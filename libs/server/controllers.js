`use strict`

module.exports = function (expressApp) {
    const { isNumber, notify, objectSize, copy,isArray } = require('x-units')
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
            
            const validTypes = this.ics.availableAbsenceTypes.filter(z=>z===req.params.type).length
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
        *  end points: `/database/absences` , `/database/members` will list all documents
        *  deep queries: /database/members?absence=1 include absences of to each member
        *  ?userId ?startDate ?endDate can be called on each end point
        */
        database(req, res) {

            if (this.serverError) return res.status(500).json({ message: `ICS databse error`, code: 500 });

            const routeName = req.params.routeName || ''
            const query = objectSize(req.query) ? req.query: null

            if (routeName === 'absences') {
                const includeMember = true

                return this.ics.absences(query, includeMember).then(response => {
                    // modify type for user output
                    return copy(response).map(item => {
                        if (item['type'] && item['member']) item['type'] = this.ics.typeSetMessage(item.member.name, item.type)
                        return item
                    })          
                }).then(response=>res.status(200).json({ success: true, response, code: 200 }))
                    // can debate regarding which code to throw
                    .catch(error => res.status(404).json({ error, response: null, code: 404 }))
            }

            if (routeName === 'members') {
                // response assigns absences array when showAbsence=true
                const showAbsence = (query||{}).absence ? true:false
                if((query||{}).absence) delete query.absence
               
                return this.ics.members(query, [], showAbsence).then(response => {
                    return copy(response).map(item => {               
                            if (showAbsence) {
                                item['absences'] = item['absences'].map((z)=>{
                                      // update message
                                    if (z.type) z.type = this.ics.typeSetMessage(item.name, z.type)
                                    return z
                                })                
                            }       
                        return item
                    })
                }).then(response => res.status(200).json({ success: true, response, code: 200 }))
                    // can debate regarding which code to throw
                    .catch(error => res.status(404).json({ error, response: null, code: 404 }))
            }

            else return res.status(500).json({ message: `routeName ${routeName} not found`, code: 500 });
        }
    }

}