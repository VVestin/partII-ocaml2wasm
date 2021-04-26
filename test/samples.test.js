const parse = require('../parser.js')
const inferTypes = require('../typer.js')
const comp = require('../comp.js')

const fs = require('fs')
const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect

describe('Sample programs', function () {
   const runSample = async sampleName => {
      const src = String(fs.readFileSync(`test/samples/${sampleName}.ml`))
      const ast = parse(src)
      inferTypes(ast, {})
      const wat = comp(ast)

      // Executing
      const wabt = await require('wabt')()
      const wasmModule = wabt.parseWat('foo', wat)
      wasmModule.validate()
      const instance = (
         await WebAssembly.instantiate(wasmModule.toBinary({}).buffer)
      ).instance
      const wasm = instance.exports
      return wasm.main()
   }
   ;[
      ['int-arith', 8],
      ['float-arith', -4.9375],
      ['bool-arith', 0],
      //['8th-power', 65536]
      //['match', 35]
      //['int-sqrt', 10]
      //['fibonacci', 89]
   ].forEach(([sample, answer]) =>
      it(`gets the right anwser for sample ${sample}`, () =>
         expect(runSample(sample)).to.become(answer))
   )
})
