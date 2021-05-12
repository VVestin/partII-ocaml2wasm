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

      return (await compileAndRun(src)).value
   }
   ;[
      ['int-arith', '', 8],
      ['float-arith', '', -4.9375],
      ['bool-arith', '', false],
      ['8th-power', '', 65536],
      //['match', '', 35],
      ['int-sqrt', 100, 10],
      ['fib-recursive', 10, 89],
      ['fib-iterative', 10, 89],
      ['gcd', '12 16', 4],
      [
         'fizzbuzz',
         15,
         [
            { constructor: 'FizzBuzz', param: 15 },
            { constructor: 'None', param: 14 },
            { constructor: 'None', param: 13 },
            { constructor: 'Fizz', param: 12 },
            { constructor: 'None', param: 11 },
            { constructor: 'Buzz', param: 10 },
            { constructor: 'Fizz', param: 9 },
            { constructor: 'None', param: 8 },
            { constructor: 'None', param: 7 },
            { constructor: 'Fizz', param: 6 },
            { constructor: 'Buzz', param: 5 },
            { constructor: 'None', param: 4 },
            { constructor: 'Fizz', param: 3 },
            { constructor: 'None', param: 2 },
            { constructor: 'None', param: 1 },
         ],
      ],
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
