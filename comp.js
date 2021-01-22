const INFIX_OP_TO_WAT = {
   '+': 'i32.add',
   '*': 'i32.mul',
   '-': 'i32.sub',
   '/': 'i32.div',
   '+.': 'f32.add',
   '-.': 'f32.sub',
   '*.': 'f32.mul',
   '/.': 'f32.div',
}

const TYPE_TO_WAT = {
   INT: 'i32',
   FLOAT: 'f32',
   BOOL: 'i32',
}
const comp = ast => {
   if (ast.tokenName == 'INT_LITERAL') return `i32.const ${ast.val}`
   else if (ast.tokenName == 'FLOAT_LITERAL') return `f32.const ${ast.val}`
   else if (ast.tokenName == 'UNARY_OP' && ast.op == '-')
      return `i32.const 0\n${comp(ast.operand)}\ni32.sub`
   else if (ast.tokenName == 'UNARY_OP' && ast.op == '-.')
      return `${comp(ast.operand)}\nf32.neg`
   else if (ast.tokenName == 'INFIX_OP')
      return `${comp(ast.lhs)}\n${comp(ast.rhs)}\n${INFIX_OP_TO_WAT[ast.op]}`
}

module.exports = ast => {
   return `
(module
  (func $main (result ${TYPE_TO_WAT[ast.type]})
${comp(ast)
   .split('\n')
   .map(line => '        ' + line)
   .join('\n')}
        )
  (export "main" (func $main))
)`
}
