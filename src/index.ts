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
  map[27] = {
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
  map[35] = {
    building: {
      name: 'bakery',
      isUpgrading: true,
      date: new Date(Date.now() + 1000),
      level: 0
    } as any,
    type: 'gras',
    rotation: degToRad(180),
    resourceAmount: 1000
  }
  map[67] = {
    building: {
      name: 'bakery',
      isUpgrading: true,
      date: new Date(Date.now() + 1000),
      level: 0
    } as any,
    type: 'gras',
    rotation: degToRad(180),
    resourceAmount: 1000
  }
  map[2048 + 32] = {
    building: {
      name: 'bakery',
      isUpgrading: true,
      date: new Date(Date.now() + 2000),
      level: 0
    } as any,
    type: 'gras',
    rotation: degToRad(180),
    resourceAmount: 1000
  }
  map[4092 - 64] = {
    building: null,
    type: 'water coast 2',
    rotation: degToRad(-90),
    resourceAmount: 1000
  }
  map[4093 - 64] = {
    building: null,
    type: 'water coast',
    rotation: degToRad(0),
    resourceAmount: 1000
  }
  map[4094 - 64] = {
    building: null,
    type: 'water coast',
    rotation: degToRad(0),
    resourceAmount: 1000
  }
  map[4095 - 64] = {
    building: null,
    type: 'water coast',
    rotation: degToRad(0),
    resourceAmount: 1000
  }
  map[4092] = {
    building: null,
    type: 'water coast',
    rotation: degToRad(-90),
    resourceAmount: 1000
  }
  map[4093] = {
    building: null,
    type: 'water',
    rotation: degToRad(0),
    resourceAmount: 1000
  }
  map[4094] = {
    building: null,
    type: 'water',
    rotation: degToRad(90),
    resourceAmount: 1000
  }
  map[4095] = {
    building: null,
    type: 'water',
    rotation: degToRad(180),
    resourceAmount: 1000
  }

  new Game(map, b)

})()

// checkBuildingUpgradeTimes(BuildingNames['bakery'])
// checkBuildingProductionTimes(BuildingNames['bakery'])


// console.log(buildingInfo['bakery'])