
declare interface CanvasRenderingContext2D {
  getTransform: () => DOMMatrix
  transformedPoint: (x: number, y: number) => DOMPoint
}