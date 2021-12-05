/*
 * Title: Helper functions
 * Description: Complex functions can reside here
 *
 *
 */

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const config = require('./config');
const secret = require('./secretHash');

var helpers = {};

// Creates a SHA256 hash; the secretHash is not in the code depot
helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256', secret.hash)
            .update(str)
            .digest('hex');
        return hash;
    } else {
        return false;
    }
};


// Natively, Node and JS throw an error if a json parse fails,
// so we return a json object, or {}
helpers.parseJsonToObject = function(str){
    try{
        var obj = JSON.parse(str);
        return obj;
    } catch {
        return {};
    }
}


helpers.formatString = function(str){
    if(typeof(str) == string){
        var cleaned = str.trim();

        if(cleaned.length > 0){
            return cleaned;
        }
    }

    return null;
}



// modified from:  https://stackoverflow.com/a/8358141
helpers.formatPhoneNumber = function(str){
    if(typeof(str) == 'string'){
        var cleaned = str.replace(/\D+/g, ''); // replace all non-digits with nothing
        // reject numbers with country codes
        if (cleaned.length == 10){
            // returned string WILL be 10 characters long, or null
            return cleaned;
        }
    }
    return null;
};


helpers.createRandomString = function(length){
    const MIN_LEN = 10;
    if(typeof(length) == 'number'){
        length = length > MIN_LEN ? length : MIN_LEN;
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';

        var str = '';
        for(i = 0; i < length; i++){
            // get random char
            var randChar = characters.charAt(
                Math.floor(Math.random() * characters.length));
            str += randChar;
        };

        return str;
    } else {
        return false;
    }
};


// length == token length, lifespant == timespan (sec) until expiration
helpers.createAuthToken = function(userID, length, lifespan){
    const tokenID = helpers.createRandomString(length);
    const tokenExpires = Date.now() + lifespan;

    var token = {
        'userID': userID,
        'tokenID': tokenID,
        'expires': tokenExpires
   }; 

    return token;
};


helpers.sendTwilioSMS = function(phone, message, callback){
    const TWILIO_MAX_LEN = 1600;

    // validate params
    const phone = helpers.formatPhoneNumber(phone);
    const msg = helpers.formatString(message);

    if(phone && msg && msg.length < TWILIO_MAX_LEN){
        // create payload
        var payload = {
            'From': config.twilio.fromPhone,
            'To': '+1'+phone,
            'Body': msg
        };
        // prepare payload
        var payloadString = querystring.stringify(payload);
        // create request config
        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/'+consig.twilio.accountSid+'/messages.json',
            'auth': config.twilio.accountSid+':'+config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byte.Length(payloadString)
            }
        };
        // instantiate the request
        var request = https.request(requestDetailsi, function(response){
            // get status
            var status = response.statusCode;
            if(status == 200 || status == 201){
                // no error occurred
                callback(false);
            } else {
                callback(`Error, return-code: ${status}`);
            }
        });

        // bind to error event, b/c a thrown error will kill the thread
        request.on('error', function(error){
            callback(error);
        });

        // add payload
        requrest.write(payloadString);

        // send request
        request.end();

    } else{
        var errMsg = '';
        if (msg.length >= TWILIO_MAX_LEN){
            errMsg = `Submitted message of length = ${msg.length}/${TWILIO_MAX_LEN}\n`;
        } else {
            errMsg = 'Missing or invalid parameters';
        }

        callback(400, {'error': errMsg});
    }
};

module.exports = helpers;

