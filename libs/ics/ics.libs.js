`use strict`
/** 
 * @ICSlibs
 * - extention to ics module
*/
module.exports = (ICSmodule) => {
    const { notify, someKeyMatch, head } = require('x-units')
    const { date } = require('../utils')()
    const { reduce } = require('lodash')

    return class ICSlibs extends ICSmodule {
        constructor(opts, debug) {
            super(opts, debug)
        }

        /** 
         *  - per database document, check if profided query was fulfilled 
         * @param {object} query can search thru name properties provided by members/absences database
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
            if (!limit()) {
                this.d = []
                return this
            }
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
            this.d = filteredData.sort((a, b) => {
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

            return this
        }

        /** 
        * - then `includeMember=true`, we grab `this.d` generated by `absences()`
        * - then execute `members({userId})` for each absence
        * @returns arrAsync including `member:{}` property
       */
        assignMember(includeMember = null) {

            if (!includeMember) return this.d
            const absencesAsyncArr = this.d || []

            const arrAsync = absencesAsyncArr.map(async (item) => {
                // conditionaly append `member` 
                if (includeMember === true) {
                    let member = {}
                    try {
                        member = head(await this.members({ userId: item.userId }))
                    } catch (error) {
                        // ups
                        notify({ error }, 1)
                    }
                    // NOTE
                    // 1. assing `{member}` to absences/item
                    // 2. reduce to only show `name`
                    if (member) {
                        item['member'] = reduce(member, (n, el, k) => {
                            if (k === 'name') n['name'] = el
                            return n
                        }, {})
                    }
                    else {
                        // return absences/item without member
                        item['member'] = {}
                        if (this.debug) notify(`[absences] no member userId:${item.userId} found on members.db `, 0)
                    }
                    return item
                }
                else return item
            })
            this.d = arrAsync
            return this
        }
    }
}