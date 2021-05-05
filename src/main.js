const parse = require('./parser')
const inferTypes = require('./typer')
const comp = require('./comp')

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
      console.log(prefix, ast.val, ':', prettyType(ast.type))
   else if (ast.tokenName == 'FLOAT_LITERAL')
      console.log(prefix, ast.val + 'f', ':', prettyType(ast.type))
   else if (ast.tokenName == 'IDENTIFIER')
      console.log(prefix, 'ID', ast.id, ':', prettyType(ast.type))
   else if (ast.tokenName == 'UNARY_OP') {
      console.log(prefix, ast.op, ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.operand)
   } else if (ast.tokenName == 'INFIX_OP') {
      prettyPrint(prefix + '--', ast.lhs)
      console.log(prefix, ast.op, ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.rhs)
   } else if (ast.tokenName == 'LET') {
      console.log(prefix, 'LET', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.binding)
      console.log(prefix, 'IN')
      prettyPrint(prefix + '--', ast.expr)
   } else if (ast.tokenName == 'BINDING') {
      prettyPrint(prefix + '--', ast.lhs)
      console.log(prefix, '=', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.rhs)
   } else if (ast.tokenName == 'APP') {
      prettyPrint(prefix + '--', ast.func)
      console.log(prefix, 'APP', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.arg)
   } else if (ast.tokenName == 'FUNC') {
      console.log(prefix, 'FUNC', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.param)
      console.log(prefix, 'BODY')
      prettyPrint(prefix + '--', ast.body)
   } else if (ast.tokenName == 'TUPLE') {
      console.log(prefix, 'TUPLE', ':', prettyType(ast.type))
      ast.exprs.forEach(expr => prettyPrint(prefix + '--', expr))
   } else if (ast.tokenName == 'IF') {
      console.log(prefix, 'IF', ':', prettyType(ast.type))
      prettyPrint(prefix + '--', ast.cond)
      console.log(prefix, 'THEN')
      prettyPrint(prefix + '--', ast.then)
      console.log(prefix, 'ELSE')
      prettyPrint(prefix + '--', ast.else)
   } else if (ast.tokenName == 'ERROR') {
      console.log(prefix, 'ERROR', ':', prettyType(ast.type))
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
   console.log('extracting', val, t)
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
      return {
         constructor: constr.name,
         ...(constr.paramType && {
            param: extract(
               accessMemory(memory, val / 4 + 1, constr.paramType),
               constr.paramType,
               memory,
               datatypes
            ),
         }),
      }
   }
}

const main = async () => {
   // Parsing
   const ir = parse(process.argv[2])
   console.log('DONE PARSING \n\n')
   console.log('ast', ir.ast)
   console.log()
   prettyPrint('', ir.ast)

   try {
      inferTypes(ir)
      console.log('type', ir.ast.type)
   } catch (e) {
      console.error(e)
      return
   }

   prettyPrint('', ir.ast)

   // Compiling
   const wat = comp(ir)
   console.log(wat)

   // Executing
   const wabt = await require('wabt')()
   const wasmModule = wabt.parseWat('foo', wat) //hmm, why foo?
   wasmModule.validate()
   const instance = (
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
   ).instance

   const wasm = instance.exports
   const memory = new Uint32Array(wasm.heap.buffer)

   const output = wasm.main()
   console.log(memory)
   console.log('main', output, ':', prettyType(ir.ast.type))
   console.log('extracted', extract(output, ir.ast.type, memory, ir.datatypes))
}

main()
