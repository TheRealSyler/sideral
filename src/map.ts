
import { Building } from './building';

export enum MapCellTexturePos {
  'gras',
  'forest',
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
  'fruits',
}

export type MapCellName = keyof typeof MapCellTexturePos

export interface MapCell {
  type: MapCellName,
  rotation: number,
  resourceAmount: number
  building: Building | null
}

export type Map = MapCell[]



