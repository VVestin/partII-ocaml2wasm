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
const comp = ast => {
   if (ast.type == 'INT_LITERAL') return `i32.const ${ast.val}`
   else if (ast.type == 'FLOAT_LITERAL') return `f32.const ${ast.val}`
   else if (ast.type == 'UNARY_OP' && ast.op == '-')
      return `i32.const 0\n${comp(ast.operand)}\ni32.sub`
   else if (ast.type == 'UNARY_OP' && ast.op == '-.')
      return `${comp(ast.operand)}\nf32.neg`
   else if (ast.type == 'INFIX_OP')
      return `${comp(ast.lhs)}\n${comp(ast.rhs)}\n${INFIX_OP_TO_WAT[ast.op]}`
}

const addBoilerplate = expr => {
   return `
(module
  (func $main (result i32)
${expr
   .split('\n')
   .map(line => '        ' + line)
   .join('\n')}
        )
  (export "main" (func $main))
)`
}

module.exports = ast => addBoilerplate(comp(ast))
