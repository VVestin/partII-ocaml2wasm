const INFIX_TO_WAT = {
   '+': 'i32.add',
   '*': 'i32.mul',
   '-': 'i32.sub',
   '/': 'i32.div_s',
   '+.': 'f32.add',
   '-.': 'f32.sub',
   '*.': 'f32.mul',
   '/.': 'f32.div',
   '||': 'i32.or',
   '&&': 'i32.and',
}

const COMPARISON_TO_WAT = {
   INT: {
      '<': 'i32.lt_s',
      '<=': 'i32.le_s',
      '>': 'i32.gt_s',
      '>=': 'i32.ge_s',
      '=': 'i32.eq',
      '!=': 'i32.ne',
   },
   FLOAT: {
      '<': 'f32.lt',
      '<=': 'f32.le',
      '>': 'f32.gt',
      '>=': 'f32.ge',
      '=': 'f32.eq',
      '!=': 'f32.ne',
   },
}
COMPARISON_TO_WAT.BOOL = COMPARISON_TO_WAT.INT

const TYPE_TO_WAT = {
   INT: 'i32',
   FLOAT: 'f32',
   BOOL: 'i32',
}

const comp = ast => {
   if (ast.tokenName == 'INT_LITERAL') return `i32.const ${ast.val}`
   else if (ast.tokenName == 'FLOAT_LITERAL') return `f32.const ${ast.val}`
   else if (ast.tokenName == 'BOOL_LITERAL') return `i32.const ${+ast.val}`
   else if (ast.tokenName == 'UNARY_OP' && ast.op == '-')
      return `i32.const 0\n${comp(ast.operand)}\ni32.sub`
   else if (ast.tokenName == 'UNARY_OP' && ast.op == '-.')
      return `${comp(ast.operand)}\nf32.neg`
   else if (ast.tokenName == 'INFIX_OP' && INFIX_TO_WAT[ast.op])
      return `${comp(ast.lhs)}\n${comp(ast.rhs)}\n${INFIX_TO_WAT[ast.op]}`
   else if (
      ast.tokenName == 'INFIX_OP' &&
      COMPARISON_TO_WAT[ast.lhs.type][ast.op]
   )
      return `${comp(ast.lhs)}\n${comp(ast.rhs)}\n${
         COMPARISON_TO_WAT[ast.lhs.type][ast.op]
      }`
   else throw new Error(`No handler for compiling ${ast.tokenName} node`)
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
