const parse = require('../src/parser.js')
const chai = require('chai')
const expect = chai.expect
const chaiSnapshot = require('mocha-chai-snapshot')
chai.use(chaiSnapshot)

describe('Parser', function () {
   return
   it('parses int literals', function () {
      expect(parse('1')).ast.to.eql({ tokenName: 'INT_LITERAL', val: 1 })
   })
})
