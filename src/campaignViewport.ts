import { findPath, restoreAStarNodes } from './aStar';
import { CanvasCache } from './canvas/canvasCache';

import { MAP_CELL_SIZE, MAP_MOVE_FACTOR, MAP_PADDING, ZOOM_SCALE_FACTOR, ZOOM_MAX_SCALE, UI_BOTTOM_HEIGHT, UI_TOP_HEIGHT } from './globalConstants';
import { Position } from './interfaces';
import { render } from './render';

import { floor, getIndex, toPx } from './utils';
import { Viewport } from './canvas/viewport';
import { Campaign, SelectionMode } from './campaign';
import { renderBuilding } from './buildingRender';

export class CampaignViewport extends Viewport {

  private showHover = false
  private selectionEnd: Position = { x: 0, y: 0 };
  private selectionStart: Position | null = null;
  public mapTextureCanvas = new CanvasCache(this.game.mapSize, 'Map Texture Canvas')
  public buildingTextureCanvas = new CanvasCache(this.game.mapSize, 'Building Texture Canvas')

  private getViewportHeight = () => window.innerHeight - (UI_TOP_HEIGHT + UI_BOTTOM_HEIGHT)
  private getViewportWidth = () => window.innerWidth

  selectionDrag = false

  constructor(private game: Campaign) {
    super('Campaign Viewport Canvas', {
      getMaxXPos: (scale: number) => this.getViewportWidth() - (this.game.mapSize * scale) - MAP_PADDING,
      getMaxYPos: (scale: number) => this.getViewportHeight() - (this.game.mapSize * scale) - MAP_PADDING,
      moveFactor: MAP_MOVE_FACTOR,
      boundaryPadding: MAP_PADDING,
      zoomMaxScale: ZOOM_MAX_SCALE,
      zoomScaleFactor: ZOOM_SCALE_FACTOR
    })

    this.setBounds({
      bottom: this.game.mapSize - (this.game.mapSize / 2),
      right: this.game.mapSize - (this.game.mapSize / 2),
      left: 0,
      top: 0
    })
    game.main.appendChild(this.canvas)
    this.canvas.className = 'map';
  }

  public async start() {
    this.setEvents({
      mouseleave: this.mouseleave,
      mousedown: this.mousedown,
      mousemove: this.mousemove,
      mouseup: this.mouseup,
      resize: this.resize
    })
    // don't change the order of the function calls.
    this.resize()
    await render(this.mapTextureCanvas, this.game.map.cells, this.game.cellsPerRow, async (i, x, y) => {
      const cell = this.game.map.cells[i]
      if (cell.building) {
        this.buildingTextureCanvas.ctx.drawImage(await renderBuilding(cell.building), x, y, MAP_CELL_SIZE, MAP_CELL_SIZE)
      }
    })

    this.ctx.translate((-this.game.mapSize + this.canvas.width) / 2, (-this.game.mapSize + this.canvas.height) / 2)
  }


