
import { Building } from './buildings';

export enum MapCellName {
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

export interface MapCell {
  type: MapCellName,
  rotation: number,
  resourceAmount: number
  building: Building | null
}

export type Map = MapCell[]



