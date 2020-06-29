`use strict`

module.exports = (DEBUG = true) => {
    const { notify } = require('x-units')
    if (DEBUG) notify(`[ics-calendar-server] running in DEBUG mode`)
    const { listRoutes } = require('../utils')()
    // @ts-ignore
    const express = require('express')
    const app = express()
    const router = express.Router()
    const morgan = require('morgan')
    const bodyParser = require('body-parser')
    const config = require('../../config')
    const ServerAuth = require('./auth')(app)
    const ServerCtrs = require('./controllers')(app)
    const cors = require('cors')
    const ejs = require('ejs')
    const messageCodes = require('../status-handler/message.codes')
    app.set('trust proxy', 1) // trust first proxy
    app.use(morgan('dev'))
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use(cors())

    // for rendering html
    // @ts-ignore
    app.engine('html', ejs.__express)
    app.set('view engine', 'html')
    
    // static path to ical generatod files 
    app.use('/download', express.static(config.ics.filePath))

    /// ///////////////////
    // Initialize server controllers
    new ServerAuth(DEBUG).AppUseAuth()
    // Our SimpleOrder application is initialized from `ServerCtrs`
    const controllers = new ServerCtrs(DEBUG)

    /// //////////////////
    // set server routes
    // router.get('/calendar/:userId', controllers.calendar.bind(controllers));
    router.get('/calendar/:type/:userId', controllers.calendar.bind(controllers))
    router.get('/database/:collection', controllers.database.bind(controllers))

    // catch all other calls
    router.all('*', function (req, res) {
        const routes = [].concat(listRoutes(router.stack), { route: '/download/:fileName' })
        return res.status(200).json({ message: 'welcome to ics-calendar', url: req.url, available_routes: routes, status: 200 })
    })

    /// //////////////////
    // handle errors
    // @ts-ignore
    app.use(function (error, req, res, next) {
        res.status(500).json({ error: error.toString(), ...messageCodes[500] })
    })

    app.use('/', router)

    /// //////////////////
    // Initialize server

    const server = app.listen(config.port, function () {
        // @ts-ignore
        const host = (server.address().address || '').replace(/::/, 'localhost')
        // @ts-ignore
        const port = server.address().port
        notify(`server runnign on http://${host}:${port}`)
    })
    return server
}
