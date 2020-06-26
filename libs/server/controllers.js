`use strict`

module.exports = function (expressApp) {
    const { isNumber, notify, objectSize, copy } = require('x-units')
    const querystring = require('querystring')
    const url = require('url')
    return class ServerController {
        constructor(debug) {

            this.debug = debug || null
            this.serverError = null
            try {
                const ICS = require('../ics/ics.module')()
                this.ics = new ICS({}, this.debug)
            } catch (error) {
                notify({ error }, 1)
                this.serverError = error
            }
        }


        /**
         * (GET) REST/api
         * - produce calendar with valid params `./:type/:userId`
         */
        calendar(req, res) {
            if (this.serverError) return res.status(500).json({ message: `ICS databse error`, code: 500 });

            const validTypes = ['sickness', 'vacation'].filter(z=>z===req.params.type).length
            if(!validTypes) return res.status(200).json({ error: 'wrong type provided', response: {}, code: 200 });
            const type = req.params.type
            const userId = Number(req.params.userId)    
            if (!isNumber(userId) || userId < 0) return res.status(200).json({ error: 'wrong userId provided', response: {}, code: 200 });

            return this.ics.generateICS(type, userId, 'members').then(z => {
                let message
                if (z.length) message = '.ics files generated'
                else message = 'no match for provided query'
                res.status(200).json({ success: true, response: z, message, code: 200 });
            })
        }

        /**
        * (GET) REST/api
        * - Show me calendar item by `id`
        * `examples: /database/:absences` , `/database/:members`
        */
        database(req, res) {

            if (this.serverError) return res.status(500).json({ message: `ICS databse error`, code: 500 });

            const routeName = req.params.routeName || ''
            const query = objectSize(req.query) ? req.query: null

            if (routeName === 'absences') {
                const includeMember = true
                return this.ics.absences(query, includeMember).then(response => res.status(200).json({ success: true, response, code: 200 }))
                    // can debate regarding which code to throw
                    .catch(error => res.status(404).json({ error, response: null, code: 404 }))
            }

            if (routeName === 'members') {
               return this.ics.members(query).then(response => res.status(200).json({ success: true, response, code: 200 }))
                    // can debate regarding which code to throw
                    .catch(error => res.status(404).json({ error, response: null, code: 404 }))
            }

            else return res.status(500).json({ message: `routeName ${routeName} not found`, code: 500 });
        }
    }

}