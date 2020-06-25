
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
    const { date } = require('../utils')()
    return class ICS {
        constructor({ }, debug) {
            this.debug = debug
        }

        /**
         * @absences
         * @extends queryFilter
         * @returns [{},..] list of items
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
                try {
                    return this.queryFilter(data, query, ['userId', 'startDate', 'endDate'], 'absences')
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
        * @extends queryFilter
        * @returns [{},..] list of items
        */
        async members(query = null) {
            let data = []
            try {
                data = await database.members()
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
         * - can query thru all available props in absence database
         * - applied limit to only filter thru `limitedSearch[]` props
         * @param {*} data required
         * @param {*} query required
         * @param limitedSearch array include limit to which items to filter thru
         * @param dbName reference to which db we are performing this filter
         * @returns [] filtered array by query filter
         */
        queryFilter(data = [], query = {}, limitedSearch = [], dbName='') {

            if (!limitedSearch || !(limitedSearch || []).length || limitedSearch.indexOf('ALL_ITEMS') !== -1){
                limitedSearch = ['ALL_ITEMS'] // only limit to these props
            }

            const matched = (val, _with) => {
                if (val === _with) return true
                if ((val || '').toString() === _with) return true
                return false
            }

            const matchedQuery = (query, item) => {
                return Object.keys(query).filter(z => Object.keys(item).filter(zz => zz === z).length).length
            }

            const limit = () => {
                if( limitedSearch.indexOf('ALL_ITEMS') !== -1) return 1
                return limitedSearch.filter(z => {
                    return Object.keys(query).filter(zz => zz == z).length
                }).length
            }
       
            // limit exceeded!
            if( !limit()) return []

            const filteredData = data.reduce((n, el, inx) => {

                // only perform if any matching keys are found
                if (!matchedQuery(query, el)) return n

                // apply limit to block search thru other props
            
                const isStart = el['startDate'] && query['startDate']
                const isEnd =  el['endDate'] && query['endDate']
                const queryRange = query['startDate'] && query['endDate']
                // if query has date applied and item also has data
                if (isStart || isEnd) {
                       
                    const withStartDate = () => {
                        if (query['startDate'] && el['startDate']) {
                            return date(query['startDate']).getTime() <= date(el['startDate']).getTime() && isStart
                        }
                        return false
                    }

                    const withEndDate = () => {
                        if (query['endDate'] && el['endDate']) {
                            return date(el['endDate']).getTime() <= date(query['endDate']).getTime() && isEnd
                        }
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
                // match all other queries conditionally with `limitedSearch`
                Object.entries(el).map(([key, value]) => {
                    
                    const queryMatched = query[key] !== undefined
                    const isDate = (key === 'startDate' || key === 'endDate')
                    // match query that is not a date
                    if (queryMatched && !isDate && matched(value, query[key])) n.push(el)
                })

                return n
            }, [])
            // sort all by createdAt  or userId
            return filteredData.sort((a, b) => {
                if (dbName === 'absences') return new Date(a['createdAt']).getTime() - new Date(b['createdAt']).getTime()
                if (dbName === 'userId') return Number(a['userId']) - Number(b['userId'])
                else return 1
            })
        }

    }
}