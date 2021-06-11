export class CanvasCache {
  canvas = document.createElement('canvas')
  ctx!: CanvasRenderingContext2D
  constructor(size: number, name: string) {
    this.canvas.width = size
    this.canvas.height = size
    const ctx = this.canvas.getContext('2d')
    if (ctx) {
      this.ctx = ctx
    } else {
      // TODO add could not initialize notification.
      console.error(`could not initialize 2d context in CanvasCache[${name}], todo add notification`)
    }
  }
}