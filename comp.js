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

const indent = code =>
   code
      .split('\n')
      .map(line => '  ' + line)
      .join('\n')

const comp = (ast, ctx) => {
   if (ast.tokenName == 'INT_LITERAL')
      return { defs: '', code: `i32.const ${ast.val}\n` }
   else if (ast.tokenName == 'FLOAT_LITERAL')
      return { defs: '', code: `f32.const ${ast.val}\n` }
   else if (ast.tokenName == 'BOOL_LITERAL')
      return { defs: '', code: `i32.const ${+ast.val}\n` }
   else if (ast.tokenName == 'UNARY_OP' && ast.op == '-') {
      const op = comp(ast.operand, ctx)
      return {
         defs: op.defs,
         code: 'i32.const 0\n' + op.code + 'i32.sub\n',
      }
   } else if (ast.tokenName == 'UNARY_OP' && ast.op == '-.') {
      const op = comp(ast.operand, ctx)
      return {
         defs: op.defs,
         code: op.code + 'f32.neg\n',
      }
   } else if (ast.tokenName == 'INFIX_OP') {
      const lhs = comp(ast.lhs, ctx)
      const rhs = comp(ast.rhs, ctx)
      const operatorCode =
         INFIX_TO_WAT[ast.op] || COMPARISON_TO_WAT[ast.lhs.type][ast.op]
      return {
         defs: lhs.defs + rhs.defs,
         code: lhs.code + rhs.code + operatorCode + '\n',
      }
   } else if (ast.tokenName == 'FUNC') {
      const expr = comp(ast.body, ctx)
      const labelNum = newLabel()
      return {
         defs:
            expr.defs +
            `(func $func${labelNum} (type $func_${
               TYPE_TO_WAT[ast.body.type]
            })\n${indent(expr.code)})\n`,
         code: `(call $alloc_i32 (i32.const ${labelNum}) (get_local $env))\n`,
      }
   } else if (ast.tokenName == 'APP') {
      const func = comp(ast.func, ctx)
      const arg = comp(ast.arg, ctx)
      return {
         defs: func.defs + arg.defs,
         code:
            func.code +
            arg.code +
            `call $applyfunc_${TYPE_TO_WAT[ast.arg.type]}_${
               TYPE_TO_WAT[ast.func.type]
            }\n`,
      }
   } else if (ast.tokenName == 'IDENTIFIER') {
      return {
         defs: '',
         code: '(i32.load (get_local $env))\n',
      }
   } else throw new Error(`No handler for compiling ${ast.tokenName} node`)
}

const newLabel = (() => {
   let counter = 0
   return () => counter++
})()

const compile = ast => {
   const { defs, code } = comp(ast, [])
   return `
(module
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

  (table 1 funcref)
  (elem (i32.const 0) $func0)
${indent(defs)}
  (func $main (export "main") (result ${TYPE_TO_WAT[ast.type]})
    (local $env i32)
${indent(indent(code))}
    )
)`
}

module.exports = compile
