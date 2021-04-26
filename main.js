const parse = require('./parser')
const inferTypes = require('./typer')
const comp = require('./comp')

const prettyType = t => {
   if (!t) return ''
   if (t.type == 'FUNC')
      return `(${prettyType(t.fromType)} -> ${prettyType(t.toType)})`
   else return t
}

const prettyPrint = (prefix, tree) => {
   if (tree.tokenName == 'INT_LITERAL')
      console.log(prefix, tree.val, prettyType(tree.type))
   else if (tree.tokenName == 'FLOAT_LITERAL')
      console.log(prefix, tree.val + 'f', prettyType(tree.type))
   else if (tree.tokenName == 'IDENTIFIER')
      console.log(prefix, tree.id, prettyType(tree.type))
   else if (tree.tokenName == 'UNARY_OP') {
      console.log(prefix, tree.op, prettyType(tree.type))
      prettyPrint(prefix + '--', tree.operand)
   } else if (tree.tokenName == 'INFIX_OP') {
      prettyPrint(prefix + '--', tree.lhs)
      console.log(prefix, tree.op, prettyType(tree.type))
      prettyPrint(prefix + '--', tree.rhs)
   } else if (tree.tokenName == 'LET') {
      console.log(prefix, 'LET', prettyType(tree.type))
      prettyPrint(prefix + '--', tree.binding)
      console.log(prefix, 'IN')
      prettyPrint(prefix + '--', tree.expr)
   } else if (tree.tokenName == 'BINDING') {
      prettyPrint(prefix + '--', tree.lhs)
      console.log(prefix, '=', prettyType(tree.type))
      prettyPrint(prefix + '--', tree.rhs)
   } else if (tree.tokenName == 'APP') {
      prettyPrint(prefix + '--', tree.func)
      console.log(prefix, 'APP', prettyType(tree.type))
      prettyPrint(prefix + '--', tree.arg)
   } else if (tree.tokenName == 'FUNC') {
      console.log(prefix, 'FUNC', prettyType(tree.type))
      prettyPrint(prefix + '--', tree.param)
      console.log(prefix, 'BODY')
      prettyPrint(prefix + '--', tree.body)
   }
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
      await WebAssembly.instantiate(wasmModule.toBinary({}).buffer)
   ).instance

   const wasm = instance.exports

   console.log('main', wasm.main())
}

main()
