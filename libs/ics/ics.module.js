
`use strict`
/** 
 * @ICS
 * - calendar file handler class, used to generate `.ics, .ical` files for MS and Apple
 * - import `ics.api` database documents: `{absences,members}` both correlate with `crewId, userId` props.
 * - `new ICS({},debug)`
*/
module.exports = () => {
    const database = require('./api')()
    const { notify } = require('x-units')
    return class ICS {
        constructor({ }, debug) {
            this.debug = debug
        }

        /**
         * @absences
         * - @returns [{},..] list of items
         */
        absences() {
            try {
                return database.absences()
            } catch (err) {
                if (this.debug) notify(`[absences] database empty`, 1)
                return Promise.reject('database empt')
            }
        }

        /**
        * @members
        * - @returns [{},..] list of items
        */
        members() {
            try {
                return database.members()
            } catch (err) {
                if (this.debug) notify(`[members] database empty`, 1)
                return Promise.reject('database empt')
            }
        }
    }
}