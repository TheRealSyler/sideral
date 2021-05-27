import { clamp } from './utils'

export class CanvasViewer {
  canvas = document.createElement('canvas')
  ctx!: CanvasRenderingContext2D
  static viewers = 0
  static container = document.createElement('div')
  constructor(public size: number, public scale = 1) {

    this.canvas.width = size
    this.canvas.height = size

    this.canvas.style.width = `${size * scale}px`
    this.canvas.style.height = `${size * scale}px`
    this.canvas.style.imageRendering = 'crisp-edges'
    const ctx = this.canvas.getContext('2d')
    if (ctx) {
      this.ctx = ctx
    } else {
      // TODO add could not initialize notification.
      console.error(`could not initialize 2d context in Canvas Viewer[${CanvasViewer.viewers}], todo add notification`)
    }
    if (CanvasViewer.viewers === 0) {
      document.body.appendChild(CanvasViewer.container)
      CanvasViewer.container.style.position = 'fixed'
      CanvasViewer.container.style.overflow = 'scroll'
      CanvasViewer.container.style.top = '0'
      CanvasViewer.container.style.left = '0'
      CanvasViewer.container.style.bottom = '0'
      CanvasViewer.container.style.right = '0'
      CanvasViewer.container.style.zIndex = '1000'
      CanvasViewer.container.style.background = '#0a0a0f'
    }
    CanvasViewer.container.appendChild(this.canvas)
    CanvasViewer.viewers++
  }
  drawNumArray(arr: number[], colorMultiplier = 255) {
    for (let j = 0; j < this.size * this.size; j++) {

      const x = (j % this.size);
      const y = Math.floor((j / this.size));

      const color = arr[j] * colorMultiplier

      this.ctx.fillStyle = this.rgbToHex(color, color, color);

      this.ctx.fillRect(x, y, 1, 1)

    }
  }

  private componentToHex(c: number) {
    var hex = clamp(Math.round(c), 255, 0).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  private rgbToHex(r: number, g: number, b: number) {
    return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  }
}