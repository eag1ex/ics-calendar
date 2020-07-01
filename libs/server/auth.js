`use strict`

/**
 * - ServerAuth extension
 */
module.exports = function (expressApp) {
    const config = require('../../config')
    const { notify } = require('x-units')
    const del = require('delete');
    const fs = require('fs')
    const path = require('path')
    const olderThen = require('file-older-than')
    return class ServerAuth {
        constructor(debug) {
            this.debug = debug
        }

        /** 
         * not to over throw Heroku memory, remove files `config.deleteOlderThen` 
        */
        deleteICSfilesIfOlderThen(enable = null) {
            if (!enable) return false
            fs.readdir(config.ics.filePath, (err, files) => {
                files.forEach(async (file) => {
                    if (file.indexOf('.ics') === -1) return
                    const f = path.join(config.ics.filePath, file)
                    if (olderThen(f, config.deleteOlderThen)) {
                        try {
                            await del.promise([f], { force: true })
                            notify(`file deleted, file:${file}`)
                        } catch (err) {
                            console.log('error deleting file: ', file)
                        }
                    }
                });
            });
        }

        authCheck(req, res, next) {

            this.deleteICSfilesIfOlderThen(true)

            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Methods', 'GET')
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, token-expiry')
            if (this.debug) notify(`-- calling url: ${req.url}`)
            return next()

            // providing no restrictions apart from the header
            // return res.status(400).send({ error: true, msg: 'No token provided, or session expired' });

        }

        AppUseAuth() {
            expressApp.use(this.authCheck.bind(this))
        }

        // SECTION disabled, not in play
        // verifyAccess(req, token, cb){
        //     jwt.verify(token, config.secret, function (err, decoded) {
        //         if (err) {
        //             console.log('There was an error with the authentication');
        //             cb(false)
        //         } else {
        //             req.token = decoded //[1]
        //             cb(true)
        //         }
        //     })
        // }
        // getToken(headers) {
        //     if (headers && headers.authorization) {
        //         var parted = headers.authorization.split(' ');
        //         if (parted.length === 2) {
        //             return parted[1];
        //         } else {
        //             return null;
        //         }
        //     } else {
        //         return null;
        //     }
        // };
        // !SECTION 
    }
}
