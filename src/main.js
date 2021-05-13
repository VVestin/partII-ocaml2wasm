const parse = require('./parser')
const transform = require('./transform')
const inferTypes = require('./typer')
const comp = require('./comp')
const log = require('./logger')

const prettyType = t => {
   if (!t) return ''
   if (t.type == 'FUNC')
      return `(${prettyType(t.fromType)} -> ${prettyType(t.toType)})`
   if (t.type == 'TUPLE')
      return `(${t.types.map(type => prettyType(type)).join(' * ')}${
         t.varLength ? ' * ...' : ''
      })`
   else return t
}

const prettyPrint = (prefix, ast) => {
   if (ast.tokenName == 'INT_LITERAL' || ast.tokenName == 'BOOL_LITERAL')
      log(prefix, ast.val, ':', prettyType(ast.type))
   else if (ast.tokenName == 'FLOAT_LITERAL')
      log(prefix, ast.val + 'f', ':', prettyType(ast.type))
   else if (ast.tokenName == 'IDENTIFIER')
      log(prefix, 'ID', ast.id, ':', prettyType(ast.type))
   else if (ast.tokenName == 'UNARY_OP') {
      log(
         prefix,
         ast.op + (ast.op == 'NTH' ? `(${ast.n})` : ''),
         ':',
         prettyType(ast.type)
      )
      prettyPrint(prefix + '--', ast.operand)
   } else if (ast.tokenName == 'INFIX_OP') {
      prettyPrint(prefix + '--', ast.lhs)
      log(prefix, ast.op, ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.rhs)
   } else if (ast.tokenName == 'LET') {
      log(prefix, 'LET', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.binding)
      log(prefix, 'IN')
      prettyPrint(prefix + '--', ast.expr)
   } else if (ast.tokenName == 'BINDING') {
      prettyPrint(prefix + '--', ast.lhs)
      log(prefix, '=', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.rhs)
   } else if (ast.tokenName == 'APP') {
      prettyPrint(prefix + '--', ast.func)
      log(prefix, 'APP', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.arg)
   } else if (ast.tokenName == 'FUNC') {
      log(prefix, 'FUNC', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.param)
      log(prefix, 'BODY')
      prettyPrint(prefix + '--', ast.body)
   } else if (ast.tokenName == 'TUPLE') {
      log(prefix, 'TUPLE', ':', prettyType(ast.type))
      ast.exprs.forEach(expr => prettyPrint(prefix + '--', expr))
   } else if (ast.tokenName == 'IF') {
      log(prefix, 'IF', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.cond)
      log(prefix, 'THEN')
      prettyPrint(prefix + '--', ast.then)
      log(prefix, 'ELSE')
      prettyPrint(prefix + '--', ast.else)
   } else if (ast.tokenName == 'ERROR') {
      log(prefix, 'ERROR', ':', prettyType(ast.type))
   } else
      throw new Error("Can't pretty print unknown token " + JSON.stringify(ast))
}

// function found online: https://www.codeproject.com/Tips/387989/Convert-Binary-Single-Precision-Value-to-Float-in
function ieee32ToFloat(intval) {
   var fval = 0.0
   var x //exponent
   var m //mantissa
   var s //sign
   s = intval & 0x80000000 ? -1 : 1
   x = (intval >> 23) & 0xff
   m = intval & 0x7fffff
   switch (x) {
      case 0:
         //zero, do nothing, ignore negative zero and subnormals
         break
      case 0xff:
         if (m) fval = NaN
         else if (s > 0) fval = Number.POSITIVE_INFINITY
         else fval = Number.NEGATIVE_INFINITY
         break
      default:
         x -= 127
         m += 0x800000
         fval = s * (m / 8388608.0) * Math.pow(2, x)
         break
   }
   return fval
}

const accessMemory = (memory, loc, type) =>
   type == 'FLOAT' ? ieee32ToFloat(memory[loc]) : memory[loc]

const extract = (val, t, memory, datatypes) => {
   if (t == 'INT') return val
   else if (t == 'FLOAT') return val
   else if (t == 'BOOL') return Boolean(val)
   else if (t.type == 'TUPLE')
      return t.types.map((type, i) =>
         extract(
            accessMemory(memory, val / 4 + i, type),
            type,
            memory,
            datatypes
         )
      )
   else if (typeof t == 'string' && t.startsWith('$type-')) {
      const datatype = datatypes[t.slice(6)]
      const constr = datatype[memory[val / 4]]
      const param = constr.paramType && {
         param: extract(
            accessMemory(memory, val / 4 + 1, constr.paramType),
            constr.paramType,
            memory,
            datatypes
         ),
      }
      if (constr.name == 'Nil') return []
      else if (constr.name == 'Cons') {
         return [param.param[0], ...param.param[1]]
      }
      return {
         constructor: constr.name,
         ...param,
      }
   }
}

const generateWasm = async input => {
   const ir = parse(input)
   ir.ast = transform(ir.ast, ir.constructorTypes)
   log('DONE PARSING \n\n')
   log('ast', ir.ast)
   log()
   prettyPrint('', ir.ast)

   try {
      inferTypes(ir)
      log('type', ir.ast.type)
   } catch (e) {
      console.error(e)
      return
   }

   prettyPrint('', ir.ast)

   //return { ir }
   // Compiling
   const wat = comp(ir)
   log(wat)

   // Executing
   const wabt = await require('wabt')()
   const wasmModule = wabt.parseWat('foo', wat) //hmm, why foo?
   wasmModule.validate()
   return {
      ir,
      instance: (
         await WebAssembly.instantiate(wasmModule.toBinary({}).buffer, {
            imports: {
               print: console.log,
               error: () => {
                  console.error(
                     'Error occurred at runtime, probably a match error'
                  )
               },
            },
         })
      ).instance,
   }
}

const compileAndRun = async input => {
   const { ir, instance } = await generateWasm(input)
   if (!instance) return
   //log('instance', instance)

   const wasm = instance.exports
   const memory = new Uint32Array(wasm.heap.buffer)

   const t0 = process.hrtime()
   const output = wasm.main()
   const time = process.hrtime(t0)
   //log(memory)
   log('main', output, ':', prettyType(ir.ast.type))
   return { value: extract(output, ir.ast.type, memory, ir.datatypes), time }
}
if (require.main === module)
   (async () => {
      console.log('extracted', await compileAndRun(process.argv[2]))
   })()

module.exports = { compileAndRun }
