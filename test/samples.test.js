const lex = require('../lex.js')
const parse = require('../parse.js')
const comp = require('../comp.js')

const fs = require('fs')
const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect

describe('Sample programs', function () {
   const runSample = async sampleName => {
      const src = fs.readFileSync(`test/samples/${sampleName}.ml`)
      const tokens = lex(src)
      const ast = parse(tokens)
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
      ['int-arith', 10],
      //['float-arith', 6.75]
   ].forEach(([sample, answer]) =>
      it(`gets the right anwser for sample ${sample}`, () =>
         expect(runSample(sample)).to.become(answer))
   )
})
