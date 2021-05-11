type int_list = Nil | Cons of int * int_list

let cns x xs = Cons (x, xs);;

let rec append xs ys =
   match xs with
      Nil -> ys
    | Cons (x, rest) -> Cons (x, append rest ys);;

let rec partition lst pred =
   match lst with
      Nil -> (Nil, Nil)
    | Cons (x, xs) ->
          match partition xs pred with
            (ls, rs) ->
               if pred x then ((cns x ls), rs)
               else (ls, Cons (x, rs));;

let rec quicksort lst =
   match lst with
      Nil -> Nil
    | Cons (x, Nil) -> Cons (x, Nil)
    | Cons (x, xs) ->
          match partition xs (fun y -> y < x) with
           (ls, rs) -> append (quicksort ls) (Cons(x, quicksort rs));;

quicksort
