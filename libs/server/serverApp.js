`use strict`
// initialize server

process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p)
    })
    .on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown')
    // process.exit(1);
    })

module.exports = require('./server')()
