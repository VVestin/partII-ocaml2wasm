const fib = n => {
   let a = 0,
      b = 1
   for (let i = 0; i < n; i++) [a, b] = [b, a + b]
   return b
}

const t0 = process.hrtime()
fib(eval(process.argv[2]))
console.log(process.hrtime(t0))
