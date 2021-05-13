const log = require('./logger')
const util = require('util')

const transform = (ast, constructorTypes) => {
   const withoutMatch = transformMatch(constructorTypes)(ast)
   log(
      'withoutMatch',
      util.inspect(withoutMatch, { showHidden: false, depth: null })
   )
   const withoutLet = transformLet(withoutMatch)
   log(
      'withoutLet',
      util.inspect(withoutLet, { showHidden: false, depth: null })
   )
   return withoutLet
}

const combineChecks = checks =>
   checks.length
      ? checks.slice(1).reduce(
           (acc, check) => ({
              tokenName: 'INFIX_OP',
              op: '&&',
              lhs: acc,
              rhs: check,
           }),
           checks[0]
        )
      : { tokenName: 'BOOL_LITERAL', val: true }

const applyDecls = (decls, expr) =>
   decls.reduce(
      (acc, decl) => ({
         tokenName: 'LET',
         binding: { ...decl, params: [] },
         body: acc,
      }),
      expr
   )

const transformMatch = constructorTypes => {
   const thisTransform = ast => {
      log('removing match from', ast)
      if (ast.tokenName == 'MATCH') {
         const matcher = {
            tokenName: 'IDENTIFIER',
            id: '$matcher' + newLabel(),
         }
         let body = { tokenName: 'ERROR' }
         ast.clauses.reverse().forEach(clause => {
            log(
               'unified',
               clause.pattern,
               matcher,
               unifyPattern(clause.pattern, matcher, constructorTypes)
            )
            const { checks, decls } = unifyPattern(
               clause.pattern,
               matcher,
               constructorTypes
            )
            const cond = combineChecks(checks)
            const then = applyDecls(decls, thisTransform(clause.expr))
            body = {
               tokenName: 'IF',
               cond,
               then,
               else: body,
            }
         })
         return {
            tokenName: 'LET',
            binding: {
               id: { ...matcher },
               expr: thisTransform(ast.expr),
               params: [],
            },
            params: [],
            body,
         }
      } else return applyTransform(ast, thisTransform)
   }
   return thisTransform
}

const unifyPattern = (pattern, matcher, constructorTypes) => {
   log('unifying', pattern, matcher, constructorTypes)
   if (pattern.tokenName == 'IDENTIFIER' && pattern.id == '_')
      return { checks: [], decls: [] }
   if (pattern.tokenName == 'IDENTIFIER' && constructorTypes[pattern.id])
      return {
         checks: [
            {
               tokenName: 'INFIX_OP',
               op: '=',
               lhs: {
                  tokenName: 'UNARY_OP',
                  op: 'GET_INDEX',
                  constructor: constructorTypes[pattern.id],
                  operand: { ...matcher },
               },
               rhs: {
                  tokenName: 'INT_LITERAL',
                  val: constructorTypes[pattern.id].index,
               },
            },
         ],
         decls: [],
      }
   else if (pattern.tokenName == 'IDENTIFIER')
      return { checks: [], decls: [{ id: pattern, expr: { ...matcher } }] }
   else if (
      ['INT_LITERAL', 'FLOAT_LITERAL', 'BOOL_LITERAL'].includes(
         pattern.tokenName
      )
   )
      return {
         checks: [
            {
               tokenName: 'INFIX_OP',
               op: '=',
               lhs: { ...matcher },
               rhs: pattern,
            },
         ],
         decls: [],
      }
   else if (pattern.tokenName == 'TUPLE')
      return pattern.exprs.reduce(
         (acc, expr, i) => {
            const { checks, decls } = unifyPattern(
               expr,
               {
                  tokenName: 'UNARY_OP',
                  op: 'NTH',
                  n: i + 1,
                  operand: { ...matcher },
               },
               constructorTypes
            )
            return {
               checks: [...acc.checks, ...checks],
               decls: [...acc.decls, ...decls],
            }
         },
         { checks: [], decls: [] }
      )
   else if (pattern.tokenName == 'DECONSTRUCT') {
      const constr = constructorTypes[pattern.constructor]
      const { checks, decls } = unifyPattern(
         pattern.argPattern,
         {
            tokenName: 'UNARY_OP',
            op: 'GET_ARG',
            constructor: constr,
            operand: { ...matcher },
         },
         constructorTypes
      )
      return {
         checks: [
            {
               tokenName: 'INFIX_OP',
               op: '=',
               lhs: {
                  tokenName: 'UNARY_OP',
                  op: 'GET_INDEX',
                  constructor: constr,
                  operand: { ...matcher },
               },
               rhs: {
                  tokenName: 'INT_LITERAL',
                  val: constr.index,
               },
            },
            ...checks,
         ],
         decls,
      }
   } else
      throw new Error(
         "Can't unify unknown pattern type " + JSON.stringify(pattern)
      )
}

const newLabel = (() => {
   let counter = 0
   return () => counter++
})()

const transformLet = ast => {
   if (ast.tokenName == 'LET') {
      const token = {
         tokenName: 'APP',
         func: {
            tokenName: 'FUNC',
            param: ast.binding.id,
            body: transformLet(ast.body),
         },
         arg: transformLet(ast.binding.expr),
      }
      let func = token.arg
      for (let param of ast.binding.params) {
         func = {
            tokenName: 'FUNC',
            param,
            body: func,
         }
      }
      if (ast.rec) func.rec = { id: ast.binding.id.id }
      token.arg = func
      return token
   } else return applyTransform(ast, transformLet)
}
const applyTransform = (ast, transform) => {
   if (ast.tokenName == 'INFIX_OP') {
      return { ...ast, lhs: transform(ast.lhs), rhs: transform(ast.rhs) }
   } else if (ast.tokenName == 'UNARY_OP') {
      return { ...ast, operand: transform(ast.operand) }
   } else if (ast.tokenName == 'APP') {
      return {
         ...ast,
         func: transform(ast.func),
         arg: transform(ast.arg),
      }
   } else if (ast.tokenName == 'FUNC') {
      return { ...ast, body: transform(ast.body) }
   } else if (ast.tokenName == 'LET') {
      return {
         ...ast,
         binding: { ...ast.binding, expr: transform(ast.binding.expr) },
         body: transform(ast.body),
      }
   } else if (ast.tokenName == 'TUPLE') {
      return { ...ast, exprs: ast.exprs.map(transform) }
   } else if (ast.tokenName == 'IF') {
      return {
         ...ast,
         cond: transform(ast.cond),
         then: transform(ast.then),
         else: transform(ast.else),
      }
   } else if (
      ![
         'IDENTIFIER',
         'INT_LITERAL',
         'FLOAT_LITERAL',
         'BOOL_LITERAL',
         'ERROR',
      ].includes(ast.tokenName)
   )
      throw new Error('Transforming unknown token ' + JSON.stringify(ast))
   else return ast
}

module.exports = transform
