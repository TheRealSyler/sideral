import { Achievements, addAchievement } from './achievements';
import { renderAnimation } from './animation';
import { AStarNode, MapToAStarNodes } from './aStar';
import { Building, BuildingInfo, buildingInfo } from "./building";
import { buildingEndDate, buildingUpgradeEndDate, convertBuildingLevel, getLevelRequirement } from "./buildingFunctions";
import { MAP_CELL_SIZE, UI_TOP_HEIGHT, UI_BOTTOM_HEIGHT, MAP_CELLS_PER_ROW } from "./globalConstants";
import { Map, MapCell } from "./map"
import { generateMap } from './mapGenerator';
import { Minimap } from './minimap';
import { renderCellBuilding } from "./render";
import { checkAndSubtractResources, defaultResources } from "./resources";
import { loadSave, save, Save } from './save';
import { State, GameState } from "./state";
import { fromNow } from './time';
import { InitUI } from "./ui";
import { Unit } from './unit';
import { clamp, floor } from "./utils";
import { Viewport } from './viewport';


export type GameMode = 'unit' | 'building';

export class Game {
  map: Map
  mapSize = MAP_CELL_SIZE * MAP_CELL_SIZE
  camera = {
    speed: 18,
    move: {
      up: false,
      down: false,
      left: false,
      right: false
    }
  }

  state: State<GameState>;
  achievements: Achievements
  aStarNodes: AStarNode[]

  units: Unit[]

  mode: GameMode = 'unit'
  viewport = new Viewport(this)
  miniMap = new Minimap(this)

  constructor(public seed: number) {

    const save = loadSave()
    if (save) {
      this.map = save.map
      this.achievements = save.achievements
      this.state = new State<GameState>(save.state)
      this.units = save.units.map(save => {
        const newUnit = new Unit(this.map, save.cellPosition)
        newUnit.applySave(save)
        return newUnit
      })
    } else {
      this.map = generateMap(MAP_CELLS_PER_ROW, this.seed)
      this.achievements = {}
      this.state = new State<GameState>({
        ...defaultResources,
        selectedMapChunk: null,
      })
      this.units = [
        new Unit(this.map, this.map.cells[2012].position),
        new Unit(this.map, this.map.cells[2014].position, 4),
        new Unit(this.map, this.map.cells[2015].position),
        new Unit(this.map, this.map.cells[2016].position),
        new Unit(this.map, this.map.cells[2017].position),
        new Unit(this.map, this.map.cells[2019].position),
        new Unit(this.map, this.map.cells[2020].position)
      ]
    }
    this.aStarNodes = MapToAStarNodes(this.map, MAP_CELLS_PER_ROW)


    InitUI(this, UI_TOP_HEIGHT, UI_BOTTOM_HEIGHT)

    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);

    this.start()
  }

  private async start() {
    await this.viewport.start()
    this.update(0)
    setInterval(this.logicLoop, 250)
    setInterval(() => save(this), 1000 * 60)
  }

  private logicLoop = async () => {
    const time = Date.now()

    for (let i = this.map.indices.startIndex; i < this.map.indices.endIndex; i++) {
      const { building } = this.map.cells[i];
      const cell = this.map.cells[i];

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
        this.state.resendListeners('selectedMapChunk')
      }
    } else if (remainingTime < time) {
      building.level++;
      building.isUpgrading = false;
      building.date = Date.now()
      const level = convertBuildingLevel(building.level);
      addAchievement(this.achievements, getLevelRequirement(level, info.achievementUnlocks))



      await renderCellBuilding(new DOMPoint(x, y), this.viewport.buildingTextureCanvas, building)
      this.state.resendListeners('selectedMapChunk')
    }
  }

  private buildingResourceCheck(info: BuildingInfo, building: Building, time: number, cell: MapCell) {

    if (info.canProduce) {
      const levelName = convertBuildingLevel(building.level);

      if (buildingEndDate(building, info.production) < time) {
        building.date = Date.now()
        const resReq = getLevelRequirement(levelName, info.production.requirements);
        if (!resReq) {
          if (cell.resourceAmount === -1) {
            this.state.setFunc(info.productionType, (v) => v + 1);
            this.state.resendListeners('selectedMapChunk');

          } else if (cell.resourceAmount >= 1) {
            cell.resourceAmount--;
            this.state.setFunc(info.productionType, (v) => v + 1);
            this.state.resendListeners('selectedMapChunk');
          } else console.log('NO RESOURCES TODO implement warning or something');

        } else if (checkAndSubtractResources(this.state, resReq)) {
          this.state.resendListeners('selectedMapChunk');
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

    requestAnimationFrame(this.update)
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
        if (this.map.cells[i].currentUnits.length) {

          this.viewport.ctx.fillStyle = '#000'
          this.viewport.ctx.strokeStyle = '#000'
          for (let i = 0; i < Unit.cellAStarNodes.length; i++) {
            const x3 = i % Unit.cellAStarNodeRows
            const y3 = floor(i / Unit.cellAStarNodeRows)
            this.viewport.ctx.beginPath();
            this.viewport.ctx.arc(Unit.newTarget(x, x3), Unit.newTarget(y, y3), 1, 0, 2 * Math.PI);
            this.viewport.ctx.fill();
            // this.viewport.ctx.font = '5px sans-serif'
            // this.viewport.ctx.fillText(`x:${Unit.newTarget(x, x3) - x2} y: ${Unit.newTarget(y, y3) - y2}`,
            //   Unit.newTarget(x, x3) - 12,
            //   Unit.newTarget(y, y3) + (5 * (x3)) - 7)
            this.viewport.ctx.lineWidth = 0.4
            this.viewport.ctx.beginPath();
            this.viewport.ctx.rect(x2 + ((x3 - 1) * Unit.subCellSize), y2 + ((y3 - 1) * Unit.subCellSize), Unit.subCellSize, Unit.subCellSize);
            this.viewport.ctx.stroke();
          }
        }
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
        this.camera.move.up = true
        break;
      case 'S':
        this.camera.move.down = true
        break;
      case 'A':
        this.camera.move.left = true
        break;
      case 'D':
        this.camera.move.right = true
        break;
    }
  }

  keyup = (e: KeyboardEvent) => {
    switch (e.key.toUpperCase()) {
      case 'W':

        this.camera.move.up = false
        break;
      case 'S':
        this.camera.move.down = false
        break;
      case 'A':
        this.camera.move.left = false
        break;
      case 'D':
        this.camera.move.right = false
        break;
    }
  }

}
