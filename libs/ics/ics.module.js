
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
    const { notify, isObject, isFalsy, head, someKeyMatch } = require('x-units')
    const { reduce } = require('lodash')
    const { date } = require('../utils')()
    return class ICS {
        constructor({ }, debug) {
            this.debug = debug
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
                        const userAbsencesList = await this.absences({ userId, type }, ['userId', type]) // NOTE modified queryFilter with searchByLimit
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
         * @extends queryFilter
         * @param {array} searchByLimit when selected will override `queryFilter`
         * @returns [{},..] list of items
         */
        async absences(query = null, searchByLimit = []) {
            let data = []
            try {
                data = await this.XDB.absences()
            } catch (err) {
                if (this.debug) notify(`[absences] database empty`, 1)
                return Promise.reject('database empt')
            }

            if (isObject(query) && !isFalsy(query)) {
                try {
                    let filter = ['userId', 'startDate', 'endDate'] // queryFilter
                    if ((searchByLimit || []).length) filter = searchByLimit
                    return this.queryFilter(data, query, filter, 'absences')
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

        /**
        * @members
        * @param {object} query optional
        * @extends queryFilter
        * @returns [{},..] list of items
        */
        async members(query = null) {

            let data = []
            try {
                data = await this.XDB.members()
            } catch (err) {
                if (this.debug) notify(`[members] database empty`, 1)
                return Promise.reject('database empt')
            }

            if (isObject(query) && !isFalsy(query)) {
                try {
                    return this.queryFilter(data, query, ['userId'], 'members')
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

        /** 
         *  - per database document, check if profided query was fulfilled 
         * @param {opject} query can search thru name properties provided by members/absences database
        */
        Queryfulfilled(query) {
            return (new function () {
                const q = query
                this.query = Object.entries(q).reduce((nn, [key, value]) => {
                    nn.push({ value, match: false, key })
                    return nn
                }, [])

                this.set = (name) => {
                    this.query.forEach((el) => {
                        if (el['key'] === name) el['match'] = true
                    })
                    return this
                }

                this.ok = () => {
                    return this.query.filter((item) => item['match'] === true).length === Object.keys(q).length
                }
            }())
        }

        /**
         * - can query thru all available props in absence database
         * - applied limit to only filter thru `limitedSearch[]` props
         * @param {array} data required
         * @param {object} query required
         * @param {array} limitedSearch array include limit to which items to filter thru
         * @param {string} dbName reference to which db we are performing this filter
         * @returns [] filtered array by query filter
         */
        queryFilter(data = [], query = {}, limitedSearch = [], dbName = '') {

            if (!limitedSearch || !(limitedSearch || []).length || limitedSearch.indexOf('ALL_ITEMS') !== -1) {
                limitedSearch = ['ALL_ITEMS'] // only limit to these props
            }

            // when values try to match (string num) === num
            const matched = (val, _with) => {
                if (val === _with) return true
                try {
                    if ((val || '').toString() === _with.toString()) return true
                }
                catch (err) {
                    // upy
                }
                return false
            }


            const limit = () => {
                if (limitedSearch.indexOf('ALL_ITEMS') !== -1) return 1
                return limitedSearch.filter(z => {
                    return Object.keys(query).filter(zz => zz == z).length
                }).length
            }

            // apply limit to block search thru other props
            if (!limit()) return []

            const filteredData = data.reduce((n, el) => {
                try {
                    // only perform if any matching keys are found
                    if (!someKeyMatch(el, query)) return n
                    // const queryMatched = query[key] !== undefined
                    const isStart = el['startDate'] && query['startDate']
                    const isEnd = el['endDate'] && query['endDate']
                    const queryRange = query['startDate'] && query['endDate']
                    // if query has date applied and item also has data
                    if (isStart || isEnd) {

                        const withStartDate = () => {
                            if (query['startDate'] && el['startDate']) return date(query['startDate']).getTime() <= date(el['startDate']).getTime() && isStart
                            return false
                        }

                        const withEndDate = () => {
                            if (query['endDate'] && el['endDate']) return date(el['endDate']).getTime() <= date(query['endDate']).getTime() && isEnd
                            return false
                        }

                        if (withStartDate() && withEndDate()) {
                            n.push(el)
                            return n
                        }

                        if (withStartDate() && !queryRange) {
                            n.push(el)
                            return n
                        }

                        if (withEndDate() && !queryRange) {
                            n.push(el)
                            return n
                        }
                    }

                    const fulfilled = this.Queryfulfilled(query)
                    const notDate = !isStart || !isEnd

                    // all other query props matching current dataTable
                    if (notDate) {
                        const itemMatched = reduce(query, (nn, val, k) => {
                            if (matched(el[k], val)) {
                                nn.push(true)
                                fulfilled.set(k)
                            }
                            return nn
                        }, []).filter(f => fulfilled.ok())
                        // 
                        if (itemMatched.length) n.push(el)
                    }
                    // end of try    
                } catch (error) {
                    notify({ error }, 1)
                }

                return n
            }, [])
            // sort all by createdAt  or userId
            return filteredData.sort((a, b) => {
                if (dbName === 'absences') {
                    if (!a['createdAt'] || !b['createdAt']) return 1
                    return new Date(a['createdAt']).getTime() - new Date(b['createdAt']).getTime()
                }
                if (dbName === 'members') {
                    if (!a['userId'] || !b['userId']) return 1
                    return Number(a['userId']) - Number(b['userId'])
                }
                else return 1
            })
        }

    }
}