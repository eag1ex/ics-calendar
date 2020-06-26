var port = process.env.PORT || (process.argv[2] || 5000)
module.exports = {
    // 'PUBLIC': "./views",
    //  'secret': 'disabled',
    port: (typeof port === "number") ? port : 5000
}
