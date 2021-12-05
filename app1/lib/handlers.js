/*
 * Title: Request Handlers
 * Description: these handle incoming requests, and return any relevant data
 *
 *
 */



const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// handler callbacks return (statusCode, json)
var handlers = {};
handlers.notFound = function(data, callback){
    callback(404);
};

handlers.ping = function(data, callback){
    callback(200);
};


// UTIL =======================================================================
//
// these functions serve as local utilities, which are too specialized to fit
// into the helper lib, but the tasks are performed too frequently not to
// refactor them into some util fns

function getPhone(unformattedPhone){
    // NOTE: does not support country code!  (###) ###-#### : len=10
    const formattedPhone = helpers.formatPhoneNumber(unformattedPhone);
    const phone = typeof(formattedPhone) == 'string' && formattedPhone.length == 10 
        ? formattedPhone 
        : false;

    //  Returns phone number as just 10 digits, or returns false
    return phone;
};

function getTimeout(timeout){
    const val = getInt(timeout);
    const min = config.minCheckTimeout;
    const max = config.maxCheckTimeout;
    
    return handlers._clamp(val, min, max);
};

handlers._clamp = function(val, min, max){
    if(val <= min){
        return min;
    } else if (val >= max){
        return max;
    } else {
        return val;
    }
}

function getStringInArray(string, array){
    // returns a string, if that string is also in the supplied array
    // otherwise returns false
    const str = getString(string);
    for(i = 0; i < array.length; i++ ){
        if(typeof(array[i]) == 'string' && array[i] == str ){
            return str;
        }
    }

    return false;
};

function getAnArray(data){
    // returns array
    // returns orignial object, if it was an array, and had elements
    if (typeof(data) == 'object' && data instanceof Array && data.length > 0){
        return data
    }

    return [];
};

function getString(unformattedString){
    if (typeof(unformattedString) == 'string'){
        const trimmed = unformattedString.trim();
        if(trimmed.length > 0){
            return trimmed;
        }
    }

    return false;
};

function getInt(number){
    if(typeof(number) == 'number' && number % 1 === 0){
        return number;
    }

    return false;
}

function getBool(unformattedBool){
    if(typeof(unformattedBool) == 'boolean'){
        return unformattedBool;
    }

    // returns a bool or null
    return null;
};


///////////////////////////////////////////////////////////////////////////////
// USERS ======================================================================

handlers.users = function(data, callback){
    const acceptedMethods = ['post', 'get', 'put', 'delete'];

    if (acceptedMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    } else {
        // http code for "method not allowed"
        callback(405);
    }
};

// split the different method types into their own fns
handlers._users = {};

handlers._users._parse_checks = function(userObject){
    var result = null;
    if (typeof(userObject) == 'object'){
        if(typeof(userObject.checks) == 'object' && userObject.checks instanceof Array){
            result = userObject.checks;
        } else {
            result = []
        }
    }

    return result;
}

// USERS: POST ================================================================
// required data:  first name, last name, phone, password, (bool)tos_agreement
// optional data:  none
handlers._users.post = function(data, callback){
    
    const firstName = getString(data.payload.firstName);
    const lastName = getString(data.payload.lastName);
    const password = getString(data.payload.password);
    const phone = getPhone(data.payload.phone);
    const tosAgreement = getBool(data.payload.tosAgreement);

    // check that required fields are filled out
    if (firstName && lastName && phone && password && tosAgreement){
        // make sure user isn't already registered
        _data.read('users', phone, function(error, data){
            // we get an error if we read from a file that doesn't exist, so it's a bit janky,
            // but we're using this read to check for no-file
            if (error){
                const hashedPassword = helpers.hash(password);
                
                if(hashedPassword){
                    // create user
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashword': hashedPassword,
                        'tosAgreement': true
                    };

                    // store user
                    _data.create('users', phone, userObject, function(error){
                        if (!error){
                            // user created successfully
                            callback(200, {'user_created': true});
                        } else {
                            process.stdout.write('User creation failure: ');
                            console.log(error);
                            callback(500, {'error': 'Could not create new user'});
                        }
                    }); // store created user record
                } else {
                    callback(500, {'error': 'Could not hash supplied password'});
                }
            } else {
                callback(400, {'error': 'A user with this phone number already exists'})
            }
        }); // verify no-record for user
    } else {
        callback(400, {'error': 'Missing required fields'});
    }
};

