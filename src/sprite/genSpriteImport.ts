import { readdirSync, writeFileSync } from 'fs'
const files = readdirSync('./src/assets/spriteCache')


let imports = ''
let keys = ''
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const name = `img_${file.split('.')[0]}`
  imports += `import ${name} from '../assets/spriteCache/${file}'\n`
  keys += `  ${name},\n`
}


writeFileSync('./src/sprite/sprites.ts', `${imports}

export const sprites = [
${keys}
]`)