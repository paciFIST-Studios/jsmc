/*
 *  Title: Uptime Monitoring RESTful API
 *  Description: This application monitors uptime for user-submited urls
 *  Date: 2021 11 28
 *  Note: This file is the entry point for the API
 *
 */


// 
const http = require('http');


// the param'd function, is a callback, which handles connections to server
var server = http.createServer( function(request, response){
    // In this example, the server responds to all requests with this string
    const standardResponse = "Hello World\n";
    response.end(standardResponse);
});


// the server has been created, and its behaviour specified


// initiate server listen
server.PORT = 27182;
server.listen(server.PORT, function(){
    // after server.listen runs, we enter this callback, indicating that the
    // server has STARTED listening
    console.log(`Server listening on ${server.PORT}`);
});


