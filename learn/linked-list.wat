(module
  (memory $heap (export "heap") 1)
  (global $heap_ptr (mut i32) (i32.const 4)) ;; start 1 byte in so 0 can be a null pointer
  (type $func_i32 (func (param i32) (result i32)))
  ;;(type $func_f32 (func (param i32) (result f32)))

  (table 1 funcref)
  (elem (i32.const 0) $foo)

  (func $foo (param $env i32) (result i32)
        i32.const 13)

  (func $alloc_i32 (param $val i32) (param $next i32) (result i32)
        (i32.store
          (get_global $heap_ptr)
          (get_local $val)
          )
        (i32.store offset=4
                   (get_global $heap_ptr)
                   (get_local $next))
        (set_global $heap_ptr
                    (i32.add (get_global $heap_ptr) (i32.const 8)))
        (i32.sub (get_global $heap_ptr) (i32.const 8))
        )

  (func $alloc_f32 (param $val f32) (param $next i32) (result i32)
        (f32.store
          (get_global $heap_ptr)
          (get_local $val)
          )
        (i32.store offset=4
                   (get_global $heap_ptr)
                   (get_local $next))
        (set_global $heap_ptr
                    (i32.add (get_global $heap_ptr) (i32.const 8)))
        (i32.sub (get_global $heap_ptr) (i32.const 8))
        )

  (func $applyfunc_i32_i32 (param $func i32) (param $arg i32) (result i32)
        (call_indirect (type $func_i32)
                       (call $alloc_i32 (get_local $arg) (i32.load offset=4 (get_local $func)))
                       (i32.load (get_local $func)))
        )

  (func $test (export "test") (result i32)
        (local $env i32)
        (local $c1 i32)
        (set_local $c1 (call $alloc_i32
              (i32.const 0) (i32.const 0)))
        i32.const 28
        i32.load offset=4
        i32.load offset=4
        ;;(call $applyfunc_i32_i32 (get_local $c1) (i32.const 10))
        )
  (func $test2 (export "test2") (result i32)
        i32.const 0
        (if (result i32)
          (then
            i32.const 10
            )
          (else
            i32.const 20
            )
          )
        )
  )
