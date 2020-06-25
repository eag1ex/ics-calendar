`use strict`

module.exports = (DEBUG = true) => {

    const { listRoutes } = require('../utils')()
    const { notify } = require('x-units')
    const express = require('express')
    const app = express()
    const router = express.Router();
    const morgan = require('morgan')
    const bodyParser = require('body-parser');
    const config = require('../config');
    const ServerAuth = require('./auth')(app)
    const ServerCtrs = require('./controllers')(app)
    const cors = require('cors');
    const ejs = require('ejs');
    // const q = require('q')

    app.set('trust proxy', 1); // trust first proxy
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cors());

    // for rendering html
    app.engine('html', ejs.__express);
    app.set('view engine', 'html');


    //////////////////////
    // Initialize server controllers
    new ServerAuth(DEBUG).AppUseAuth()
    // Our SimpleOrder application is initialized from `ServerCtrs`
    const controllers = new ServerCtrs(DEBUG)

    /////////////////////
    // set server routes
    router.get('/calander/:id', controllers.calander.bind(controllers));

    // catch all other calls
    router.all("*", function (req, res) {
        return res.status(200).json({ success: true, message: 'welcome to ics-calendar', url: req.url, available_routes: listRoutes(router.stack), status: 200 });
    })

    /////////////////////
    // handle errors
    app.use(function (error, req, res, next) {
        res.status(500).json({ error: error.toString(), message:'ups something went wrong'})
    });
    app.use('/', router);


    /////////////////////
    // Initialize server

    var server = app.listen(config.port, function () {
        var host = (server.address().address || "").replace(/::/, 'localhost')
        var port = server.address().port;
        //defer.resolve(true)
        notify(`server runnign on http://${host}:${port}`)
    })
    return server
}

