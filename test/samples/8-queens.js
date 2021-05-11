const safe = (queens, col) => {
   for (let i = 1; i <= queens.length; i++) {
      const qcol = queens[queens.length - i]
      if (col == qcol || col + i == qcol || col - i == qcol) return false
   }
   return true
}

const solve = (n, queens) => {
   if (queens.length == n) return queens
   for (let col = 0; col < n; col++) {
      if (safe(queens, col)) {
         const solution = solve(n, [...queens, col])
         if (solution) return solution
      }
   }
   return null
}

console.log(solve(10, []).reverse())
