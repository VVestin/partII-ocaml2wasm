(module
  (memory $mem 1)

  (func $helloWorld (export "helloWorld") (result i32)
        i32.const 5
        i32.const 2
        i32.sub
        )

  (func $offsetFromCoordinate (param $x i32) (param $y i32) (result i32)
        local.get $y
        i32.const 50
        i32.mul
        local.get $x
        i32.add
        i32.const 4
        i32.mul
        )

  (func $setCell (param $x i32) (param $y i32) (param $val i32)
        local.get $x
        local.get $y
        call $offsetFromCoordinate
        local.get $val
        i32.store
        )

  (func $shiftCell (param $x i32) (param $y i32)
        local.get $x
        local.get $y
        call $offsetFromCoordinate

        local.get $x
        local.get $y
        call $offsetFromCoordinate
        i32.load
        i32.const 1
        i32.shr_u
        i32.store
        )

  (func $inRange (param $low i32) (param $high i32) (param $val i32) (result i32)
        local.get $val
        local.get $low
        i32.ge_s
        local.get $val
        local.get $high
        i32.lt_s
        i32.and
        )
  (func $getCell (param $x i32) (param $y i32) (result i32)
        (if (result i32)
          (i32.and
            (call $inRange
                  (i32.const 0)
                  (i32.const 50)
                  (local.get $x)
                  )
            (call $inRange
                  (i32.const 0)
                  (i32.const 50)
                  (local.get $y)
                  )
            )
          (then
            (i32.and (i32.const 1)
                     (i32.load
                       (call $offsetFromCoordinate
                             (local.get $x)
                             (local.get $y)
                             )
                       )
                     )
            )
          (else
            (i32.const 0)
            )
          )
        )


  (table 18 anyfunc)
  (elem (i32.const 0)
        ;; dead cells
        $dead
        $dead
        $dead
        $alive
        $dead
        $dead
        $dead
        $dead
        $dead
        ;; living cells
        $dead
        $dead
        $alive
        $alive
        $dead
        $dead
        $dead
        $dead
        $dead
        )

  (func $alive (result i32)
        i32.const 2
        )
  (func $dead (result i32)
        i32.const 0
        )

  (func $nextCellState (param $x i32) (param $y i32) (result i32)
        (call_indirect (result i32)
                       (i32.add
                         (i32.mul
                           (i32.const 9)
                           (call $getCell
                                 (local.get $x)
                                 (local.get $y)
                                 )
                           )
                         (call $neighborCount
                               (local.get $x)
                               (local.get $y)
                               )
                         )
                       )
        )


  (func $neighborCount (param $x i32) (param $y i32) (result i32)
        i32.const 0
        (call $getCell
              (i32.add (i32.const -1) (local.get $x))
              (i32.add (i32.const -1) (local.get $y))
              )
        i32.add
        (call $getCell
              (i32.add (i32.const -1) (local.get $x))
              (local.get $y)
              )
        i32.add
        (call $getCell
              (i32.add (i32.const -1) (local.get $x))
              (i32.add (i32.const 1) (local.get $y))
              )
        i32.add
        (call $getCell
              (local.get $x)
              (i32.add (i32.const -1) (local.get $y))
              )
        i32.add
        (call $getCell
              (local.get $x)
              (i32.add (i32.const 1) (local.get $y))
              )
        i32.add
        (call $getCell
              (i32.add (i32.const 1) (local.get $x))
              (i32.add (i32.const -1) (local.get $y))
              )
        i32.add
        (call $getCell
              (i32.add (i32.const 1) (local.get $x))
              (local.get $y)
              )
        i32.add
        (call $getCell (i32.add (i32.const 1) (local.get $x))
              (i32.add (i32.const 1) (local.get $y))
              )
        i32.add
        )

  (func $evolveCell (param $x i32) (param $y i32)
        (call $setCell
              (local.get $x)
              (local.get $y)
              (i32.add
                (call $getCell
                      (local.get $x)
                      (local.get $y)
                      )
                (call $nextCellState
                      (local.get $x)
                      (local.get $y)
                      )
                )
              )
        )

  (func $evolveAllCells
        (local $x i32)
        (local $y i32)

        (local.set $y (i32.const 0))
        (block
          (loop

            (local.set $x (i32.const 0))

            (block
              (loop
                (call $evolveCell
                      (local.get $x)
                      (local.get $y)
                      )
                (local.set $x (i32.add (local.get $x) (i32.const 1)))
                (br_if 1 (i32.eq (local.get $x) (i32.const 50)))
                (br 0)
                )
              )
            (local.set $y (i32.add (local.get $y) (i32.const 1)))
            (br_if 1 (i32.eq (local.get $y) (i32.const 50)))
            (br 0)
            )
          )
        (local.set $y (i32.const 0))
        (block
          (loop

            (local.set $x (i32.const 0))

            (block
              (loop
                (call $shiftCell
                      (local.get $x)
                      (local.get $y)
                      )
                (local.set $x (i32.add (local.get $x) (i32.const 1)))
                (br_if 1 (i32.eq (local.get $x) (i32.const 50)))
                (br 0)
                )
              )
            (local.set $y (i32.add (local.get $y) (i32.const 1)))
            (br_if 1 (i32.eq (local.get $y) (i32.const 50)))
            (br 0)
            )
          )
        )
  (export "memory" (memory $mem))
  (export "evolveCell" (func $evolveCell))
  (export "evolveAllCells" (func $evolveAllCells))
  (export "neighborCount" (func $neighborCount))
  (export "setCell" (func $setCell))
  (export "getCell" (func $getCell))
  (export "nextCellState" (func $nextCellState))
  )
