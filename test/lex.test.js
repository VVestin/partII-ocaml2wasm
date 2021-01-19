const lex = require('../lex.js')
const chai = require('chai')
const expect = chai.expect
const chaiSnapshot = require('mocha-chai-snapshot')
chai.use(chaiSnapshot)

describe('Lexer', function () {
   it('lexes integer literals', function () {
      expect(lex('0')).eql([{ type: 'NUMBER', val: 0 }])
      expect(lex('10')).eql([{ type: 'NUMBER', val: 10 }])
      expect(lex('53')).eql([{ type: 'NUMBER', val: 53 }])
      expect(lex('12345')).eql([{ type: 'NUMBER', val: 12345 }])
      expect(lex('01320')).eql([{ type: 'NUMBER', val: 1320 }])
   })

   it('lexes identifiers', function () {
      expect(lex('hi')).eql([{ type: 'IDENTIFIER', identifier: 'hi' }])
      expect(lex('yo12')).eql([{ type: 'IDENTIFIER', identifier: 'yo12' }])
      expect(lex('_AbS8aG0')).eql([
         { type: 'IDENTIFIER', identifier: '_AbS8aG0' },
      ])
      expect(lex("foo'")).eql([{ type: 'IDENTIFIER', identifier: "foo'" }])
      expect(lex("foo'")).eql([{ type: 'IDENTIFIER', identifier: "foo'" }])
      expect(lex.bind(null, "b`by'")).throw()
   })

   it('lexes keywords', function () {
      ;['if', 'match', 'while', '(', ')'].forEach(keyword =>
         expect(lex(keyword)).eql([{ type: 'KEYWORD', keyword }])
      )
   })

   it('lexes operators', function () {
      ;['+', '*', '-', '/'].forEach(op =>
         expect(lex(op)).eql([{ type: 'OPERATOR', op }])
      )
   })

   it('lexes some test expressions', function () {
      ;[
         '1+2*3-4/5',
         'hi- 12&3and4 and 5',
         '2 * (30-1) + 20(*) while',
      ].forEach(program => expect(lex(program)).to.matchSnapshot(this))
   })
})
