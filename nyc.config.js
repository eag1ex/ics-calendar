`use strict`;

// asset https://github.com/istanbuljs/nyc

module.exports = {
    'include': [
        'libs/**/*.js'
    ],
    "exclude": [
        "**/*.spec.js"
    ],
    'temp-dir': './.nyc_output',
    // all: true,
    'check-coverage': true,
    // default coverage checks
 
     "branches": 65, 
     "lines": 85,
     "functions": 95,
     "statements": 80

};