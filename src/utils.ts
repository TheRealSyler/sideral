import { MAP_CELL_SIZE } from './globalConstants';
import { Position } from './interfaces';

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
  const y = floor((index / cellsPerRow)) * sizePerCell
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
  return Math.sqrt(a * a + b * b)
}
export function distanceSingleAxis(x1: number, x2: number) {
  const a = (x1 - x2);
  return Math.sqrt(a * a)
}
/**Returns angle to second point in radians*/
export function angleTo(x1: number, y1: number, x2: number, y2: number) {
  return Math.atan2(x2 - x1, y2 - y1);
}

export function radToDeg(n: number) {
  return n * 180 / Math.PI
}

export function interpolate(a0: number, a1: number, w: number) {
  return (a1 - a0) * w + a0;
}
export function interpolateLinear(a: number, b: number, n: number) {
  return (1 - n) * a + n * b;
}
export function interpolateCubic(a0: number, a1: number, w: number) {
  return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
}
export function interpolateSmootherStep(a0: number, a1: number, w: number) {
  return (a1 - a0) * ((w * (w * 6.0 - 15.0) + 10.0) * w * w * w) + a0;
}

export function floor(number: number) {
  return number | 0
}

export function getIndexPos(pos: Position, cellsPerRow: number) {
  return pos.x + cellsPerRow * pos.y;
}

export function getIndex(x: number, y: number, cellsPerRow: number) {
  return x + cellsPerRow * y
}