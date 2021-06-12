import { CanvasCache } from './canvas/canvasCache'
import { Viewport } from './canvas/viewport'
import { MAP_PADDING, MAP_MOVE_FACTOR, ZOOM_SCALE_FACTOR, MAP_CELL_SIZE, UI_BOTTOM_HEIGHT, UI_TOP_HEIGHT } from './globalConstants'
import { generateBattleModeMap } from './mapGenerator'
import { Minimap } from './minimap'
import { render } from './render'
import { InitBattlemodeUI } from './ui/battlemodeUI'
import { toPx } from './utils'

export class Battlemode extends Viewport {
  private cellRows = 32
  main = document.createElement('main')
  mapSize = this.cellRows * MAP_CELL_SIZE
  minimap = new Minimap(this.main, UI_BOTTOM_HEIGHT, this.mapSize, (ctx) => {
    ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0, UI_BOTTOM_HEIGHT, UI_BOTTOM_HEIGHT)
  })
  public mapTextureCanvas = new CanvasCache(this.mapSize, 'Map Texture Canvas 2')

  private getViewportHeight = () => window.innerHeight - (UI_TOP_HEIGHT + UI_BOTTOM_HEIGHT)
  private getViewportWidth = () => window.innerWidth

  private map = generateBattleModeMap(this.cellRows, this.seed)
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
    requestAnimationFrame(this.update)
  }

}