const lex = require('./lex.js')
const parse = require('./parse.js')
const comp = require('./comp.js')

const prettyPrint = (prefix, tree) => {
   if (tree.type == 'NUMBER') console.log(prefix, tree.val)
   else if (tree.type == 'INFIX') {
      prettyPrint(prefix + '---', tree.lhs)
      console.log(prefix, tree.op)
      prettyPrint(prefix + '---', tree.rhs)
   }
}

const main = async () => {
   // Lexing
   const tokens = lex(process.argv[2])
   console.log('tokens', tokens)

   // Parsing
   const ast = parse(tokens)
   console.log('ast', ast)
   console.log()
   prettyPrint('', ast)

   // Compiling
   const wat = comp(ast)
   console.log(wat)

   // Executing
   const wabt = await require('wabt')()
   const wasmModule = wabt.parseWat('foo', wat)
   wasmModule.validate()
   const instance = (
      await WebAssembly.instantiate(wasmModule.toBinary({}).buffer)
   ).instance

   const wasm = instance.exports

   console.log('main', wasm.main())
}

main()
