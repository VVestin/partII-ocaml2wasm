const INT = { type: 'INT' }
const FLOAT = { type: 'FLOAT' }
const BOOL = { type: 'BOOL' }

UNARY_OP_TABLE = {
   '-': { arg: 'INT', res: 'INT' },
   '-.': { arg: 'FLOAT', res: 'FLOAT' },
}
INFIX_OP_TABLE = {
   '+': { arg1: 'INT', arg2: 'INT', res: 'INT' },
   '-': { arg1: 'INT', arg2: 'INT', res: 'INT' },
   '*': { arg1: 'INT', arg2: 'INT', res: 'INT' },
   '/': { arg1: 'INT', arg2: 'INT', res: 'INT' },
   '+.': { arg1: 'FLOAT', arg2: 'FLOAT', res: 'FLOAT' },
   '-.': { arg1: 'FLOAT', arg2: 'FLOAT', res: 'FLOAT' },
   '*.': { arg1: 'FLOAT', arg2: 'FLOAT', res: 'FLOAT' },
   '/.': { arg1: 'FLOAT', arg2: 'FLOAT', res: 'FLOAT' },
   '&&': { arg1: 'BOOL', arg2: 'BOOL', res: 'BOOL' },
   '||': { arg1: 'BOOL', arg2: 'BOOL', res: 'BOOL' },
   '<': { arg1: 'COMP', arg2: 'COMP', res: 'BOOL' },
   '<=': { arg1: 'COMP', arg2: 'COMP', res: 'BOOL' },
   '>': { arg1: 'COMP', arg2: 'COMP', res: 'BOOL' },
   '>=': { arg1: 'COMP', arg2: 'COMP', res: 'BOOL' },
   '=': { arg1: 'COMP', arg2: 'COMP', res: 'BOOL' },
   '!=': { arg1: 'COMP', arg2: 'COMP', res: 'BOOL' },
}

const newTypeLabel = (() => {
   let counter = 0
   return () => 't' + counter++
})()

const inferTypes = ast => {
   annotate(ast, {})
   const constraints = constrain(ast)
   console.log('constraints', constraints)
   const types = solve(constraints)
   console.log(types)
   substitute(ast, types)
}

const annotate = (ast, tenv) => {
   if (ast.tokenName == 'IDENTIFIER') {
      if (!tenv[ast.id])
         throw new Error(`Unexpected Identifier ${ast.id} has not been defined`)
      ast.type = tenv[ast.id]
      return
   }

   ast.type = newTypeLabel()
   if (ast.tokenName == 'UNARY_OP') {
      annotate(ast.operand, tenv)
   } else if (ast.tokenName == 'INFIX_OP') {
      annotate(ast.lhs, tenv)
      annotate(ast.rhs, tenv)
   } else if (ast.tokenName == 'FUNC') {
      const paramType = newTypeLabel()
      annotate(ast.body, {
         ...tenv,
         [ast.param.id]: paramType,
      })
      ast.param.type = paramType
   } else if (ast.tokenName == 'APP') {
      annotate(ast.func, tenv)
      annotate(ast.arg, tenv)
   } else if (
      !['INT_LITERAL', 'FLOAT_LITERAL', 'BOOL_LITERAL'].includes(ast.tokenName)
   ) {
      throw new Error("Couldn't annotate token", ast)
   }
}

