const port = process.env.PORT || (process.argv[2] || 5000)
const path = require('path')

module.exports = {
    ics: {
        // changing this path will automaticly update `ics.createEvent` path
        filePath: path.join(__dirname, './ical_event_files')
    },
    // 'PUBLIC': "./views",
    //  'secret': 'disabled',
    port: (typeof port === "number") ? port : 5000
}
