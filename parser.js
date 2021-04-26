const fs = require('fs')
const jison = require('jison')

const KEYWORDS = (
   'and as assert asr begin class constraint' +
   'do done downto else end exception external ' +
   'false for fun function functor if in include ' +
   'inherit initializer land lazy let lor lsl lsr ' +
   'lxor match method mod module mutable new object ' +
   'of open or private rec sig struct then to true ' +
   'try type val virtual when while with'
).split(' ')

const grammar = fs.readFileSync('ocaml.jison')
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

if (require.main == module) {
   const input = process.argv[2]
   const ast = parser.parse(input)
   console.log('ast', ast)
   //prettyPrint('|', ast)
}

const parse = input => {
   const ast = parser.parse(input)
   console.log(ast)
   console.log('transformed', transformLet(ast))
   return transformLet(ast)
}

const transformLet = ast => {
   if (ast.tokenName == 'LET') {
      return {
         tokenName: 'APP',
         func: {
            tokenName: 'FUNC',
            param: transformLet(ast.binding.lhs),
            body: transformLet(ast.body),
         },
         arg: ast.binding.rhs,
      }
   } else if (ast.tokenName == 'INFIX_OP') {
      return { ...ast, lhs: transformLet(ast.lhs), rhs: transformLet(ast.rhs) }
   } else if (ast.tokenName == 'UNARY_OP') {
      return { ...ast, operand: transformLet(ast.operand) }
   } else if (ast.tokenName == 'APP') {
      return {
         ...ast,
         func: transformLet(ast.func),
         arg: transformLet(ast.arg),
      }
   } else if (ast.tokenName == 'FUNC') {
      return { ...ast, body: transformLet(ast.body) }
   }
   return ast
}

module.exports = parse
