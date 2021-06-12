import { CanvasCache } from './canvas/canvasCache'
import { Viewport } from './canvas/viewport'
import { MAP_PADDING, MAP_MOVE_FACTOR, ZOOM_SCALE_FACTOR, MAP_CELL_SIZE, UI_BOTTOM_HEIGHT, UI_TOP_HEIGHT, MAP_CELLS_PER_ROW } from './globalConstants'
import { MapCell } from './map'
import { generateBattleModeMap } from './mapGenerator'
import { Minimap } from './minimap'
import { render } from './render'
import { BattlemodeState, State } from './state'
import { InitBattlemodeUI } from './ui/battlemodeUI'
import { floor, toPx } from './utils'



export interface BattlemodeCell extends MapCell { }
export class Battlemode extends Viewport {
  private cellRows = 32
  main = document.createElement('main')
  mapSize = this.cellRows * MAP_CELL_SIZE
  minimap = new Minimap(this.main, UI_BOTTOM_HEIGHT, this.mapSize, (ctx) => {
    ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0, UI_BOTTOM_HEIGHT, UI_BOTTOM_HEIGHT)
  })

  showHover = false
  public mapTextureCanvas = new CanvasCache(this.mapSize, 'Map Texture Canvas 2')

  private getViewportHeight = () => window.innerHeight - (UI_TOP_HEIGHT + UI_BOTTOM_HEIGHT)
  private getViewportWidth = () => window.innerWidth

  private map = generateBattleModeMap(this.cellRows, this.seed)

  state = new State<BattlemodeState>({ selectedMapCell: null })
  constructor(private seed = 0) {
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
    window.addEventListener('resize', this.resize);
    this.start()


  }

  async start() {
    this.resize()
    this.setEvents({
      mouseleave: this.mouseleave,
      mousedown: this.mousedown,
      mousemove: this.mousemove,
      mouseup: this.mouseup,
    })
    InitBattlemodeUI(this)
    this.update(0)
    await render(this.mapTextureCanvas, this.map.cells, this.cellRows)
  }

  private resize = () => {
    this.canvas.width = this.getViewportWidth();
    this.canvas.height = this.getViewportHeight();
    this.canvas.style.top = toPx(UI_TOP_HEIGHT);
    this.canvas.style.bottom = toPx(UI_BOTTOM_HEIGHT);
    this._resize()
  }

  public update = (delta: number) => {
    this.updateView(delta);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0);

    const { x: xStart, y: yStart } = this.ctx.transformedPoint(0, 0);
    const { x: xEnd, y: yEnd } = this.ctx.transformedPoint(this.canvas.width, this.canvas.height);

    this.minimap.draw(xStart, yStart, xEnd, yEnd)

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


    requestAnimationFrame(this.update)
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
    if (e.button === 0) {
      const transform = this.ctx.getTransform()
      const x = floor((e.offsetX - transform.e) / transform.a)
      const y = floor((e.offsetY - transform.f) / transform.d)
      const x2 = floor(x / MAP_CELL_SIZE)
      const y2 = floor(y / MAP_CELL_SIZE)
      if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
        const index = x2 + MAP_CELLS_PER_ROW * y2;
        this.state.set('selectedMapCell', this.map.cells[index])
      }
    }
    this.showHover = true
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

}