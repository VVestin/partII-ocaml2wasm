let fib n =
   let rec fib' m a b =
      match m with
          0 -> b
        | _ -> fib' (m - 1) b (a + b)
   in
   fib' n 0 1
in fib
