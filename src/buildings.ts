import { MapCellName } from "./map";
import bakeryTex from './assets/bakery.png'
import { getImageOffset, loadTerrain } from "./utils";


export class BuildingRenderer {

  constructor(public cellSize: number) {
    // this.canvas.width = cellSize
    // this.canvas.height = cellSize
    // const ctx = this.canvas.getContext('2d')
    // if (ctx) {
    //   this.ctx = ctx
    // } else {
    //   // TODO add could not initialize notification.
    //   console.error('could not initialize 2d context in building renderer, todo add notification')
    // }
  }
  async renderBuilding(building: Building) {
    const canvas = document.createElement('canvas')
    canvas.width = this.cellSize
    canvas.height = this.cellSize
    const ctx = canvas.getContext('2d')!
    const out = document.createElement('img')
    ctx.clearRect(0, 0, this.cellSize, this.cellSize)
    switch (building.name) {
      case BuildingNames['bakery']:
        const tex = await loadTerrain(bakeryTex)

        const [offsetX, offsetY] = getImageOffset(building.level, this.cellSize, 4)
        ctx.drawImage(tex, offsetX, offsetY, this.cellSize, this.cellSize, 0, 0, this.cellSize, this.cellSize)
        break;

    }
    out.src = canvas.toDataURL('image/png');
    console.log(out)
    return out
  }

}

export interface Building {
  name: BuildingNames,
  baseProductionRate: number | null,
  level: number
}

export enum BuildingNames {
  'woodcutter',
  'house',
  'bakery'
}

export const buildings: { [key in MapCellName]: null | BuildingNames[] } = {
  [MapCellName['gras']]: [BuildingNames['house'], BuildingNames['bakery']],
  [MapCellName['forest']]: [BuildingNames['woodcutter']],
  [MapCellName['stone']]: null,
  [MapCellName['clay']]: null,
  [MapCellName['bush']]: null,
  [MapCellName['berries']]: null,
  [MapCellName['tin']]: null,
  [MapCellName['copper']]: null,
  [MapCellName['gold']]: null,
  [MapCellName['iron']]: null,
  [MapCellName['water']]: null,
  [MapCellName['water coast']]: null,
  [MapCellName['water coast 2']]: null,
  [MapCellName['water coast 3']]: null,
  [MapCellName['water coast 4']]: null,
  [MapCellName['fruits']]: null,
}

