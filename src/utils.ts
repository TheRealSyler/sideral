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

export function getTextureOffset(index: number, sizePerCell: number, cellsPerRow: number) {
  const x = (index % cellsPerRow) * sizePerCell
  const y = Math.floor((index / cellsPerRow)) * sizePerCell
  return [x, y]
}

export function map(val: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1)
}
export function distanceToEllipse(x1: number, y1: number, x2: number, y2: number, xSize: number, ySize: number) {
  const a = (x1 - x2) / xSize;
  const b = (y1 - y2) / ySize;
  return Math.sqrt(a * a + ((b * b)))
}


export function interpolate(a0: number, a1: number, w: number) {

  return (a1 - a0) * w + a0;
}
export function interpolateCubic(a0: number, a1: number, w: number) {

  return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
}
export function interpolateSmootherStep(a0: number, a1: number, w: number) {
  return (a1 - a0) * ((w * (w * 6.0 - 15.0) + 10.0) * w * w * w) + a0;
}

