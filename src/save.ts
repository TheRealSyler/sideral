import { Achievements } from './achievements';
import { ArmySave, Battlemode, BattlemodeCell } from './battlemode';
import { Building } from './building';
import { Campaign, CampaignCell } from './campaign';
import { Position } from './interfaces';
import { GameMap } from './map';
import { BattlemodeState, CampaignState } from './state';
import { UnitSave } from './unit';

export interface CampaignSave {
  map: GameMap<CampaignCell>
  achievements: Achievements
  date: number,
  state: CampaignState,
  units: UnitSave[]
}

export interface BattleModeSave {
  map: GameMap<BattlemodeCell>
  state: BattlemodeState,
  playerArmy: ArmySave
  aiArmy: ArmySave
}

const campaignSlot = 'saveTest'
const battlemodeSlot = 'saveTestBattleMode'

export function loadCampaignSave(slot = campaignSlot) {
  console.log('Load Game Save from Slot:', slot)
  const rawSave = localStorage.getItem(slot)
  if (rawSave) {
    const save: CampaignSave = JSON.parse(rawSave)

    offsetBuildingDates(save.map.cells, Date.now() - save.date);
    return save
  }
}
export function offsetBuildingDates(cells: { building: Building | null }[], timeOffset: number) {
  cells.forEach(cell => {
    if (cell.building) {
      cell.building.date += timeOffset;
    }
  });
}

export async function saveCampaign(game: Campaign, slot = campaignSlot, saveToLocalStorage = true) {
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

export function deleteSave(slot = campaignSlot) {
  console.log('Delete Game Save from Slot:', slot)
  localStorage.removeItem(slot)
}



export function saveBattlemode(game: Battlemode, slot = battlemodeSlot, saveToLocalStorage = true) {
  console.log('Saved Game to Slot:', slot)

  const state = game.state.getState();
  const save: BattleModeSave = {
    aiArmy: { soldiers: game.aiArmy.soldiers.map((soldier) => soldier.save()) },
    playerArmy: { soldiers: game.playerArmy.soldiers.map(s => s.save()) },
    map: { ...game.map, cells: game.map.cells.map((cell) => ({ ...cell, currentUnit: undefined })) },
    state: { ...state, selectedMapCell: null }
  }

  if (saveToLocalStorage) {
    localStorage.setItem(slot, JSON.stringify(save))
  }
  return save
}




export function loadBattlemodeSave(slot = battlemodeSlot) {
  console.log('Load Game Save from Slot:', slot)
  const rawSave = localStorage.getItem(slot)
  if (rawSave) {
    const save: BattleModeSave = JSON.parse(rawSave)

    return save
  }
}


// function loadArmy(armyPositions: ArmyPositions, army: Army, cells: BattlemodeCell[]) {
//   for (let i = 0; i < armyPositions.length; i++) {
//     const [index, pos] = armyPositions[i];

//     const cell = cells[pos.x + 32 * pos.y] // TODO replace width constant

//     army.soldiers[index].currentCell = cell
//     cell.currentUnit = army.soldiers[index]
//   }
// }