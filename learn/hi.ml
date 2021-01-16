let hi = "hello";;

let my_array = [|1; 2; 3|];;
let first_element = my_array.(0);;

let foo =
   match first_element with
      | 1 -> true
      | _ -> false;;

Printf.printf "%s %s %b\n" hi "world" foo;;
