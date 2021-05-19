import terrain from './assets/terrains.png';
const terrainsPerRow = 8
const terrainSize = 64

async function loadTerrain() {
  const img = document.createElement('img')
  img.src = terrain

  return new Promise((res) => {
    img.onload = () => res(img)
  })
}

export async function renderMap(map: [TerrainIndex, number][], width: number, size = terrainSize) {
  const canvas = document.createElement('canvas')
  const canvas2 = document.createElement('canvas')
  canvas.width = width * size
  canvas.height = width * size

  canvas2.width = size
  canvas2.height = size

  const ctx = canvas.getContext('2d')!
  const ctx2 = canvas2.getContext('2d')!

  const img = await loadTerrain() as any
  for (let i = 0; i < map.length; i++) {
    const mapItem = map[i];
    const rawX = (i % width)
    const rawY = Math.floor((i / width))
    const x = rawX * size
    const y = rawY * size

    const [offsetX, offsetY] = getImageOffset(mapItem[0], size, terrainsPerRow)


    ctx2.translate(size / 2, size / 2)
    ctx2.rotate(mapItem[1])
    ctx2.translate(-size / 2, -size / 2)
    ctx2.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)

    ctx?.drawImage(canvas2, x, y, size, size)

    ctx2.resetTransform()

  }


  return canvas.toDataURL("image/png");
}





function getImageOffset(index: TerrainIndex, size: number, width: number) {
  const x = (index % width) * size
  const y = Math.floor((index / width)) * size
  return [x, y]
}

export enum TerrainIndex {
  'gras',
  'trees',
  'stone',
  'clay',
  'bush',
  'berries',
  'tin',
  'copper',
  'gold',
  'iron',
  'water',
  'water coast',
  'water coast 2',
  'water coast 3',
  'water coast 4',
  'fruit trees',
}
