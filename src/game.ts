import { addAchievement } from './achievements';
import { renderAnimation } from './animation';
import { AStarNode, MapToAStarNodes } from './aStar';
import { Building, BuildingInfo, buildingInfo } from "./building";
import { buildingProductionEndDate, buildingUpgradeEndDate, convertBuildingLevel, getLevelRequirement } from "./buildingFunctions";
import { MAP_CELL_SIZE, UI_TOP_HEIGHT, UI_BOTTOM_HEIGHT, MAP_CELLS_PER_ROW } from "./globalConstants";
import { Map, MapCell } from "./map"
import { generateMap } from './mapGenerator';
import { Minimap } from './minimap';
import { renderCellBuilding } from "./render";
import { checkAndSubtractResources, defaultResources } from "./resources";
import { Save } from './save';
import { State, GameState } from "./state";
import { fromNow } from './time';
import { InitUI } from "./ui";
import { Unit } from './unit';
import { clamp, floor } from "./utils";
import { Viewport } from './viewport';


export type GameMode = 'unit' | 'building';

export class Game {
  map = generateMap(MAP_CELLS_PER_ROW, this.seed)
  mapSize = MAP_CELLS_PER_ROW * MAP_CELL_SIZE
  camera = {
    speed: 18,
    move: {
      up: false,
      down: false,
      left: false,
      right: false
    }
  }

  state = new State<GameState>({
    ...defaultResources,
    selectedMapChunk: null
  })
  gameSave: Save = {
    achievements: {},
    map: this.map
  }
  aStarNodes = MapToAStarNodes(this.map, MAP_CELLS_PER_ROW)

  units: Unit[] = [
    new Unit(this.map, this.map.cells[2012]),
    new Unit(this.map, this.map.cells[2013], 4),
    new Unit(this.map, this.map.cells[2014]),
    new Unit(this.map, this.map.cells[2015]),
    new Unit(this.map, this.map.cells[2016]),
    new Unit(this.map, this.map.cells[2017]),
    new Unit(this.map, this.map.cells[2019]),
    new Unit(this.map, this.map.cells[2020])
  ]

  mode: GameMode = 'unit'
  viewport = new Viewport(this)
  miniMap = new Minimap(this)

  constructor(public seed: number) {
    InitUI(this.state, this.gameSave, UI_TOP_HEIGHT, UI_BOTTOM_HEIGHT)

    window.addEventListener('keydown', this.keydown);
    window.addEventListener('keyup', this.keyup);

    this.start()
  }

  private async start() {
    await this.viewport.start()
    this.draw(0)
    setInterval(this.logicLoop, 250)
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
      if (progress >= 1) {
        building.isUpgrading = false;
        building.date = Date.now()
        addAchievement(this.gameSave.achievements, getLevelRequirement('I', info.achievementUnlocks))
        this.aStarNodes = MapToAStarNodes(this.map, MAP_CELLS_PER_ROW)
        this.state.resendListeners('selectedMapChunk')
      }
    } else if (remainingTime < time) {
      building.level++;
      building.isUpgrading = false;
      building.date = Date.now()
      addAchievement(this.gameSave.achievements, getLevelRequirement(convertBuildingLevel(building.level), info.achievementUnlocks))
      await renderCellBuilding(new DOMPoint(x, y), this.viewport.buildingTextureCanvas, building)
      this.state.resendListeners('selectedMapChunk')
    }
  }

  private buildingResourceCheck(info: BuildingInfo, building: Building, time: number, cell: MapCell) {
    if (info.canProduce) {
      if (buildingProductionEndDate(building, info) < time) {
        building.date = Date.now()
        const resReq = getLevelRequirement(convertBuildingLevel(building.level), info.productionResourceRequirements);
        if (!resReq) {
          if (cell.resourceAmount >= 1) {
            cell.resourceAmount--;
            this.state.resendListeners('selectedMapChunk');
            this.state.setFunc(info.productionType, (v) => v + 1);

          } else console.log('NO RESOURCES TODO implement warning or something');
          return;
        }
        if (checkAndSubtractResources(this.state, resReq)) {
          this.state.resendListeners('selectedMapChunk');
          this.state.setFunc(info.productionType, (v) => v + 1);
        } else console.log('NO RESOURCES TODO implement warning or something');
      }
    }
  }

  private draw = async (delta: number) => {

    this.viewport.draw(delta, this.mode)

    const { x: xStart, y: yStart } = this.viewport.ctx.transformedPoint(0, 0);
    const { x: xEnd, y: yEnd } = this.viewport.ctx.transformedPoint(this.viewport.canvas.width, this.viewport.canvas.height);
    this.miniMap.draw(xStart, yStart, xEnd, yEnd);

    await this.drawAnimations(delta, xStart, yStart, xEnd, yEnd);

    for (let i = 0; i < this.units.length; i++) {
      this.units[i].draw(this.viewport.ctx)
    }

    requestAnimationFrame(this.draw)
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
        if (building?.isUpgrading) {
          this.viewport.ctx.drawImage(await renderAnimation('build', delta), x2, y2)
          this.viewport.ctx.fillText(
            fromNow((buildingUpgradeEndDate(building, buildingInfo[building.name]))),
            x2 + 2,
            y2 + 10, MAP_CELL_SIZE - 4)
        }
        this.viewport.ctx.fillStyle = '#000'
        const s = floor(MAP_CELL_SIZE / 2);
        for (let i = 0; i < 9; i++) {
          const x3 = i % 3
          const y3 = floor(i / 3)
          this.viewport.ctx.beginPath();
          this.viewport.ctx.arc(x2 + (x3 * s), y2 + (y3 * s), 1, 0, 2 * Math.PI);
          this.viewport.ctx.fill();
        }
        this.viewport.ctx.lineWidth = 0.4;
        this.viewport.ctx.beginPath();
        this.viewport.ctx.rect(x2, y2, MAP_CELL_SIZE, MAP_CELL_SIZE);
        this.viewport.ctx.stroke();

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
