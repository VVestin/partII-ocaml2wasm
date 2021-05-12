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

let rec string_of_list lst = match lst with
   Nil -> ""
 | Cons (x, xs) -> (string_of_int x) ^ ", " ^ (string_of_list xs);;

let t0 = Sys.time() in
let sorted = quicksort (List.fold_left
   (fun acc x -> Cons (int_of_string x, acc))
   Nil
   (String.split_on_char ',' Sys.argv.(1))) in
let time = Sys.time() -. t0 in
Format.printf "%fs\n" time
