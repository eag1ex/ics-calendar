module.exports = function () {
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
    return o
}
