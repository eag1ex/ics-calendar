`use strict`
/** 
 * Static database api
 * - `exports` use so we can handle erros better
*/
module.exports = () => {
    const $get = (data) => new Promise((resolve) => resolve(data)).then((data) => data.payload);
    return {
        members: () => $get(require('./database/members.json')),
        absences: () => $get(require('./database/absences.json'))
    }
}


