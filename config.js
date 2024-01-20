const port = process.env.PORT || 5000 || 8000
const path = require('path')

/** 
 * ics-calendar app config file
*/
module.exports = {

    debug: false, // debug for all application code

    ics: {
        // changing path will automaticly update `ics.createEvent` path, and static server path
        filePath: path.join(__dirname, './ical_event_files')
    },

    deleteOlderThen: '1m', // delete `ical_event_files` older then the time provided
    // 'PUBLIC': "./views",
    //  'secret': 'disabled',
    port
}
