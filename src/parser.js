const fs = require('fs')
const jison = require('jison')
const util = require('util')
const log = require('./logger')

const KEYWORDS = (
   'and as assert asr begin class constraint' +
   'do done downto else end exception external ' +
   'false for fun function functor if in include ' +
   'inherit initializer land lazy let lor lsl lsr ' +
   'lxor match method mod module mutable new object ' +
   'of open or private rec sig struct then to true ' +
   'try type val virtual when while with'
).split(' ')

const grammar = fs.readFileSync('src/ocaml.jison')
const parser = new jison.Parser(String(grammar))
parser.yy.makeInfix = (op, lhs, rhs) => ({
   tokenName: 'INFIX_OP',
   op,
   lhs,
   rhs,
})
parser.yy.makeUnary = (op, operand) => ({
   tokenName: 'UNARY_OP',
   op,
   operand,
})

const parse = input => {
   const { ast, datatypes } = parser.parse(input)
   log('datatypes', datatypes)
   const constructorTypes = {}
   Object.entries(datatypes).forEach(([typeName, constrs]) => {
      constrs.forEach(({ name, paramType }, i) => {
         constructorTypes[name] = {
            paramType,
            returnType: '$type-' + typeName,
            index: i,
         }
      })
   })
   log('datatypes:', datatypes)
   log('constructors:', constructorTypes)
   log('ast', util.inspect(ast, { showHidden: false, depth: null }))
   return { ast, datatypes, constructorTypes }
}

if (require.main == module) {
   const input = process.argv[2]
   parse(input)
}

module.exports = parse
