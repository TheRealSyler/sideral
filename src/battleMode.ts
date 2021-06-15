
import { AStarNode, findPath, genAStarNodes, restoreAStarNodes } from './aStar'
import { CanvasCache } from './canvas/canvasCache'
import { Viewport } from './canvas/viewport'
import { MAP_PADDING, MAP_MOVE_FACTOR, ZOOM_SCALE_FACTOR, MAP_CELL_SIZE, UI_BOTTOM_HEIGHT, UI_TOP_HEIGHT, A_START_ENABLE_DIAGONAL } from './globalConstants'
import { GameMap, MapCell } from './map'
import { generateBattleModeMap } from './mapGenerator'
import { Minimap } from './minimap'
import { render } from './render'
import { BattleModeSave } from './save'
import { SoldierAttributes, Soldier } from './soldier'
import { BattlemodeState, State } from './state'

import { InitBattlemodeUI } from './ui/battlemodeUI'
import { UnitSave } from './unit'
import { clamp, distance, distanceSingleAxis, floor, getIndex, getIndexPos, toPx } from './utils'

export interface ArmyConstructor {
  soldiers: SoldierAttributes[]
}
export interface Army {
  soldiers: Soldier[]
}
export interface SoldierSave extends UnitSave {
  attribs: Required<SoldierAttributes>
}
export interface ArmySave {
  soldiers: SoldierSave[]
}

export interface BattlemodeCell extends MapCell {
  currentUnit?: Soldier
  flag?: 'isInSoldierReach' | 'isSoldier'
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
      this.state = new State<BattlemodeState>({
        selectedMapCell: null,
        canStartBattle: false,
        playerTurn: true,
        startedBattle: false,
        aiTurn: false
      })

      const createSoldiers = (soldierAttrib: SoldierAttributes) => new Soldier(this, soldierAttrib)

