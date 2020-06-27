`use strict`
/** 
 * @XDB database mock
 * - available databases: [members,absences]
*/
module.exports = () => {
    const { dataAsync } = require('../utils')()
    // const { isArray } = require('x-units')

    return class XDB {
        // @ts-ignore
        constructor(opts = {}) {
            // TODO
        }

        membersDB() {
            // @ts-ignore
            return dataAsync(require('./members.db.json'))
                .then((data) => data.payload)
        }

        absencesDB() {
            // @ts-ignore
            return dataAsync(require('./absences.db.json'))
                .then((data) => data.payload)
        }
    }
}