// USERS: GET =================================================================
// required data: phone, token
// optional data: none
handlers._users.get = function(data, callback){

    // check phone number in query string
    const phone = getPhone(data.query.phone);
    const tokenID = getString(data.header.token);

    if (phone && tokenID){
        handlers._tokens.verify(tokenID, phone, function(verified){
            if(verified){
                _data.read('users', phone, function(error, userData){
                    if(!error && userData){
                        // remove hashword, before returning user
                        delete userData.hashword;
                        callback(200, userData);
                    } else {
                        callback(404, {'error': 'User not found'});
                    }
                }); // retrieve user record
            } else {
                callback(403, {'error': 'Token is not valid'});
            }
        }); // verify token
    } else {
        callback(400, {'error': 'Missing required field'});
    }
};


// USERS: PUT "update" ========================================================
// required data: phone, token
// optional data: firstName, lastName, password (requires 1+)
handlers._users.put = function(data, callback){
    
    const firstName = getString(data.payload.firstName);
    const lastName = getString(data.payload.lastName);
    const password = getString(data.payload.password);
    const phone = getPhone(data.payload.phone);
    
    const tokenID = getString(data.header.token);

    if(phone && tokenID){
        handlers._tokens.verify(tokenID, phone, function(verified){
            if(verified){

                if (firstName || lastName || password){
                    // lookup user data
                    _data.read('users', phone, function(error, userData){
                        if(!error && userData){
                            if(firstName){
                                userData.firstName = firstName;
                            }

                            if(lastName){
                                userData.lastName = lastName;
                            }

                            if(password){
                                var hashword = helpers.hash(password);
                                userData.hashword = hashword;
                            }

                            // store updates
                            _data.update('users', phone, userData, function(error){
                                if (!error){
                                    // update success
                                    callback(200, {'updated_user': true});
                                } else {
                                    console.log(error);
                                    callback(500, {'error': 'Internal Error: Could not update user'});
                                }
                            }); // store updated user record

                        } else {
                            callback(400, {'error': 'User does not exist'});
                        }
                    }); // get user record
                    
                } else {
                    callback(400, {'error': 'Missing update information'});
                }
            } else {
                callback(403, {'error': 'Token is not valid'});
            }
        }); // verify token
    } else {
        callback(400, {'error': 'Missing required field'});
    }
};


// USERS: DELETE ==============================================================
// required data: phone
// optional data: none
handlers._users.delete = function(data, callback){
    
    // check phone number in query string
    const phone = getPhone(data.query.phone);
    const tokenID = getString(data.header.token);

    if (phone && tokenID){
        handlers._tokens.verify(tokenID, phone, function(verified){
            if(verified){

                _data.read('users', phone, function(error, userData){
                    if(!error && userData){
                        _data.delete('tokens', tokenID, function(error){
                            if(!error){
                                _data.delete('users', phone, function(error){
                                    if(!error){
                                        // now delete each of the checks associate w/ the user
                                        var checks = handlers._users._parse_checks(userData);
                                        var deleteCount = checks.length;
                                        if(deleteCount > 0){
                                            var checksDeleted = 0;
                                            var deletionErrors = 0;
                                            
                                            checks.forEach(function(checkID){
                                                _data.delete('checks', checkID, function(error){
                                                    checksDeleted++;
                                                    if(error){
                                                        deletionErrors += 1;
                                                    }

                                                    if(checksDeleted == deleteCount){
                                                        if(deletionErrors > 0){
                                                            const msg = `Internal Error: ${deletionErrors} errors encountered while purging user data`;
                                                            callback(500, {'error': msg});
                                                        } else {
                                                            callback(200, {'user_deleted': true});
                                                        }
                                                    } // all work done
                                                }); // delete checkID
                                            }); // foreach
                                        } else {
                                            // user has no checks in system
                                            callback(200, {'user_deleted': true});
                                        }
                                    } else {
                                        callback(500, {'error': 'Internal Error: Could not delete user'});
                                    }
                                }); // delete user record
                            } else {
                                callback(500, {'error': 'Internal Error: Could not delete user token'});
                            }
                        }); // delete user token
                    } else {
                        callback(400, {'error': 'User not found'});
                    }
                }); // verify existence of user record
            } else {
                callback(403, {'error': 'Token is not valid'});
            }
        }); // verify token
    } else {
        callback(400, {'error': 'Missing required field'});
    }
};



