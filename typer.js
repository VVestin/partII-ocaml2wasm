const inferTypes = ast => {
   if (ast.tokenName == 'INT_LITERAL') ast.type = 'INT'
   else if (ast.tokenName == 'FLOAT_LITERAL') ast.type = 'FLOAT'
   else if (ast.tokenName == 'BOOL_LITERAL') ast.type = 'BOOL'
   else if (ast.tokenName == 'UNARY_OP' && ast.op == '-') {
      inferTypes(ast.operand)
      if (ast.operand.type != 'INT')
         throw new Error(
            "Type Error, unary '-' expected type INT got" + ast.operand.type
         )
      ast.type = 'INT'
   } else if (ast.tokenName == 'UNARY_OP' && ast.op == '-.') {
      inferTypes(ast.operand)
      if (ast.operand.type != 'FLOAT')
         throw new Error(
            "Type Error, unary '-.' expected type FLOAT got" + ast.operand.type
         )
      ast.type = 'FLOAT'
   } else if (
      ast.tokenName == 'INFIX_OP' &&
      ['+', '-', '*', '/'].includes(ast.op)
   ) {
      inferTypes(ast.lhs)
      inferTypes(ast.rhs)
      if (ast.lhs.type != 'INT' || ast.rhs.type != 'INT')
         throw new Error(
            `Type Error, op '${ast.op}' expected operands of type INT got ${ast.lhs.type} and ${ast.rhs.type}`
         )
      ast.type = 'INT'
   } else if (
      ast.tokenName == 'INFIX_OP' &&
      ['+.', '-.', '*.', '/.'].includes(ast.op)
   ) {
      inferTypes(ast.lhs)
      inferTypes(ast.rhs)
      if (ast.lhs.type != 'FLOAT' || ast.rhs.type != 'FLOAT')
         throw new Error(
            `Type Error, op '${ast.op}' expected operands of type INT got ${ast.lhs.type} and ${ast.rhs.type}`
         )
      ast.type = 'FLOAT'
   }
}

module.exports = inferTypes
