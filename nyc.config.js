`use strict`;

// asset https://github.com/istanbuljs/nyc

module.exports = {
    'include': [
        'libs/**/*.js' 
    ],
    'temp-dir':'./.nyc_output',
     // all: true,
    'check-coverage': true    
    // default coverage checks
    // 'watermarks': {
    //     'lines': [80, 95],
    //     'functions': [80, 95],
    //     'branches': [80, 95],
    //     'statements': [80, 95]
    //   }
};