const constrain = ast => {
   //console.log('constraining', ast.tokenName)
   if (ast.tokenName == 'INT_LITERAL') return [{ a: ast.type, b: 'INT' }]
   else if (ast.tokenName == 'FLOAT_LITERAL')
      return [{ a: ast.type, b: 'FLOAT' }]
   else if (ast.tokenName == 'BOOL_LITERAL') return [{ a: ast.type, b: 'BOOL' }]
   else if (ast.tokenName == 'UNARY_OP') {
      const opType = UNARY_OP_TABLE[ast.op]
      return [
         { a: ast.operand.type, b: UNARY_OP_TABLE[ast.op].arg },
         { a: ast.type, b: UNARY_OP_TABLE[ast.op].res },
         ...constrain(ast.operand),
      ]
   } else if (ast.tokenName == 'INFIX_OP') {
      return [
         { a: ast.lhs.type, b: INFIX_OP_TABLE[ast.op].arg1 },
         { a: ast.rhs.type, b: INFIX_OP_TABLE[ast.op].arg2 },
         { a: ast.type, b: INFIX_OP_TABLE[ast.op].res },
         ...constrain(ast.lhs),
         ...constrain(ast.rhs),
      ]
   } else if (ast.tokenName == 'FUNC') {
      return [
         {
            a: ast.type,
            b: {
               type: 'FUNC',
               fromType: ast.param.type,
               toType: ast.body.type,
            },
         },
         ...constrain(ast.body),
      ]
   } else if (ast.tokenName == 'APP') {
      return [
         {
            a: ast.func.type,
            b: { type: 'FUNC', fromType: ast.arg.type, toType: ast.type },
         },
         ...constrain(ast.func),
         ...constrain(ast.arg),
      ]
   } else if (ast.tokenName == 'IDENTIFIER') return []
   else throw new Error("Couldn't constrain token", ast.tokenName)
}

const solve = constraints => {
   let solution = {}
   for (let constraint of constraints) {
      //console.log('applying constraint', constraint)
      //console.log( 'updated constraint', applySubstitutions(constraint, solution))
      const substitutions = unify(applySubstitutions(constraint, solution))
      //console.log('got substitutions', substitutions)
      // updating solution
      for (let tvar of Object.keys(solution)) {
         solution[tvar] = applySubstitutions(solution[tvar], substitutions)
      }
      for (let tvar of Object.keys(substitutions)) {
         if (!solution[tvar]) solution[tvar] = substitutions[tvar]
      }
      //console.log('')
   }
   return solution
}

const isTVar = t => {
   return typeof t == 'string' && t.startsWith('t')
}

// takes a single constraint and returns a substitution that unifies the two sides of the contstraint
const unify = constraint => {
   if (
      ['INT', 'FLOAT', 'BOOL'].includes(constraint.a) &&
      constraint.a == constraint.b
   ) {
      return {} // no substitution since it's already a match
   } else if (isTVar(constraint.a) && constraint.a == constraint.b) {
      return {} // no substitution since it's already a match
   } else if (constraint.a.type == 'FUNC' && constraint.b.type == 'FUNC') {
      return {
         ...unify({ a: constraint.a.fromType, b: constraint.b.fromType }),
         ...unify({ a: constraint.a.toType, b: constraint.b.toType }),
      }
   } else if (isTVar(constraint.a)) {
      return { [constraint.a]: constraint.b }
   } else if (isTVar(constraint.b)) {
      return { [constraint.b]: constraint.a }
   } else
      throw new Error(
         `Can't unify ${JSON.stringify(constraint.a)} with ${JSON.stringify(
            constraint.b
         )}`
      )
}

// applies a whole list of substitutions to a single type or a whole constraint, replacing type variables that have substitutions
const applySubstitutions = (t, substitutions) => {
   if (t.a)
      return {
         a: applySubstitutions(t.a, substitutions),
         b: applySubstitutions(t.b, substitutions),
      }
   if (['INT', 'FLOAT', 'BOOL'].includes(t)) return t
   else if (t.type == 'FUNC') {
      return {
         type: 'FUNC',
         fromType: applySubstitutions(t.fromType, substitutions),
         toType: applySubstitutions(t.toType, substitutions),
      }
   } else {
      // t is a type var, so replace it if there's a substitution for it
      if (substitutions[t]) return substitutions[t]
      else return t
   }
}

const substitute = (ast, substitutions) => {
   ast.type = substitutions[ast.type]
   if (ast.tokenName == 'UNARY_OP') {
      substitute(ast.operand, substitutions)
   } else if (ast.tokenName == 'INFIX_OP') {
      substitute(ast.lhs, substitutions)
      substitute(ast.rhs, substitutions)
   } else if (ast.tokenName == 'FUNC') {
      substitute(ast.param, substitutions)
      substitute(ast.body, substitutions)
   } else if (ast.tokenName == 'APP') {
      substitute(ast.func, substitutions)
      substitute(ast.arg, substitutions)
   }
}

module.exports = inferTypes
