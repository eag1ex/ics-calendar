`use strict`


module.exports = function (expressApp) {
    const { isNumber} = require('x-units')

    return class ServerController {
        constructor(debug) {
            this.debug = debug
        }

    
        /**
         * (GET) REST/api
         * - Show me calendar item by `id`
         * `example: /calendar/:id` 
         * @param {*} req 
         * @param {*} res 
         */
        calendar(req, res){
            const {id} = req.params
            if(!id) return res.status(200).json({ error: 'false', response:{}, code: 200 });
            // 
            return res.status(200).json({ success: true, response:{menu:this.simpleOrder.listStore}, code: 200 });
        }

    }

}