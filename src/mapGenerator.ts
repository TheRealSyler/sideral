import { GameMap, MapCell, MapCellName } from './map';
import { degToRad, floor } from './utils';
import random from 'seedrandom'
import { islandMaskGen, forestMaskGen, oreMaskGen } from './mapMasks';
import { MAP_CELLS_PER_ROW } from './globalConstants';
import { CampaignCell } from './campaign';
import { BattlemodeCell } from './battlemode';


export function generateMap(width: number, seed: number) {

  const cellAmounts: { [key in MapCellName]?: number } = {}

  const mapSize = width * width

  const { mask: islandMask, indices } = islandMaskGen(seed, width)
  const forestMask = forestMaskGen(seed, width)
  const oreMask = oreMaskGen(seed, width, islandMask)
  const map: GameMap<CampaignCell> = { cells: [], indices }

  for (let i = 0; i < mapSize; i++) {

    let type: MapCell['type'] = 'water'
    let rotation = randomRotation(seed, i);
    if (islandMask[i]) {
      type = getLandType(oreMask[i], forestMask[i], i,);
    } else {
      const { newType, newRotation } = makeCoast(islandMask, i, width, seed)
      type = newType
      rotation = newRotation
    }
    map.cells[i] = ({
      building: null,
      resourceAmount: getResourceAmount(type, i),
      currentUnit: undefined,
      rotation: rotation,
      type: type,
      position: { x: i % MAP_CELLS_PER_ROW, y: floor(i / MAP_CELLS_PER_ROW) }
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
export function generateBattleModeMap(width: number, seed: number) {

  const cellAmounts: { [key in MapCellName]?: number } = {}

  const mapSize = width * width

  const forestMask = forestMaskGen(seed, width, 0.8, 0.7, 4)
  const map: GameMap<BattlemodeCell> = {
    cells: [], indices: {
      endIndex: 0,
      startIndex: 0,
    }
  }

  for (let i = 0; i < mapSize; i++) {

    const type = getLandType(0, forestMask[i], i,);
    const rotation = randomRotation(seed, i);

    map.cells[i] = ({
      rotation: rotation,
      type: type,
      position: { x: i % MAP_CELLS_PER_ROW, y: floor(i / MAP_CELLS_PER_ROW) }
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

function randomRotation(seed: number, i: number) {
  return degToRad(floor(random('rotation' + seed + i)() * 4) * 90);
}

function getResourceAmount(type: MapCellName, i: number) {
  switch (type) {
    case 'stone':
    case 'forest':
    case 'bush':
    case 'berries':
    case 'clay':

      return Math.round(random('getResourceAmount' + i)() * 1000)
    case 'iron':
      return Math.round(random('getResourceAmount' + i)() * 750)
    case 'tin':
    case 'copper':
      return Math.round(random('getResourceAmount' + i)() * 500)
    case 'gold':
      return Math.round(random('getResourceAmount' + i)() * 100)

    default:
      return -1;

  }
}

const oreRarity: { [key in MapCellName]?: number } = {
  copper: 3,
  stone: 3,
  iron: 3,
  tin: 3,
  gold: 1,
  clay: 4
}
const oreTypes: MapCellName[] = getOreTypes()
function getOreTypes() {
  const oreTypes: MapCellName[] = []
  for (const key in oreRarity) {
    if (Object.prototype.hasOwnProperty.call(oreRarity, key)) {
      const rarity = oreRarity[key as MapCellName];
      for (let i = 0; i < rarity!; i++) {
        oreTypes.push(key as MapCellName)
      }
    }
  }
  return oreTypes
}
function getLandType(oreMask: number, forestMask: number, i: number): MapCellName {
  if (oreMask) {
    switch (oreMask) {
      case 1:
        return 'stone';
      case 0.5:
        return oreTypes[floor(random('oreType' + i)() * oreTypes.length)]
    }
    return 'gras';
  } else if (forestMask) {
    switch (forestMask) {
      case 1:
        return 'forest';
      case 0.5:
        return random('Bush' + i)() > 0.2 ? 'bush' : 'berries';
    }
    return 'gras';
  }
  return 'gras';
}

function makeCoast(landMask: number[], i: number, width: number, seed: number): { newRotation: number, newType: MapCellName } {

  const isNextLand = landMask[i + 1];
  const isPrevLand = landMask[i - 1];
  const isLandAbove = landMask[i - width];
  const isLandBelow = landMask[i + width];
  const isLandUpLeft = landMask[i - width - 1];
  const isLandUpRight = landMask[i - width + 1];
  const isLandDownLeft = landMask[i + width - 1];
  const isLandDownRight = landMask[i + width + 1];

  if (isLandAbove && isLandBelow && isNextLand && isPrevLand) {
    return { newType: 'water pond', newRotation: randomRotation(seed, i) };
  } else if (isLandAbove + isLandBelow + isNextLand + isPrevLand === 3) {
    landMask[i] = 1;
    return { newType: 'gras', newRotation: randomRotation(seed, i) };

  } else if (isPrevLand && isNextLand) {
    landMask[i] = 1;
    return { newType: 'gras', newRotation: randomRotation(seed, i) };

  } else if (isLandBelow && isLandAbove) {
    landMask[i] = 1;
    return { newType: 'gras', newRotation: randomRotation(seed, i) };

  } else if (isLandBelow && isNextLand) {
    return { newType: 'water coast 2', newRotation: degToRad(90) };

  } else if (isLandAbove && isNextLand) {
    return { newType: 'water coast 2', newRotation: degToRad(0) };

  } else if (isLandBelow && isPrevLand) {
    return { newType: 'water coast 2', newRotation: degToRad(180) };

  } else if (isLandAbove && isPrevLand && !isLandDownRight) {
    return { newType: 'water coast 2', newRotation: degToRad(-90) };

  } else if (isLandAbove || isLandUpLeft && isLandUpRight) {
    if (isLandDownRight) {
      return { newType: 'water coast 2', newRotation: degToRad(0) };
    }

    return { newType: 'water coast', newRotation: degToRad(0) };
  } else if (isLandBelow || isLandDownLeft && isLandDownRight) {
    if (isLandUpRight) {
      landMask[i] = 1;
      return { newType: 'water coast 2', newRotation: degToRad(90) };
    }
    return { newType: 'water coast', newRotation: degToRad(180) };

  } else if (isNextLand || isLandUpRight && isLandDownRight) {
    return { newType: 'water coast', newRotation: degToRad(90) };

  } else if (isPrevLand || isLandUpLeft && isLandDownLeft) {
    return { newType: 'water coast', newRotation: degToRad(-90) };

  } else if (isLandUpLeft && isLandDownRight) {
    return { newType: 'water coast 4', newRotation: degToRad(0) };

  } else if (isLandUpRight && isLandDownLeft) {
    return { newType: 'water coast 4', newRotation: degToRad(90) };

  } else if (isLandUpLeft) {
    return { newType: 'water coast 3', newRotation: degToRad(-90) };

  } else if (isLandUpRight) {
    return { newType: 'water coast 3', newRotation: degToRad(0) };

  } else if (isLandDownRight) {
    return { newType: 'water coast 3', newRotation: degToRad(90) };

  } else if (isLandDownLeft) {
    return { newType: 'water coast 3', newRotation: degToRad(180) };
  }
  return { newType: 'water', newRotation: randomRotation(seed, i) };
}



