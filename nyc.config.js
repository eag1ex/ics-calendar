'use strict';

// NOTE asset https://github.com/istanbuljs/nyc

// add more coverage based on your `./tests/**.js`
module.exports = {
    'include': [
        'libs/server/**/*.js' // test coverage for `server app`
    ],
    'temp-dir':'./.nyc_output',
     all: true,
    'check-coverage': true
    
    // default coverage checks
    // 'watermarks': {
    //     'lines': [80, 95],
    //     'functions': [80, 95],
    //     'branches': [80, 95],
    //     'statements': [80, 95]
    //   }
};