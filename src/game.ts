import { renderMap, TerrainIndex } from "./map"
import { clamp } from "./utils";

export class Game {
  chunksPerRow = 8
  terrainSize = 64
  zoomScaleFactor = 1.1;
  canvas = document.createElement('canvas')
  ctx!: CanvasRenderingContext2D
  mapSize = this.width * this.terrainSize
  minScale = 0.8
  maxScale = 4
  lastX = this.canvas.width / 2
  lastY = this.canvas.height / 2;
  dragStart: DOMPoint | null = null
  dragged = false;
  mapData!: HTMLImageElement

  mapPadding = 0
  mapMoveFactor = 1.4
  getMaxXPos = (scale: number) => window.innerWidth - (this.mapSize * scale) - this.mapPadding
  getMaxYPos = (scale: number) => (window.innerHeight) - (this.mapSize * scale) - this.mapPadding

  constructor(public map: [TerrainIndex, number][], public width: number) {
    this.canvas.className = 'map'
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    const ctx = this.canvas.getContext('2d')
    if (ctx) {
      this.ctx = ctx
    } else {
      // TODO add could not initialize notification.
      console.error('could not initialize 2d context, todo add notification')
    }

    window.addEventListener('resize', this.resize);

    this.canvas.addEventListener('DOMMouseScroll', this.handleScroll, false);
    this.canvas.addEventListener('mousewheel', this.handleScroll, false);

    this.canvas.addEventListener('click', this.click)

    this.canvas.addEventListener('mousedown', this.mousedown, false);


    this.canvas.addEventListener('mousemove', this.mousemove, false);

    this.canvas.addEventListener('mouseup', this.mouseup, false);
    this.canvas.addEventListener('mouseleave', this.mouseup, false);

    this.start()

  }
  private async start() {
    document.body.appendChild(this.canvas)

    this.mapData = await renderMap(this.map, this.width, this.terrainSize, this.chunksPerRow)
    this.addCtxTransformTacking(this.ctx)
    this.draw()
  }
  private draw = () => {

    const p1 = this.ctx.transformedPoint(0, 0);
    const p2 = this.ctx.transformedPoint(this.canvas.width, this.canvas.height);
    this.ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

    this.ctx.save();
    this.ctx.setTransform(new DOMMatrix());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    this.ctx.drawImage(this.mapData, 0, 0);
    requestAnimationFrame(this.draw)
  }

  private resize = () => {
    this.ctx.canvas.width = window.innerWidth
    this.ctx.canvas.height = window.innerHeight

    this.ctx.setDomMatrix(new DOMMatrix())
  }

  private click = (e: MouseEvent) => {

    const transform = this.ctx.getTransform()
    const x = Math.round((e.offsetX - transform.e) / transform.a)
    const y = Math.round((e.offsetY - transform.f) / transform.d)

    // console.log(Math.floor((x) / this.terrainSize), y, 'maps.ts | canvas click')

  }

  private mousedown = (evt: any) => {
    //@ts-ignore
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
    this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
    this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);

    this.dragStart = this.ctx.transformedPoint(this.lastX, this.lastY);
    this.dragged = false;



