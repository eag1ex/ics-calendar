module.exports = function () {
    const { reduce } = require('lodash')
    const o = {}

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