      this.aiArmy = { soldiers: aiArmy.soldiers.map(createSoldiers) }
      this.playerArmy = { soldiers: playerArmy.soldiers.map(createSoldiers) }
    }

    this.deploySoldier(this.map.cells[0], this.aiArmy.soldiers[0])
    this.deploySoldier(this.map.cells[1], this.aiArmy.soldiers[1])

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
      if (cell.currentUnit.team !== soldier.team) return

      this.recallSoldier(cell.currentUnit)
    }
    if (!cell.currentUnit) {
      if (soldier.currentCell) {
        this.aStarNodes[getIndexPos(soldier.currentCell.position, this.cellsPerRow)].isObstacle = false
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

      this.aStarNodes[getIndexPos(cell.position, this.cellsPerRow)].isObstacle = true
      this.checkBattleStart()
      this.state.resendListeners('selectedMapCell')
    }
  }

  recallSoldier(soldier: Soldier) {
    const cell = soldier.currentCell
    if (cell) {
      this.aStarNodes[getIndexPos(cell.position, this.cellsPerRow)].isObstacle = false
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

    let endPlayerTurn = true
    for (let i = 0; i < this.playerArmy.soldiers.length; i++) {
      const soldier = this.playerArmy.soldiers[i]
      soldier.update(this.ctx);
      endPlayerTurn = endPlayerTurn && !soldier.isInTurn
    }

    let endAiTurn = true
    for (let i = 0; i < this.aiArmy.soldiers.length; i++) {
      const soldier = this.aiArmy.soldiers[i];
      soldier.update(this.ctx)
      endAiTurn = endAiTurn && !soldier.isInTurn
    }
    const aiTurn = this.state.get('aiTurn')
    if (endPlayerTurn && !this.state.get('playerTurn') && !aiTurn) {
      this.startAiTurn()
    } else if (aiTurn && endAiTurn) {
      this.endAiTurn()
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
        const i = getIndex(x, y, this.cellsPerRow);
        const x2 = x * MAP_CELL_SIZE
        const y2 = y * MAP_CELL_SIZE
        const { flag } = this.map.cells[i]


        switch (flag) {
          case 'isInSoldierReach':
            this.ctx.fillStyle = '#f004'
            this.ctx.fillRect(x2, y2, MAP_CELL_SIZE, MAP_CELL_SIZE)
            break;
          case 'isSoldier':
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
            if (startedBattle && cell.currentUnit?.team === 'player') {
              this.setMoveFlags(cell.position.x, cell.position.y, cell.currentUnit.getRange())
            } else {
              this.clearMoveFlags()
            }

          }
        } else if (e.button === 2 && selectedCell?.currentUnit && startedBattle) {
          const soldier = selectedCell.currentUnit

          const targetNode = this.aStarNodes[getIndexPos(soldier.targetCellPos, this.cellsPerRow)]
          targetNode.isObstacle = false
          if (selectedCell === cell && cell.currentUnit) {
            cell.currentUnit.path = []
            this.aStarNodes[getIndexPos(selectedCell.position, this.cellsPerRow)].isObstacle = true
          } else if (cell.flag) {
            const start = this.aStarNodes[getIndexPos(selectedCell.position, this.cellsPerRow)]
            const endIndex = getIndexPos(cell.position, this.cellsPerRow)
            const end = this.aStarNodes[endIndex]
            const isEndObstacle = end.isObstacle

            const isAttacking = cell.currentUnit
              && cell.currentUnit.team === 'ai'
              && cell.currentUnit.health !== 'dead'

            if (isAttacking && soldier.health === 'healthy') {
              end.isObstacle = false
            }


            if (!end.isObstacle) {
              const path = findPath(start, end)
              restoreAStarNodes(this.aStarNodes)

              end.isObstacle = isEndObstacle
              if (path && path.length <= soldier.getRange()) {
                let endPos = cell.position
                if (isAttacking) {
                  path.shift()
                  endPos = path[0]
                  soldier.attack = cell
                  if (!endPos) {
                    endPos = soldier.targetCellPos
                    targetNode.isObstacle = true
                  }
                }
                soldier.path = path

                this.aStarNodes[getIndexPos(cell.position, this.cellsPerRow)].isObstacle = true

                soldier.targetCellPos = { ...endPos }
              }
            } else {
              targetNode.isObstacle = true
            }
          } else {
            targetNode.isObstacle = true
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
    const startIndex = getIndex(startX, startY, this.cellsPerRow);
    const endX = clamp(x + dist, this.cellsPerRow - 1, 0)
    const endY = clamp(y + dist, this.cellsPerRow - 1, 0)
    const endIndex = getIndex(endX, endY, this.cellsPerRow)
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
        cell.flag = 'isInSoldierReach'
        if (i === getIndex(x, y, this.cellsPerRow)) {
          cell.flag = 'isSoldier'
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

  private soldierAttack(soldier: Soldier) {
    const enemyCell = soldier.attack
    if (enemyCell) {
      const enemy = enemyCell.currentUnit
      if (enemy) {
        if (Math.random() > 0.5) {
          enemy.health = Math.random() > 0.5 ? 'dead' : 'wounded'
        } else {
          soldier.health = Math.random() > 0.5 ? 'dead' : 'wounded'
        }
      }
      soldier.attack = undefined
    }
  }

  private soldierLoop(func: (soldier: Soldier) => void) {
    for (let i = 0; i < this.playerArmy.soldiers.length; i++) {
      func(this.playerArmy.soldiers[i])
    }
  }
  private aiSoldierLoop(func: (aiSoldier: Soldier) => void) {
    for (let i = 0; i < this.aiArmy.soldiers.length; i++) {
      func(this.aiArmy.soldiers[i])
    }
  }

  endTurn() {
    this.state.set('playerTurn', false)
    this.soldierLoop((soldier) => soldier.isInTurn = true)
    this.clearMoveFlags()
    this.state.set('selectedMapCell', null)
  }

  private async startAiTurn() {

    this.soldierLoop((soldier) => this.soldierAttack(soldier))

    this.state.set('aiTurn', true)

    this.aiSoldierLoop((aiSoldier) => {
      if (aiSoldier.health !== 'dead') {

        const closet = {
          dist: Infinity,
          soldier: undefined as undefined | Soldier
        }

        this.soldierLoop((soldier) => {
          const dist = distance(soldier.x, soldier.x, aiSoldier.x, aiSoldier.y)
          if (dist <= closet.dist && soldier.health !== 'dead') {
            closet.dist = dist
            closet.soldier = soldier
          }
        })

        const solider = closet.soldier
        if (solider) {
          const aiPos = aiSoldier.currentCell?.position
          const soldierPos = solider.currentCell?.position
          if (aiPos && soldierPos) {

            const startNode = this.aStarNodes[getIndexPos(aiPos, this.cellsPerRow)]
            const endNode = this.aStarNodes[getIndexPos(soldierPos, this.cellsPerRow)]
            endNode.isObstacle = false
            const path = findPath(startNode, endNode)
            endNode.isObstacle = true
            restoreAStarNodes(this.aStarNodes)
            if (path) {
              aiSoldier.isInTurn = true
              if (path.length <= aiSoldier.getRange()) {
                const attack = path.shift()
                if (attack && aiSoldier.health === 'healthy') {
                  aiSoldier.attack = this.map.cells[getIndexPos(attack, this.cellsPerRow)]
                }
                aiSoldier.path = path

              } else {
                const start = path.length - aiSoldier.getRange()
                aiSoldier.path = path.slice(start)
              }


              const lastPos = aiSoldier.path[0]
              if (lastPos) {
                this.aStarNodes[getIndexPos(lastPos, this.cellsPerRow)].isObstacle = true
              }
            }
          }
        }
      }
    })

  }

  checkDefeat(army: Army, func?: (soldier: Soldier) => void) {
    let defeat = true
    const f = func || (() => undefined);
    army.soldiers.forEach((soldier) => {
      f(soldier)
      if (soldier.health === 'healthy') {
        defeat = false
      }
    })
    return defeat
  }

  private endAiTurn() {
    const aiDefat = this.checkDefeat(this.aiArmy, (aiSoldier) => this.soldierAttack(aiSoldier))
    const playerDefat = this.checkDefeat(this.playerArmy)


    if (aiDefat) {
      console.log('PLAYER VICTORY')
    }
    if (playerDefat) {
      console.log('PLAYER DEFEAT')
    }

    this.state.set('playerTurn', true)
    this.state.set('aiTurn', false)
  }
}