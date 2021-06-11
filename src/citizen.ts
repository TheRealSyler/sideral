import { MapCell } from './map';
import { Unit } from './unit';

export interface Citizen {
  name: string,
  assignment?: Unit | MapCell
}