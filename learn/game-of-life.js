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

   console.log('helloWorld()', instance.exports.helloWorld())
   return
   const memory = new Uint32Array(wasm.memory.buffer, 0, 50 * 50)

   addPattern(
      wasm,
      `........................O
......................O.O
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO
OO........O...O.OO....O.O
..........O.....O.......O
...........O...O
............OO`
   )

   setInterval(() => {
      console.log()
      for (let i = 0; i < 50; i++) {
         console.log(
            [...memory.slice(i * 50, (i + 1) * 50)].map(v => ' #'[v]).join('')
         )
      }
      wasm.evolveAllCells()
   }, 50)
})()

const checkCell = (x, y) =>
   console.log(`nextCellState(${x}, ${y}):`, wasm.nextCellState(x, y))

const addPattern = (wasm, pattern) => {
   pattern
      .split('\n')
      .forEach((line, y) =>
         line.split('').forEach((c, x) => wasm.setCell(x, y, c == 'O' ? 1 : 0))
      )
}
const addRandom = wasm => {
   for (let i = 0; i < 1_000; i++)
      wasm.setCell(
         Math.floor(Math.random() * 50),
         Math.floor(Math.random() * 50),
         1
      )
}
