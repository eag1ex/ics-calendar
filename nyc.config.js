`use strict`;

// asset https://github.com/istanbuljs/nyc

module.exports = {
    'include': [
        'libs/**/*.js' 
    ],
    'temp-dir':'./.nyc_output',
     // all: true,
    'check-coverage': true,    
    // default coverage checks
    'watermarks': {
        'lines': [75, 90],
        'functions': [75, 90],
        'branches': [75, 90],
        'statements': [75, 90]
      }
};