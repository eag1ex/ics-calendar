`use strict`
/** 
 * @ICSlibs
 * - extention to ics module
*/
module.exports = (ICSmodule) => {

    const { date } = require('../utils')()
    const { notify, isObject, isFalsy, head, someKeyMatch,isArray } = require('x-units')
    const uuidv4 = require('uuid').v4
    const ics = require('ics')
    const { reduce,pickBy, identity } = require('lodash')
    const moment = require('moment')

    return class ICSlibs extends ICSmodule {
        constructor(opts, debug) {
            super(opts, debug)
        }

         /** 
         * 
         * - performs validation against `requiredFields`, and generates new ics event file based on `ics` npm package `https://www.npmjs.com/package/ics`
         * - to execute call: `CreateEventData({...}).event()`
         * @param {object} absenceMember data to parse new even
         * @returns valid event object or null
        */
       CreateEventData(absenceMember) {
        const self = this
        return (new function (absenceMember) {
            if(isFalsy(absenceMember) || !isObject(absenceMember)) {
                throw('absenceMember must not be empty')
            }
            const { createdAt, startDate, endDate, type, member, absence_days, confirmedAt, rejectedAt, admitterNote, memberNote } = absenceMember ||{}

            // NOTE not too sure which one should be used ? createdAt or startDate
            this.created = moment(createdAt || startDate || null).isValid() ? moment(createdAt || startDate).toArray() : null
            // NOTE not too sure which one should be used ? confirmedAt or startDate
            this.start = moment(confirmedAt || null).isValid() ? moment(confirmedAt).toArray() : null
            // `duration:` or `end:` is required, not both
            this.end = () => {
                const dateStr = endDate || rejectedAt || null
                return moment(dateStr).isValid() ? moment(endDate).toArray() : null
            }
            this.uid = uuidv4()

            // NOTE not sure of this format, there is not valid example on absences.db
            this.duration = (absence_days || []).length ? { days: head(absence_days) } : null

            //title: `Employee, ${member.name}`,
            this.title = () => {
                try {
                    return type === 'vacation' ? `${member.name} is on ${type}` : type === 'sickness'
                        ? `${member.name} is ${type}` : null
                } catch (err) {
                    // member not provided
                    return null
                }
            }

            this.description = (admitterNote || '').length > (memberNote || '').length
                ? admitterNote : memberNote || ''

            // TENTATIVE, CONFIRMED, CANCELLED
            this.status = this.start && !rejectedAt ? 'CONFIRMED' : rejectedAt ? 'CANCELLED' : 'TENTATIVE'
            // 'BUSY' OR 'FREE' OR 'TENTATIVE' OR 'OOF'
            this.busyStatus = this.status === 'CONFIRMED' ? 'BUSY' : this.status === 'CANCELLED' ? 'OOF' : this.status === 'TENTATIVE' ? 'TENTATIVE' : 'FREE'
            
            // NOTE optional field
            this.organizer = { name: 'Admin', email: 'admin@Crewmeister.com' },

            this.event = () => {
                const env = {
                    uid: this.uid,
                    created: this.created,
                    start: this.start,
                    end: this.end(),
                    duration: this.duration,
                    status: this.status,
                    busyStatus: this.busyStatus,
                    title: this.title(),
                    description: this.description,
                    organizer:this.organizer
                }

                // NOTE can only allow 1 end time
                if(env['duration']) delete env['end']

                const requiredFields = ['uid', 'created' /*,'start'*/, ['end', 'duration'], 'status', 'busyStatus', 'title']

                // exclude any empty props
                let validEnv = pickBy(env, identity)
                const lastTest = Object.keys(validEnv).filter(a => {
                      
                    return requiredFields.filter(b=>{
                        // at least 1 should match
                        if (isArray(b)) return b.filter(c=> a.indexOf(c) !== -1).length > 0
                        // all should match
                        else return a.indexOf(b) !== -1                  
                    }).length
                
                }).length >= requiredFields.length

                if (lastTest) return validEnv
                else {
                    if(self.debug) notify(`[CreateValidEventData] failed [requiredFields,...] validation`, 1)
                    return null
                }

            }
        }(absenceMember))
    }

        /** 
         *  - per database record, check if profided query was fulfilled 
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
                if(this.debug) notify(`[queryFilter] no match for limitedSearch`,0)
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
          
            if (!includeMember) {
                return this
            }
            
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