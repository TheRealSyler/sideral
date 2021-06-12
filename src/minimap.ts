import { CanvasCache } from './canvas/canvasCache';

export class Minimap extends CanvasCache {
  constructor(parent: HTMLElement, private size: number, private mapSize: number, private drawBg: (ctx: CanvasRenderingContext2D) => void) {
    super(size, 'Mini Map Canvas')
    parent.appendChild(this.canvas)
    this.canvas.className = 'minimap'
    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 1.2
  }

  public draw(xStart: number, yStart: number, xEnd: number, yEnd: number) {
    this.drawBg(this.ctx)
    const x2 = (xStart / this.mapSize) * this.size;
    const y2 = (yStart / this.mapSize) * this.size;
    const x3 = (xEnd / this.mapSize) * this.size;
    const y3 = (yEnd / this.mapSize) * this.size;

    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(x3, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.lineTo(x2, y3);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }
}