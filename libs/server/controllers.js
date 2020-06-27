`use strict`

module.exports = function (expressApp) {
    const { isNumber, notify, objectSize, copy } = require('x-units')
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
            if (this.serverError) return res.status(500).json({ message: `ICS databse error`, code: 500 })
            
            const validTypes = this.ics.availableAbsenceTypes.filter(z => z === req.params.type).length
            if (!validTypes) return res.status(200).json({ error: 'wrong type provided', response: {}, code: 200 })
            const type = req.params.type
            const userId = Number(req.params.userId)    
            if (!isNumber(userId) || userId < 0) return res.status(200).json({ error: 'wrong userId provided', response: {}, code: 200 })

            return this.ics.generateICS(type, userId, 'members').then(z => {
                let message
                if (z.length) message = '.ics files generated'
                else message = 'no match for provided query'
                res.status(200).json({ success: true, response: z, message, code: 200 })
            })
        }

        /**
        * (GET) REST/api 
        *  end points: `/database/:document` >> `/database/members` or `/database/absences` will list document items
        *  deep queries: `/database/members?absence=1` assign absences list
        *  ?userId ?startDate ?endDate can be called to deepend your query
        */
        database(req, res) {

            if (this.serverError) return res.status(500).json({ message: `ICS databse error`, code: 500 })

            const _document = req.params.document || ''
            const query = objectSize(req.query) ? req.query : null

            if (_document === 'absences') {
                const includeMember = true
                return ( async() => {
                    const r = await this.ics.absences(query, includeMember)
                    const response = copy(r).map(item => {
                        if (item['type'] && item['member']) item['type'] = this.ics.typeSetMessage(item.member.name, item.type)
                        return item
                    })
                    return res.status(200).json({ success: true, response, code: 200 })
                })().catch(error => {
                    res.status(404).json({ error, response: null, code: 404 })
                })

            } if (_document === 'members') {
                // response assigns absences array when showAbsence=true
                const showAbsence = !!(query || {}).absence
                if ((query || {}).absence) delete query.absence
               
               return (async ()=>{
                   const r = await this.ics.members(query, [], showAbsence)
                   const response = copy(r).map(item => {
                       if (showAbsence) {
                           item['absences'] = item['absences'].map((z) => {
                               // update message
                               if (z.type) z.type = this.ics.typeSetMessage(item.name, z.type)
                               return z
                           })
                       }
                       return item
                   })          
                    return res.status(200).json({ success: true, response, code: 200 })
                })().catch(error=>{
                    return res.status(404).json({ error, response: null, code: 404 })
                })

            } else return res.status(500).json({ message: `document ${_document} not found`, code: 500 })
        }
    }

}
