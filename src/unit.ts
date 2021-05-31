import { MAP_CELLS_PER_ROW, MAP_CELL_SIZE } from './globalConstants'
import { Position } from './interfaces'
import { angleTo, distance, floor } from './utils'
import { Map, MapCell } from './map'
import { addAStarNodeNeighbors, AStarNode, createAStartNode, findPath, restoreAStarNodes, restoreAStarNodesClearObstacle } from './aStar';
import { CanvasViewer } from './canvasViewer';

type AStartCellNodes = [AStarNode, AStarNode, AStarNode, AStarNode, AStarNode, AStarNode, AStarNode, AStarNode, AStarNode];

export class Unit {
  x: number;
  y: number;
  target: Position
  path: Position[] = []
  subCellPath: Position[] = []
  endTarget: Position
  selected = false
  static cellAStarNodeRows = 3
  static cellAStarNodes: AStartCellNodes = Unit.createCellNodes()
  private static subCellSize = MAP_CELL_SIZE / 2
  private static m = MAP_CELL_SIZE / 2

  currentSubCellPos: Position = { x: 1, y: 1 }

  constructor(private map: Map, public currentCell: MapCell, public speed = 0.4) {
    currentCell.currentUnits.push(this)
    this.x = currentCell.position.x * MAP_CELL_SIZE + Unit.m
    this.y = currentCell.position.y * MAP_CELL_SIZE + Unit.m
    this.target = { x: this.x, y: this.y }
    this.endTarget = { x: this.x, y: this.y }
  }
  draw(ctx: CanvasRenderingContext2D) {

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
    ctx.fillStyle = '#fff'
    if (this.selected) {
      ctx.strokeStyle = '#0af'
      ctx.beginPath();
      ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
      // ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f00'
      ctx.beginPath();
      ctx.arc(this.target.x, this.target.y, 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = '#f0f'
      ctx.beginPath();
      ctx.arc(this.endTarget.x, this.endTarget.y, 5, 0, 2 * Math.PI);
      ctx.stroke();

      for (let i = 0; i < this.path.length; i++) {
        const path = this.path[i];
        ctx.beginPath();
        ctx.arc(path.x * MAP_CELL_SIZE + Unit.m, path.y * MAP_CELL_SIZE + Unit.m, 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = '#f0f'
      const x = this.currentCell.position.x;
      const y = this.currentCell.position.y;
      for (let i = 0; i < this.subCellPath.length; i++) {
        const path = this.subCellPath[i];
        ctx.beginPath();
        ctx.arc((x * MAP_CELL_SIZE) + path.x * Unit.subCellSize, (y * MAP_CELL_SIZE) + path.y * Unit.subCellSize, 3, 0, 3 * Math.PI);
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
      ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
      ctx.stroke();
      // ctx.fill();
    }
  }
  moveToNewTarget(newPath = false) {
    if (newPath && this.path.length > 0) {
      const { subCellPath } = this.computeCellPath(this.currentCell.position.x, this.currentCell.position.y);
      if (subCellPath) {

        this.subCellPath.length = 0
        this.subCellPath.push(...subCellPath)
      }
    }

    const newSubTarget = this.subCellPath.pop()
    if (newSubTarget) {
      const x = this.currentCell.position.x;
      const y = this.currentCell.position.y;
      this.target.x = x * MAP_CELL_SIZE + (newSubTarget.x * Unit.subCellSize)
      this.target.y = y * MAP_CELL_SIZE + (newSubTarget.y * Unit.subCellSize)
      this.currentSubCellPos.x = newSubTarget.x
      this.currentSubCellPos.y = newSubTarget.y
    } else {

      const newTarget = this.path.pop()
      if (newTarget) {
        const x23 = (this.currentCell.position.x + 1) - newTarget.x;
        const y23 = (this.currentCell.position.y + 1) - newTarget.y;

        this.currentSubCellPos.x = x23
        this.currentSubCellPos.y = y23
        const { cell, subCellPath } = this.computeCellPath(newTarget.x, newTarget.y);
        if (subCellPath) {
          this.subCellPath.length = 0
          this.subCellPath.push(...subCellPath)

          const newSubTarget = this.subCellPath.pop()
          cell.currentUnits.filter((u) => u !== this)
          this.currentCell = cell;
          this.currentCell.currentUnits.push(this)

          if (newSubTarget) {
            const x = this.currentCell.position.x;
            const y = this.currentCell.position.y;
            this.target.x = x * MAP_CELL_SIZE + (newSubTarget.x * Unit.subCellSize)
            this.target.y = y * MAP_CELL_SIZE + (newSubTarget.y * Unit.subCellSize)
            this.currentSubCellPos.x = newSubTarget.x
            this.currentSubCellPos.y = newSubTarget.y
          }
        }
      }
    }
  }

  computeCellPath(x: number, y: number) {

    const a = this.path[this.path.length - 1]
    const cell = this.map.cells[x + MAP_CELLS_PER_ROW * y]
    let xEnd = 0
    let yEnd = 0
    if (!a) {
      const x = ((this.endTarget.x) - (cell.position.x * MAP_CELL_SIZE))
      const y = ((this.endTarget.y) - (cell.position.y * MAP_CELL_SIZE))
      const x2 = floor((x + Unit.subCellSize / 2) / Unit.subCellSize)
      const y2 = floor((y + Unit.subCellSize / 2) / Unit.subCellSize)
      xEnd = x2
      yEnd = y2
      console.log(x, y, x2, y2, (cell.position.x * MAP_CELL_SIZE), this.endTarget.x)
    } else {
      xEnd = a.x - x + 1
      yEnd = a.y - y + 1
    }


    const startIndex = this.currentSubCellPos.x + Unit.cellAStarNodeRows * this.currentSubCellPos.y;
    const endIndex = xEnd + Unit.cellAStarNodeRows * yEnd;
    const startCell = Unit.cellAStarNodes[startIndex]
    const endCell = Unit.cellAStarNodes[endIndex]

    for (let i = 0; i < cell.currentUnits.length; i++) {
      const unit = cell.currentUnits[i];
      const x = unit.currentSubCellPos.x
      const y = unit.currentSubCellPos.y
      const obstacleIndex = x + Unit.cellAStarNodeRows * y
      Unit.cellAStarNodes[obstacleIndex].isObstacle = true
    }


    const subCellPath: false | Position[] = findPath(startCell, endCell)
    restoreAStarNodesClearObstacle(Unit.cellAStarNodes)



    return { cell, subCellPath }
  }

  private static createCellNodes(): AStartCellNodes {
    const nodes: AStartCellNodes = [
      createAStartNode(0, 0, false), createAStartNode(1, 0, false), createAStartNode(2, 0, false),
      createAStartNode(0, 1, false), createAStartNode(1, 1, false), createAStartNode(2, 1, false),
      createAStartNode(0, 2, false), createAStartNode(1, 2, false), createAStartNode(2, 2, false),
    ]

    for (let i = 0; i < nodes.length; i++) {
      addAStarNodeNeighbors(i, Unit.cellAStarNodeRows, nodes, nodes[i])
    }

    return nodes
  }
}