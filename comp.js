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

const typeToWAT = t => {
   if (t == 'FLOAT') return 'f32'
   else if (t == 'INT') return 'i32'
   else if (t == 'BOOL') return 'i32'
   else if (t.type == 'FUNC') return 'i32'
   else if (t.type == 'TUPLE') return 'i32'
   else throw new Error('Unknown type' + JSON.stringify(t))
}

const indent = code =>
   code
      .split('\n')
      .map(line => '  ' + line)
      .join('\n')

const comp = (ast, ctx = {}, depth = 0) => {
   console.log('compiling', ast.tokenName, ctx, depth)
   if (ast.tokenName == 'INT_LITERAL')
      return { defs: {}, localDefs: '', code: `i32.const ${ast.val}\n` }
   else if (ast.tokenName == 'FLOAT_LITERAL')
      return { defs: {}, localDefs: '', code: `f32.const ${ast.val}\n` }
   else if (ast.tokenName == 'BOOL_LITERAL')
      return {
         defs: {},
         localDefs: '',
         code: `i32.const ${+ast.val} ;; BOOL ${ast.val}\n`,
      }
   else if (ast.tokenName == 'ERROR')
      return {
         defs: {},
         localDefs: '',
         code: `call $raise_error\n${typeToWAT(ast.type)}.const 0\n`,
      }
   else if (ast.tokenName == 'UNARY_OP' && ast.op == '-') {
      const op = comp(ast.operand, ctx, depth)
      return {
         defs: op.defs,
         localDefs: op.localDefs,
         code: 'i32.const 0\n' + op.code + 'i32.sub\n',
      }
   } else if (ast.tokenName == 'UNARY_OP' && ast.op == '-.') {
      const op = comp(ast.operand, ctx, depth)
      return {
         defs: op.defs,
         localDefs: op.localDefs,
         code: op.code + 'f32.neg\n',
      }
   } else if (ast.tokenName == 'INFIX_OP') {
      const lhs = comp(ast.lhs, ctx, depth)
      const rhs = comp(ast.rhs, ctx, depth)
      const operatorCode =
         INFIX_TO_WAT[ast.op] || COMPARISON_TO_WAT[ast.lhs.type][ast.op]
      return {
         defs: { ...lhs.defs, ...rhs.defs },
         localDefs: lhs.localDefs + rhs.localDefs,
         code: lhs.code + rhs.code + operatorCode + '\n',
      }
   } else if (ast.tokenName == 'FUNC') {
      const newDepth = ast.rec ? depth + 1 : depth
      const expr = comp(
         ast.body,
         {
            ...ctx,
            $rec: {
               ...ctx.$rec,
               ...(ast.rec && { [ast.rec.id]: depth }),
            },
            [ast.param.id]: newDepth,
         },
         newDepth + 1
      )
      const labelNum = newFuncLabel()
      return {
         defs: {
            ...expr.defs,
            ['func' +
            labelNum]: `(func $func${labelNum} (param $env i32) (result ${typeToWAT(
               ast.type.toType
            )})
${indent(expr.localDefs).trim()}${indent(expr.code)})\n`,
         },
         localDefs: '',
         code: `(call $alloc_i32 (i32.const ${labelNum}) (get_local $env))\n${
            ast.rec ? 'call $add_rec_to_env\n' : ''
         }`,
      }
   } else if (ast.tokenName == 'APP') {
      const func = comp(ast.func, ctx, depth)
      const arg = comp(ast.arg, ctx, depth)
      return {
         defs: { ...func.defs, ...arg.defs },
         localDefs: func.localDefs + arg.localDefs,
         code:
            func.code +
            arg.code +
            `call $applyfunc_${typeToWAT(ast.arg.type)}_${typeToWAT(
               ast.func.type
            )}\n`,
      }
   } else if (ast.tokenName == 'IDENTIFIER') {
      if (ctx[ast.id] === undefined && ctx.$rec[ast.id] === undefined)
         throw new Error(`Unable to resolve identifier ${ast.id}`)
      const varDepth =
         ctx[ast.id] !== undefined ? ctx[ast.id] : ctx.$rec[ast.id]
      console.log('varDepth', varDepth, ast.id, ctx[ast.id], ctx.$rec[ast.id])
      let code = `get_local $env ;; lookup ${ast.id}\n`
      code += `;; ${varDepth} - ${depth}\n`
      // TODO, this traversal could be a WASM function instead of adding linear code
      for (let i = 0; i < depth - 1 - varDepth; i++)
         code += 'i32.load offset=4\n'
      if (ctx.$rec[ast.id] !== undefined) code += 'call $add_rec_to_env\n'
      else code += 'i32.load\n'
      return { defs: {}, localDefs: '', code }
   } else if (ast.tokenName == 'TUPLE') {
      const exprs = ast.exprs.map(expr => comp(expr, ctx, depth))
      const ptrVar = 'ptr' + newLocalLabel()
      return {
         defs: exprs.reduce((acc, expr) => ({ ...acc, ...expr.defs }), {}),
         localDefs:
            `(local $${ptrVar} i32)\n` +
            exprs.map(expr => expr.localDefs).join(''),
         code: `(tee_local $${ptrVar} (get_global $heap_ptr))
(set_global $heap_ptr (i32.add (get_local $${ptrVar}) (i32.const ${
            ast.exprs.length * 4
         })))
${exprs
   .map(
      (expr, i) =>
         `;; storing tuple ${ptrVar} element ${i}
${expr.code}${typeToWAT(ast.exprs[i].type)}.store offset=${4 * i}
get_local $${ptrVar}\n`
   )
   .join('')}\n`,
      }
   } else if (ast.tokenName == 'IF') {
      const cond = comp(ast.cond, ctx, depth)
      const then = comp(ast.then, ctx, depth)
      const elze = comp(ast.else, ctx, depth) // elze since else is a js keyword :(

      return {
         defs: { ...cond.defs, ...then.defs, ...elze.defs },
         localDefs: cond.localDefs + then.localDefs + elze.localDefs,
         code: `${cond.code}(if (result ${typeToWAT(ast.type)})
  (then
${indent(indent(then.code.trim()))}
    )
  (else
${indent(indent(elze.code.trim()))}
    )
  )\n`,
      }
   } else throw new Error(`No handler for compiling ${ast.tokenName} node`)
}

