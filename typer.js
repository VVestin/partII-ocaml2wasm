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

const inferTypes = ({ ast, datatypes, constructorTypes }) => {
   const tenv = Object.fromEntries(
      Object.keys(constructorTypes).map(constr => [constr, newTypeLabel()])
   )
   annotate(ast, tenv)
   const constraints = constrain(ast, constructorTypes)
   Object.entries(constructorTypes).forEach(
      ([constr, { paramType, returnType }]) => {
         constraints.push({
            a: tenv[constr],
            b: paramType
               ? {
                    type: 'FUNC',
                    fromType: paramType,
                    toType: returnType,
                 }
               : returnType,
         })
      }
   )
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
         ...(ast.rec && { [ast.rec.id]: ast.type }),
      })
      ast.param.type = paramType
   } else if (ast.tokenName == 'APP') {
      annotate(ast.func, tenv)
      annotate(ast.arg, tenv)
   } else if (ast.tokenName == 'TUPLE') {
      for (let expr of ast.exprs) annotate(expr, tenv)
   } else if (ast.tokenName == 'IF') {
      annotate(ast.cond, tenv)
      annotate(ast.then, tenv)
      annotate(ast.else, tenv)
   } else if (
      !['INT_LITERAL', 'FLOAT_LITERAL', 'BOOL_LITERAL', 'ERROR'].includes(
         ast.tokenName
      )
   )
      throw new Error("Couldn't annotate token " + JSON.stringify(ast))
}

const constrain = (ast, constructorTypes) => {
   //console.log('constraining', ast.tokenName)
   if (ast.tokenName == 'INT_LITERAL') {
      return [{ a: ast.type, b: 'INT' }]
   } else if (ast.tokenName == 'FLOAT_LITERAL') {
      return [{ a: ast.type, b: 'FLOAT' }]
   } else if (ast.tokenName == 'BOOL_LITERAL') {
      return [{ a: ast.type, b: 'BOOL' }]
   } else if (ast.tokenName == 'UNARY_OP' && ast.op == 'NTH') {
      return [
         {
            a: ast.operand.type,
            b: {
               type: 'TUPLE',
               types: new Array(ast.n - 1).fill('ANY').concat(ast.type),
               varLength: true,
            },
         },
         ...constrain(ast.operand),
      ]
   } else if (ast.tokenName == 'UNARY_OP' && ast.op == 'GET_INDEX') {
      console.log([
         { a: ast.operand.type, b: ast.constructor.returnType },
         { a: ast.type, b: 'INT' },
      ])
      return [
         { a: ast.operand.type, b: ast.constructor.returnType },
         { a: ast.type, b: 'INT' },
      ]
   } else if (ast.tokenName == 'UNARY_OP' && ast.op == 'GET_ARG') {
      return [
         { a: ast.operand.type, b: ast.constructor.returnType },
         { a: ast.type, b: ast.constructor.paramType },
      ]
   } else if (ast.tokenName == 'UNARY_OP') {
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
         { a: ast.lhs.type, b: ast.rhs.type },
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
   } else if (ast.tokenName == 'IDENTIFIER') {
      return []
   } else if (ast.tokenName == 'TUPLE') {
      return [
         {
            a: ast.type,
            b: {
               type: 'TUPLE',
               types: ast.exprs.map(expr => expr.type),
            },
         },
         ...ast.exprs.map(expr => constrain(expr)).flat(),
      ]
   } else if (ast.tokenName == 'IF') {
      return [
         { a: ast.cond.type, b: 'BOOL' },
         { a: ast.then.type, b: ast.else.type },
         { a: ast.type, b: ast.then.type },
         ...constrain(ast.cond),
         ...constrain(ast.then),
         ...constrain(ast.else),
      ]
   } else if (ast.tokenName == 'ERROR') {
      return [{ a: ast.type, b: 'ANY' }]
   } else throw new Error("Couldn't constrain token " + JSON.stringify(ast))
}

