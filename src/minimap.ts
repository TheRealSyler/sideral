import { CanvasCache } from './canvasCache';
import { Game } from './game';
import { UI_BOTTOM_HEIGHT } from './globalConstants';

export class Minimap extends CanvasCache {
  constructor(private game: Game) {
    super(UI_BOTTOM_HEIGHT, 'Mini Map Canvas')
    document.body.appendChild(this.canvas)
    this.canvas.className = 'minimap'
    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 1.2
  }

  public draw(xStart: number, yStart: number, xEnd: number, yEnd: number) {
    this.ctx.drawImage(this.game.viewport.mapTextureCanvas.canvas, 0, 0, UI_BOTTOM_HEIGHT, UI_BOTTOM_HEIGHT)
    this.ctx.drawImage(this.game.viewport.buildingTextureCanvas.canvas, 0, 0, UI_BOTTOM_HEIGHT, UI_BOTTOM_HEIGHT)

    const x2 = (xStart / this.game.mapSize) * UI_BOTTOM_HEIGHT;
    const y2 = (yStart / this.game.mapSize) * UI_BOTTOM_HEIGHT;
    const x3 = (xEnd / this.game.mapSize) * UI_BOTTOM_HEIGHT;
    const y3 = (yEnd / this.game.mapSize) * UI_BOTTOM_HEIGHT;

    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(x3, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.lineTo(x2, y3);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }
}