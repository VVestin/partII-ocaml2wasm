const OP_TO_WAT = { '+': 'i32.add', '*': 'i32.mul' }
const comp = ast => {
   if (ast.type == 'NUMBER') return `i32.const ${ast.val}`
   else if (ast.type == 'INFIX')
      return `${comp(ast.lhs)}
${comp(ast.rhs)}
${OP_TO_WAT[ast.op]}`
}

const addBoilerplate = expr => {
   return `
(module
  (func $main (result i32)
${expr
   .split('\n')
   .map(line => '        ' + line)
   .join('\n')}
        )
  (export "main" (func $main))
)`
}

module.exports = ast => addBoilerplate(comp(ast))
