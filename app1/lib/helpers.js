/*
 * Title: Helper functions
 * Description: Complex functions can reside here
 *
 *
 */

const crypto = require('crypto');
const config = require('./config');

var helpers = {};

// Creates a SHA256 hash
helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256', config.hashingSecret)
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

// modified from:  https://stackoverflow.com/a/8358141
helpers.formatPhoneNumber = function(str){
    if(typeof(str) == 'string'){
        var cleaned = str.replace(/\D+/g, ''); // replace all non-digits with nothing
        // if someone submitted a country code, reject the number
        if (cleaned.length == 10){
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


module.exports = helpers;


















