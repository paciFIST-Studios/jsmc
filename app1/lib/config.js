
/*
 * Title: Create and export configuration variables
 * Description: Holds configuration variables, so we can choose
 *              between config settings at runtime
 *
 */



var environments = {};


environments.staging = {
    'ip': 'localhost',
    'httpPort': 27182,
    'httpsPort': 27183,
    'envName': 'staging',
    'maxChecks': 5,
    'minCheckTimeout': 1,
    'maxCheckTimeout': 5,
    'twilio': {
        'fromPhone': 2068238414,
        'accountSid': '',
        'authToken': ''
    }
};


environments.production = {
    'ip': 'localhost',
    'httpPort': 27182,
    'httpsPort': 27183,
    'envName': 'production',
    'maxChecks': 5,
    'minCheckTimeout': 1,
    'maxCheckTimeout': 5,
    'twilio': {
        'fromPhone': 2068238414,
        'accountSid': '',
        'authToken': ''
    }
};


// determine specificed environment and export

// parse env var
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase(): '';

// if we got an env_var, make sure it's actually a defined environment, else use staging
var exportEnvironment = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = exportEnvironment;

