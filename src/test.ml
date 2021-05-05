type intList = Nil | Cons of int * intList

let rec sum lst =
   match lst with
      Nil -> 0
    | Cons (x, xs) -> x + (sum xs) in
let s = sum (Cons (-5, Cons (-10, Cons(1, Nil)))) in
let rec gcd a b =
   if b = 0 then a else gcd b (a mod b) in
gcd 8 12
