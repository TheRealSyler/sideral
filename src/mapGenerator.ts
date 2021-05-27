import { Map, MapCell, MapCellName } from './map';
import { degToRad, map as mapValue } from './utils';
import random from 'seedrandom'
import { islandMaskGen, forestMaskGen, oreMaskGen } from './mapMasks';


export function generateMap(width: number, seed: number) {

  const cellAmounts: { [key in MapCellName]?: number } = {}

  const mapSize = width * width

  const { mask: islandMask, indices } = islandMaskGen(seed, width)
  const forestMask = forestMaskGen(seed, width)
  const oreMask = oreMaskGen(seed, width, islandMask)
  const map: Map = { cells: [], indices }

  for (let i = 0; i < mapSize; i++) {
    const x = (i % width)
    const y = Math.floor((i / width))


    let type: MapCell['type'] = 'water'
    let rotation = degToRad(Math.floor(random('' + seed + i * y * x)() * 4) * 90);
    if (islandMask[i]) {
      if (forestMask[i]) {
        switch (forestMask[i]) {
          case 1:
            type = 'forest'

            break;
          case 0.5:
            type = random('Bush' + i)() > 0.2 ? 'bush' : 'berries'
            break;
        }
      } else if (oreMask[i]) {
        switch (oreMask[i]) {
          case 1:
            type = 'stone'
            break;
          case 0.5:
            type = 'clay'
            break;
        }
      } else {
      }
      type = 'gras'
    } else {
      const { newType, newRotation } = makeCoast(islandMask, i, width)
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
    type = 'placeholder_3';
    landMask[i] = 1;
  } else if (isPrevLand && isNextLand) {
    type = 'placeholder_3';
    landMask[i] = 1;
  } else if (isLandBelow && isLandAbove) {
    type = 'placeholder_3';
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



