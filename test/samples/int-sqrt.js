let isqrt = n => {
   if (n == 1) return 1
   let m = isqrt(n - 1)
   return Math.floor((m + Math.floor(n / m)) / 2)
}

console.log(isqrt(process.argv[2]))
