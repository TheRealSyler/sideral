
declare interface CanvasRenderingContext2D {
  getTransform: () => DOMMatrix
  setDomMatrix: (matrix: DOMMatrix) => void
  transformedPoint: (x: number, y: number) => DOMPoint
}