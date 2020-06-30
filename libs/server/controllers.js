`use strict`

module.exports = function (expressApp) {
    const { isNumber, notify, objectSize, copy } = require('x-units')
    const messageCodes = require('../status-handler/message.codes')
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
            if (this.serverError) return res.status(500).json({ message: 'ICS databse error', code: 500 })

            const validTypes = this.ics.availableAbsenceTypes.filter(z => z === req.params.type).length
            if (!validTypes) return res.status(200).json({ error: true, ...messageCodes[108] })
            const type = req.params.type
            const userId = Number(req.params.userId)
            if (!isNumber(userId) || userId < 0) return res.status(404).json({ error: 'wrong userId provided', response: {}, code: 200 })

            return this.ics.generateICS(type, userId, 'members').then(z => res.status(200).json({ success: true, response: z, ...this.ics.statusHandler.$get() })).catch(error => res.status(400).json({ error, ...messageCodes[601] }))
        }

        /**
        * (GET) REST/api 
        *  end points: `/database/:collection` >> `/database/members` or `/database/absences` will list collection documents
        *  deep queries: `/database/members?absence=1` assign absences list
        *  ?userId ?startDate ?endDate can be called to deepend your query
        */
        database(req, res) {

            if (this.serverError) return res.status(500).json({ message: 'ICS databse error', code: 500 })

            const collection = req.params.collection || ''
            const query = objectSize(req.query) ? req.query : null

            if (collection === 'absences') {
                const includeMember = true

                return (async () => {
                    const response = copy(await this.ics.absences(query, includeMember))
                        .map(item => {
                            if (item['type'] && item['member']) item['type'] = this.ics.typeSetMessage(item.member.name, item.type)
                            return item
                        })

                    return res.status(200).json({ success: true, response, ...this.ics.statusHandler.$get() })

                })().catch(error => res.status(404).json({ error, ...messageCodes[600] }))

            } if (collection === 'members') {
                // NOTE response assigns absences array when showAbsence=true
                const showAbsence = !!(query || {}).absence
                if (showAbsence) delete query.absence

                return (async () => {
                    const response = copy(await this.ics.members(query, [], showAbsence))
                        .map(item => {
                            if (showAbsence) {
                                // update type message
                                item['absences'].forEach(element => {
                                    if (element.type) element.type = this.ics.typeSetMessage(item.name, element.type)
                                });
                            }
                            return item
                        })
                    return res.status(200).json({ success: true, response, ...this.ics.statusHandler.$get() })
                })().catch(error => res.status(404).json({ error, ...messageCodes[601] }))

            } else return res.status(404).json({ error: true, ...messageCodes[603] })
        }
    }

}
