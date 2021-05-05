let rec isqrt n =
  if n = 1 then 1
  else let n' = isqrt (n - 1) in
    (n' + (n / n')) / 2
in isqrt 1
