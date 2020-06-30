
/** 
 * - `messages and error codes to better identify issues and responses`
*/
const { codeMessage } = require('../utils')()

/**
 * returns example : `{'001':{message,code},...}`
 */
module.exports = codeMessage({
    // light error 100 to 199
    100: ['Query{} to database/absences  returned no results'],
    101: ['Error in absences/Query{}, or member assignment'],
    102: ['No results in database/absences'], // 
    103: ['Query{} to database/members returned no results'],
    104: ['Error in your members/Query{}, or absences assignment'],
    105: ['No results in database/members'],
    106: ['Calendar files not produced, because no database was matched, or .ics file creation error'],
    107: ['Calendar files not produced, no userId matched in absences.db'],
    108: ['Wrong userId provided'],

    // ok 200 to 399
    200: ['Got results for absences/{query}'],
    201: ['Got all results for /absences'],
    202: ['Got results for members/{query}'],
    203: ['Got all results for /members'],
    204: [`Calendar ({productId}_event.ics) files generated`],

    // critical error from  500 up
    500: ['Server error'],
    600: ['ICS unrepresented error database/absences response'],
    601: ['ICS unrepresented error database/members response'],
    602: ['ICS unrepresented error producing .ics file'],
    603: ['No /collection found'],
    604: ['Unhandled response error']
})
