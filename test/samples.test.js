const { compileAndRun } = require('../src/main')

const fs = require('fs')
const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect

const toOCaml = list =>
   list.length ? `Cons (${list[0]}, ${toOCaml(list.slice(1))})` : 'Nil'

describe('Sample programs', function () {
   const runSample = async (sampleName, input) => {
      const src = String(
         fs.readFileSync(`test/samples/${sampleName}.ml`) + ' ' + input
      )

      return compileAndRun(src)
   }
   ;[
      ['int-arith', '', 8],
      ['float-arith', '', -4.9375],
      ['bool-arith', '', false],
      ['8th-power', '', 65536],
      ['match', '', 35],
      ['int-sqrt', 100, 10],
      ['fib-recursive', 10, 89],
      ['fib-iterative', 10, 89],
      [
         'quicksort',
         `(${toOCaml([3, 1, 6, 2, 4, 5, 0])})`,
         [0, 1, 2, 3, 4, 5, 6],
      ],
      ['age-puzzle', '', [18, 72]],
      ['8-queens', 10, [6, 3, 1, 8, 4, 9, 7, 5, 2, 0]],
   ].forEach(([sample, input, answer]) =>
      it(`gets the right anwser for sample ${sample}`, () =>
         expect(runSample(sample, input)).to.become(answer))
   )
})
