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
    const phone = typeof(formattedPhone) == 'string' && formattedPhone.trim().length == 10 
        ? formattedPhone.trim() 
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

handlers._users.get = function(data, callback){
};

handlers._users.put = function(data, callback)
{};

handlers._users.delete = function(data, callback){
};

module.exports = handlers;



























