let rec fib n =
   if n <= 1 then 1
   else (fib (n - 1)) + (fib (n - 2))
in Format.printf "fib-iterative: %d \n" (fib (int_of_string (Sys.argv.(1))))
