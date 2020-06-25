
`use strict`
/** 
 * @ICS
 * - calendar file handler class, used to generate `.ics, .ical` files for MS and Apple
 * - import `ics.api` database documents: `{absences,members}` both correlate with `crewId, userId` props.
 * - `new ICS({},debug)`
 * - ical ref: `https://en.wikipedia.org/wiki/ICalendar`
 * - ics ref: `https://www.npmjs.com/package/ics`
*/
module.exports = () => {
    const XDB = require('../xdb/xdb.api.module')()
    const { notify, isObject, isFalsy, head } = require('x-units')
    const { reduce } = require('lodash')

    class ICSmodule {
        constructor(opts = {}, debug) {
            this.debug = debug
            this.d = null // temporary hold data
            this.XDB = new XDB() // initiale database
        }

        /**
         * - generate new ics file by cross reference of 2 databases. Find member by `userId` and match them with  by `type`
         * @param {string} type references document prop on `absences` database
         * @param {number} uId required, get user by id
         * @param {string} dbName defaults to `members`
         */
        async generateICS(type = 'vacation', uId = null, dbName = 'members') {

            // "crewId": 352,
            // "id": 2245,
            // "image": "http://place-hoff.com/300/400",
            // "name": "Monika",
            // "userId": 2290
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
                        if (!memberData.length) throw (`no member with userId:${uId} found`, 1)
                        if (memberData.length > 1) {
                            if (this.debug) notify(`[generateICS] found more then one userId:${uId} on members database, selecting first`, 0)
                        }

                        const user = head(memberData)
                        if (!user) {
                            break
                        }

                        const { name, id, userId } = user || {} // {crewId,name,id,userId}
                        const userAbsencesList = await this.absences({ userId, type }, null, ['userId', type]) // NOTE modified queryFilter with searchByLimit
                        notify({ userAbsencesList: userAbsencesList.length })

                    } catch (error) {
                        notify({ error }, 1)
                    }

                    break;
                }

                default:
                    notify(`[generateICS] wrong dbName: ${dbName} selected not ics generated`, 1)
            }


            // {
            //     "absence_days": [],
            //     "admitterNote": "",
            //     "confirmedAt": "2017-01-27T17:35:03.000+01:00",
            //     "createdAt": "2017-01-25T11:06:19.000+01:00",
            //     "crewId": 352,
            //     "endDate": "2017-03-11",
            //     "id": 2909,
            //     "memberNote": "Urlaub",
            //     "rejectedAt": null,
            //     "startDate": "2017-02-23",
            //     "type": "vacation", // available types 'vacation' 'sickness'
            //     "userId": 5192
            //   },
            return true
        }

       


        /**
         * @absences
         * 
         * @extends queryFilter,assignMember
         * @param {boolean} includeMember when true, propetry: `member:{}` will be added
         * @param {array} searchByLimit when selected will override `queryFilter`
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
                return Promise.all(this.assignMember(includeMember).d)
            }

        }

        /**
        * @members
        * @param {object} query optional
        * @extends queryFilter
        * @param {array} searchByLimit when selected will override `queryFilter`
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