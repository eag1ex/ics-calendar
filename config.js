const port = process.env.PORT || (process.argv[2] || 5000)
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
    // 'PUBLIC': "./views",
    //  'secret': 'disabled',
    port: (typeof port === "number") ? port : 5000
}
