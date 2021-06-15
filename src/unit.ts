import { MAP_CELL_SIZE } from './globalConstants'
import { Position } from './interfaces'
import { angleTo, distance, getIndexPos } from './utils'

import { AStarNode, findPath, restoreAStarNodes } from './aStar';
import { GameMap, MapCell } from './map';

export interface UnitSave {
  x: number;
  y: number;
  target: Position
  path: Position[]
  targetCellPos: Position
  cellPosition?: Position
  speed: number,
}

interface UnitCell extends MapCell {
  currentUnit?: Unit
}

type UnitGame = {
  map: GameMap<UnitCell>;
  aStarNodes: AStarNode[]
  cellsPerRow: number
};

export class Unit implements UnitSave {
  public x: number;
  public y: number;
  public target: Position
  public path: Position[]
  public targetCellPos: Position

  protected avoidOtherUnits = true
  public selected = false

  currentCell: UnitCell | undefined;

  private static readonly MAP_CELL_HALF_SIZE = (MAP_CELL_SIZE / 2);

  constructor(private game: UnitGame, cellPosition?: Position, save?: UnitSave, public speed = 1) {
    let cellPos: Position | undefined
    if (cellPosition) {
      cellPos = cellPosition
    } else {
      cellPos = save?.cellPosition
    }

    if (cellPos) {
      const index = getIndexPos(cellPos, this.game.cellsPerRow);
      const cell = game.map.cells[index]
      cell.currentUnit = this
      game.aStarNodes[index].isObstacle = true
      this.x = cell.position.x * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
      this.y = cell.position.y * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
      this.currentCell = cell
      this.targetCellPos = { ...cell.position }
    } else {
      this.x = 0
      this.y = 0
      this.targetCellPos = { x: 0, y: 0 }
    }
    this.path = []
    this.target = { x: this.x, y: this.y }

    if (save) {
      this.speed = save.speed
      this.x = save.x
      this.y = save.y
      this.targetCellPos = save.targetCellPos
      this.path = save.path
      this.target = save.target
    }

  }

  protected updatePosition() {
    const angle = angleTo(this.x, this.y, this.target.x, this.target.y)
    const d = distance(this.x, this.y, this.target.x, this.target.y)

    if (d > 2) {
      const movementX = Math.sin(angle) * (this.speed)
      const movementY = Math.cos(angle) * (this.speed)
      this.x += movementX
      this.y += movementY
    } else {
      this.moveToNewTarget();
    }
  }

  protected draw(ctx: CanvasRenderingContext2D, color = '#fff', rimColor = '#0af') {
    if (this.currentCell) {
      if (this.selected) {

        ctx.fillStyle = color

        ctx.strokeStyle = rimColor
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();


        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, 2, 0, 2 * Math.PI);
        ctx.fill();
        for (let i = 0; i < this.path.length; i++) {
          const path = this.path[i];
          ctx.beginPath();
          ctx.arc(path.x * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE, path.y * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE, 2, 0, 2 * Math.PI);
          ctx.fill();
        }

      } else {
        ctx.strokeStyle = '#000'
        ctx.fillStyle = '#aaaa'
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
      }
    }
  }

  update(ctx: CanvasRenderingContext2D) {
    this.updatePosition()
    this.draw(ctx)
  }

  /** returns true if there is a new target*/
  moveToNewTarget() {
    if (this.currentCell) {
      const newTarget = this.path.pop()
      if (newTarget) {
        const currentCellIndex = getIndexPos(this.currentCell.position, this.game.cellsPerRow)
        const newIndex = getIndexPos(newTarget, this.game.cellsPerRow);
        const nextCell = this.game.map.cells[newIndex]

        if (nextCell.currentUnit && this.avoidOtherUnits) {
          const endIndex = getIndexPos(this.targetCellPos, this.game.cellsPerRow)

          const path = findPath(this.game.aStarNodes[currentCellIndex], this.game.aStarNodes[endIndex]);
          restoreAStarNodes(this.game.aStarNodes)
          if (path) {
            this.path.length = 0
            this.path.push(...path);
            this.moveToNewTarget()
          }
        } else {
          const oldNode = this.game.aStarNodes[currentCellIndex]
          oldNode.isObstacle = false
          const newNode = this.game.aStarNodes[newIndex]
          newNode.isObstacle = true
          this.currentCell.currentUnit = undefined
          this.currentCell = nextCell
          nextCell.currentUnit = this
          this.target.x = newTarget.x * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
          this.target.y = newTarget.y * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
        }

        return true
      }
    }
  }

  public save(): UnitSave {
    return {
      speed: this.speed,
      x: this.x,
      y: this.y,
      cellPosition: this.currentCell?.position,
      targetCellPos: this.targetCellPos,
      path: this.path,
      target: this.target,
    }
  }

}