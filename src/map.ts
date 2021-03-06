import { Position } from './interfaces';

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
  position: Position
}


export interface Indices {
  startIndex: number;
  endIndex: number;
}

export type GameMap<T extends MapCell> = {
  cells: T[],
  indices: Indices
}