    this.canvas.requestPointerLock()
  }
  private mouseup = () => {
    this.dragStart = null;
    document.exitPointerLock()
    // if (!dragged) zoom(evt.shiftKey ? -1 : 1);
  }

  private mousemove = (evt: MouseEvent) => {

    this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
    this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
    this.dragged = true;
    if (this.dragStart) {
      const transform = this.ctx.getTransform()
      const { a, b, c, d, e, f } = transform
      const pt = this.ctx.transformedPoint(this.lastX, this.lastY);
      // console.log(e + evt.movementX, clamp(e + evt.movementX, 20, -this.mapSize * a), -this.mapSize * a)
      let x = clamp(e + evt.movementX * this.mapMoveFactor, this.mapPadding, this.getMaxXPos(a))
      let y = clamp(f + evt.movementY * this.mapMoveFactor, this.mapPadding, this.getMaxYPos(a))
      // console.log(x)
      const t = (n: number) => Math.round(n)
      // console.log(this.max2(a), t(y))
      // console.log(t(x))
      const padding = 20
      // if ((this.ctx.transformedPoint(0, 0).x)  > this.mapSize + padding && x < 0) {
      //   x = 0
      // }
      // this.ctx.translate(x, pt.y - this.dragStart.y);
      let newX = 0

      // console.log(a, b, c, d, e, f)
      this.ctx.setTransform(a, b, c, d, x, y)



    }
  }

  private zoom = (clicks: number) => {
    // TODO refine zoom function, right now this function only approximates the zoom limits.
    const transform = this.ctx.getTransform()
    const scale = transform.a

    const factor = Math.pow(this.zoomScaleFactor, clicks);
    // console.log('a', scale,)
    if (scale < this.maxScale && factor > 1 || scale > this.minScale && factor < 1) {

      const pt = this.ctx.transformedPoint(this.lastX, this.lastY);
      this.ctx.translate(pt.x, pt.y);

      this.ctx.scale(factor, factor);

      this.ctx.translate(-pt.x, -pt.y);
      // clamp position
      const { a, b, c, d, e, f } = this.ctx.getTransform()
      let x = clamp(e, this.mapPadding, this.getMaxXPos(a))
      let y = clamp(f, this.mapPadding, this.getMaxYPos(a))
      this.ctx.setTransform(a, b, c, d, x, y)

    }

  }

  private handleScroll = (evt: any) => {
    const delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
    if (delta) this.zoom(delta);
    return evt.preventDefault() && false;
  };


  private addCtxTransformTacking(ctx: CanvasRenderingContext2D) {

    let domMatrix = new DOMMatrix()
    ctx.setDomMatrix = function (matrix) { domMatrix = matrix }
    ctx.getTransform = function () { return domMatrix; };

    const savedTransforms: any[] = [];
    const save = ctx.save;
    ctx.save = function () {
      savedTransforms.push(domMatrix.translate(0, 0));
      return save.call(ctx);
    };

    const restore = ctx.restore;
    ctx.restore = function () {
      domMatrix = savedTransforms.pop();
      return restore.call(ctx);
    };

    const scale = ctx.scale;
    ctx.scale = function (sx, sy) {
      domMatrix = domMatrix.multiply(scaleNonUniform(sx, sy))

      return scale.call(ctx, sx, sy);
    };

    const rotate = ctx.rotate;
    ctx.rotate = function (radians) {
      domMatrix = domMatrix.rotate(radians * 180 / Math.PI);
      return rotate.call(ctx, radians);
    };

    const translate = ctx.translate;
    ctx.translate = function (dx, dy) {
      domMatrix = domMatrix.translate(dx, dy);
      return translate.call(ctx, dx, dy);
    };

    const transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
      const m2 = new DOMMatrix()
      m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
      domMatrix = domMatrix.multiply(m2);
      return transform.call(ctx, a, b, c, d, e, f);
    };

    const setTransform = ctx.setTransform;
    // @ts-ignore
    ctx.setTransform = function (a: number, b: number, c: number, d: number, e: number, f: number) {
      domMatrix.a = a;
      domMatrix.b = b;
      domMatrix.c = c;
      domMatrix.d = d;
      domMatrix.e = e;
      domMatrix.f = f;

      // @ts-ignore
      return setTransform.call(ctx, a, b, c, d, e, f);
    };


    const pt = new DOMPoint();

    ctx.transformedPoint = (x: number, y: number) => {
      pt.x = x; pt.y = y;
      return pt.matrixTransform(domMatrix.inverse());
    }
  }

}


function scaleNonUniform(sx: number, sy: number) {
  const m: DOMMatrix2DInit = {
    a: sx, b: 0, c: 0, d: sy, e: 0, f: 0
  }
  return m
}