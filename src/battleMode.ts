
import { AStarNode, findPath, genAStarNodes, restoreAStarNodes } from './aStar'
import { CanvasCache } from './canvas/canvasCache'
import { Viewport } from './canvas/viewport'
import { MAP_PADDING, MAP_MOVE_FACTOR, ZOOM_SCALE_FACTOR, MAP_CELL_SIZE, UI_BOTTOM_HEIGHT, UI_TOP_HEIGHT, A_START_ENABLE_DIAGONAL } from './globalConstants'
import { Position } from './interfaces'
import { GameMap, MapCell } from './map'
import { generateBattleModeMap } from './mapGenerator'
import { Minimap } from './minimap'
import { render } from './render'
import { BattleModeSave, loadBattlemodeSave } from './save'
import { BattlemodeState, State } from './state'

import { InitBattlemodeUI } from './ui/battlemodeUI'
import { Unit, UnitSave } from './unit'
import { clamp, distanceSingleAxis, floor, toPx } from './utils'

// export interface Soldier {
//   defence: number,
//   attack: number,
//   xp: number,
//   path?: Position[],
//   name: string
//   currentCell?: BattlemodeCell
// }

interface SoldierAttributes {
  name: string
}


export class Soldier extends Unit implements SoldierAttributes {
  name: string
  constructor(game: Battlemode, { name }: SoldierAttributes, save?: SoldierSave, speed?: number) {
    super(game, undefined, save, speed)
    this.selected = true
    this.canMove = false
    this.avoidOtherUnits = false

    this.name = name
  }

  save(): SoldierSave {
    return {
      ...super.save(),
      attribs: { name: this.name }
    }
  }

}


export interface ArmyConstructor {
  soldiers: SoldierAttributes[]
}
export interface Army {
  soldiers: Soldier[]
}
export interface SoldierSave extends UnitSave {
  attribs: SoldierAttributes
}
export interface ArmySave {
  soldiers: SoldierSave[]
}

export interface BattlemodeCell extends MapCell {
  currentUnit?: Soldier
  flag?: 'test' | 'test2'
}

export class Battlemode extends Viewport {
  cellsPerRow = 32
  mapSize = this.cellsPerRow * MAP_CELL_SIZE

  startAreaWidth = 12
  main = document.createElement('main')

  showHover = false
  moveFlags: BattlemodeCell[] = []

