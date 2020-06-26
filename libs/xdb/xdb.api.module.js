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

        members() {
            // @ts-ignore
            return dataAsync(require('./members.db.json'))
                .then((data) => data.payload)
        }

        absences() {
            // @ts-ignore
            return dataAsync(require('./absences.db.json'))
                .then((data) => data.payload)
        }
    }
}
