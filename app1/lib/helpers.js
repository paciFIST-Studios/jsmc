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


module.exports = helpers;


















