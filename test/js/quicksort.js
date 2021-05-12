const partition = (list, pred) => {
   const left = [],
      right = []
   list.forEach(e => (pred(e) ? left.push(e) : right.push(e)))
   return [left, right]
}

const quicksort = list => {
   if (list.length <= 1) return list
   const [left, right] = partition(list.slice(1), x => x < list[0])
   return [...quicksort(left), list[0], ...quicksort(right)]
}

const t0 = process.hrtime()
quicksort(process.argv[2].split(',').map(Number))
console.log(process.hrtime(t0))
