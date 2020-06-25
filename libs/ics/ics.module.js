
`use strict`
/** 
 * @ICS
 * - calendar file handler class, used to generate `.ics, .ical` files for MS and Apple
 * - import `ics.api` database documents: `{absences,members}` both correlate with `crewId, userId` props.
 * - `new ICS({},debug)`
*/
module.exports = () => {
    const database = require('./api')()
    const { notify, isObject, isFalsy } = require('x-units')
    const {date} = require('../utils')()
    return class ICS {
        constructor({ }, debug) {
            this.debug = debug
         
            /** 
             * 
             *    new Date(year, month[, date[, hours[, minutes[, seconds[, milliseconds]]]]]);
      "endDate": "2017-01-05",
      new Date(2011, 0, 1, 0, 0, 0, 0); // 1 Jan 2011, 00:00:00
            */
        }

        /**
         * @absences
         * - @returns [{},..] list of items
         */
        async absences(query = null) {
            let data = []
            try {
                data = await database.absences()
            } catch (err) {
                if (this.debug) notify(`[absences] database empty`, 1)
                return Promise.reject('database empt')
            }

            if (isObject(query) && !isFalsy(query)) {

                const filteredData = data.reduce((n, el, inx) => {

                    Object.entries(el).map(([key, value]) => {
                        const queryMatched = query[key] !== undefined
                        const isDate = (key === 'startDate' || key === 'endDate')
                        // match query that is not a date
                        if (queryMatched && !isDate && query[key] === value) {
                            return n.push(el)
                        }
                        // match query that is a date
                        else if (isDate && queryMatched) {
                            let matchedEl

                            if (key === 'startDate' && date(query[key]).getTime() >= date(value).getTime()) {
                                matchedEl = el
                            }
                            // re eval above if endDate is set
                            if (key === 'endDate' && date(value).getTime() <= date(query[key]).getTime()) {
                                matchedEl = el
                            }
                            if (matchedEl) n.push(matchedEl)
                        }
                    })
                    return n
                }, [])
                return filteredData
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
        * - @returns [{},..] list of items
        */
        members(query=null) {
            try {
                return database.members()
            } catch (err) {
                if (this.debug) notify(`[members] database empty`, 1)
                return Promise.reject('database empt')
            }
        }
    }
}