// TOKENS: =====================================================================
handlers.tokens = function(data, callback){
    const acceptedMethods = ['post', 'get', 'put', 'delete'];

    if (acceptedMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    } else {
        // http code for "method not allowed"
        callback(405);
    }
};

handlers._tokens = {};
handlers._token_length = 40;
handlers._token_lifetime = 3600000;

handlers._tokens.verify = function(tokenID, userID, callback){
    _data.read('tokens', tokenID, function(error, tokenData){
        if(!error && tokenData){
            if(tokenData.userID == userID){
                if(tokenData.expires > Date.now()){
                    callback(true);
                } else {
                    // token has expired
                    callback(false);
                }
            } else {
                // token is not for supplied userID
                callback(false);
            }
        } else {
            // no token using this tokenID, or error during token read
            callback(false);
        }
    });
};


// TOKENS: POST ================================================================
// required data: Phone, Password
// optional data: none
handlers._tokens.post = function(data, callback){

    // here, the user is creating a token
    const phone = getPhone(data.payload.phone);
    const password = getString(data.payload.password);

    if (phone && password){
        // look up user from phone number
        _data.read('users', phone, function(error, userData){
            if(!error && userData){
                // did they give us the correct password?
                const hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashword){
                    // TODO: invalidate user's old tokens, and remove them from fs

                    // create token, token expires in 1 hour  
                    var authToken = helpers.createAuthToken(phone, 
                        handlers._token_length, 
                        handlers._token_lifetime);

                    // store, so we can check against this token in the future
                    _data.create('tokens', authToken.tokenID, authToken, function(error){
                        if(!error){
                            // success
                            callback(200, authToken);
                        } else {
                            callback(500, {'error': 'Internal Error: Could not create new token'});
                        }
                    });
                } else {
                    callback(400, {'error': 'Invalid user credentials'});
                }
            } else {
                callback(400, {'error': 'User not found'});
            }
        }); 
    } else {
        callback(400, {'error': 'Missing required data'});
    }
};


// TOKENS: GET =================================================================
// required data: token
// optional data: none
handlers._tokens.get = function(data, callback){
    const tokenID = getString(data.header.token);
    if (tokenID){
        if(tokenID.length == handlers._token_length){
            _data.read('tokens', tokenID, function(error, tokenData){
                if(!error && tokenData){
                    callback(200, tokenData);
                } else {
                    callback(500, {'error': 'Internal Error, could not retreive token data'});
                }
            });
        } else {
            callback(400, {'error': 'Malformed Token'});
        }
    } else {
        callback(400, {'error': 'Malformed or missing token id'});
    }
};


// TOKENS: PUT =================================================================
// required data: token, addtime(bool)
// required data: none
handlers._tokens.put = function(data, callback){
    const tokenID = getString(data.header.token);
    const addTime = getBool(data.payload.addtime);

    if(tokenID && addTime){
       _data.read('tokens', tokenID, function(error, tokenData){
        if(!error && tokenData){

            const time = Date.now();
            if (tokenData.expires > time){
                tokenData.expires = time + handlers._token_lifetime;
                
                _data.update('tokens', tokenID, tokenData, function(error){
                    if(!error){
                        callback(200, tokenData);
                    } else {
                        callback(500, {'error': 'Internal Error: Could not update token'})
                    }
                });
            } else {
                callback(400, {'error': 'Token expired.  Create new token.'});
            }
        } else {
            callback(400, {'error': 'Token not found'});
        }
       }); 
    } else {
        callback(400, {'error': 'Missing fields or malformed fields'});
    }
};


// TOKENS: DELETE ==============================================================
// required data: token
// optional data: none
handlers._tokens.delete = function(data, callback){
    const tokenID = getString(data.header.token);
    
    if(tokenID){
        _data.read('tokens', tokenID, function(error, tokenData){
            if(!error && tokenData){
                _data.delete('tokens', tokenID, function(error){
                    if(!error){
                        callback(200, {'token_deleted': true});
                    } else {
                        callback(500, {'error': 'Internal Error: Could not delete token'});
                    }
                });
            } else{
                callback(400, {'error': 'Token not found'});
            }
        });
    } else {
        callback(400, {'error': 'Missing or malformed field'});
    }
};


