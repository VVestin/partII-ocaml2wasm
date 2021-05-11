let exchange k = 10 * (k mod 10) + k / 10;;

let is_valid_answer answer =
   match answer with (son_age, grandpa_age) ->
      son_age * 4 = grandpa_age &&
  (exchange grandpa_age) * 3 = (exchange son_age);;

let rec find answer =
   match answer with (min_son_age, max_grandpa_age) ->
      if min_son_age >= max_grandpa_age
      then (-1, -1)
      else
         let rec find' answer = match answer with (son_age, grandpa_age) ->
            if son_age = grandpa_age
            then (-1, -1)
            else
               if is_valid_answer (son_age, grandpa_age)
               then (son_age, grandpa_age)
               else find' (son_age + 1, grandpa_age) in
         match find' (min_son_age, max_grandpa_age) with
          (-1, -1) -> find (min_son_age, max_grandpa_age - 1)
          | answer -> answer in
find (11, 99)
