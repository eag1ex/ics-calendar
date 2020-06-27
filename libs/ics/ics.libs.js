`use strict`
/** 
 * @ICSlibs
 * - extention to ics module
*/
module.exports = (ICSmodule) => {
    const config = require('../../config')
    const { date } = require('../utils')()
    const { notify, isObject, isFalsy, head, someKeyMatch, isArray, copy } = require('x-units')
    const uuidv4 = require('uuid').v4
    const ics = require('ics')
    const fs = require('fs')
    const path = require('path')
    const { reduce, pickBy, identity } = require('lodash')
    const sq = require('simple-q')
    const moment = require('moment')

    return class ICSlibs extends ICSmodule {
        constructor(opts, debug) {
            super(opts, debug)
        }

        /** 
          * 
          * - generate new calendar event for each absenceMember available in `absences.db`
          * @param {array} absenceMembers, optional, merged memberAbsence record, or used last `this.d` cached value after chaining sequence
         */
        createICalEvents(absenceMembers = []) {

            if (!absenceMembers && this.d) absenceMembers = this.d        
            const eventsArr = [] 

            // 1. get all valid events
            for (let inx = 0; inx < (absenceMembers || []).length; inx++) {
                const item = absenceMembers[inx]
                try {
                    const eventData = this.CreateEventData(item).event()
                    if (!eventData) continue
                    eventsArr.push(eventData)
                } catch (error) {
                    continue
                }     
            }
            return eventsArr
        }

        /** 
         * - `ics.createEvent` populate .ics files
         * @param {array} eventsArr  array created by `createICalEvents`
        */
        async populateICalEvents(eventsArr = []) {

            function genIcal(eventData) {
                const defer = sq()

                ics.createEvent(eventData, (error, value) => {
                    if (error) return defer.reject({ [eventData.productId]: error })

                    const icsFilePath = config.ics.filePath           
                    fs.writeFile(path.join(icsFilePath, `./${eventData.productId}_event.ics`), value, err => {
                        if (err) return defer.reject({ [eventData.productId]: err })
                        defer.resolve({ [eventData.productId]: value })
                    })
                })

                return defer.promise()
            }

            const deneratedResults = []
            for (let inx = 0; inx < eventsArr.length; inx++) {
                // add `created` and `error` properties to handle user outputs called by `generateICS`
                try {
                    deneratedResults.push({ created: await genIcal(eventsArr[inx]) })
                } catch (error) {
                    notify({ error, populateICalEvents: true }, 1)
                    deneratedResults.push({ error: { [Object.keys(error)[0]]: true } })
                }

            }
            return deneratedResults
        }
        
        get availableAbsenceTypes() {
            return ['sickness', 'vacation' ]
        }

        /** 
         * produce formated message based on absenceType and memberName
         * @param {string} absenceType
        */
        typeSetMessage(memberName, absenceType = '') {
            let message
            switch (absenceType) {
                case 'sickness':
                    message = `${memberName} is sick`
                    break
                case 'vacation':
                    message = `${memberName} is on vacation`
                    break
                default:
                    if (this.debug) notify(`[typeSetMessage] wrong absenceType: ${absenceType}`, 0)
            }
            return message
        }

        /** 
         * 
         * - performs validation against `requiredFields`, and generates new ics event file based on `ics` npm package `https://www.npmjs.com/package/ics`
         * - to execute call: `CreateEventData({...}).event()`
         * @param {object} absenceWithMember data to parse new even
         * @returns valid event object or null
        */
        CreateEventData(absenceWithMember) {

            const self = this
            
            // const absenceMemberExample = {
            //     absence_days: [5], refer to duration
            //     admitterNote: "some notice to add", << use this if `memberNote` is lesser then

            // NOTE  NOT TOO SURE WHAT TAKES PRIORITY HERE
            //     confirmedAt: "2017-01-27T17:35:03.000+01:00",  << refer to lastModified
            //     createdAt: "2017-01-25T11:06:19.000+01:00", << refer to created
            //     startDate: "2017-02-23", <<  refer to start
            //     endDate: "2017-03-11",  refer to end 

            //     rejectedAt: null, << if endDate not set
            //     id: 2909, << refers to productId
            //     memberNote: "blah", << use this if `admitterNote` is lesser then
            //     lastModified:   refers to lastModified
            //     admitterId:123, NOTE refers to organizer ?? 
            //     type: "vacation",

            //     // member: {
            //     //     name: "Sandra"
            //     // }
            // }

            /** 
             * `ics offset notes vs moment/date format:`
             * - date properties, for example: `created=[2017,1,2,0]` render: `2017-1-2` but, standard date/moment.js format would render `2017-0-1`, The month and date index counts from 0 (+1) < fixed with `icsDateAdjustment`
             * - `absenceMember` is an absence document with `member:{}` property
            */
            return (new function (absenceMember) {
                if (isFalsy(absenceMember) || !isObject(absenceMember)) {
                    throw ('absenceMember must not be empty')
                }
                const { createdAt, startDate, endDate, type, member, absence_days, confirmedAt, rejectedAt, admitterNote, memberNote, id, admitterId } = absenceMember || {}

                const icsDateAdjustment = (dataArr, increment = 1) => {
                    return dataArr.map((n, inx) => inx === 0 ? n : (inx > 0 && inx < 3) ? n + increment : n)
                }

                this.created = () => {
                    const c = moment(createdAt || null).isValid() ? moment(createdAt).utc().toArray() : null
                    if (c) c.splice(6) // max size is 6
                    return c ? icsDateAdjustment(c, 1) : null
                }

                this.start = () => {
                    const c = moment(startDate || null).isValid() ? moment(startDate).toArray() : null
                    if (c) c.splice(6) // max size is 6
                    return c ? icsDateAdjustment(c, 1) : null
                }

                this.lastModified = () => {
                    const c = moment(confirmedAt || null).isValid() ? moment(confirmedAt).utc().toArray() : null
                    if (c) c.splice(6) // max size is 6
                    return c ? icsDateAdjustment(c, 1) : null
                }

                // `duration:` or `end:` is required, not both
                this.end = () => {
                    const dateStr = endDate || rejectedAt || null
                    const c = moment(dateStr).isValid() ? moment(endDate).toArray() : null
                    if (c) c.splice(6) // max size is 6
                    return c ? icsDateAdjustment(c, 1) : null
                }

                this.uid = uuidv4() 
                this.productId = id.toString()

                // NOTE not sure of this format, there is not valid example on absences.db
                this.duration = () => {
                    const d = (absence_days || []).length ? { days: head(absence_days).toString() } : null
                    if (d && Number((d || {}).days) < 1) {
                        if (self.debug) notify('[CreateEventData] absence_days must be gte >0', 0)
                        return null
                    } else return d
                }

                this.title = () => {
                    try {
                        return self.typeSetMessage(member.name, type)
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
            
                // NOTE optional
 
                // currently only got type for category
                this.categories = () => {
                    return type ? [type] : null
                }

                // NOTE note too sure if `admitterId` should be the organizer ?
                this.organizer = () => {
                    return pickBy({ name: 'Admin', email: 'admin@Crewmeister.com', admitterId }, identity)
                }

                this.event = () => {
                    const env = {
                        productId: this.productId,
                        uid: this.uid,
                        created: this.created(),
                        start: this.start(),
                        end: this.end(),
                        lastModified: this.lastModified(),
                        duration: this.duration(),
                        status: this.status,
                        busyStatus: this.busyStatus,
                        title: this.title(),
                        description: this.description,
                        organizer: this.organizer(), 
                        categories: this.categories()
                    }

                    // NOTE can only allow 1 end time
                    if (env['duration']) delete env['end']

                    const requiredFields = ['uid', 'productId', 'created' /*, 'start' */, ['end', 'duration'], 'status', 'busyStatus', 'title']

                    // exclude any empty props
                    let validEnv = pickBy(env, identity)
                    const lastTest = Object.keys(validEnv).filter(a => {
                      
                        return requiredFields.filter(b => {
                        // at least 1 should match
                            if (isArray(b)) return b.filter(c => a.indexOf(c) !== -1).length > 0
                            // all should match
                            else return a.indexOf(b) !== -1                  
                        }).length
                
                    }).length >= requiredFields.length

                    if (lastTest) return validEnv
                    else {
                        if (self.debug) notify('[CreateValidEventData] failed [requiredFields,...] validation', 1)
                        return null
                    }
                }
            }(absenceWithMember))
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
                } catch (err) {
                    // upy
                }
                return false
            }

            const limit = () => {
                if (limitedSearch.indexOf('ALL_ITEMS') !== -1) return 1
                return limitedSearch.filter(z => {
                    return Object.keys(query).filter(zz => zz === z).length
                }).length
            }

            // apply limit to block search thru other props
            if (!limit()) {
                if (this.debug) notify('[queryFilter] no match for limitedSearch', 0)
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
                } else return 1
            })
            return this
        }

        /** 
        * @param {boolean} includeMember when set, we grab `this.d` generated by `absences()`,  then execute `members({userId})` for each absence
        * @returns arrAsync including `member:{}` property
       */
        assignMember(includeMember = null) {
          
            if (!includeMember) {
                return this
            }
            const absencesList = (this.d || [])    
            const arrAsync = copy(absencesList).map(async (item) => {
                // conditionaly append `member` 
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
                } else {
                    // return absences/item without member
                    item['member'] = {}
                    if (this.debug) notify(`[absences] no member for userId:${item.userId} found on members.db `, 0)
                }
                    
                return item
            })

            this.d = arrAsync
            return this
        }

        /** 
        * @param {boolean} includeAbsence when set, we grab `this.d` generated by `members()`,  then execute `absences({userId})` for each member
        * @returns arrAsync including `absences:{}` property
       */
        assignAbsences(includeAbsence = null) {
            if (!includeAbsence) {
                return this
            }
            const memberList = (this.d || [])

            const arrAsync = copy(memberList).map(async (item) => {
                // conditionaly append `absences` 
                let absences = []
                try {
                    absences = await this.absences({ userId: item.userId }, null)
                } catch (error) {
                    // ups
                    notify({ error }, 1)
                }

                // assing `{absences}` to member/item
                if (absences.length) item['absences'] = absences
                else {
                    // return members/item without absences
                    item['absences'] = []
                    if (this.debug) notify(`[absences] no absences for userId:${item.userId} found on absences.db `, 0)
                }
                return item
            })

            this.d = arrAsync
            return this
        }
    }
}
