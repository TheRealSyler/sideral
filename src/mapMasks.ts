import { Perlin } from './noise'
import random from 'seedrandom'
import { Map } from './map';
import { distance, distanceToEllipse, distanceSingleAxis, map, angleTo, radToDeg } from './utils'


export function islandMaskGen(seed: number, width: number) {
  const { noise2D } = Perlin({ seed: seed, lacunarity: 10 / width, octaves: 8 })

  const mapSize = width * width
  const out: number[] = new Array(mapSize)

  const noise = getAdjustedNoise(mapSize, width, noise2D);

  const o = {
    x: 2,
    y: 2
  }
  const boundingBox = {
    x: width,
    y: width,
    xEnd: 0,
    yEnd: 0,

  }

  o[random('Oval' + seed)() > 0.5 ? 'y' : 'x'] = map(random('Oval Val' + seed)(), 0, 1, 1, 2)

  for (let i = 0; i < mapSize; i++) {
    const x = (i % width);
    const y = Math.floor((i / width));
    const dist = distanceToEllipse(x, y, (width / 2) - 0.5, (width / 2) - 0.5, o.x, o.y) / width

    const n = noise(x, y)
    const c0 = (1 - dist * 4)
    const ringStart = 0.0
    const ringEnd = 0.4
    const cMid = c0 > ringEnd ? 1 : 0
    const cRing = c0 > ringStart && c0 < ringEnd ? 1 : 0
    const cRingGrad = map(cRing * c0, ringStart, ringEnd, -0.1, 1.4)
    const res = ((n - 0.2) * cRing) + cRingGrad + (cMid * 2)
    const resThreshold = 1
    out[i] = res > resThreshold ? 1 : 0

    if (res > resThreshold && x < boundingBox.x) boundingBox.x = x
    if (res > resThreshold && y < boundingBox.y) boundingBox.y = y
    if (res > resThreshold && x > boundingBox.xEnd) boundingBox.xEnd = x
    if (res > resThreshold && y > boundingBox.yEnd) boundingBox.yEnd = y

  }
  const indices: Map['indices'] = {
    startIndex: (boundingBox.x - 1) + width * (boundingBox.y - 1),
    endIndex: (boundingBox.xEnd + 1) + width * (boundingBox.yEnd + 1),
  }

  return { mask: out, indices }
}
export function forestMaskGen(seed: number, width: number) {
  const { noise2D } = Perlin({ seed: seed + 10, lacunarity: 12 / width, octaves: 8 })

  const mapSize = width * width
  const out: number[] = new Array(mapSize)

  const noise = getAdjustedNoise(mapSize, width, noise2D);

  for (let i = 0; i < mapSize; i++) {
    const x = (i % width);
    const y = Math.floor((i / width));
    const n = noise(x, y)

    const treeThreshold = 0.6
    const bushThreshold = 0.51
    const res = n > treeThreshold ? 1 : n > bushThreshold ? 0.5 : 0
    out[i] = res

  }

  return out
}
export function oreMaskGen(seed: number, width: number, islandMask: number[]) {
  const mapSize = width * width
  const out: number[] = new Array(mapSize).fill(0)



  let spots = random('ore spots')() * 16
  const size = 8
  for (let i = 0; i < mapSize; i++) {
    if (islandMask[i]) {

      out[i] = 0.1
    }
    const x = (i % width);
    const y = Math.floor((i / width));
    if (x === width / 2 && y === width / 2) {
      out[i] = 0.5
    }
  }
  let startIndex = 0
  for (let i = 0; i < mapSize; i++) {
    const chance = random('ore chance' + i)() < 0.01
    if (islandMask[i]) {
      if (chance) {
        const x = (i % width);
        const y = Math.floor((i / width));
        const angle = angleTo(x, y, 38, (width / 2) - 0.5)
        const newX = x + Math.cos(angle) * 10
        const newY = y + Math.sin(angle) * 10
        console.log('x', x, 'y', y, 'newX', newX, 'newY', newY, 'angle', radToDeg(angle))
        out[i] = 1
        out[Math.round(newX) + width * Math.round(newY)] = 0.9
        startIndex = i
        break;
      } else {
        out[i] = 0.1
      }
    }

  }



  return out
}

export function oreSpots(seed: number, width: number) {
  const { noise2D } = Perlin({ seed: seed + 3, lacunarity: 10 / width, octaves: 8 })

  const mapSize = width * width
  const out: number[] = new Array(mapSize)

  const noise = getAdjustedNoise(mapSize, width, noise2D);


  for (let i = 0; i < mapSize; i++) {
    const x = (i % width);
    const y = Math.floor((i / width));
    const dist = distance(x, y, (width / 2) - 0.5, (width / 2) - 0.5) / width

    const n = noise(x, y)
    const c0 = (1 - dist * 2)
    const ringStart = 0.0
    const ringEnd = 0.8
    const cMid = c0 > ringEnd ? 1 : 0
    const cRing = c0 > ringStart && c0 < ringEnd ? 1 : 0
    const cRingGrad = map(cRing * c0, ringStart, ringEnd, -0.1, 1.4)
    const res = ((n - 0.2) * cRing) + cRingGrad + (cMid * 2)
    const resThreshold = 1
    const resThreshold2 = 0.2
    out[i] = res > resThreshold ? 1 : res > resThreshold2 ? 0.5 : 0

  }

  return out
}

function getAdjustedNoise(mapSize: number, width: number, noise2D: (x: number, y: number) => number) {
  let min = 1;
  let max = 0;
  for (let i = 0; i < mapSize; i++) {
    const x = Math.floor(i % width);
    const y = Math.floor((i / width));
    const n = noise2D(x, y);
    if (n > max)
      max = n;
    if (n < min)
      min = n;
  }
  return (x: number, y: number) => map(noise2D(x, y), min, max, 0, 1)
}
