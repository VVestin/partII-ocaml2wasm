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

const prettyPrint = (prefix, tree) => {
   if (tree.tokenName == 'INT_LITERAL') console.log(prefix, tree.val)
   else if (tree.tokenName == 'FLOAT_LITERAL')
      console.log(prefix, tree.val + 'f')
   else if (tree.tokenName == 'IDENTIFIER') console.log(prefix, tree.id)
   else if (tree.tokenName == 'UNARY_OP') {
      console.log(prefix, tree.op)
      prettyPrint(prefix + '--', tree.operand)
   } else if (tree.tokenName == 'INFIX_OP') {
      prettyPrint(prefix + '--', tree.lhs)
      console.log(prefix, tree.op)
      prettyPrint(prefix + '--', tree.rhs)
   } else if (tree.tokenName == 'LET') {
      console.log(prefix, 'LET')
      prettyPrint(prefix + '--', tree.binding)
      console.log(prefix, 'IN')
      prettyPrint(prefix + '--', tree.expr)
   } else if (tree.tokenName == 'BINDING') {
      prettyPrint(prefix + '--', tree.lhs)
      console.log(prefix, '=')
      prettyPrint(prefix + '--', tree.rhs)
   }
}

if (require.main == module) {
   const input = process.argv[2]
   const ast = parser.parse(input)
   console.log('ast', ast)
   prettyPrint('|', ast)
}

module.exports = { parser, prettyPrint }
