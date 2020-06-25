`use strict`
/** 
 * @XDB database mock
 * - available databases: [members,absences]
*/
module.exports = () => {
    const { dataAsync } = require('../utils')()
    // const { isArray } = require('x-units')

    return class XDB {
        constructor(opts={}) {
            // TODO
        }

        members() {
            return dataAsync(require('./members.db.json.js'))
                .then((data) => data.payload)
        }

        absences() {
            return dataAsync(require('./absences.db.json.js'))
                .then((data) => data.payload)
        }
    }
}


