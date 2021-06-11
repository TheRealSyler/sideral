import { CanvasCache } from './canvas/canvasCache'
import { Viewport } from './canvas/viewport'
import { MAP_PADDING, MAP_MOVE_FACTOR, ZOOM_SCALE_FACTOR, MAP_CELL_SIZE } from './globalConstants'
import { generateBattleModeMap } from './mapGenerator'
import { Minimap } from './minimap'
import { render } from './render'

export class BattleMode extends Viewport {
  private cellRows = 32
  main = document.createElement('main')
  mapSize = this.cellRows * MAP_CELL_SIZE
  minimap = new Minimap(this.main, 200, this.mapSize, (ctx) => {
    ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0, 200, 200)
  })
  public mapTextureCanvas = new CanvasCache(this.mapSize, 'Map Texture Canvas 2')

  private getViewportHeight = () => window.innerHeight
  private getViewportWidth = () => window.innerWidth

  private map = generateBattleModeMap(this.cellRows, this.seed)
  constructor(private seed = 0) {
    super('Battle Mode Viewport Canvas', {
      getMaxXPos: (scale: number) => this.getViewportWidth() - (this.mapSize * scale) - MAP_PADDING,
      getMaxYPos: (scale: number) => this.getViewportHeight() - (this.mapSize * scale) - MAP_PADDING,
      moveFactor: MAP_MOVE_FACTOR,
      boundaryPadding: 0,
      zoomMaxScale: 3,
      zoomMinScale: 0.8,
      zoomScaleFactor: ZOOM_SCALE_FACTOR
    })
    document.body.appendChild(this.main)
    this.main.appendChild(this.canvas)
    this.canvas.className = 'map';

    this.start()
  }

  async start() {
    this.resize()
    this.update(0)
    await render(this.mapTextureCanvas, new CanvasCache(this.mapSize, 'Building Texture Canvas 2'), this.map, this.cellRows)
  }

  private resize = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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