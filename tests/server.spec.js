`use strict`


// asset: https://mochajs.org/
// asset: https://www.chaijs.com/
// asset: https://github.com/istanbuljs/nyc


const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../libs/server/server')(true)
const should = chai.should();
const expect = chai.expect;
const { notify } = require("x-units")
const config = require('../config')
chai.use(chaiHttp);


describe('Server should start sucessfully', function () {
  let port
  before(async function (done) {
    port = server.address().port;
    done()
  });

  after(function (done) {
    server.close();
    done();
  });

  it(`server is running on port:${config.port}`, function (done) {
    this.retries(2);
    const okPort = process.env.PORT || config.port
    assert.equal(okPort, Number(port))
    done()
  })
})



process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });
