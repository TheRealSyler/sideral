import { MAP_CELL_SIZE } from './globalConstants'
import { Position } from './interfaces'
import { angleTo, distance } from './utils'

export class Unit {

  target: Position = { x: this.x, y: this.y }
  path: Position[] | undefined
  endTarget: Position = { x: this.x, y: this.y }
  selected = false
  constructor(public x: number, public y: number, public speed = 2) { }
  private m = MAP_CELL_SIZE / 2
  draw(ctx: CanvasRenderingContext2D) {

    const angle = angleTo(this.x, this.y, this.target.x, this.target.y)
    const movementX = Math.sin(angle) * (this.speed)
    const movementY = Math.cos(angle) * (this.speed)
    const d = distance(this.x, this.y, this.target.x, this.target.y)

    if (d > 2) {
      this.x += movementX
      this.y += movementY
    } else if (this.path) {
      const newTarget = this.path.pop()
      if (newTarget) {
        this.target.x = newTarget.x * MAP_CELL_SIZE + this.m
        this.target.y = newTarget.y * MAP_CELL_SIZE + this.m
      } else {
        this.path = undefined
      }

    }
    ctx.fillStyle = '#fff'
    if (this.selected) {
      ctx.strokeStyle = '#0af'
      ctx.beginPath();
      ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f00'
      ctx.beginPath();
      ctx.arc(this.target.x, this.target.y, 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = '#f0f'
      ctx.beginPath();
      ctx.arc(this.endTarget.x, this.endTarget.y, 5, 0, 2 * Math.PI);
      ctx.stroke();
      if (this.path) {
        for (let i = 0; i < this.path.length; i++) {
          const path = this.path[i];
          ctx.beginPath();
          ctx.arc(path.x * MAP_CELL_SIZE + this.m, path.y * MAP_CELL_SIZE + this.m, 2, 0, 2 * Math.PI);
          ctx.fill();
        }

      }
      // ctx.fillText(`x: ${movementX.toFixed(4)} y: ${movementY.toFixed(4)}  d: ${d.toFixed(4)}`, this.x, this.y)
      // ctx.fillText(`x: ${this.x.toFixed(4)} y: ${this.y.toFixed(4)}`, this.x, this.y + 20)
      // ctx.fillText(`x: ${this.target.x.toFixed(4)} y: ${this.target.y.toFixed(4)}`, this.x, this.y + 40)
      // ctx.fillText(`a: ${radToDeg(angle).toFixed(4)} `, this.x, this.y + 60)
    } else {
      ctx.fillStyle = '#aaa'
      ctx.beginPath();
      ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
      ctx.fill();

    }

  }
}