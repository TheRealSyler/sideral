import { Map, MapCell, MapCellName } from './map';
import { degToRad, distanceToEllipse, map as mapValue } from './utils';
import random from 'seedrandom'

import { Perlin } from './noise';


export function generateMap(width: number, seed: number) {

  const cellAmounts: { [key in MapCellName]?: number } = {}

  const mapSize = width * width

  const { mask: landMask, indices } = islandMask(seed, width)
  const map: Map = { cells: [], indices }

  let min = 1
  let max = 0
  for (let i = 0; i < mapSize; i++) {
    const x = Math.floor(i % width);
    const y = Math.floor((i / width));
    // const n = noise(x, y)
    // if (n > max) max = n
    // if (n < min) min = n
  }


  for (let i = 0; i < mapSize; i++) {
    const x = (i % width)
    const y = Math.floor((i / width))


    let type: MapCell['type'] = 'water'
    let rotation = degToRad(Math.floor(random('' + seed + i * y * x)() * 4) * 90);
    if (landMask[i]) {
      type = 'gras'
    } else {
      const { newType, newRotation } = makeCoast(landMask, i, width)
      type = newType
      rotation = newRotation
    }
    map.cells[i] = ({
      building: null,
      resourceAmount: 100,
      rotation: rotation,
      type: type,
    })

    if (cellAmounts[type]) {
      cellAmounts[type]!++
    } else {
      cellAmounts[type] = 1
    }

  }
  // console.log(cellAmounts)
  return map
}


function makeCoast(landMask: number[], i: number, width: number,) {
  let type: MapCellName = 'water'
  let rotation: number = 0
  const isNextLand = landMask[i + 1];
  const isPrevLand = landMask[i - 1];
  const isLandAbove = landMask[i - width];
  const isLandBelow = landMask[i + width];
  const isLandUpLeft = landMask[i - width - 1];
  const isLandUpRight = landMask[i - width + 1];
  const isLandDownLeft = landMask[i + width - 1];
  const isLandDownRight = landMask[i + width + 1];

  if (isLandAbove && isLandBelow && isNextLand && isPrevLand) {
    type = 'water pond';
  } else if (isLandAbove + isLandBelow + isNextLand + isPrevLand === 3) {
    type = 'clay';
    landMask[i] = 1;
  } else if (isPrevLand && isNextLand) {
    type = 'gold';
    landMask[i] = 1;
  } else if (isLandBelow && isLandAbove) {
    type = 'berries';
    landMask[i] = 1;
  } else if (isLandBelow && isNextLand) {
    type = 'water coast 2';
    rotation = degToRad(90);
  } else if (isLandAbove && isNextLand) {
    type = 'water coast 2';
    rotation = degToRad(0);
  } else if (isLandBelow && isPrevLand) {
    type = 'water coast 2';
    rotation = degToRad(180);
  } else if (isLandAbove && isPrevLand && !isLandDownRight) {
    type = 'water coast 2';
    rotation = degToRad(-90);
  } else if (isLandAbove || isLandUpLeft && isLandUpRight) {
    if (isLandDownRight) {
      type = 'water coast 2';
      rotation = degToRad(0);
      // landMask[i] = 1;
    } else {
      type = 'water coast';
      rotation = degToRad(0);
    }
  } else if (isLandBelow || isLandDownLeft && isLandDownRight) {
    if (isLandUpRight) {
      type = 'water coast 2';
      rotation = degToRad(90);
      landMask[i] = 1;
    } else {
      type = 'water coast';
      rotation = degToRad(180);
    }
  } else if (isNextLand || isLandUpRight && isLandDownRight) {
    type = 'water coast';
    rotation = degToRad(90);
  } else if (isPrevLand || isLandUpLeft && isLandDownLeft) {
    type = 'water coast';
    rotation = degToRad(-90);

  } else if (isLandUpLeft && isLandDownRight) {
    type = 'water coast 4';
    rotation = degToRad(0);
  } else if (isLandUpRight && isLandDownLeft) {
    type = 'water coast 4';
    rotation = degToRad(90);
  } else if (isLandUpLeft) {
    type = 'water coast 3';
    rotation = degToRad(-90);

  } else if (isLandUpRight) {
    type = 'water coast 3';
    rotation = degToRad(0);

  } else if (isLandDownRight) {
    type = 'water coast 3';
    rotation = degToRad(90);

  } else if (isLandDownLeft) {
    type = 'water coast 3';
    rotation = degToRad(180);
  }

  return { newType: type, newRotation: rotation };
}

export function islandMask(seed: number, width: number) {
  const { noise2D } = Perlin({ seed: seed, lacunarity: 10 / width, octaves: 8 })

  const mapSize = width * width
  const out: number[] = new Array(mapSize)
  let min = 1
  let max = 0
  for (let i = 0; i < mapSize; i++) {
    const x = Math.floor(i % width);
    const y = Math.floor((i / width));
    const n = noise2D(x, y)
    if (n > max) max = n
    if (n < min) min = n
  }

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


  o[random('Oval' + seed)() > 0.5 ? 'y' : 'x'] = mapValue(random('Oval Val' + seed)(), 0, 1, 1, 2)

  for (let j = 0; j < mapSize; j++) {
    const x = (j % width);
    const y = Math.floor((j / width));
    const dist = distanceToEllipse(x, y, (width / 2) - 0.5, (width / 2) - 0.5, o.x, o.y) / width

    const n = mapValue(noise2D(x, y), min, max, 0, 1)
    const c0 = (1 - dist * 4)
    const ringStart = 0.0
    const ringEnd = 0.4
    const cMid = c0 > ringEnd ? 1 : 0
    const cRing = c0 > ringStart && c0 < ringEnd ? 1 : 0
    const cRingGrad = mapValue(cRing * c0, ringStart, ringEnd, -0.1, 1.4)
    const res = ((n - 0.2) * cRing) + cRingGrad + (cMid * 2)
    const resThreshold = 1
    out[j] = res > resThreshold ? 1 : 0

    if (res > resThreshold && x < boundingBox.x) boundingBox.x = x
    if (res > resThreshold && y < boundingBox.y) boundingBox.y = y
    if (res > resThreshold && x > boundingBox.xEnd) boundingBox.xEnd = x
    if (res > resThreshold && y > boundingBox.yEnd) boundingBox.yEnd = y



  }
  const indices: Map['indices'] = {
    startIndex: (boundingBox.x - 1) + width * (boundingBox.y - 1),
    endIndex: (boundingBox.xEnd + 1) + width * (boundingBox.yEnd + 1),
  }

  console.log(boundingBox)
  console.log(indices)
  return { mask: out, indices }
}

