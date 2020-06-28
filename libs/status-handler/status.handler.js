
/** 
 * @StatusHandler middleware, handles messages and code for REST
 * - NOTE tests available in `./tests/ics.ical.spec.js`
 * 
 * - we dont want to change endpoint datatypes, or make any descructive changes, so will store each status to help return appropiate  `messageCodes`
 * `StatusHandler.$set({})` > sets new lastStatus
 * `StatusHandler.$get({})` > returns lastStatus if any
 * `StatusHandler.$setWith({})` > can also be used as an alt to `$set()` 
 * 
 * - all available message codes are set in `./libs/message.codes.js`
*/
module.exports = () => {
    const messageCodes = require('./message.codes')
    const { isFalsy, notify, copy } = require('x-units')
    const { pickBy, identity } = require('lodash')
    return class StatusHandler {
        constructor(opts = {}, debug) {
            this._lastStatus = null // {message, code, error}
            this.debug = debug
        }

        /** 
         * - set either status all at one go
         * @borrows $set({})
         * 
         * @param {object} passStatus required, when condition===true, then will set passStatus
         * @param {object} failStatus required, when condition===false,then will set failStatus
         * @param {boolean} condition conditionaly set  _lastStatus
        */
        $setWith(condition = null, passStatus = {}, failStatus = {}) {
            const bothSet = !isFalsy(passStatus) && !isFalsy(failStatus)
            if (!bothSet) {
                if(this.debug) notify(`[$setWith] both passStatus/failStatus must be set to condition the correct results`, 1)
                return null
            }

            if (condition === true || condition > 0) return this.$set(passStatus)
            if (condition === false || condition <= 0) return this.$set(failStatus)
            else return null
        }
        /** 

         * - set new `_lastStatus`
         * @returns `true/false`
        */
        $set({ message, code, error }) {

            let status = pickBy({ message, code, error }, identity)

            if (isFalsy(status)) {
                notify(`[setStatus] status cannot be empty, nothing set`, 0)
                return false
            }
            if (!Number(status['code']) < 0) {
                notify(`[setStatus] code is missing, status not set`, 0)
                return false
            }
            status.code = Number(status.code)
            this._lastStatus = status

            return true
        }

        /** 
         * return last set status and and clear itm so it wont repeat on the next one
         * @returns {object} `{message,code,error} returns message and code
        */
        $get() {
            try {
                const last = copy(this._lastStatus)
                const newStatus = messageCodes[last['code']]
                if (!newStatus) {
                    if(this.debug) notify(`[getStatus] new status nto set because asking code is not yet in './message.codes.js'`, 1)
                    return null
                }

                // produce status from available message.codes 
                return newStatus
            } catch (err) {
                notify(`[$get] unhandeled status, returning default`,1)
                return messageCodes[604]
            }
        }

    }
}
