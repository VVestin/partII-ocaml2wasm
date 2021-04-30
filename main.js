const parse = require('./parser')
const inferTypes = require('./typer')
const comp = require('./comp')

const prettyType = t => {
   if (!t) return ''
   if (t.type == 'FUNC')
      return `(${prettyType(t.fromType)} -> ${prettyType(t.toType)})`
   if (t.type == 'TUPLE')
      return `(${t.types.map(type => prettyType(type)).join(' * ')})`
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

const extract = (val, t, memory) => {
   if (t == 'INT') return val
   else if (t == 'BOOL') return Boolean(val)
   else if (t.type == 'TUPLE')
      return t.types.map((type, i) =>
         extract(memory[Math.floor(val / 4) + i], type, memory)
      )
}

const main = async () => {
   // Parsing
   const ast = parse(process.argv[2])
   console.log('DONE PARSING \n\n')
   console.log('ast', ast)
   console.log()
   prettyPrint('', ast)

   try {
      inferTypes(ast)
      console.log('type', ast.type)
   } catch (e) {
      console.error(e)
      return
   }

   prettyPrint('', ast)

   // Compiling
   const wat = comp(ast)
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
   const memory = new Uint32Array(wasm.heap.buffer, 0, 50)

   const output = wasm.main()
   console.log('main', output, ':', prettyType(ast.type))
   console.log('extracted', extract(output, ast.type, memory))
}

main()
