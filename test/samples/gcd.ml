let rec gcd a b =
   if a = 0 then b
   else gcd (b mod a) a

in gcd
