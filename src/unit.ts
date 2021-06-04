import { MAP_CELLS_PER_ROW, MAP_CELL_SIZE } from './globalConstants'
import { Position } from './interfaces'
import { angleTo, distance, floor } from './utils'
import { Map, MapCell } from './map'
import { addAStarNodeNeighbors, AStarNode, createAStartNode, findPath, restoreAStarNodes, restoreAStarNodesClearObstacle } from './aStar';
import { CanvasViewer } from './canvasViewer';

type AStartCellNodes = AStarNode[];

export interface UnitSave {
  x: number;
  y: number;
  target: Position
  path: Position[]
  subCellPath: Position[]
  endTarget: Position
  currentSubCellPos: Position
  cellPosition: Position
  speed: number
}
export class Unit {
  x: number;
  y: number;
  target: Position
  path: Position[] = []
  subCellPath: Position[] = []
  endTarget: Position
  selected = false
  currentSubCellPos: Position = { x: 2, y: 2 }

  static cellAStarNodeRows = 5
  static cellAStarNodes: AStartCellNodes = Unit.createCellNodes()
  static subCellSize = MAP_CELL_SIZE / 3
  static subCellHalfSize = Unit.subCellSize / 2
  static subCellQuarterSize = floor(Unit.subCellHalfSize / 2)
  static newTarget(a: number, a2: number): number {
    return (a * MAP_CELL_SIZE) + (a2 * Unit.subCellSize) - Unit.subCellHalfSize;
  }

  private static m = MAP_CELL_SIZE / 2
  private currentCell: MapCell;
  constructor(private map: Map, cellPosition: Position, public speed = 0.4) {
    const cell = map.cells[cellPosition.x + MAP_CELLS_PER_ROW * cellPosition.y]
    cell.currentUnits.push(this)
    this.x = cell.position.x * MAP_CELL_SIZE + Unit.m
    this.y = cell.position.y * MAP_CELL_SIZE + Unit.m
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
    ctx.fillStyle = '#fff'
    if (this.selected) {
      ctx.strokeStyle = '#0af'
      ctx.beginPath();
      ctx.arc(this.x, this.y, 6, 0, 2 * Math.PI);
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
        ctx.arc(Unit.newTarget(x, path.x), Unit.newTarget(y, path.y), 3, 0, 3 * Math.PI);
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
      // ctx.fill();
    }
  }
  moveToNewTarget(newPath = false) {
    if (newPath) {
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
      this.target.x = Unit.newTarget(x, newSubTarget.x)
      this.target.y = Unit.newTarget(y, newSubTarget.y)
      this.currentSubCellPos.x = newSubTarget.x
      this.currentSubCellPos.y = newSubTarget.y
    } else {

      const newTarget = this.path.pop()
      if (newTarget) {
        const x23 = ((this.currentCell.position.x + 1) - newTarget.x) + 1;
        const y23 = ((this.currentCell.position.y + 1) - newTarget.y) + 1;
        console.log('23', x23, y23)
        this.currentSubCellPos.x = x23
        this.currentSubCellPos.y = y23
        const { cell, subCellPath } = this.computeCellPath(newTarget.x, newTarget.y);
        if (subCellPath) {
          this.subCellPath.length = 0
          this.subCellPath.push(...subCellPath)

          const newSubTarget = this.subCellPath.pop()
          this.currentCell.currentUnits = this.currentCell.currentUnits.filter((u) => u !== this)
          this.currentCell = cell;
          this.currentCell.currentUnits.push(this)

          if (newSubTarget) {
            const x = this.currentCell.position.x;
            const y = this.currentCell.position.y;
            this.target.x = Unit.newTarget(x, newSubTarget.x)
            this.target.y = Unit.newTarget(y, newSubTarget.y)
            this.currentSubCellPos.x = newSubTarget.x
            this.currentSubCellPos.y = newSubTarget.y
          }
        }
      }
    }
  }


  private computeCellPath(x: number, y: number) {

    const a = this.path[this.path.length - 1]
    const cell = this.map.cells[x + MAP_CELLS_PER_ROW * y]
    let xEnd = 0
    let yEnd = 0
    if (a) {
      const x = ((a.x) - (cell.position.x)) + 1
      const y = ((a.y) - (cell.position.y)) + 1

      const x2 = floor(x)
      const y2 = floor(y)
      xEnd = x2
      yEnd = y2
      console.log('S', x, y, x2, y2, (cell.position.x * MAP_CELL_SIZE), this.endTarget.x)
    } else {
      const x = ((this.endTarget.x) - (cell.position.x * MAP_CELL_SIZE))
      const y = ((this.endTarget.y) - (cell.position.y * MAP_CELL_SIZE))
      const x2 = floor(x / (Unit.subCellSize)) + 1
      const y2 = floor(y / (Unit.subCellSize)) + 1
      xEnd = x2
      yEnd = y2
      console.log(x, y, x2, y2, (cell.position.x * MAP_CELL_SIZE), this.endTarget.x)
    }


    const startIndex = this.currentSubCellPos.x + Unit.cellAStarNodeRows * this.currentSubCellPos.y;
    const endIndex = xEnd + Unit.cellAStarNodeRows * yEnd;
    console.log('START0', startIndex, endIndex)
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

    if (subCellPath) {
      subCellPath.push({ x: this.currentSubCellPos.x, y: this.currentSubCellPos.y })
    }


    return { cell, subCellPath }
  }

  private static createCellNodes(): AStartCellNodes {
    const nodes: AStartCellNodes = []
    // const nodes: AStartCellNodes = [
    //   createAStartNode(0, 0, false), createAStartNode(1, 0, false),

    //   createAStartNode(0, 1, false), createAStartNode(1, 1, false),
    // ]
    const size = Unit.cellAStarNodeRows * Unit.cellAStarNodeRows
    for (let i = 0; i < size; i++) {
      const x = (i % Unit.cellAStarNodeRows)
      const y = floor((i / Unit.cellAStarNodeRows))
      const node = createAStartNode(x, y, false)
      nodes.push(node)
      addAStarNodeNeighbors(i, Unit.cellAStarNodeRows, nodes, node)
    }

    return nodes
  }

  public save(): UnitSave {
    return {
      speed: this.speed,
      x: this.x,
      y: this.y,
      cellPosition: this.currentCell.position,
      currentSubCellPos: this.currentSubCellPos,
      endTarget: this.endTarget,
      path: this.path,
      subCellPath: this.subCellPath,
      target: this.target
    }
  }
  public applySave(save: UnitSave) {
    this.speed = save.speed
    this.x = save.x
    this.y = save.y
    this.currentSubCellPos = save.currentSubCellPos
    this.endTarget = save.endTarget
    this.path = save.path
    this.subCellPath = save.subCellPath
    this.target = save.target
  }
}