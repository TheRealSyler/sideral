import { CanvasCache } from './canvasCache';
import { clamp } from '../utils';
import { Bounds } from '../interfaces';

export class Viewport extends CanvasCache {
  camera = {
    speed: 18,
    move: {
      up: false,
      down: false,
      left: false,
      right: false
    }
  }

  private bounds: Bounds = {
    top: 0,
    left: 0,
    right: 10000,
    bottom: 10000,
  }

  setBounds(bounds: Bounds) {
    this.bounds = bounds
  }

  protected lastX = 0
  protected lastY = 0;
  protected canDrag = false
  protected dragCursorLock = false

  private events: ViewportEvents = {}
  constructor(name: string, private options: ViewportOptions) {
    super(0, name)

    this.canvas.addEventListener('DOMMouseScroll', this.handleScroll);
    this.canvas.addEventListener('mousewheel', this.handleScroll);
    this.canvas.addEventListener('mousedown', this._mousedown);
    this.canvas.addEventListener('mousemove', this._mousemove);
    this.canvas.addEventListener('mouseup', this._mouseup);
    this.canvas.addEventListener('mouseleave', this._mouseleave);

    this.addCtxTransformTacking(this.ctx)
  }

  updateView(delta: number) {
    let x = 0;
    let y = 0;
    const { a, b, c, d, e, f } = this.ctx.getTransform();
    const speed = (this.camera.speed);
    if (this.camera.move.up) {
      y += speed;
    }
    if (this.camera.move.down) {
      y += -speed;
    }
    if (this.camera.move.left) {
      x += speed;
    }
    if (this.camera.move.right) {
      x += -speed;
    }

    this.ctx.setTransform(a, b, c, d, clamp(e + x, this.options.boundaryPadding, this.options.getMaxXPos(a)), clamp(f + y, this.options.boundaryPadding, this.options.getMaxYPos(a)));
  }

  setEvents(events: ViewportEvents) {
    this.events = events
  }

  _resize = () => {
    const transform = this.ctx.getTransform()
    this.ctx.setDomMatrix(new DOMMatrix())
    this.ctx.translate(transform.e, transform.f)
  }

  private event<K extends keyof ViewportEvents>(key: K, e: any) {
    const func = this.events[key]
    if (!func) return;
    func(e as any)
  }

  private _mousedown = (e: MouseEvent) => {
    //@ts-ignore
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

    this.canDrag = true
    this.lastX = e.offsetX || (e.pageX - this.canvas.offsetLeft);
    this.lastY = e.offsetY || (e.pageY - this.canvas.offsetTop);
    this.event('mousedown', e)
  }

  private _mouseup = (e: MouseEvent) => {
    this.canDrag = false;
    this.dragCursorLock = false
    document.exitPointerLock()

    this.event('mouseup', e)
  }

  private _mouseleave = (e: Event) => {
    this.event('mouseleave', e)
  }

  private _mousemove = (evt: MouseEvent) => {
    this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
    this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);

    if (this.canDrag) {
      if (!this.dragCursorLock) {
        this.canvas.requestPointerLock()
        this.dragCursorLock = true
      }
      const transform = this.ctx.getTransform()
      const { a, b, c, d, e, f } = transform
      let x = clamp(e + evt.movementX * this.options.moveFactor, this.options.boundaryPadding, this.options.getMaxXPos(a))
      let y = clamp(f + evt.movementY * this.options.moveFactor, this.options.boundaryPadding, this.options.getMaxYPos(a))

      this.ctx.setTransform(a, b, c, d, x, y)
    }
    this.event('mousemove', evt)
  }

  private zoom = (clicks: number) => {
    const scale = this.ctx.getTransform().a
    const factor = Math.pow(this.options.zoomScaleFactor, clicks);

    const scaledScale = scale * factor;
    const maxWidth = (this.bounds.right - this.bounds.left);
    const maxHeight = (this.bounds.bottom - this.bounds.top);
    const maxScale = Math.max(
      this.canvas.width / maxWidth,
      this.canvas.height / maxHeight
    );

    const pt = this.ctx.transformedPoint(this.lastX, this.lastY);

    this.ctx.translate(pt.x, pt.y);
    const { b, c, e, f } = this.ctx.getTransform()

    const newScale = clamp(scaledScale, this.options.zoomMaxScale, maxScale)
    this.ctx.setTransform(newScale, b, c, newScale, e, f)

    this.ctx.translate(-pt.x, -pt.y);

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

type ViewportMouseEvent = (e: MouseEvent) => void;

interface ViewportEvents {
  mousedown?: ViewportMouseEvent
  mouseup?: ViewportMouseEvent
  mouseleave?: ViewportMouseEvent
  mousemove?: ViewportMouseEvent
}


interface ViewportOptions {
  getMaxXPos: (scale: number) => number,
  getMaxYPos: (scale: number) => number,
  moveFactor: number,
  boundaryPadding: number,
  zoomScaleFactor: number,
  zoomMaxScale: number
}

