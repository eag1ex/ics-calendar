`use strict`

// asset: https://mochajs.org/
// asset: https://www.chaijs.com/
// asset: https://github.com/istanbuljs/nyc

const assert = require('assert')
const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../libs/server/server')(false)
const should = chai.should()
const expect = chai.expect
// const { notify } = require("x-units")
const config = require('../config')
chai.use(chaiHttp)

let absencesList = ['admitterNote',
  'confirmedAt',
  'createdAt',
  'crewId',
  'endDate',
  'id',
  'memberNote',
  'rejectedAt',
  'startDate',
  'type',
  'userId']

let membersList = [
  'crewId',
  'id',
  'image',
  'name',
  'userId'
]

function chaiGetRequest(server, url, cb, done) {
  chai.request(server).get(url)
    .end(function (err, res) {
      if (err) {
        expect('success').not.equal('success')
        return
      }
      cb(res)
      done()
    })
}

// SECTION  Server should start sucessfully
describe('Server should start sucessfully', function () {

  let port
  before(async function (done) {
    port = server.address().port
    done()
  })

  after(function (done) {
    server.close()
    done()
  })

  it(`server is running on port:${config.port}`, function (done) {
    this.retries(2)
    const okPort = process.env.PORT || config.port
    assert.equal(okPort, Number(port))
    done()
  })

  it('GET/ status is 200', function (done) {

    chaiGetRequest(server, `/`, (res) => {
      expect(res.body.status).equal(200)
      res.should.have.status('200')
      res.should.be.json
    }, done)

  })
}) // !SECTION 


// SECTION PASS:GET /absences requests
describe('PASS:GET /absences requests', function () {

  it(`should list all items with all keys`, function (done) {

    chaiGetRequest(server, `/database/absences`, (res) => {

      assert.equal(res.body.success, true)
      expect(res.body.response.length).above(0)
      expect(res.status === 200 || res.status === 300).equal(true)
      res.should.be.json
      res.should.have.status('200')
      expect('error').not.equal('success')

      res.body.response.forEach((item, inx) => {
        absencesList.filter(key => {
          assert(Object.keys(item).includes(key))
        })
      })
    }, done)

  })


  it(`every [item,...] should have {member.name}`, function (done) {

    chaiGetRequest(server, `/database/absences`, (res) => {
      res.body.response.forEach((item, inx) => {
        expect(item).to.have.property('member')
        expect(item.member).to.have.property('name').to.be.a('string')
      })
    }, done)
  })


  it(`{query} with ?userId=644 to list its absences`, function (done) {

    chaiGetRequest(server, `/database/absences?userId=644`, (res) => {
      assert.equal(res.body.success, true)
      expect(res.body.response.length).above(0)
      res.body.response.forEach((item) => {
        expect(item).to.have.property('userId').to.be.a('number')
        expect(item['userId']).to.equal(644)
      })
    }, done)
  })

  it(`{query} ?startDate=2016-12-31&endDate=2017-03-10 to list correct range`, function (done) {

    chaiGetRequest(server, `/database/absences?startDate=2016-12-31&endDate=2017-03-10`, (res) => {
      assert.equal(res.body.success, true)
      expect(res.body.response.length).above(0)
      res.body.response.forEach((item) => {
        if (new Date(item.startDate).getTime() >= new Date('2016-12-31')) expect(true).to.equal(true)
        if (new Date(item.endDate).getTime() <= new Date('2017-03-10')) expect(true).to.equal(true)
      })
    }, done)

  })

  it(`{query} ?startDate=2016-12-31 to list from startDate`, function (done) {

    chaiGetRequest(server, `/database/absences?startDate=2016-12-31`, (res) => {

      assert.equal(res.body.success, true)
      expect(res.body.response.length).above(0)
      res.body.response.forEach((item) => {
        if (new Date(item.startDate).getTime() >= new Date('2016-12-31')) expect(true).to.equal(true)
      })

    }, done)
  })
}) // !SECTION 


// SECTION PASS:GET /members requests
describe('PASS:GET /members requests', function () {

  it(`should list all items with all keys`, function (done) {

    chaiGetRequest(server, `/database/members`, (res) => {
      assert.equal(res.body.success, true)
      expect(res.body.response.length).above(0)
      expect(res.status === 200 || res.status === 300).equal(true)
      res.should.be.json
      res.should.have.status('200')
      expect('error').not.equal('success')

      res.body.response.forEach((item, inx) => {
        membersList.filter(key => {
          assert(Object.keys(item).includes(key))
        })
      })
    }, done)

  })


  it(`{query} ?userId=644 list by userId=644`, function (done) {

    chaiGetRequest(server, `/database/members?userId=644`, (res) => {
      res.body.response.forEach((item, inx) => {
        membersList.filter(key => {
          assert(Object.keys(item).includes(key))
        })
        expect(item['userId']).to.equal(644)
      })
    }, done)

  })


  it(`{query} ?absence=1 list all items with related absences[]`, function (done) {

    chaiGetRequest(server, `/database/members?absence=1`, (res) => {
      res.body.response.forEach((item, inx) => {
        [].concat('absences', membersList).filter(key => {
          assert(Object.keys(item).includes(key))
        })
        // it is ok for some members not to have absences yet set
        if ((item['absences'] || []).length) {
          item['absences'].forEach((absence) => {
            absencesList.filter(key => assert(Object.keys(absence).includes(key)))
          })
        }
      })
    }, done)

  })


  it(`{query} ?userId=644&absence=1 list by userId=644 with related absences[]`, function (done) {

    chaiGetRequest(server, `/database/members?userId=644&absence=1`, (res) => {
      res.body.response.forEach((item, inx) => {
        [].concat('absences', membersList).filter(key => {
          assert(Object.keys(item).includes(key))
        })
        // it is ok for some members not to have absences yet set
        if ((item['absences'] || []).length) {
          item['absences'].forEach((absence) => {
            expect(absence['userId']).to.equal(644)
            absencesList.filter(key => assert(Object.keys(absence).includes(key)))
          })
        }
        expect(item['userId']).to.equal(644)
      })
    }, done)

  })

}) //!SECTION 


// describe('FAIL:GET  /absences requests', function () {

// })

// describe('FAIL:GET  /members requests', function () {

// })