// CHECK TASKS =================================================================
handlers.checks = function(data, callback){
    if (handlers._checks.methods.indexOf(data.method) > -1){
        handlers._checks[data.method](data, callback);
    } else {
        // http code for "method not allowed"
        callback(405);
    }
};

handlers._checks = {};
handlers._checks.methods = ['post', 'get', 'put', 'delete']
handlers._checks.protocols = ['http', 'https']

// required data: protocol, url, method, success codes, timeout seconds, token
// optional data: none
handlers._checks.post = function(data, callback){
    // data used to poll the target site
    const url = getString(data.payload.url);
    const protocol = getStringInArray(data.payload.protocol, handlers._checks.protocols);
    const method = getStringInArray(data.payload.method, handlers._checks.methods);
    const codes = getAnArray(data.payload.codes);
    const timeout = getTimeout(data.payload.timeout);

    if (url && protocol && method && codes){

        const tokenID = getString(data.header.token);
        if(tokenID){
         
            _data.read('tokens', tokenID, function(error, tokenData){
                if(!error && tokenData){
                 
                    handlers._tokens.verify(tokenID, tokenData.userID, function(verified){
                        if(verified){
                            const time = Date.now();
                            if(tokenData.expires > time){
                            
                                _data.read('users', tokenData.userID, function(error, userData){
                                    if(!error && userData){
                                        var userChecks = handlers._users._parse_checks(userData);
                                        if(userChecks.length < config.maxChecks){
                                            // create a random id for check
                                            var checkID = helpers.createRandomString(20);
                                            var checkObject = {
                                                'checkID': checkID,
                                                'userID': tokenData.userID,
                                                'protocol': protocol,
                                                'url': url,
                                                'method': method,
                                                'codes': codes,
                                                'timeout': timeout
                                            };

                                            // store check to disk
                                            _data.create('checks', checkID, checkObject, function(error){
                                                if(!error){
                                                    // add new check id to user's data
                                                    userData.checks = userChecks;
                                                    userData.checks.push(checkID);
                                                    
                                                    _data.update('users', tokenData.userID, userData, function(error){
                                                        if(!error){
                                                            callback(200, checkObject);
                                                        } else {
                                                            callback(500, {'error': 'Internal Error: could not update user data'});
                                                        } 
                                                    });
                                                } else {
                                                    callback(500, {'error': 'Internal Error: could not create task'});
                                                }
                                            }); // data create, write check to disk
                                        } else {
                                            const mc = config.maxChecks
                                            const msg = `User already has ${mc}/${mc} tasks scheduled.  Delete a task before adding a new one.`;
                                            callback(400, {'error': msg});
                                        } 
                                    } else {
                                        callback(400, {'error': 'Account invalid'});
                                    }
                                }); // data read, get user object
                            } else { 
                                callback(400, {'error': 'Token expired'});
                            }
                        } else {
                            callback(400, {'error': 'Token invalid'});
                        }
                    }); // handlers, verify token
                } else { 
                    callback(403, {'error': 'Token does not exist'});
                }
            }); // _data.read, get token object from id
        } else {
            callback(404, {'error': 'Missing token'});
        }
    } else {
        callback(400, {'error': 'Missing required data, or data invalid'});
    }
};

// requried data: token, checkID
// optional data: none
handlers._checks.get = function(data, callback){ 
    const tokenID = getString(data.header.token);
    const checkID = getString(data.query.check);
    
    if (tokenID && checkID){ 
        _data.read('tokens', tokenID, function(error, tokenData){
            if(!error && tokenData){
                // verify token
                handlers._tokens.verify(tokenID, tokenData.userID, function(verified){
                    if(verified){
                        
                        _data.read('users', tokenData.userID, function(error, userData){
                            if(!error && userData){
                                _data.read('checks', checkID, function(error, checkData){
                                    if(!error && checkData){
                                        callback(200, checkData);
                                    } else {
                                        callback(404, {'error': `Check does not exist. id=${checkID}`});
                                    }
                                });
                            } else {
                                callback(400, {'error': 'No user data'});
                            }
                        }); // get user data
                    } else {
                        callback(400, {'error': 'Token invalid'});
                    }
                }); // verify token
            } else {
                callback(404, {'error': 'User not found'});
            }
        }); // get tokenData
    } else {
        callback(400, {'error': 'Missing required field'});
    }
};


