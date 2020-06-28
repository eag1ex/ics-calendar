module.exports = function () {
    // const config = require('../config')
    const { reduce } = require('lodash')
    const o = {}

    /** 
     * @param str must provide valid date format, example: `2017-12-15`
     * @returns new Date() or null
    */
    o.date = (str = '') => {
        if (!str) str = ''
        if ((new Date(str)).toDateString() === 'Invalid Date') return null
        return new Date(str)
    }

    o.dataAsync = (data) => {
        return new Promise((resolve) => resolve(data))
    }

    o.listRoutes = (stack) => {
        return reduce(stack, (n, el, k) => {
            if (el.route) {
                if (((el.route || {}).path || '').indexOf('/') !== -1) {
                    n.push({ route: el.route.path })
                }
            }
            return n
        }, [])
    }

    /**
     * - accepting object, example: `{'001':['SimpleOrder listStore is empty'],...}`
     * - we can pass code as either number or string, will be updated to number
     * @returns : {001:{message,code},...}
     */
    o.codeMessage = (messages) => {
        const msgs = {}
        for (let [k, v] of Object.entries(messages)) {
            msgs[k] = { message: v[0], code: Number(k) }
        }
        return msgs
    }
    return o

}
