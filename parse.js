const PRECIDENCE = { '*': 2, '+': 1, '(': 0 }
const parse = tokens => {
   const opStack = []
   const exprStack = []
   const popOp = () => {
      const popped = opStack.pop()
      if (popped.type == 'INFIX')
         exprStack.push({
            ...popped,
            rhs: exprStack.pop(),
            lhs: exprStack.pop(),
         })
      return popped
   }
   tokens.forEach(token => {
      console.log(exprStack, opStack, token)
      switch (token.type) {
         case 'NUMBER':
            exprStack.push(token)
            break
         case 'INFIX':
            while (
               opStack.length &&
               PRECIDENCE[opStack[opStack.length - 1].op] >=
                  PRECIDENCE[token.op]
            )
               popOp()
            opStack.push(token)
            break
         case 'KEYWORD':
            if (token.keyword == '(') opStack.push(token)
            else if (token.keyword == ')') while (popOp().keyword != '(') {}
            break
         default:
            console.error('Unrecognized token', token)
      }
   })
   while (opStack.length) popOp()
   return exprStack[0]
}

module.exports = parse
