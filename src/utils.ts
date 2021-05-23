export function degToRad(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function clamp(value: number, max: number, min: number) {
  return Math.min(Math.max(value, min), max);
}

export function toPx(n: number) {
  return `${n}px`
}

export async function loadTexture(src: string): Promise<HTMLImageElement> {
  const img = document.createElement('img')
  img.src = src

  return new Promise((res) => {
    img.onload = () => res(img)
  })
}

export function getImageOffset(index: number, sizePerCell: number, cellsPerRow: number) {
  const x = (index % cellsPerRow) * sizePerCell
  const y = Math.floor((index / cellsPerRow)) * sizePerCell
  return [x, y]
}