  minimap = new Minimap(this.main, UI_BOTTOM_HEIGHT, this.mapSize, (ctx) => {
    ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0, UI_BOTTOM_HEIGHT, UI_BOTTOM_HEIGHT)
  })
  mapTextureCanvas = new CanvasCache(this.mapSize, 'Map Texture Canvas Battlemode')
  private getViewportHeight = () => window.innerHeight - (UI_TOP_HEIGHT + UI_BOTTOM_HEIGHT)
  private getViewportWidth = () => window.innerWidth

  aStarNodes: AStarNode[]
  map: GameMap<BattlemodeCell>
  state: State<BattlemodeState>
  public playerArmy: Army
  public aiArmy: Army
  constructor(playerArmy: ArmyConstructor, aiArmy: ArmyConstructor, save?: BattleModeSave, private seed = 0) {
    super('Battle Mode Viewport Canvas', {
      getMaxXPos: (scale: number) => this.getViewportWidth() - (this.mapSize * scale) - MAP_PADDING,
      getMaxYPos: (scale: number) => this.getViewportHeight() - (this.mapSize * scale) - MAP_PADDING,
      moveFactor: MAP_MOVE_FACTOR,
      boundaryPadding: 0,
      zoomMaxScale: 3,
      zoomScaleFactor: ZOOM_SCALE_FACTOR
    })

    this.setBounds({
      bottom: this.mapSize - (this.mapSize / 4),
      right: this.mapSize - (this.mapSize / 4),
      left: 0,
      top: 0
    })
    document.body.appendChild(this.main)
    this.main.appendChild(this.canvas)
    this.canvas.className = 'map';

    this.canvas.ondrop = this.ondrop
    this.canvas.ondragover = (e) => {
      e.preventDefault()
      this._mousemove(e)
    }


    const isObstacle = (cell: BattlemodeCell) => cell.type !== 'gras' || !!cell.currentUnit
    if (save) {
      this.map = save.map
      this.aStarNodes = genAStarNodes(this.map.cells, this.cellsPerRow, isObstacle)
      this.state = new State<BattlemodeState>(save.state)
      const restoreSoldiers = (soldierSave: SoldierSave) => new Soldier(this, soldierSave.attribs, soldierSave)
      this.aiArmy = { soldiers: save.aiArmy.soldiers.map(restoreSoldiers) }
      this.playerArmy = { soldiers: save.playerArmy.soldiers.map(restoreSoldiers) }
    } else {
      this.map = generateBattleModeMap(this.cellsPerRow, this.seed)
      this.aStarNodes = genAStarNodes(this.map.cells, this.cellsPerRow, isObstacle)
      this.state = new State<BattlemodeState>({ selectedMapCell: null, canStartBattle: false, playerTurn: true, startedBattle: false })

      const createSoldiers = (soldierAttrib: SoldierAttributes) => new Soldier(this, soldierAttrib)

      this.aiArmy = { soldiers: aiArmy.soldiers.map(createSoldiers) }
      this.playerArmy = { soldiers: playerArmy.soldiers.map(createSoldiers) }
    }

    this.start()
  }

  async start() {
    this.resize()
    this.setEvents({
      mouseleave: this.mouseleave,
      mousedown: this.mousedown,
      mousemove: this.mousemove,
      mouseup: this.mouseup,
      resize: this.resize
    })
    InitBattlemodeUI(this)
    if (!this.state.get('startedBattle')) {
      this.checkBattleStart()
    }
    this.state.resendListeners('selectedMapCell')
    this.update(0)
    await render(this.mapTextureCanvas, this.map.cells, this.cellsPerRow)

  }

  private ondrop = (e: DragEvent) => {
    if (e.dataTransfer) {

      const soldierIndex = +e.dataTransfer.getData('soldier')

      const transform = this.ctx.getTransform()
      const x = floor((e.offsetX - transform.e) / transform.a)
      const y = floor((e.offsetY - transform.f) / transform.d)
      const x2 = floor(x / MAP_CELL_SIZE)
      const y2 = floor(y / MAP_CELL_SIZE)
      if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
        const index = x2 + this.cellsPerRow * y2;
        const soldier = this.playerArmy.soldiers[soldierIndex]
        const cell = this.map.cells[index]

        this.deploySoldier(cell, soldier)
      }
    }
  }

  deploySoldier(cell: BattlemodeCell, soldier: Soldier) {
    if (cell.currentUnit) {
      this.recallSoldier(cell.currentUnit)
    }
    if (!cell.currentUnit) {
      if (soldier.currentCell) {
        this.aStarNodes[this.getIndexPos(soldier.currentCell.position)].isObstacle = false
        soldier.currentCell.currentUnit = undefined
      }
      cell.currentUnit = soldier
      soldier.currentCell = cell

      const x = cell.position.x * MAP_CELL_SIZE + (MAP_CELL_SIZE / 2)
      const y = cell.position.y * MAP_CELL_SIZE + (MAP_CELL_SIZE / 2)
      soldier.x = x
      soldier.y = y
      soldier.target.x = x
      soldier.target.y = y

      soldier.targetCellPos = { ...cell.position }


      this.aStarNodes[this.getIndexPos(cell.position)].isObstacle = true
      this.checkBattleStart()
      this.state.resendListeners('selectedMapCell')
    }
  }

  recallSoldier(soldier: Soldier) {
    const cell = soldier.currentCell
    if (cell) {
      this.aStarNodes[this.getIndexPos(cell.position)].isObstacle = false
      cell.currentUnit = undefined
      soldier.currentCell = undefined

      this.checkBattleStart()
      this.state.resendListeners('selectedMapCell')
    }
  }

  checkBattleStart() {
    let canStart = true
    for (let i = 0; i < this.playerArmy.soldiers.length; i++) {
      const soldier = this.playerArmy.soldiers[i];
      if (!soldier.currentCell) {
        canStart = false
      }
    }

    this.state.set('canStartBattle', canStart)
  }

  private resize = () => {
    this.canvas.width = this.getViewportWidth();
    this.canvas.height = this.getViewportHeight();
    this.canvas.style.top = toPx(UI_TOP_HEIGHT);
    this.canvas.style.bottom = toPx(UI_BOTTOM_HEIGHT);
  }

  public update = (delta: number) => {
    this.updateView(delta);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0);

    const { x: xStart, y: yStart } = this.ctx.transformedPoint(0, 0);
    const { x: xEnd, y: yEnd } = this.ctx.transformedPoint(this.canvas.width, this.canvas.height);

    this.minimap.draw(xStart, yStart, xEnd, yEnd)

    this.drawAnimations(delta, xStart, yStart, xEnd, yEnd)

    if (this.showHover) {
      const { x, y } = this.ctx.transformedPoint(this.lastX, this.lastY)
      const x2 = floor(x / MAP_CELL_SIZE) * MAP_CELL_SIZE
      const y2 = floor(y / MAP_CELL_SIZE) * MAP_CELL_SIZE
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#000'
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(x2 + MAP_CELL_SIZE, y2);
      this.ctx.lineTo(x2 + MAP_CELL_SIZE, y2 + MAP_CELL_SIZE);
      this.ctx.lineTo(x2, y2 + MAP_CELL_SIZE);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    const selectedPos = this.state.get('selectedMapCell')
    if (selectedPos) {
      const x2 = selectedPos.position.x * MAP_CELL_SIZE
      const y2 = selectedPos.position.y * MAP_CELL_SIZE
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#f00'
      this.ctx.moveTo(x2, y2);
      this.ctx.lineTo(x2 + MAP_CELL_SIZE, y2);
      this.ctx.lineTo(x2 + MAP_CELL_SIZE, y2 + MAP_CELL_SIZE);
      this.ctx.lineTo(x2, y2 + MAP_CELL_SIZE);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
    let startPlayerTurn = true
    this.ctx.strokeStyle = '#0af'
    for (let i = 0; i < this.playerArmy.soldiers.length; i++) {
      const soldier = this.playerArmy.soldiers[i]
      soldier.update(this.ctx);
      startPlayerTurn = startPlayerTurn && soldier.reachedDestination

    }
    if (!this.state.get('playerTurn') && startPlayerTurn) {
      console.log('YAY')
      this.startTurn()
    }

    if (!this.state.get('startedBattle')) {
      this.ctx.fillStyle = '#000a'
      const start = MAP_CELL_SIZE * this.startAreaWidth
      const fullSize = MAP_CELL_SIZE * this.cellsPerRow
      this.ctx.fillRect(start, 0, fullSize - start, fullSize)
    }

    requestAnimationFrame(this.update)
  }

  private async drawAnimations(delta: number, xStart: number, yStart: number, xEnd: number, yEnd: number) {
    const xStartCell = clamp(floor(xStart / MAP_CELL_SIZE), this.cellsPerRow - 1, 0);
    const yStartCell = clamp(floor(yStart / MAP_CELL_SIZE), this.cellsPerRow - 1, 0);
    const xEndCell = clamp(floor(xEnd / MAP_CELL_SIZE), this.cellsPerRow - 1, 0);
    const yEndCell = clamp(floor(yEnd / MAP_CELL_SIZE), this.cellsPerRow - 1, 0);

    for (let x = xStartCell; x <= xEndCell; x++) {
      for (let y = yStartCell; y <= yEndCell; y++) {
        const i = this.getIndex(x, y);
        const x2 = x * MAP_CELL_SIZE
        const y2 = y * MAP_CELL_SIZE
        const { flag } = this.map.cells[i]


        switch (flag) {
          case 'test':
            this.ctx.fillStyle = '#f004'
            this.ctx.fillRect(x2, y2, MAP_CELL_SIZE, MAP_CELL_SIZE)
            break;
          case 'test2':
            this.ctx.fillStyle = '#0f04'
            this.ctx.fillRect(x2, y2, MAP_CELL_SIZE, MAP_CELL_SIZE)
            break;
        }
        if (flag) {

          this.ctx.fillStyle = '#fff'
          this.ctx.fillText(`x:${x} y:${y} i: ${i}`,
            x2 + 2,
            y2 + 10, MAP_CELL_SIZE - 4)
        }

        if (this.aStarNodes[i].isObstacle) {
          this.ctx.fillStyle = '#00f2'
          this.ctx.fillRect(x2, y2, MAP_CELL_SIZE, MAP_CELL_SIZE)
        }


        // this.ctx.fillStyle = '#fff'
        // this.ctx.fillText(`x:${x} y:${y} i: ${i}`,
        //   x2 + 2,
        //   y2 + 10, MAP_CELL_SIZE - 4)

      }

    }
  }


  private mousemove = (e: MouseEvent) => {
    if (this.canDrag) {
      this.showHover = false
    } else {
      this.showHover = true
    }
  }

  private mouseleave = () => {
    this.showHover = false
  }
  private mouseup = (e: MouseEvent) => {
    if (this.state.get('playerTurn')) {
      const transform = this.ctx.getTransform()
      const x = floor((e.offsetX - transform.e) / transform.a)
      const y = floor((e.offsetY - transform.f) / transform.d)
      const x2 = floor(x / MAP_CELL_SIZE)
      const y2 = floor(y / MAP_CELL_SIZE)
      if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
        const selectedCell = this.state.get('selectedMapCell')
        const startedBattle = this.state.get('startedBattle')
        const index = x2 + this.cellsPerRow * y2;
        const cell = this.map.cells[index]
        if (e.button === 0) {
          if (selectedCell === cell) {
            this.state.set('selectedMapCell', null)
            this.clearMoveFlags()
          } else {
            this.state.set('selectedMapCell', cell)
            if (cell.currentUnit && startedBattle) {
              this.setMoveFlags(cell.position.x, cell.position.y, 4)
            } else {
              this.clearMoveFlags()
            }

          }
        } else if (e.button === 2 && selectedCell?.currentUnit && startedBattle) {
          const soldier = selectedCell.currentUnit
          this.aStarNodes[this.getIndexPos(soldier.targetCellPos)].isObstacle = false
          if (selectedCell === cell && cell.currentUnit) {
            cell.currentUnit.path = []
            this.aStarNodes[this.getIndexPos(selectedCell.position)].isObstacle = true
          } else if (cell.flag) {
            const start = this.aStarNodes[this.getIndexPos(selectedCell.position)]
            const end = this.aStarNodes[this.getIndexPos(cell.position)]

            const path = findPath(start, end)
            restoreAStarNodes(this.aStarNodes)
            if (path) {

              soldier.path = path
              soldier.reachedDestination = false
              this.aStarNodes[this.getIndexPos(cell.position)].isObstacle = true


              soldier.targetCellPos = { ...cell.position }
            }
          }
        }

      }
      this.showHover = true
    }

  }

  private mousedown = (e: MouseEvent) => {
    this.canDrag = false
    if (e.button === 2) {

    } else if (e.button === 0) {

    }
    else {
      this.canDrag = true
    }
  }

  private setMoveFlags(x: number, y: number, dist: number) {
    // TODO remove this function???
    const startX = clamp(x - dist, this.cellsPerRow, 0)
    const startY = clamp(y - dist, this.cellsPerRow, 0)
    const startIndex = this.getIndex(startX, startY);
    const endX = clamp(x + dist, this.cellsPerRow - 1, 0)
    const endY = clamp(y + dist, this.cellsPerRow - 1, 0)
    const endIndex = this.getIndex(endX, endY)
    const o = x - dist
    const offset = o < 0 ? o : 0
    let currentX = 0
    let currentY = 0
    const increment = (i: number) => {
      if (endX <= currentX) {
        return i - ((dist * 2) + offset) + this.cellsPerRow
      }
      return i + 1
    }

    this.clearMoveFlags()

    for (let i = startIndex; i <= endIndex; i = increment(i)) {
      const cell = this.map.cells[i];
      currentX = i % this.cellsPerRow
      currentY = floor(i / this.cellsPerRow)

      const dx = distanceSingleAxis(x, currentX)
      const dy = distanceSingleAxis(y, currentY)
      const canReach = A_START_ENABLE_DIAGONAL || dx + dy <= dist

      if (canReach && cell.type === 'gras') {
        cell.flag = 'test'
        if (i === this.getIndex(x, y)) {
          cell.flag = 'test2'
        }
      }
      this.moveFlags.push(cell)
    }
  }

  private clearMoveFlags() {
    while (this.moveFlags.length) {
      const cell = this.moveFlags.pop()
      if (cell) {
        cell.flag = undefined
      }
    }
  }
  private getIndexPos(pos: Position) {
    return pos.x + this.cellsPerRow * pos.y

  }
  private getIndex(x: number, y: number) {
    return x + this.cellsPerRow * y
  }

  private startTurn() {
    this.state.set('playerTurn', true)

    this.setSoldierCanMove(false)
  }


  endTurn() {
    this.state.set('playerTurn', false)
    this.setSoldierCanMove(true)
    this.clearMoveFlags()
    this.state.set('selectedMapCell', null)
  }

  private setSoldierCanMove(b: boolean) {
    for (let i = 0; i < this.playerArmy.soldiers.length; i++) {
      const soldier = this.playerArmy.soldiers[i]
      soldier.canMove = b
    }
  }
}