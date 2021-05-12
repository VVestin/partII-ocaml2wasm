const { exec } = require('child_process')
const fs = require('fs')
const util = require('util')
const { compileAndRun } = require('../src/main')

const timeCommand = command => {
   const startTime = process.hrtime()
   return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
         if (error) reject(`error: ${error.message}`)
         if (stderr) reject(`stderr: ${stderr}`)
         resolve([stdout, process.hrtime(startTime)])
      })
   })
}

const toOCaml = val => {
   if (typeof val == 'number') return val
   else return val.length ? `Cons (${val[0]}, ${toOCaml(val.slice(1))})` : 'Nil'
}

const runTest = async (test, genInput) => {
   const ocamlWasmSrc = fs.readFileSync(`test/samples/${test}.ml`)
   const wasmResults = []

   const jsCommand = `node test/js/${test}.js `
   const jsResults = []

   const ocamlCommand = `node test/js_of_ocaml/${test}.js `
   const ocamlResults = []
   for (let input of genInput()) {
      wasmResults.push(
         (await compileAndRun(ocamlWasmSrc + ' (' + toOCaml(input) + ')'))
            .time[1]
      )
      jsResults.push(eval((await timeCommand(jsCommand + ' ' + input))[0])[1])
      ocamlResults.push(
         Number(
            (await timeCommand(ocamlCommand + ' ' + input))[0].split('s')[0]
         ) * 1_000_000_000
      )
   }
   return {
      wasmResults,
      jsResults,
      ocamlResults,
   }
}

const logOneLine = obj => {
   for (let [key, values] of Object.entries(obj)) {
      console.log(key)
      values.forEach(v => console.log(v))
   }
}

;(async () => {
   const fibIter = await runTest('fib-iterative', function* () {
      for (let i = 0; i < 45; i++) yield i
   })
   const fibRec = await runTest('fib-recursive', function* () {
      for (let i = 0; i < 16; i++) yield i
   })
   const quicksort = await runTest('quicksort', function* () {
      for (let i = 0; i < 60; i++)
         yield new Array(i * 10 + 1)
            .fill(0)
            .map((_, x) => x)
            .sort(() => Math.random() - 0.5)
   })
   logOneLine(fibIter)
   logOneLine(fibRec)
   logOneLine(quicksort)
})()
