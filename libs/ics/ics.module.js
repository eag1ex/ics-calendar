
`use strict`
/** 
 * @ICS
 * - calendar file handler class, used to generate `.ics, .ical` files for MS and Apple
 * - import `ics.api` database records: `{absences,members}` both correlate with `crewId, userId` props.
 * - `new ICS({},debug)`
 * - ical ref: `https://en.wikipedia.org/wiki/ICalendar`
 * - ics ref: `https://www.npmjs.com/package/ics`
*/
module.exports = () => {
    const XDB = require('../xdb/xdb.api.module')()
   
    const { notify, isObject, isFalsy, head } = require('x-units')

    class ICSmodule {
        // @ts-ignore
        constructor(opts = {}, debug) {
            this.debug = debug
            this.d = null // temporary hold data
            this.XDB = new XDB() // initiale database
        }

        /**
         * - generate new ics file by cross reference of 2 databases. Find member by `userId` and match them with  by `type`
         * @param {string} type references record prop on `absences` database
         * @param {number} uId required, get user by id
         * @param {string} dbName defaults to `members`
         * @borrows `members, absences`
         */
        async generateICS(type = 'vacation', uId = null, dbName = 'members') {

            if (!dbName) {
                if (this.debug) notify(`[generateICS] no dbName selected`, 1)
                return []
            }

            if (Number(uId) < 0) {
                if (this.debug) notify(`[generateICS] wrong userId`, 1)
                return []
            }

            if (this.availableAbsenceTypes.indexOf(type || '') === -1) {
                if (this.debug) notify(`[generateICS] wrong type selected`, 1)
                return []
            }

            let userOutput = []
            switch (dbName) {
                case 'members': {

                    try {
                        const memberData = await this.members({ userId: uId })
                        if (!memberData.length) throw (`no member with userId:${uId} found`)
                        if (memberData.length > 1) {
                            if (this.debug) notify(`[generateICS] found more then one userId:${uId} on members database, selecting first`, 0)
                        }

                        const user = head(memberData)
                        if (!user) {
                            break
                        }

                        const { userId } = user // {crewId,name,id,userId}
                        const userAbsencesList = await this.absences({ userId, type }, true, ['userId', type]) 

                        // 1. produce event list for ics files
                        const calEvents = this.newICalEvents(userAbsencesList) 
                        // 2. populate ics files   
                        userOutput = await this.populateICalEvents(calEvents).then(z => {
                            // notify({populateICalEvents:z})
                            return z.map(el => Object.keys(el)[0])
                        })

                    } catch (error) {
                        notify({ error }, 1)
                    }

                    break
                }

                default:
                    notify(`[generateICS] wrong dbName: ${dbName} selected no ics generated`, 1)
            }

            return userOutput
        }
    
        /**
         * 
         * @param {boolean} includeMember when true, propetry: `member:{}` will be added
         * @param {array} searchByLimit when selected will override `queryFilter`
         * @borrows `queryFilter,assignMember`
         * @returns [{},..] list of items
         */
        async absences(query = null, includeMember = null, searchByLimit = []) {
            this.d = null
            let data = []
            try {
                data = await this.XDB.absences()
            } catch (err) {
                if (this.debug) notify(`[absences] database empty`, 1)
                return Promise.reject('database empt')
            }
            
            // when query is set and `includeMember` enabled (by default) on controller.absences(...)
            // it will again perform another query against `members({userId})` to be added on each item
            if (isObject(query) && !isFalsy(query)) {
                try {
                    let filter = ['userId', 'startDate', 'endDate'] // queryFilter
                    if ((searchByLimit || []).length) filter = searchByLimit
                    // @ts-ignore
                    const arrAsync = this.queryFilter(data, query, filter, 'absences')
                        .assignMember(includeMember).d 
                    
                    return Promise.all(arrAsync)
                } catch (error) {
                    notify({ error }, 1)
                    return []
                }
            } else {
                this.d = data
                // @ts-ignore
                return Promise.all(this.assignMember(includeMember).d)
            }
        }

        /**
        * @param {object} query optional
        * @param {array} searchByLimit when selected will override `queryFilter`
        * @borrows `queryFilter`
        * @returns [{},..] list of items
        */
        async members(query = null, searchByLimit = [], showAbsence = null) {
            this.d = null
            let data = []
            try {
                data = await this.XDB.members()
            } catch (err) {
                if (this.debug) notify(`[members] database empty`, 1)
                return Promise.reject('database empty')
            }
            if (isObject(query) && !isFalsy(query)) {
                try {
                    let filter = ['userId'] // queryFilter
                    if ((searchByLimit || []).length) filter = searchByLimit
                    // @ts-ignore
                    const arrAsync = this.queryFilter(data, query, filter, 'members')
                        .assignAbsences(showAbsence).d

                    return Promise.all(arrAsync)
                } catch (error) {
                    notify({ error }, 1)
                    return []
                }
            } else {
                this.d = data         
                return Promise.all(this.assignAbsences(showAbsence).d)
            }
        }
    }

    const ICSExt = require('./ics.libs')(ICSmodule)
    return ICSExt
}
