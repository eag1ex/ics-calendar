/** 
 * We need to test `StatusHandler/middleware` is `setting` and `getting` correct status codes on each REST response
*/

//const assert = require('assert')
const chai = require('chai')
//const should = chai.should()
const expect = chai.expect
const StatusHandler = require('../libs/status-handler/status.handler')()
const messageCodes = require('../libs/status-handler/message.codes')
// with debug true will get better coverage because will expose notify logging
const DEBUG = require('../config').debug

describe('Check StatusHandler status codes', function () {
    const sth = new StatusHandler({}, DEBUG)
    it('Should response with $get()=>{code.message} per each $set({})', function (done) {
        for (let [key, val] of Object.entries(messageCodes)) {
            sth.$set({ code: val.code })
            const $get = sth.$get()
            expect($get).to.have.property('code').equal(val.code)
            expect($get).to.have.property('message').equal(val.message)
        }
        done()
    })

    it('Should fail response with $get()=>{code.message} per each $set({})', function (done) {
        for (let [key, val] of Object.entries(messageCodes)) {
            sth.$set({ code: val.code + 1000 })
            const $get = sth.$get()
            expect($get).equal(null)
        }
        for (let [key, val] of Object.entries(messageCodes)) {
            sth.$set({ code: -1 })
            const $get = sth.$get()
            expect($get).equal(null)
        }
        done()
    })

    it('Should response with $get()=>{code.message} per each $setWith({})', function (done) {
        for (let [key, val] of Object.entries(messageCodes)) {
            sth.$setWith(true, { code: 200 }, { code: 500 })
            const $get = sth.$get()
            expect($get).to.have.property('code').equal(200)
        }

        for (let [key, val] of Object.entries(messageCodes)) {
            sth.$setWith(false, { code: val.code }, { code: 500 })
            const $get = sth.$get()
            expect($get).to.have.property('code').equal(500)
        }
        done()
    })

})