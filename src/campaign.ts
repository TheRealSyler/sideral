import { Achievements, addAchievement } from './achievements';
import { renderAnimation } from './animation';
import { AStarNode, MapToAStarNodes } from './aStar';
import { Building, BuildingInfo, buildingInfo } from "./building";
import { buildingEndDate, buildingUpgradeEndDate, convertBuildingLevel, getLevelRequirement } from "./buildingFunctions";
import { Citizen } from './citizen';
import { MAP_CELL_SIZE, UI_TOP_HEIGHT, UI_BOTTOM_HEIGHT, MAP_CELLS_PER_ROW } from "./globalConstants";
import { GameMap, MapCell } from "./map"
import { generateMap } from './mapGenerator';
import { Minimap } from './minimap';
import { renderCellBuilding } from "./render";
import { checkAndSubtractResources, defaultResources } from "./resources";
import { CampaignSave, offsetCellDates, saveCampaign } from './save';
import { State, CampaignState } from "./state";
import { fromNow } from './time';
import { InitCampaignUI } from "./ui/campaignUI";
import { Unit } from './unit';
import { clamp, floor } from "./utils";
import { CampaignViewport } from './campaignViewport';

export type SelectionMode = 'unit' | 'building';



export interface CampaignCell extends MapCell {
  resourceAmount: number
  building: Building | null,
  currentUnit?: Unit
}

export class Campaign {
  map: GameMap<CampaignCell>

  mapSize = MAP_CELLS_PER_ROW * MAP_CELL_SIZE

  state: State<CampaignState>;
  achievements: Achievements
  aStarNodes: AStarNode[]

  units: Unit[]
  citizens: Citizen[] = [
    { name: '12', },
    { name: '23', },
    { name: '35', },
    { name: '45', },
    { name: '56', },
    { name: '67', },
    { name: '78', },
  ]

  mode: SelectionMode = 'unit'

  main = document.createElement('main') // TODO think of a better name
  viewport = new CampaignViewport(this)
  miniMap = new Minimap(this.main, UI_BOTTOM_HEIGHT, this.mapSize, (ctx) => {
    ctx.drawImage(this.viewport.mapTextureCanvas.canvas, 0, 0, UI_BOTTOM_HEIGHT, UI_BOTTOM_HEIGHT)
    ctx.drawImage(this.viewport.buildingTextureCanvas.canvas, 0, 0, UI_BOTTOM_HEIGHT, UI_BOTTOM_HEIGHT)
  })

  constructor(public seed: number, save?: CampaignSave) {

    if (save) {
      this.map = save.map

      this.aStarNodes = MapToAStarNodes(this.map.cells, MAP_CELLS_PER_ROW)
      this.achievements = save.achievements
      this.state = new State<CampaignState>(save.state)
      this.units = save.units.map(save => {
        const newUnit = new Unit(this, save.cellPosition)
        newUnit.applySave(save)
        return newUnit
      })
    } else {

      this.map = generateMap(MAP_CELLS_PER_ROW, this.seed)
      this.aStarNodes = MapToAStarNodes(this.map.cells, MAP_CELLS_PER_ROW)
      this.achievements = {}
      this.state = new State<CampaignState>({
        ...defaultResources,
        selectedMapCell: null,
      })
      this.units = [
        new Unit(this, this.map.cells[2012].position),
        new Unit(this, this.map.cells[2014].position, 4),
        new Unit(this, this.map.cells[2015].position, 3),
        new Unit(this, this.map.cells[2016].position, 3),
        new Unit(this, this.map.cells[2017].position, 3),
        new Unit(this, this.map.cells[2019].position, 3),
        new Unit(this, this.map.cells[2020].position, 3)
      ]
    }
    document.body.appendChild(this.main)

    this.start()
  }

  end() {
    this.pause()
    this.main.remove()
  }

  private async start() {
    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);

    await this.viewport.start()

