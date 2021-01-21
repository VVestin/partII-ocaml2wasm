let isqrt n =
   let rec isqrt' x prevx =
      match prevx - x with
       | 0 -> x
       | _ -> isqrt' ((x + n / x) / 2) x
   in isqrt' n 0
in isqrt 100
