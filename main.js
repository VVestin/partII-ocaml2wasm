const { parser, prettyPrint } = require('./parser')
const inferTypes = require('./typer')
const comp = require('./comp')

const main = async () => {
   // Parsing
   const ast = parser.parse(process.argv[2])
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
