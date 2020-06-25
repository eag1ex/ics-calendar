`use strict`

module.exports = function (expressApp) {
    const { isNumber, notify, objectSize } = require('x-units')
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
         * - Show me calendar item by `id`
         * `example: /calendar/:id` 
         */
        calendar(req, res) {
            if (this.serverError) return res.status(500).json({ message: `ICS databse error`, code: 500 });

            const id = Number(req.params.id)
            if (!isNumber(id) || id < 0) return res.status(200).json({ error: 'wrong id provided', response: {}, code: 200 });
            return res.status(200).json({ success: true, response: { id }, code: 200 });
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
                return this.ics.absences(query).then(response => res.status(200).json({ success: true, response, code: 200 }))
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