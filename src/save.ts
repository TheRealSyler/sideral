import { Achievements } from './achievements';
import { Building } from './building';
import { Campaign, CampaignMap } from './campaign';
import { GameState } from './state';
import { UnitSave } from './unit';

export interface CampaignSave {
  map: CampaignMap
  achievements: Achievements
  date: number,
  state: GameState,
  units: UnitSave[]
}

const saveSlot = 'saveTest'

export function loadCampaignSave(slot = saveSlot) {
  console.log('Load Game Save from Slot:', slot)
  const rawSave = localStorage.getItem(slot)
  if (rawSave) {
    const save: CampaignSave = JSON.parse(rawSave)

    offsetCellDates(save.map.cells, Date.now() - save.date);
    return save
  }
}
export function offsetCellDates(cells: { building: Building | null }[], timeOffset: number) {
  cells.forEach(cell => {
    if (cell.building) {
      cell.building.date += timeOffset;
    }
  });
}

export async function saveCampaign(game: Campaign, slot = saveSlot, saveToLocalStorage = true) {
  console.log('Saved Game to Slot:', slot)
  const map = game.map

  const save: CampaignSave = {
    date: Date.now(),
    map: { ...map, cells: map.cells.map((cell) => ({ ...cell, currentUnit: undefined })) },
    achievements: game.achievements,
    state: game.state.getState(),
    units: game.units.map((unit) => unit.save()),
  }
  if (saveToLocalStorage) {
    localStorage.setItem(slot, JSON.stringify(save))
  }
  return save
}

export function deleteSave(slot = saveSlot) {
  console.log('Delete Game Save from Slot:', slot)
  localStorage.removeItem(slot)
}