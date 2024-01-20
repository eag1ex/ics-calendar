`use strict`
// start the app

process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p)
    })
    .on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown')
        // process.exit(1);
    })
const config = require('./config')
module.exports = require('./libs/server/server')(config.debug)
