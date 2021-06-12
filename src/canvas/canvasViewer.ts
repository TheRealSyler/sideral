import { clamp, floor } from '../utils'
import { CanvasCache } from './canvasCache'

export class CanvasViewer extends CanvasCache {

  static viewers = 0
  static container = document.createElement('div')
  constructor(public size: number, public scale = 1, public cssScale = 1) {
    super(size, `Canvas Viewer ${CanvasViewer.viewers}`)
    this.canvas.width = size * scale
    this.canvas.height = size * scale

    this.canvas.style.width = `${size * scale * cssScale}px`
    this.canvas.style.height = `${size * scale * cssScale}px`
    this.canvas.style.imageRendering = 'crisp-edges'

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
    for (let i = 0; i < this.size * this.size; i++) {

      const x = (i % this.size) * this.scale;
      const y = floor((i / this.size)) * this.scale;

      const color = arr[i] * colorMultiplier

      this.ctx.fillStyle = this.rgbToHex(color, color, color);

      this.ctx.fillRect(x, y, this.scale, this.scale)

    }
  }
  drawRGBNumArray(arr: [number, number, number][], colorMultiplier = 255) {
    for (let i = 0; i < this.size * this.size; i++) {

      const x = (i % this.size) * this.scale;
      const y = floor((i / this.size)) * this.scale;

      const color = arr[i][0] * colorMultiplier
      const color2 = arr[i][1] * colorMultiplier
      const color3 = arr[i][2] * colorMultiplier

      this.ctx.fillStyle = this.rgbToHex(color, color2, color3);

      this.ctx.fillRect(x, y, this.scale, this.scale)
    }
  }

  componentToHex(c: number) {
    var hex = clamp(Math.round(c), 255, 0).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  rgbToHex(r: number, g: number, b: number) {
    return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  }
}