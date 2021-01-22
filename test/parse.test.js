const { parser } = require('../parser.js')
const chai = require('chai')
const expect = chai.expect
const chaiSnapshot = require('mocha-chai-snapshot')
chai.use(chaiSnapshot)

describe('Parser', function () {
   // TODO it fail to parse this?
   it('parses int literals', function () {
      expect(parser.parse('1')).to.eql({ tokenName: 'INT_LITERAL', val: 1 })
   })
})
