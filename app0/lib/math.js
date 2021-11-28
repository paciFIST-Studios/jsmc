/*
 *  Title: Math Library
 *  Description: Implements a function as a math library
 *  Date:
 *
 */


var math = {};

math.getRandomNumber = function(min, max){
    // if min is of type number, and divisible by 1 w/ no remainder (is an int), use min, else use 0
    min = typeof(min) == 'number' && min % 1 === 0 ? min : 0;
    max = typeof(max) == 'number' && max % 1 === 0 ? max : 0;
    return Math.floor(Math.random() * (max-min+1)+min)
};

// An object math={} is defined, and then exported for use by anyone whom may require it
// This is a lot like the python import system
module.exports = math;



