import { MAP_CELL_SIZE } from './globalConstants'
import { Position } from './interfaces'
import { angleTo, distance } from './utils'

import { AStarNode, findPath } from './aStar';
import { GameMap, MapCell } from './map';

export interface UnitSave {
  x: number;
  y: number;
  target: Position
  path: Position[]
  targetCellPos: Position
  cellPosition?: Position
  speed: number,
  canMove: boolean
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
  public canMove: boolean

  protected avoidOtherUnits = true
  public selected = false
  reachedDestination = false

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
      const index = cellPos.x + this.game.cellsPerRow * cellPos.y;
      const cell = game.map.cells[index]
      cell.currentUnit = this
      game.aStarNodes[index].isObstacle = true
      this.x = cell.position.x * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
      this.y = cell.position.y * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
      this.currentCell = cell
      this.targetCellPos = { ...cell.position }
    }

    if (save) {
      this.speed = save.speed
      this.x = save.x
      this.y = save.y
      this.targetCellPos = save.targetCellPos
      this.path = save.path
      this.target = save.target
      this.canMove = save.canMove
    } else {
      this.canMove = true
      this.path = []
      this.x = 0
      this.y = 0
      this.targetCellPos = { x: 0, y: 0 }
    }


    this.target = { x: this.x, y: this.y }



  }
  update(ctx: CanvasRenderingContext2D) {

    if (this.canMove && !this.reachedDestination) {
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
    if (this.currentCell) {
      if (this.selected) {
        if (this.canMove) {

          ctx.fillStyle = '#ff6'
        } else {
          ctx.fillStyle = '#fff'

        }
        ctx.strokeStyle = '#0af'
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        // ctx.strokeStyle = '#f00'
        // ctx.beginPath();
        // ctx.arc(this.target.x, this.target.y, 5, 0, 2 * Math.PI);
        // ctx.stroke();
        // ctx.strokeStyle = '#f0f'
        // ctx.beginPath();
        // ctx.arc(this.endTarget.x, this.endTarget.y, 5, 0, 2 * Math.PI);
        // ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, 2, 0, 2 * Math.PI);
        ctx.fill();
        for (let i = 0; i < this.path.length; i++) {
          const path = this.path[i];
          ctx.beginPath();
          ctx.arc(path.x * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE, path.y * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE, 2, 0, 2 * Math.PI);
          ctx.fill();
        }


        // ctx.fillText(`x: ${movementX.toFixed(4)} y: ${movementY.toFixed(4)}  d: ${d.toFixed(4)}`, this.x, this.y)
        // ctx.fillText(`x: ${this.x.toFixed(4)} y: ${this.y.toFixed(4)}`, this.x, this.y + 20)
        // ctx.fillText(`x: ${this.target.x.toFixed(4)} y: ${this.target.y.toFixed(4)}`, this.x, this.y + 40)
        // ctx.fillText(`a: ${radToDeg(angle).toFixed(4)} `, this.x, this.y + 60)
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
  moveToNewTarget() {
    if (this.currentCell) {
      const newTarget = this.path.pop()
      if (newTarget) {
        const oldIndex = this.currentCell.position.x + this.game.cellsPerRow * this.currentCell.position.y;
        const newIndex = newTarget.x + this.game.cellsPerRow * newTarget.y;
        const nextCell = this.game.map.cells[newIndex]
        // TODO find out if this part is used or necessary.
        if (nextCell.currentUnit && this.avoidOtherUnits) {
          const targetXCell = this.targetCellPos.x;
          const targetYCell = this.targetCellPos.y;
          const endIndex = targetXCell + this.game.cellsPerRow * targetYCell
          const path = findPath(this.game.aStarNodes[oldIndex], this.game.aStarNodes[endIndex]);
          this.path.length = 0
          if (path) {
            this.path.push(...path);
            this.moveToNewTarget()
          }
        } else {
          const oldNode = this.game.aStarNodes[oldIndex]
          oldNode.isObstacle = false
          const newNode = this.game.aStarNodes[newIndex]
          newNode.isObstacle = true
          this.currentCell.currentUnit = undefined
          this.currentCell = nextCell
          nextCell.currentUnit = this
          this.target.x = newTarget.x * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
          this.target.y = newTarget.y * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
        }
        this.reachedDestination = false
        return
      }

    }
    this.reachedDestination = true
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
      canMove: this.canMove
    }
  }

}