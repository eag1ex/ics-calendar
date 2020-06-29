`use strict`
/** 
 * @XDB database mock
 * - available databases: [members,absences]
*/
module.exports = () => {
    const { notify } = require('x-units')
    const { dataAsync } = require('../utils')()
    return class XDB {
        // @ts-ignore
        constructor(opts = {}, debug) {
            this.debug = debug
            this.dataPath = {
                members: opts.members || `./members.db.json`,
                absences: opts.absences || `./absences.db.json`
            }

            if (this.debug) notify({ XDB: { dataPath: this.dataPath } })
        }

        membersDB() {
            try {
                return dataAsync(require(this.dataPath.members))
                    .then((data) => data.payload)
            } catch (err) {
                return Promise.reject('dataPath for XDB.members.db not found')
            }
        }

        absencesDB() {
            try {
                return dataAsync(require(this.dataPath.absences))
                    .then((data) => data.payload)
            } catch (err) {
                return Promise.reject('dataPath for XDB.absences.db not found')
            }
        }
    }
}