const solve = constraints => {
   let solution = {}
   //constraints = constraints.filter(({ a, b }) => !['COMP', 'ANY'].includes(b))
   //console.log('constraints without COMP', constraints)
   for (let constraint of constraints) {
      console.log('solution', solution)
      console.log('applying constraint', constraint)
      console.log(
         'updated constraint',
         applySubstitutions(constraint, solution)
      )
      const substitutions = unify(applySubstitutions(constraint, solution))
      console.log('got substitutions', substitutions)
      for (let [tvar, t] of Object.entries(substitutions)) {
         if (['COMP', 'ANY'].includes(t)) delete substitutions[tvar]
      }
      console.log('substitutions without COMP', substitutions)
      // updating solution
      for (let tvar of Object.keys(solution)) {
         solution[tvar] = applySubstitutions(solution[tvar], substitutions)
      }
      for (let tvar of Object.keys(substitutions)) {
         if (!solution[tvar]) solution[tvar] = substitutions[tvar]
      }
      /*for (let tvar of Object.keys(substitutions)) {
         const newType = solution[tvar]
            ? applySubstitutions(solution[tvar], substitutions)
            : substitutions[tvar]
         solution[tvar] = newType
      }*/
      console.log('')
   }
   return solution
}

const isTVar = t => {
   return typeof t == 'string' && t.startsWith('t')
}

const isDatatype = t => {
   return typeof t == 'string' && t.startsWith('$type-')
}

// takes a single constraint and returns a substitution that unifies the two sides of the contstraint
const unify = ({ a, b }) => {
   console.log('unifying', a, b)
   if (a == 'ANY' || b == 'ANY') {
      return {}
   } else if (['INT', 'FLOAT', 'BOOL'].includes(a) && (a == b || b == 'COMP')) {
      return {} // no substitution since it's already a match
   } else if (a == 'COMP' && ['INT', 'FLOAT', 'BOOL', 'COMP'].includes(b)) {
      return {} // no substitution since it's already a match
   } else if (isDatatype(a) && isDatatype(b) && a == b) {
      return {}
   } else if (isTVar(a) && a == b) {
      return {} // no substitution since it's already a match
   } else if (a.type == 'FUNC' && b.type == 'FUNC') {
      return {
         ...unify({ a: a.fromType, b: b.fromType }),
         ...unify({ a: a.toType, b: b.toType }),
      }
   } else if (
      a.type == 'TUPLE' &&
      b.type == 'TUPLE' &&
      (a.types.length == b.types.length ||
         (a.varLength && a.types.length <= b.types.length) ||
         (b.varLength && b.types.length <= a.types.length))
   ) {
      let acc = {}
      for (let i = 0; i < Math.min(a.types.length, b.types.length); i++) {
         acc = { ...acc, ...unify({ a: a.types[i], b: b.types[i] }) }
      }
      return acc
   } else if (isTVar(a)) {
      return { [a]: b }
   } else if (isTVar(b)) {
      return { [b]: a }
   } else
      throw new Error(
         `Can't unify ${JSON.stringify(a)} with ${JSON.stringify(b)}`
      )
}

// applies a whole list of substitutions to a single type or a whole constraint, replacing type variables that have substitutions
const applySubstitutions = (t, substitutions) => {
   if (t.a)
      return {
         a: applySubstitutions(t.a, substitutions),
         b: applySubstitutions(t.b, substitutions),
      }
   if (['INT', 'FLOAT', 'BOOL', 'COMP', 'ANY'].includes(t) || isDatatype(t))
      return t
   else if (t.type == 'FUNC') {
      return {
         ...t,
         fromType: applySubstitutions(t.fromType, substitutions),
         toType: applySubstitutions(t.toType, substitutions),
      }
   } else if (t.type == 'TUPLE') {
      return {
         ...t,
         types: t.types.map(type => applySubstitutions(type, substitutions)),
      }
   } else if (isTVar(t)) {
      // t is a type var, so replace it if there's a substitution for it
      if (substitutions[t]) return substitutions[t]
      else return t
   } else {
      throw new Error("Couldn't subsitute into type " + JSON.stringify(t))
   }
}

const substitute = (ast, substitutions) => {
   if (!isTVar(ast.type)) return
   /*throw new Error(
         'Node has already had its type replaced (duplicate node in tree) ' +
            JSON.stringify(ast)
      )*/
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
   } else if (ast.tokenName == 'TUPLE') {
      ast.exprs.forEach(expr => substitute(expr, substitutions))
   } else if (ast.tokenName == 'IF') {
      substitute(ast.cond, substitutions)
      substitute(ast.then, substitutions)
      substitute(ast.else, substitutions)
   } else if (
      ![
         'IDENTIFIER',
         'INT_LITERAL',
         'FLOAT_LITERAL',
         'BOOL_LITERAL',
         'ERROR',
      ].includes(ast.tokenName)
   )
      throw new Error(
         "Couldn't substitue types into token " + JSON.stringify(ast)
      )
}

module.exports = inferTypes