const newFuncLabel = (() => {
   let funcCounter = 0
   return () => funcCounter++
})()

const newLocalLabel = (() => {
   let localCounter = 0
   return () => localCounter++
})()

const compile = ast => {
   const { defs, localDefs, code } = comp(ast)
   return `
(module
  (func $raise_error (import "imports" "error"))
  (func $print1 (import "imports" "print") (param i32))
  (func $print2 (import "imports" "print") (param i32 i32))
  (func $print3 (import "imports" "print") (param i32 i32 i32))
  (func $print4 (import "imports" "print") (param i32 i32 i32 i32))
  (func $print5 (import "imports" "print") (param i32 i32 i32 i32 i32))

  (memory $heap (export "heap") 1)
  (global $heap_ptr (mut i32) (i32.const 4)) ;; start 1 byte in so 0 can be a null pointer
  (type $func_i32 (func (param i32) (result i32)))
  (type $func_f32 (func (param i32) (result f32)))

  (func $alloc_i32 (param $val i32) (param $next i32) (result i32)
        (i32.store
          (get_global $heap_ptr)
          (get_local $val)
          )
        (i32.store offset=4
                   (get_global $heap_ptr)
                   (get_local $next))
        (set_global $heap_ptr
                    (i32.add (get_global $heap_ptr) (i32.const 8)))
        (i32.sub (get_global $heap_ptr) (i32.const 8))
        )

  (func $alloc_f32 (param $val f32) (param $next i32) (result i32)
        (f32.store
          (get_global $heap_ptr)
          (get_local $val)
          )
        (i32.store offset=4
                   (get_global $heap_ptr)
                   (get_local $next))
        (set_global $heap_ptr
                    (i32.add (get_global $heap_ptr) (i32.const 8)))
        (i32.sub (get_global $heap_ptr) (i32.const 8))
        )
  (func $applyfunc_i32_i32 (param $func i32) (param $arg i32) (result i32)
      (call_indirect (type $func_i32)
                     (call $alloc_i32 (get_local $arg) (i32.load offset=4 (get_local $func)))
                     (i32.load (get_local $func)))
      )
  (func $add_rec_to_env (param $env i32) (result i32)
      (call $alloc_i32 (i32.load (get_local $env)) (get_local $env))
      )

  (table funcref
      (elem ${Object.keys(defs)
         .map(func => '$' + func)
         .join(' ')}))
${Object.values(defs).map(indent).join('\n')}
  (func $main (export "main") (result ${typeToWAT(ast.type)})
    (local $env i32)
    ${indent(indent(localDefs)).trim()}${indent(indent(code)).trim()}
    )
)`
}

module.exports = compile
