
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
         * 
         * - generate new calendar event for each absenceMember available in `absences.db`
         * @param {object} absenceMember, optional, merged memberAbsence record, or used last `this.d` cached value after chaining sequence
        */
        async newICalEvent(absenceMember={}){

            if(!absenceMember &&  this.d) absenceMember = this.d

            // few tests
            const test1 = {
                absence_days: [5],
                // admitterNote: "some notice to add",
                confirmedAt: "2017-01-27T17:35:03.000+01:00",
               // createdAt: "2017-01-25T11:06:19.000+01:00",
                crewId: 352,
                // endDate: "2017-03-11",
                id: 2909,
                //memberNote: "blah",
                rejectedAt: null,
                startDate: "2017-02-23",
                type: "vacation",
                userId: 5192,
                // member: {
                //     name: "Sandra"
                // }
            }



            notify({CreateEventData:this.CreateEventData(test1).event()})
            
        }

        /**
         * - generate new ics file by cross reference of 2 databases. Find member by `userId` and match them with  by `type`
         * @param {string} type references record prop on `absences` database
         * @param {number} uId required, get user by id
         * @param {string} dbName defaults to `members`
         * @borrows `members, absences`
         */
        async generateICS(type = 'vacation', uId = null, dbName = 'members') {

            const availableTypes = ['vacation', 'sickness']

            if (!dbName) {
                if (this.debug) notify(`[generateICS] no dbName selected`, 1)
                return {}
            }

            if (Number(uId) < 0) {
                if (this.debug) notify(`[generateICS] wrong userId`, 1)
                return {}
            }

            if (availableTypes.indexOf(type || '') === -1) {
                if (this.debug) notify(`[generateICS] wrong type selected`, 1)
                return {}
            }

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

                        const {userId} = user  // {crewId,name,id,userId}
                        const userAbsencesList = await this.absences({ userId, type }, true, ['userId', type]) // NOTE modified queryFilter with searchByLimit
                        this.newICalEvent()     
                        //notify({ userAbsencesList: })

                    } catch (error) {
                        notify({ error }, 1)
                    }

                    break;
                }

                default:
                    notify(`[generateICS] wrong dbName: ${dbName} selected not ics generated`, 1)
            }

            return true
        }

    
        /**
         * 
         * @param {boolean} includeMember when true, propetry: `member:{}` will be added
         * @param {array} searchByLimit when selected will override `queryFilter`
         * @borrows `queryFilter,assignMember`
         * @returns [{},..] list of items
         */
        async absences(query = null, includeMember = null, searchByLimit = []) {
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
            }

            // invalid query
            else if (query) {
                if (this.debug) notify(`[absences] specified query must be an object`, 0)
                return []
            }
            else {
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
        async members(query = null, searchByLimit = []) {

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
                    return this.queryFilter(data, query, filter, 'members').d
                } catch (error) {
                    notify({ error }, 1)
                    return []
                }
            }
            // invalid query
            else if (query) {
                if (this.debug) notify(`[absences] specified query must be an object`, 0)
                return []
            }
            else return data
        }
    }

    const ICSExt = require('./ics.libs')(ICSmodule)
    return ICSExt
}