  public update(delta: number, mode: SelectionMode) {
    this.updateView(delta);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0);
    this.ctx.drawImage(this.buildingTextureCanvas.canvas, 0, 0);
    if (this.selectionStart) {
      this.ctx.strokeStyle = '#0af'
      this.ctx.strokeRect(this.selectionStart.x, this.selectionStart.y, this.selectionEnd.x, this.selectionEnd.y)
    }
    if (mode === 'building') {
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

      const selectedPos = this.game.state.get('selectedMapCell')
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
    }
  }

  private resize = () => {
    this.canvas.width = this.getViewportWidth();
    this.canvas.height = this.getViewportHeight();
    this.canvas.style.top = toPx(UI_TOP_HEIGHT);
    this.canvas.style.bottom = toPx(UI_BOTTOM_HEIGHT);
  }

  private mousemove = (e: MouseEvent) => {

    if (this.canDrag) {
      this.showHover = false
    } else if (this.selectionDrag) {

      if (this.selectionStart) {
        const { x: x2, y: y2 } = this.ctx.transformedPoint(this.lastX, this.lastY)
        this.selectionEnd.x = x2 - this.selectionStart.x
        this.selectionEnd.y = y2 - this.selectionStart.y

        for (let i = 0; i < this.game.armies.length; i++) {
          const unit = this.game.armies[i];
          const isxInverted = this.selectionEnd.x < 0
          const isyInverted = this.selectionEnd.y < 0
          const x = isxInverted ? this.selectionStart.x + this.selectionEnd.x : this.selectionStart.x
          const xEnd = isxInverted ? this.selectionStart.x : this.selectionStart.x + this.selectionEnd.x
          const y = isyInverted ? this.selectionStart.y + this.selectionEnd.y : this.selectionStart.y
          const yEnd = isyInverted ? this.selectionStart.y : this.selectionStart.y + this.selectionEnd.y

          if (unit.x > x && unit.x < xEnd && unit.y > y && unit.y < yEnd) {
            unit.selected = true
          } else {
            unit.selected = false
          }
        }
      } else {
        const { x: x2, y: y2 } = this.ctx.transformedPoint(this.lastX, this.lastY)
        this.selectionStart = { x: x2, y: y2 }
        this.selectionEnd.x = 0
        this.selectionEnd.y = 0
        this.game.mode = 'unit'
        this.showHover = false
        this.game.state.set('selectedMapCell', null)
      }
    } else {
      this.showHover = true
    }
  }

  private mouseleave = () => {
    this.showHover = false
  }
  private mouseup = (e: MouseEvent) => {
    if (e.button === 0 && !this.selectionStart) {
      const transform = this.ctx.getTransform()
      const x = floor((e.offsetX - transform.e) / transform.a)
      const y = floor((e.offsetY - transform.f) / transform.d)
      const x2 = floor(x / MAP_CELL_SIZE)
      const y2 = floor(y / MAP_CELL_SIZE)
      let selectUnit = false
      const cellIndex = x2 + this.game.cellsPerRow * y2
      const cell = this.game.map.cells[cellIndex];
      for (let i = 0; i < this.game.armies.length; i++) {
        const army = this.game.armies[i];
        if (cell.currentUnit === army) {
          selectUnit = true
          army.selected = true
        } else {
          army.selected = false
        }
      }

      if (selectUnit) {
        this.game.mode = 'unit'
        this.game.state.set('selectedMapCell', null)
      } else {
        this.game.mode = 'building'
        if (x >= 0 && x < this.game.mapSize && y >= 0 && y < this.game.mapSize) {
          const index = x2 + this.game.cellsPerRow * y2;
          this.game.state.set('selectedMapCell', this.game.map.cells[index])
        }
      }
    }

    this.showHover = true
    this.selectionDrag = false
    this.selectionStart = null
  }


  private mousedown = (e: MouseEvent) => {
    const x = e.offsetX || (e.pageX - this.canvas.offsetLeft);
    const y = e.offsetY || (e.pageY - this.canvas.offsetTop);
    this.canDrag = false
    if (e.button === 2) {
      if (this.moveUnits(x, y)) {
        this.game.mode = 'unit'
        this.game.state.set('selectedMapCell', null)
      }
    } else if (e.button === 0) {
      this.selectionDrag = true
    }
    else {
      this.canDrag = true
    }
  }

  private moveUnits(x: number, y: number) {
    const { x: x2, y: y2 } = this.ctx.transformedPoint(x, y);
    let movedUnit = false;

    for (let i = 0; i < this.game.armies.length; i++) {
      const army = this.game.armies[i];
      if (army.selected) {
        const targetX = x2;
        const targetY = y2;
        const targetXCell = floor(targetX / MAP_CELL_SIZE);
        const targetYCell = floor(targetY / MAP_CELL_SIZE);
        const endIndex = targetXCell + this.game.cellsPerRow * targetYCell;
        const endNode = this.game.aStarNodes[endIndex];
        if (!endNode.isObstacle) {
          const startIndex = floor(army.x / MAP_CELL_SIZE) + this.game.cellsPerRow * floor(army.y / MAP_CELL_SIZE);
          if (startIndex !== endIndex) {

            const oldTargetX = floor(army.target.x / MAP_CELL_SIZE)
            const oldTargetY = floor(army.target.y / MAP_CELL_SIZE)
            const i = getIndex(oldTargetX, oldTargetY, this.game.cellsPerRow)
            this.game.aStarNodes[i].isObstacle = false

            const path = findPath(this.game.aStarNodes[startIndex], endNode);
            if (path) {
              army.path.length = 0
              army.path.push(...path);
              army.targetCellPos.x = targetXCell;
              army.targetCellPos.y = targetYCell;
              army.moveToNewTarget()
            }
          }
          movedUnit = true;
          restoreAStarNodes(this.game.aStarNodes);

        }
      }
    }

    return movedUnit;
  }

}

