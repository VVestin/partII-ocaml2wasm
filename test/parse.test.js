const parse = require('../parse.js')
const chai = require('chai')
const expect = chai.expect
const chaiSnapshot = require('mocha-chai-snapshot')
chai.use(chaiSnapshot)

describe('Parser', function () {
   // TODO it fail to parse this?
   it('parses an empty token list', function () {
      parse([])
   })
})
