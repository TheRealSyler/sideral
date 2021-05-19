import terrain from './assets/terrains.png';


async function loadTerrain() {
  const img = document.createElement('img')
  img.src = terrain

  return new Promise((res) => {
    img.onload = () => res(img)
  })
}

export async function renderMap(map: number[], width: number) {
  console.log('awd')


  const size = 64

  console.log(width)

  const canvas = document.createElement('canvas')
  canvas.width = width * size
  canvas.height = width * size

  const ctx = canvas.getContext('2d')
  const img = await loadTerrain() as any
  const out = document.createElement('img')
  const a = ctx?.createImageData(width * size, width * size)

  document.body.appendChild(canvas)
  for (let i = 0; i < map.length; i++) {
    const terrainIndex = map[i];
    console.log(terrainIndex)
    const x = (i % width) * size
    const y = Math.floor((i / width)) * size
    const [offsetX, offsetY] = getImageOffset(terrainIndex, size, 8)

    ctx?.drawImage(img, offsetX, offsetY, size, size, x, y, size, size)

  }
  console.log('awd')

}

function getImageOffset(index: number, size: number, width: number) {
  const x = (index % width) * size
  const y = Math.floor((index / width)) * size
  return [x, y]
}