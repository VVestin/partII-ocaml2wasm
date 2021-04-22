const fs = require('fs')

;(async () => {
   const wabt = await require('wabt')()

   const inputWabt = process.argv[2]

   const buffer = fs.readFileSync(inputWabt)
   const wasmModule = wabt.parseWat(inputWabt, String(buffer))
   wasmModule.validate()
   const instance = (
      await WebAssembly.instantiate(wasmModule.toBinary({}).buffer)
   ).instance

   const wasm = instance.exports

   const memory = new Uint32Array(wasm.heap.buffer, 0, 50)

   console.log('test():', wasm.test())

   console.log(memory)
})()
