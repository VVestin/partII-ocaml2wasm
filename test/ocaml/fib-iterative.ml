let fib n =
   let rec fib' m a b =
      match m with
          0 -> b
        | _ -> fib' (m - 1) b (a + b)
   in
   fib' n 0 1;;

let t0 = Sys.time() in
let ans = (fib (int_of_string (Sys.argv.(1)))) in
let time = Sys.time() -. t0 in
Format.printf "%d, %fs\n" ans time
