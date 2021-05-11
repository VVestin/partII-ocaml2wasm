type int_list = Nil | Cons of int * int_list

let rec safe qs col i = match qs with
   Nil -> true
 | Cons (h, t) ->
      if h = col || h - i = col || h + i = col then false
      else safe t col (i + 1);;

let rec solve n row p =
   if row = n then p else
   let rec loop col =
      if col = n then Nil
      else if safe p col 1
         then
            match solve n (row + 1) (Cons (col, p)) with
               Nil -> loop (col + 1)
             | s -> s
         else loop (col + 1)
   in loop 0;;

let exec n = solve n 0 Nil in
exec
