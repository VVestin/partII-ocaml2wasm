const fs = require('fs')
const jison = require('jison')
const util = require('util')

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

const parse = input => {
   const { ast, datatypes } = parser.parse(input)
   console.log('datatypes', datatypes)
   const constructorTypes = {}
   Object.entries(datatypes).forEach(([typeName, constrs]) => {
      constrs.forEach(({ name, paramType }, i) => {
         constructorTypes[name] = {
            paramType,
            returnType: '$type-' + typeName,
            index: i,
         }
      })
   })
   console.log('datatypes:', datatypes)
   console.log('constructors:', constructorTypes)
   console.log(ast)
   const withoutMatch = transformMatch(ast)
   console.log(
      'withoutMatch',
      util.inspect(withoutMatch, { showHidden: false, depth: null })
   )
   const withoutLet = transformLet(withoutMatch)
   console.log(
      'withoutLet',
      util.inspect(withoutLet, { showHidden: false, depth: null })
   )
   return { ast: withoutLet, datatypes, constructorTypes }
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

const transformMatch = ast => {
   console.log('removing match from', ast)
   if (ast.tokenName == 'MATCH') {
      const matcher = { tokenName: 'IDENTIFIER', id: '$matcher' + newLabel() }
      let body = { tokenName: 'ERROR' }
      ast.clauses.reverse().forEach(clause => {
         console.log(
            'unified',
            clause.pattern,
            matcher,
            unifyPattern(clause.pattern, matcher)
         )
         const { checks, decls } = unifyPattern(clause.pattern, matcher)
         const cond = combineChecks(checks)
         const then = applyDecls(decls, clause.expr)
         body = {
            tokenName: 'IF',
            cond,
            then,
            else: body,
         }
      })
      return {
         tokenName: 'LET',
         binding: { id: matcher, expr: ast.expr, params: [] },
         params: [],
         body,
      }
   } else return applyTransform(ast, transformMatch)
}

const unifyPattern = (pattern, matcher) => {
   if (pattern.tokenName == 'IDENTIFIER')
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
            const { checks, decls } = unifyPattern(expr, {
               tokenName: 'UNARY_OP',
               op: 'NTH',
               n: i + 1,
               operand: { ...matcher },
            })
            return {
               checks: [...acc.checks, ...checks],
               decls: [...acc.decls, ...decls],
            }
         },
         { checks: [], decls: [] }
      )
   else
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
            param: transformLet(ast.binding.id),
            body: transformLet(ast.body),
         },
         arg: ast.binding.expr,
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

if (require.main == module) {
   const input = process.argv[2]
   parse(input)
}

module.exports = parse