    InitCampaignUI(this)
    this.play()
    setInterval(() => saveCampaign(this), 1000 * 60)
  }
  private updateHandler = -1
  private logicHandler = -1
  private pauseTime = -1
  private lastSelectedMapCell: CampaignState['selectedMapCell'] = null
  isPaused = false
  pause() {
    this.pauseTime = Date.now()
    cancelAnimationFrame(this.updateHandler)
    clearInterval(this.logicHandler)
    this.isPaused = true
    this.viewport.canvas.style.pointerEvents = 'none'
    this.viewport.canvas.style.opacity = '0.5'

    this.lastSelectedMapCell = this.state.get('selectedMapCell')
    this.state.set('selectedMapCell', null)
    console.log('PAUSE GAME')
  }

  play() {
    this.viewport.canvas.style.pointerEvents = 'unset'
    this.viewport.canvas.style.opacity = '1'

    this.state.set('selectedMapCell', this.lastSelectedMapCell)
    console.log('PLAY GAME')
    if (this.pauseTime >= 0) {
      offsetCellDates(this.map.cells, Date.now() - this.pauseTime)
    }
    this.update(0)
    this.logicHandler = setInterval(this.logicLoop, 250) as any
    this.isPaused = false
  }

  private logicLoop = async () => {
    const time = Date.now()

    for (let i = this.map.indices.startIndex; i < this.map.indices.endIndex; i++) {
      const cell = this.map.cells[i];
      const { building } = cell;

      if (building) {
        const info = buildingInfo[building.name]
        if (building.isUpgrading) {
          await this.buildingUpgradeCheck(building, info, time, i);
        } else {
          this.buildingResourceCheck(info, building, time, cell);
        }
      }
    }
  }

  private async buildingUpgradeCheck(building: Building, info: BuildingInfo, time: number, i: number) {
    const remainingTime = buildingUpgradeEndDate(building, info);
    const x = (i % MAP_CELLS_PER_ROW)
    const y = floor((i / MAP_CELLS_PER_ROW))
    if (building.level < 4) {
      const progress = 1 - ((remainingTime - Date.now()) / (info.constructionTime * 1000));
      if (progress > (building.level + 1) * 0.25) {
        building.level++;
        await renderCellBuilding(new DOMPoint(x, y), this.viewport.buildingTextureCanvas, building)
      }
      if (progress > 1) {
        building.isUpgrading = false;
        building.date = Date.now()
        addAchievement(this.achievements, info.achievementUnlocks?.I)


        this.aStarNodes[i].isObstacle = true
        this.state.resendListeners('selectedMapCell')
      }
    } else if (remainingTime < time) {
      building.level++;
      building.isUpgrading = false;
      building.date = Date.now()
      const level = convertBuildingLevel(building.level);
      addAchievement(this.achievements, getLevelRequirement(level, info.achievementUnlocks))



      await renderCellBuilding(new DOMPoint(x, y), this.viewport.buildingTextureCanvas, building)
      this.state.resendListeners('selectedMapCell')
    }
  }

  private buildingResourceCheck(info: BuildingInfo, building: Building, time: number, cell: CampaignCell) {

    if (info.canProduce) {
      const levelName = convertBuildingLevel(building.level);

      if (buildingEndDate(building, info.production) < time) {
        building.date = Date.now()
        const resReq = getLevelRequirement(levelName, info.production.requirements);
        if (!resReq) {
          if (cell.resourceAmount === -1) {
            this.state.setFunc(info.productionType, (v) => v + 1);
            this.state.resendListeners('selectedMapCell');

          } else if (cell.resourceAmount >= 1) {
            cell.resourceAmount--;
            this.state.setFunc(info.productionType, (v) => v + 1);
            this.state.resendListeners('selectedMapCell');
          } else console.log('NO RESOURCES TODO implement warning or something');

        } else if (checkAndSubtractResources(this.state, resReq)) {
          this.state.resendListeners('selectedMapCell');
          this.state.setFunc(info.productionType, (v) => v + 1);
        } else console.log('NO RESOURCES TODO implement warning or something');
      }
    }
  }

  private update = async (delta: number) => {

    this.viewport.update(delta, this.mode)

    const { x: xStart, y: yStart } = this.viewport.ctx.transformedPoint(0, 0);
    const { x: xEnd, y: yEnd } = this.viewport.ctx.transformedPoint(this.viewport.canvas.width, this.viewport.canvas.height);
    this.miniMap.draw(xStart, yStart, xEnd, yEnd);

    await this.drawAnimations(delta, xStart, yStart, xEnd, yEnd);

    for (let i = 0; i < this.units.length; i++) {
      this.units[i].update(this.viewport.ctx)
    }

    this.updateHandler = requestAnimationFrame(this.update)
  }

  private async drawAnimations(delta: number, xStart: number, yStart: number, xEnd: number, yEnd: number) {
    const xStartCell = clamp(floor(xStart / MAP_CELL_SIZE), MAP_CELLS_PER_ROW - 1, 0);
    const yStartCell = clamp(floor(yStart / MAP_CELL_SIZE), MAP_CELLS_PER_ROW - 1, 0);
    const xEndCell = clamp(floor(xEnd / MAP_CELL_SIZE), MAP_CELLS_PER_ROW - 1, 0);
    const yEndCell = clamp(floor(yEnd / MAP_CELL_SIZE), MAP_CELLS_PER_ROW - 1, 0);
    this.viewport.ctx.fillStyle = "white";
    this.viewport.ctx.font = '10px sans-serif'
    for (let x = xStartCell; x <= xEndCell; x++) {
      for (let y = yStartCell; y <= yEndCell; y++) {
        const i = x + MAP_CELLS_PER_ROW * y;
        const x2 = x * MAP_CELL_SIZE
        const y2 = y * MAP_CELL_SIZE
        const { building } = this.map.cells[i]
        if (building) {

          if (building.isUpgrading) {
            this.viewport.ctx.drawImage(await renderAnimation('build', delta), x2, y2)
            this.viewport.ctx.fillText(
              fromNow((buildingUpgradeEndDate(building, buildingInfo[building.name]))),
              x2 + 2,
              y2 + 10, MAP_CELL_SIZE - 4)
          }
          // if (building.disabled) {
          //   this.viewport.ctx.drawImage(await renderAnimation('disabled', delta), x2, y2)
          // }
        }

        // const node = this.aStarNodes[i]
        // this.viewport.ctx.fillStyle = '#f003'
        // if (node.isObstacle) {
        //   this.viewport.ctx.beginPath();
        //   this.viewport.ctx.rect(x2, y2, MAP_CELL_SIZE, MAP_CELL_SIZE);
        //   this.viewport.ctx.fill();
        // }
        // this.viewport.ctx.fillStyle = '#000'
        // this.viewport.ctx.strokeStyle = '#f00'
        // this.viewport.ctx.beginPath();
        // this.viewport.ctx.rect(x2, y2, MAP_CELL_SIZE, MAP_CELL_SIZE);
        // this.viewport.ctx.stroke();

        // this.viewport.ctx.fillText(`x:${x} y: ${y} i: ${i}`,
        //   x2 + 2,
        //   y2 + 10, MAP_CELL_SIZE - 4)

      }

    }
  }

  keydown = (e: KeyboardEvent) => {
    switch (e.key.toUpperCase()) {
      case 'W':
        this.viewport.camera.move.up = true
        break;
      case 'S':
        this.viewport.camera.move.down = true
        break;
      case 'A':
        this.viewport.camera.move.left = true
        break;
      case 'D':
        this.viewport.camera.move.right = true
        break;
    }
  }

  keyup = (e: KeyboardEvent) => {
    switch (e.key.toUpperCase()) {
      case 'W':
        this.viewport.camera.move.up = false
        break;
      case 'S':
        this.viewport.camera.move.down = false
        break;
      case 'A':
        this.viewport.camera.move.left = false
        break;
      case 'D':
        this.viewport.camera.move.right = false
        break;
    }
  }

}
