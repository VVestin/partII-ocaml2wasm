//const main = require('./main.js')
function component() {
   const element = document.createElement('div')

   element.innerHTML = ['Hello', 'webpack'].join(' ')

   return element
}

document.addEventListener('DOMContentLoaded', event => {
   document.body.appendChild(component())
   //main('2 + 2')
})
