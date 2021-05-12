const fib = n => {
   if (n <= 1) return 1
   return fib(n - 1) + fib(n - 2)
}

const t0 = process.hrtime()
fib(eval(process.argv[2]))
console.log(process.hrtime(t0))
