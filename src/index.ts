import './index.sass';
import { MapCell, MapCellName } from './map';
import random from 'seedrandom'
import { degToRad } from './utils';
import { Game } from './game';
import { buildingInfo, BuildingNames, } from './building';

function createMapCell(type: MapCellName, rotation: number, resourceAmount: number, building = null): MapCell {
  return { type, rotation, resourceAmount, building }
}

(async () => {
  const b = 64
  const map = new Array(b * b).fill(createMapCell('gras', 0, -1)).map((v, i) =>
  ({
    type: v.type, rotation: degToRad(Math.floor(random('aw' + i)() * 4) * 90), resourceAmount: 10000,
    building: null

    // {
    //   name: 'bakery',
    //   isUpgrading: false,
    //   date: new Date(),
    //   level: Math.floor(random('aw' + i)() * 15)
    // } as any

  }))
  map[65] = {
    building: {
      name: 'bakery',
      isUpgrading: true,
      date: new Date(),
      level: 0
    } as any,
    type: 'gras',
    rotation: degToRad(180),
    resourceAmount: 1000
  }
  // map[37] = {
  //   building: {
  //     name: BuildingNames['bakery'],

  //     level: 0
  //   } as any,
  //   type: MapCellName['gras'],
  //   rotation: degToRad(180),
  //   resourceAmount: 20
  // }
  // map[3] = {
  //   building: {
  //     name: BuildingNames['bakery'],

  //     level: 12
  //   } as any,
  //   type: MapCellName['gras'],
  //   rotation: degToRad(180),
  //   resourceAmount: 20
  // }
  // map[35] = {
  //   building: {
  //     name: BuildingNames['bakery'],

  //     level: 14
  //   } as any,
  //   type: MapCellName['gras'],
  //   rotation: degToRad(180),
  //   resourceAmount: 20
  // }
  // map[1] = createMapCell(MapCellName['water coast'], degToRad(180), -1)
  // map[2] = createMapCell(MapCellName['water coast 2'], degToRad(90), -1)
  // map[3] = createMapCell(MapCellName['bush'], degToRad(90), 234)
  // map[4] = createMapCell(MapCellName['clay'], degToRad(90), 234)
  // map[32] = createMapCell(MapCellName['copper'], degToRad(90), 2322)
  // map[33] = createMapCell(MapCellName['iron'], degToRad(90), 2322)
  // map[34] = createMapCell(MapCellName['forest'], degToRad(90), 2322)
  // map[64] = createMapCell(MapCellName['forest'], degToRad(90), random('aw' + 1)() * 100)
  // map[65] = createMapCell(MapCellName['berries'], degToRad(90), random('aw' + 2)() * 100)
  // map[66] = createMapCell(MapCellName['forest'], degToRad(90), random('aw' + 3)() * 100)
  // map[67] = createMapCell(MapCellName['stone'], degToRad(90), random('aw' + 4)() * 100)
  // map[120] = createMapCell(MapCellName['clay'], degToRad(90), random('aw' + 5)() * 100)
  // map[123] = createMapCell(MapCellName['copper'], degToRad(90), 324)
  // map[127] = createMapCell(MapCellName['water coast 4'], degToRad(90), -1)
  // map[1023] = createMapCell(MapCellName['water coast 4'], degToRad(180), -1)

  new Game(map, b)

})()

// checkBuildingUpgradeTimes(BuildingNames['bakery'])
// checkBuildingProductionTimes(BuildingNames['bakery'])


// console.log(buildingInfo['bakery'])