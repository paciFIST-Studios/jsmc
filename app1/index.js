/*
 *  Title: Uptime Monitoring RESTful API
 *  Description: This application monitors uptime for user-submited urls
 *  Date: 2021 11 28
 *  Note: This file is the entry point for the API
 *
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;


// configuration variable relies on NODE_ENV
const config = require('./config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

function debugPrint(method, path, query, header, buffer){
    const showDebug = false;

    if(!showDebug){
        return;
    }

    
    // log requested path
    console.log(`request: ${method}:${path}`);
    process.stdout.write('query=');
    console.log(query); // weird printing issues, b/c this is NoneType, and also a dict
    
    // headers are affixed by sending request from Insomnia
    process.stdout.write('headers=');
    console.log(header);
    
    // payload is the "body" of the request
    process.stdout.write(`payload=${buffer}`);
};


// HTTP
var httpServer = http.createServer(function(request, response){
    internalProcessing(request, response);
});
httpServer.listen(config.httpPort, function(){
    // after server.listen runs, we enter this callback, indicating that the
    // server has STARTED listening
    console.log(`HTTP server, listening on ${config.httpPort}, env=${config.envName}`);
});


// HTTPS
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, function(request, response){
    internalProcessing(request, response);
});
httpsServer.listen(config.httpsPort, function(){
    console.log(`HTTPS server, listening on ${config.httpsPort}, env=${config.envName}`);
});



var internalProcessing = function(request, response){
    // Here, "true" indicates that we should parse the url as a query
    var parsedUrl = url.parse(request.url, true);
    
    // get path from url (path == "route", in the sense of './' ?)
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, ''); // trim external slashes
    
    // get query string as an object
    var queryStringObject = parsedUrl.query;
    
    // get http method type
    var methodType = request.method.toLowerCase();
    
    // get submitted headers as an object
    var headers = request.headers;
    
    // get user defined payload.  StringDecoder is a stream reader
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    // as the data comes in, the on data event will emit,
    // and then we can use the stream reader, it transform the
    // streamed data, into utf-8 string data, that we append to the buffer
    request.on('data', function(data){
        buffer += decoder.write(data);    
    });
    
    // called when data finishes streaming
    request.on('end', function(){
        // In Node.js, to get data from a stream, you bind to the stream's events, 
        // and then read it, and then close it.  Streams are built into Node
        //
        // we're sending the responses from the handler of the 'end' event.
        // the 'data' event may not be called, but the 'end' event will always be called
        // you're allowed to call decoder.end() on an empty string
        buffer += decoder.end()
    
    
        // choose handler response
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
    
        var data = {
            'path': trimmedPath,
            'query': queryStringObject,
            'method': methodType,
            'header': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };
    
        // send data from the incoming response, to the handler it requested
        chosenHandler(data, function(statusCode, payload){
            // returns handler's status code, else 200
            // returns handler's payload else {} ('empty object')
            
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
    
            // convert payload to string
            var payloadString = JSON.stringify(payload);
            
            // mark response as json
            response.setHeader('Content-Type','application/json');
            response.writeHead(statusCode);
            response.end(payloadString);
        
            debugPrint(methodType, trimmedPath, queryStringObject, headers, buffer);
            console.log(`${statusCode}, ${payloadString}`);
        });
    
    });
};





// A request router handles incoming requests, by matching requests for specific
// paths in the API, with the calls to that API
var router = {
    'ping': handlers.ping,
    'users': handlers.users
};



