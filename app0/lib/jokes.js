/*
 *
 *
 *
 *
 */


// fs does not get exported as port of the interface, which is exported as the object
// fs does exit, but it's scoped to within the object exported for this module, as though
// it were a private variable (module)
// fs is part of the Node standard library
var fs = require('fs');

var jokes = {};

jokes.allJokes = function(){
    var fileContents = fs.readFileSync(__dirname+'/jokes.txt', 'utf-8');
    var arrayOfJokes = fileContents.split(/\n?\n/);
    return arrayOfJokes;
};

module.exports = jokes;