// required data: token
// optional data: (1+ of) protocol, url, method, codes, timeout 
handlers._checks.put = function(data, callback){ 
    const tokenID = getString(data.header.token);
    const checkID = getString(data.payload.check);

    if (tokenID && checkID){
        const protocol = getString(data.payload.protocol);
        const url = getString(data.payload.url);
        const method = getString(data.payload.url);
        const codes = getAnArray(data.payload.codes);
        const timeout = getTimeout(data.payload.timeout);

        // verify some data for update
        if(protocol || url || method | timeout || codes.length > 0){
            
            // verify token
            _data.read('tokens', tokenID, function(error, tokenData){
                if(!error && tokenData){
                    handlers._tokens.verify(tokenID, tokenData.userID, function(verified){
                        
                        // now that we know the token is legit, we have to ensure "check"
                        // actually belongs to the user
                        _data.read('users', tokenData.userID, function(error, userData){
                            if(!error && userData){
                                var checks = handlers._users._parse_checks(userData);
                                if (checks.indexOf(checkID) > -1){
                                    
                                    // now that we know the user has a coherent edit requrest
                                    // and that request is valid to perform
                                    _data.read('checks', checkID, function(error, checkData){
                                        if(!error && checkData){
                                            
                                            if(protocol){
                                                checkData.protocol = protocol;
                                            } 

                                            if(url){
                                                checkData.url = url;
                                            } 

                                            if(method){
                                                checkData.method = method;
                                            } 

                                            if(codes){
                                                checkData.codes = codes;
                                            } 

                                            if(timeout){
                                                checkData.timeout = timeout;
                                            } 
                                            
                                            // store update
                                            _data.update('checks', checkID, checkData, function(error){
                                                if(!error){
                                                    callback(200, {'check_updated': true});
                                                } else {
                                                    callback(500, {'error': 'Internal Error: Could not update "Check" data'});
                                                }
                                            }); // store update
                                        } else {
                                            callback(500, {'error': 'Internal Error: "Check" data not found'});
                                        }
                                    }); // open "check" data for edit
                                } else{
                                    callback(404, {'error': 'Unauthorized edit'});
                                }
                            } else {
                                callback(400, {'error': 'User not found'});
                            }
                        }); // make sure user owns the "check" to be modified
                    }); // verify token
                } else {
                    callback(400, {'error':'Token not recognized'});
                }
            }); // make sure token is on record
        } else {
            callback(400, {'error': 'Empty Request'});
        }
    } else {
        callback(404, {'error': 'Token authorization && CheckID requried'});
    }
};

// required data: token
// optional data: none
handlers._checks.delete = function(data, callback){ 
    const tokenID = getString(data.header.token);
    const checkID = getString(data.query.check);

    // required fields
    if(tokenID && checkID){
        // make sure token is valid
        _data.read('tokens', tokenID, function(error, tokenData){
            if(!error && tokenData){
                handlers._tokens.verify(tokenID, tokenData.userID, function(verified){
                    if(verified){
                        
                        // make sure user, associated with this token, actually owns the "check"
                        _data.read('users', tokenData.userID, function(error, userData){
                            if(!error && userData){
                                const idx = handlers._users._parse_checks(userData).indexOf(checkId);
                                if(idx > -1){
                                    
                                    _data.delete('checks', checkID, function(error){
                                        if(!error){
                                            
                                            // remove from user profile
                                            userData.checks.splice(idx, 1);
                                            _data.update('users', tokenData.userID, userData, function(error){
                                                if(!error){
                                                    callback(200, {'check_removed': true});
                                                } else {
                                                    callback(500, {'error': 'Internal Error: could not update user account'});
                                                }
                                            }); // store update
                                        } else {
                                            console.log(error);
                                            callback(500, {'error': 'Internal Error: could not remove "check" file'});
                                        }
                                    }); // remove "check"
                                } else {
                                    callback(403, {'error': 'Action not authorized'});
                                }
                            } else {
                                callback(500, {'error': 'Internal Error: User data not found'});
                            }
                        }); // verify token rights
                    } else {
                        callback(403, {'error': 'Invalid Token'});
                    }
                }); // verify token
            } else {
                callback(400, {'error': 'Token not recognized'});
            }
        });
    } else{
        callback(404, {'error': 'Token authorization && CheckID required'});
    }
};


module.exports = handlers;

