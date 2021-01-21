let x = 1 in
let m1 = (match x + 1 with
   2 -> 20
 | 3 -> 30
 | y -> y + 1) in
let m2 =
 (match x >= 3 with
   true -> 10
 | false -> 15) in
   m1 + m2
