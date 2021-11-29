/*
 *  Title: Uptime Monitoring RESTful API
 *  Description: This application monitors uptime for user-submited urls
 *  Date: 2021 11 28
 *  Note: This file is the entry point for the API
 *
 */


const http = require('http'); // stdlib, server
const url = require('url');   // stdlib, url parse



var server = http.createServer( 
    // the param'd function, is a callback, which handles connections to server
    // b/c this fn handles new requests, the request and response params, are
    // also new, each time a request comes in
    function(request, response){
    
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


        // send correct response for path
            // In this example, the server responds to all requests with this string
        const standardResponse = "Hello World\n";
        response.end(standardResponse);
        
        // log requested path
        console.log(`request: ${methodType}:${trimmedPath}`);
        process.stdout.write('query=');
        console.log(queryStringObject); // weird printing issues, b/c this is NoneType, and also a dict
        
        // headers are affixed by sending request from Insomnia
        process.stdout.write('headers=');
        console.log(headers);
});


// the server has been created, and its behaviour specified


// initiate server listen
server.PORT = 27182;
server.listen(server.PORT, function(){
    // after server.listen runs, we enter this callback, indicating that the
    // server has STARTED listening
    console.log(`Server listening on ${server.PORT}`);
});


