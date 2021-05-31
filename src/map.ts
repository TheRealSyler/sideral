
import { Building } from './building';
import { Position } from './interfaces';
import { Unit } from './unit';

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
  'water pond',
  'placeholder_0',
  'placeholder_1',
  'placeholder_2',
  'placeholder_3',
  'placeholder_4',
  'placeholder_5',
  'placeholder_6',
  'placeholder_7',
}

export type MapCellName = keyof typeof MapCellTexturePos

export interface MapCell {
  type: MapCellName,
  rotation: number,
  resourceAmount: number
  building: Building | null,
  currentUnits: Unit[],
  position: Position
}

export type Map = {
  cells: MapCell[],
  indices: { startIndex: number, endIndex: number }
}



