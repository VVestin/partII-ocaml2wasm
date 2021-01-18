const KEYWORDS = (
   'and as assert asr begin class constraint' +
   'do done downto else end exception external ' +
   'false for fun function functor if in include ' +
   'inherit initializer land lazy let lor lsl lsr ' +
   'lxor match method mod module mutable new object ' +
   'of open or private rec sig struct then to true ' +
   'try type val virtual when while with'
).split(' ')

const lex = src => {
   src += '\n'
   console.log('lexing', src)

   let state = 'INIT'
   let num, identifier
   let tokens = []
   src.split('').forEach(char => {
      console.log('state', state, 'char', JSON.stringify(char))
      if (state == 'NUMBER' && char.match(/\d/)) {
         num = num * 10 + Number(char)
         return
      } else if (state == 'NUMBER') {
         tokens.push({ type: 'NUMBER', val: num })
         state = 'INIT'
      } else if (state == 'IDENTIFIER' && char.match(/[a-zA-Z0-9_']/)) {
         identifier += char
         return
      } else if (state == 'IDENTIFIER') {
         if (KEYWORDS.includes(identifier))
            tokens.push({ type: 'KEYWORD', keyword: identifier })
         else tokens.push({ type: 'IDENTIFIER', identifier })
         state = 'INIT'
      }
      if (char.match(/[=<>@^|&+\-*/$%]/)) {
         tokens.push({ type: 'INFIX', op: char })
      } else if (char.match(/\(|\)/)) {
         tokens.push({ type: 'KEYWORD', keyword: char })
      } else if (char.match(/\d/)) {
         num = Number(char)
         state = 'NUMBER'
      } else if (char.match(/[a-zA-Z_]/)) {
         identifier = char
         state = 'IDENTIFIER'
      } else if (char.match(/\s/)) {
      } else {
         console.log('UNRECOGNIZED')
      }
   })
   return tokens
}

if (require.main === module) {
   console.log(lex(process.argv[2]))
}

module.exports = lex
