/*
 * Title: Request Handlers
 *
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

// POST =======================================================================
// required data:  first name, last name, phone, password, (bool)tos_agreement
// optional data:  none
handlers._users.post = function(data, callback){
    // check that required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 
        ? data.payload.firstName.trim() 
        : false;

    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 
        ? data.payload.lastName.trim() 
        : false;

    // NOTE: does not support country code!  (###) ###-#### : len=10
    const formattedPhone = helpers.formatPhoneNumber(data.payload.phone);
    const phone = typeof(formattedPhone) == 'string' && formattedPhone.length == 10 
        ? formattedPhone 
        : false;
    
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 
        ? data.payload.password.trim() 
        : false;

    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true 
        ? true 
        : false;

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

// GET ========================================================================
// required data: phone
// optional data: none
// TODO:    only allow an authed-in user to access data
//          only allow users to access their own data
handlers._users.get = function(data, callback){
    // check phone number in query string
    const formattedPhone = helpers.formatPhoneNumber(data.query.phone);
    var phone  = typeof(formattedPhone) == 'string' && formattedPhone.length == 10 
        ? formattedPhone 
        : false;

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


// PUT ========================================================================
// "update"
// required data: phone
// optional data: firstName, lastName, password (requires 1+)
// @TODO:   Only update for authed-in users
//          user can only update their own information
handlers._users.put = function(data, callback){
    // check for phone    
    const formattedPhone = helpers.formatPhoneNumber(data.payload.phone);
    var phone  = typeof(formattedPhone) == 'string' && formattedPhone.length == 10 
        ? formattedPhone 
        : false;

    // check that required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 
        ? data.payload.firstName.trim() 
        : false;

    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 
        ? data.payload.lastName.trim() 
        : false;

    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 
        ? data.payload.password.trim() 
        : false;

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


// DELETE =====================================================================
// required data: phone
// optional data: none
// TODO:    Only auth'd-in users can access
//          users can only delete their own account
// TODO:    delete other files related to this user
handlers._users.delete = function(data, callback){
    // check phone number in query string
    const formattedPhone = helpers.formatPhoneNumber(data.query.phone);
    var phone  = typeof(formattedPhone) == 'string' && formattedPhone.length == 10 
        ? formattedPhone 
        : false;

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

module.exports = handlers;



























