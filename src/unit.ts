import { MAP_CELLS_PER_ROW, MAP_CELL_SIZE } from './globalConstants'
import { Position } from './interfaces'
import { angleTo, distance, floor } from './utils'
import { MapCell } from './map'

import { Game } from './game';
import { findPath } from './aStar';
import { CampaignCell, Campaign } from './campaign';

export interface UnitSave {
  x: number;
  y: number;
  target: Position
  path: Position[]
  endTarget: Position
  cellPosition: Position
  speed: number,
}


export class Unit {
  public x: number;
  public y: number;
  public target: Position
  public path: Position[] = []
  public endTarget: Position
  public selected = false

  currentCell: CampaignCell;

  private static readonly MAP_CELL_HALF_SIZE = (MAP_CELL_SIZE / 2);

  constructor(private game: Campaign, cellPosition: Position, public speed = 0.4) {
    const index = cellPosition.x + MAP_CELLS_PER_ROW * cellPosition.y;
    const cell = game.map.cells[index]

    cell.currentUnit = this
    game.aStarNodes[index].isObstacle = true
    this.x = cell.position.x * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
    this.y = cell.position.y * MAP_CELL_SIZE + Unit.MAP_CELL_HALF_SIZE
    this.target = { x: this.x, y: this.y }
    this.endTarget = { x: this.x, y: this.y }
    this.currentCell = cell
  }
  update(ctx: CanvasRenderingContext2D) {

    const angle = angleTo(this.x, this.y, this.target.x, this.target.y)
    const movementX = Math.sin(angle) * (this.speed)
    const movementY = Math.cos(angle) * (this.speed)
    const d = distance(this.x, this.y, this.target.x, this.target.y)

    if (d > 2) {
      this.x += movementX
      this.y += movementY
    } else {
      this.moveToNewTarget();
    }
    if (this.selected) {
      ctx.fillStyle = '#fff'
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
  moveToNewTarget() {
    const newTarget = this.path.pop()
    if (newTarget) {
      const oldIndex = this.currentCell.position.x + MAP_CELLS_PER_ROW * this.currentCell.position.y;
      const newIndex = newTarget.x + MAP_CELLS_PER_ROW * newTarget.y;
      const nextCell = this.game.map.cells[newIndex]
      if (nextCell.currentUnit) {
        const targetXCell = floor(this.endTarget.x / MAP_CELL_SIZE);
        const targetYCell = floor(this.endTarget.y / MAP_CELL_SIZE);
        const endIndex = targetXCell + MAP_CELLS_PER_ROW * targetYCell
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
    }
  }

  public save(): UnitSave {
    return {
      speed: this.speed,
      x: this.x,
      y: this.y,
      cellPosition: this.currentCell.position,
      endTarget: this.endTarget,
      path: this.path,
      target: this.target,
    }
  }
  public applySave(save: UnitSave) {
    this.speed = save.speed
    this.x = save.x
    this.y = save.y
    this.endTarget = save.endTarget
    this.path = save.path
    this.target = save.target
  }
}