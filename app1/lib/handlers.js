/*
 * Title: Request Handlers
 *
 *
 *
 */



const _data = require('./data');
const helpers = require('./helpers');


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

function getString(unformattedString){
    const str = typeof(unformattedString) == 'string' && unformattedString.trim().length > 0 
        ? unformattedString.trim() 
        : false;

    // returns a string, of len > 0, or false
    return str;
};

function getBool(unformattedBool){
    if(typeof(unformattedBool) == 'boolean'){
        return unformattedBool;
    }

    // returns a bool or null
    return Null;
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
                var hashedPassword = helpers.hash(password);
                
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
                    });

                } else {
                    callback(500, {'error': 'Could not hash supplied password'});
                }
            } else {
                callback(400, {'error': 'A user with this phone number already exists'})
            }
        });
    } else {
        callback(400, {'error': 'Missing required fields'});
    }
};

// USERS: GET =================================================================
// required data: phone
// optional data: none
// TODO:    only allow an authed-in user to access data
//          only allow users to access their own data
handlers._users.get = function(data, callback){

    // check phone number in query string
    const phone = getPhone(data.query.phone);

    if (phone){
        _data.read('users', phone, function(error, userData){
            if(!error && userData){
                // remove hashword, before returning user
                delete userData.hashword;
                callback(200, userData);
            } else {
                callback(404, {'error': 'User not found'});
            }
        });
    } else {
        callback(400, {'error': 'Missing required field'});
    }
};


// USERS: PUT =================================================================
// "update"
// required data: phone
// optional data: firstName, lastName, password (requires 1+)
// @TODO:   Only update for authed-in users
//          user can only update their own information
handlers._users.put = function(data, callback){
    
    const firstName = getString(data.payload.firstName);
    const lastName = getString(data.payload.lastName);
    const password = getString(data.payload.password);
    const phone = getPhone(data.payload.phone);

    if(phone){
        if (firstName || lastName || password){
            // lookup user
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
                    });

                } else {
                    callback(400, {'error': 'User does not exist'});
                }
            });
            //
        } else {
            callback(400, {'error': 'Missing fields to update'});
        }
    } else {
        callback(400, {'error': 'Missing required field'});
    }

};


// USERS: DELETE ==============================================================
// required data: phone
// optional data: none
// TODO:    Only auth'd-in users can access
//          users can only delete their own account
// TODO:    delete other files related to this user
handlers._users.delete = function(data, callback){
    
    // check phone number in query string
    const phone = getPhone(data.query.phone);

    if (phone){
        _data.read('users', phone, function(error, userData){
            if(!error && userData){
                _data.delete('users', phone, function(error){
                    if(!error){
                        callback(200, {'user_deleted': true});
                    } else {
                        callback(500, {'error': 'Internal Error: Could not delete user'});
                    }
                });

            } else {
                callback(400, {'error': 'User not found'});
            }
        });
    } else {
        callback(400, {'error': 'Missing required field'});
    }
};



// TOKENS: =====================================================================
handlers.tokens = function(data, callback){
    const acceptedMethods = ['post', 'get', 'put', 'delete'];

    if (acceptedMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    } else {
        // http code for "method not allowed"
        callback(405);
    }

};

handlers._tokens = {};


// TOKENS: POST ================================================================
// required data: Phone, Password
// optional data: none
handlers._tokens.post = function(data, callback){

    // here, the user is creating a token
    const phone = getPhone(data.query.phone);

};


// TOKENS: GET =================================================================
handlers._tokens.get = function(data, callback){};


// TOKENS: PUT =================================================================
handlers._tokens.put = function(data, callback){};


// TOKENS: DELETE ==============================================================
handlers._tokens.delete = function(data, callback){};


module.exports = handlers;

