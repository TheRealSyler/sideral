import { Achievements } from './achievements';
import { Game } from './game';
import { Map, MapCell } from './map';
import { GameState } from './state';
import { UnitSave } from './unit';

export interface Save {
  map: Map
  achievements: Achievements
  date: number,
  state: GameState,
  units: UnitSave[]
}

const saveSlot = 'saveTest'

export function loadSave(slot = saveSlot) {
  console.log('Load Game Save from Slot:', slot)
  const rawSave = localStorage.getItem(slot)
  if (rawSave) {
    const save: Save = JSON.parse(rawSave)

    offsetCellDates(save.map.cells, Date.now() - save.date);
    return save
  }
}

export function offsetCellDates(cells: MapCell[], timeOffset: number) {
  cells.forEach(cell => {
    if (cell.building) {
      cell.building.date += timeOffset;
    }
  });
}

export async function save(game: Game, slot = saveSlot) {
  console.log('Saved Game to Slot:', slot)
  const save: Save = {
    date: Date.now(),
    map: { cells: game.map.cells.map((cell) => ({ ...cell, currentUnit: undefined })), indices: game.map.indices },
    achievements: game.achievements,
    state: game.state.getState(),
    units: game.units.map((unit) => unit.save())
  }


  localStorage.setItem(slot, JSON.stringify(save))

}

export function deleteSave(slot = saveSlot) {
  console.log('Delete Game Save from Slot:', slot)
  localStorage.removeItem(slot)
}