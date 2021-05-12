type fb = None of int | Fizz of int | Buzz of int | FizzBuzz of int
type fb_list = Nil | Cons of fb * fb_list

let rec fizzbuzz n =
   if n = 0 then Nil
   else let f = match (n mod 3, n mod 5) with
      (0, 0) -> FizzBuzz n
    | (0, _) -> Fizz n
    | (_, 0) -> Buzz n
    | (_, _) -> None n
   in Cons (f, fizzbuzz (n - 1));;

fizzbuzz
