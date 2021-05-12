let rec fib n =
   if n <= 1 then 1
   else (fib (n - 1)) + (fib (n - 2));;

let t0 = Time_ns.now() in
let ans = (fib (int_of_string (Sys.argv.(1)))) in
let time = Time_ns.now() -. t0 in
Format.printf "%d, %fs\n" ans time
