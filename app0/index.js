/*  
 *  Title: Basic Example
 *  Description: example file that shows off Node.js's runtime  
 *  Date: 
 *
 */



// dependencies
// Here, we're importing the interface, which is exported by these modules
// Node.js assumes that you're either importing a file:  file.js, or that you're
// importing a directory which contains index.js,  such as math/index.js
// which is a lot like python's module.__init__.py imports 
var mathLib = require('./lib/math');
var jokesLib = require('./lib/jokes');

// Making objects and then assigning attributes to them is not required, but it's
// a convention used to keep things well structured.  It's called 
// Object-Literal-Notation, or OLN, and it makes testing easier
var app = {};


app.config = {
    'timeBetweenJokes': 1000
};

app.printAJoke = function(){
    var allJokes = jokesLib.allJokes();

    var numberOfJokes = allJokes.length;

    var randomNumber = mathLib.getRandomNumber(1, numberOfJokes);

    var selectedJoke = allJokes[randomNumber-1]

    console.log(selectedJoke);

};

app.indefiniteLoop = function() {
    setInterval(app.printAJoke, app.config.timeBetweenJokes);
};

app.indefiniteLoop();

