const inferTypes = (ast, ctx) => {
   if (ast.tokenName == 'INT_LITERAL') ast.type = 'INT'
   else if (ast.tokenName == 'FLOAT_LITERAL') ast.type = 'FLOAT'
   else if (ast.tokenName == 'BOOL_LITERAL') ast.type = 'BOOL'
   else if (ast.tokenName == 'IDENTIFIER') {
      if (!ctx[ast.id])
         throw new Error(`Unexpected Identifier ${ast.id} has not been defined`)
      ast.type = ctx[ast.id]
   } else if (ast.tokenName == 'UNARY_OP' && ast.op == '-') {
      inferTypes(ast.operand, ctx)
      if (ast.operand.type != 'INT')
         throw new Error(
            "Type Error, unary '-' expected type INT got " + ast.operand.type
         )
      ast.type = 'INT'
   } else if (ast.tokenName == 'UNARY_OP' && ast.op == '-.') {
      inferTypes(ast.operand, ctx)
      if (ast.operand.type != 'FLOAT')
         throw new Error(
            "Type Error, unary '-.' expected type FLOAT got " + ast.operand.type
         )
      ast.type = 'FLOAT'
   } else if (
      ast.tokenName == 'INFIX_OP' &&
      ['+', '-', '*', '/'].includes(ast.op)
   ) {
      inferTypes(ast.lhs, ctx)
      inferTypes(ast.rhs, ctx)
      if (ast.lhs.type != 'INT' || ast.rhs.type != 'INT')
         throw new Error(
            `Type Error, op '${ast.op}' expected operands of type INT got ${ast.lhs.type} and ${ast.rhs.type}`
         )
      ast.type = 'INT'
   } else if (
      ast.tokenName == 'INFIX_OP' &&
      ['+.', '-.', '*.', '/.'].includes(ast.op)
   ) {
      inferTypes(ast.lhs, ctx)
      inferTypes(ast.rhs, ctx)
      if (ast.lhs.type != 'FLOAT' || ast.rhs.type != 'FLOAT')
         throw new Error(
            `Type Error, op '${ast.op}' expected operands of type INT got ${ast.lhs.type} and ${ast.rhs.type}`
         )
      ast.type = 'FLOAT'
   } else if (
      ast.tokenName == 'INFIX_OP' &&
      ['<', '<=', '>', '>=', '=', '!='].includes(ast.op)
   ) {
      inferTypes(ast.lhs, ctx)
      inferTypes(ast.rhs, ctx)
      if (ast.lhs.type != ast.rhs.type)
         throw new Error(
            `Type Error, op '${ast.op}' expected operands of same type got ${ast.lhs.type} and ${ast.rhs.type}`
         )
      if (!['INT', 'FLOAT', 'BOOL'].includes(ast.lhs.type))
         throw new Error(
            `Type Error, op '${ast.op}' only supports number types currently`
         )
      ast.type = 'BOOL'
   } else if (ast.tokenName == 'INFIX_OP' && ['||', '&&'].includes(ast.op)) {
      inferTypes(ast.lhs, ctx)
      inferTypes(ast.rhs, ctx)
      if (ast.lhs.type != 'BOOL' || ast.rhs.type != 'BOOL')
         throw new Error(
            `Type Error, op '${ast.op}' expected operands of type BOOL got ${ast.lhs.type} and ${ast.rhs.type}`
         )
      ast.type = 'BOOL'
   } else if (ast.tokenName == 'LET') {
      inferTypes(ast.binding.rhs, ctx)
      inferTypes(ast.body, {
         ...ctx,
         [ast.binding.lhs.id]: ast.binding.rhs.type,
      })
      ast.type = ast.body.type
   }
}

module.exports = inferTypes
