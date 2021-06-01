import { findPath, restoreAStarNodes } from './aStar';
import { CanvasCache } from './canvasCache';
import { Game, GameMode } from './game';

import { MAP_CELL_SIZE, MAP_MOVE_FACTOR, MAP_PADDING, ZOOM_SCALE_FACTOR, ZOOM_MAX_SCALE, ZOOM_MIN_SCALE, UI_BOTTOM_HEIGHT, UI_TOP_HEIGHT, MAP_CELLS_PER_ROW } from './globalConstants';
import { Position } from './interfaces';
import { render } from './render';
import { Unit } from './unit';

import { floor, clamp, toPx, distance } from './utils';

export class Viewport extends CanvasCache {
  private lastX = 0
  private lastY = 0;
  private canDrag = false
  private dragCursorLock = false
  private showHover = false
  private selectionEnd: Position = { x: 0, y: 0 };
  private selectionStart: Position | null = null;
  public mapTextureCanvas = new CanvasCache(this.game.mapSize, 'Map Texture Canvas')
  public buildingTextureCanvas = new CanvasCache(this.game.mapSize, 'Building Texture Canvas')

  private getViewportHeight = () => window.innerHeight - (UI_TOP_HEIGHT + UI_BOTTOM_HEIGHT)
  private getViewportWidth = () => window.innerWidth
  private getMaxXPos = (scale: number) => this.getViewportWidth() - (this.game.mapSize * scale) - MAP_PADDING
  private getMaxYPos = (scale: number) => this.getViewportHeight() - (this.game.mapSize * scale) - MAP_PADDING
  selectionDrag = false


  constructor(private game: Game) {
    super(0, 'Viewport Canvas')
    document.body.appendChild(this.canvas)
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('DOMMouseScroll', this.handleScroll);
    this.canvas.addEventListener('mousewheel', this.handleScroll);
    this.canvas.addEventListener('mousedown', this.mousedown);
    this.canvas.addEventListener('mousemove', this.mousemove);
    this.canvas.addEventListener('mouseup', this.mouseup);
    this.canvas.addEventListener('mouseleave', this.mouseleave);
  }

  public async start() {
    // don't change the order of the function calls.
    this.addCtxTransformTacking(this.ctx)
    this.resize()
    await render(this.mapTextureCanvas, this.buildingTextureCanvas, this.game.map, MAP_CELLS_PER_ROW)

    this.ctx.translate((-this.game.mapSize + this.canvas.width) / 2, (-this.game.mapSize + this.canvas.height) / 2)
  }


  public draw(delta: number, mode: GameMode) {
    this.updateView();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0);
    this.ctx.drawImage(this.buildingTextureCanvas.canvas, 0, 0);
    if (this.selectionStart) {
      this.ctx.strokeStyle = '#0af'
      this.ctx.strokeRect(this.selectionStart.x, this.selectionStart.y, this.selectionEnd.x, this.selectionEnd.y)
    }
    if (mode === 'building') {
      if (this.showHover) {
        const { x, y } = this.ctx.transformedPoint(this.lastX, this.lastY)
        const x2 = floor(x / MAP_CELL_SIZE) * MAP_CELL_SIZE
        const y2 = floor(y / MAP_CELL_SIZE) * MAP_CELL_SIZE
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#000'
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 + MAP_CELL_SIZE, y2);
        this.ctx.lineTo(x2 + MAP_CELL_SIZE, y2 + MAP_CELL_SIZE);
        this.ctx.lineTo(x2, y2 + MAP_CELL_SIZE);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

      }

      const selectedPos = this.game.state.get('selectedMapChunk')
      if (selectedPos) {
        const x2 = selectedPos.x * MAP_CELL_SIZE
        const y2 = selectedPos.y * MAP_CELL_SIZE
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#f00'
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 + MAP_CELL_SIZE, y2);
        this.ctx.lineTo(x2 + MAP_CELL_SIZE, y2 + MAP_CELL_SIZE);
        this.ctx.lineTo(x2, y2 + MAP_CELL_SIZE);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }
    }
  }

  private resize = () => {
    this.canvas.className = 'map';
    this.canvas.width = this.getViewportWidth();
    this.canvas.height = this.getViewportHeight();
    this.canvas.style.top = toPx(UI_TOP_HEIGHT);
    this.canvas.style.bottom = toPx(UI_BOTTOM_HEIGHT);
    this.ctx.setDomMatrix(new DOMMatrix())
  }


  private mousedown = (e: MouseEvent) => {
    const x = e.offsetX || (e.pageX - this.canvas.offsetLeft);
    const y = e.offsetY || (e.pageY - this.canvas.offsetTop);
    if (e.button === 2) {

      if (this.moveUnits(x, y)) {
        this.game.mode = 'unit'
        this.game.state.set('selectedMapChunk', null)
      }
    } else if (e.button === 0) {
      this.selectionDrag = true
    }
    else {
      //@ts-ignore
      document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';

      this.canDrag = true
      this.lastX = x
      this.lastY = y
    }
  }
  private mouseleave = () => {
    this.showHover = false
  }
  private mouseup = (e: MouseEvent) => {
    if (e.button === 0 && !this.selectionStart) {
      const transform = this.ctx.getTransform()
      const x = floor((e.offsetX - transform.e) / transform.a)
      const y = floor((e.offsetY - transform.f) / transform.d)
      const x2 = floor(x / MAP_CELL_SIZE)
      const y2 = floor(y / MAP_CELL_SIZE)
      let selectUnit = false
      for (let i = 0; i < this.game.units.length; i++) {
        const unit = this.game.units[i];
        const d = distance(x, y, unit.x, unit.y)
        if (d < 20) {
          selectUnit = true
          unit.selected = true
        } else {
          unit.selected = false
        }
      }
      if (selectUnit) {
        this.game.mode = 'unit'
        this.game.state.set('selectedMapChunk', null)
      } else {
        this.game.mode = 'building'
        if (x >= 0 && x < this.game.mapSize && y >= 0 && y < this.game.mapSize) {
          this.game.state.set('selectedMapChunk', { cell: this.game.map.cells[x2 + MAP_CELLS_PER_ROW * y2], x: x2, y: y2 })
        }
      }
    }

    this.canDrag = false;
    this.dragCursorLock = false
    this.showHover = true
    this.selectionDrag = false
    this.selectionStart = null
    document.exitPointerLock()
  }

  private mousemove = (evt: MouseEvent) => {

    this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
    this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);

    if (this.canDrag) {
      if (!this.dragCursorLock) {
        this.canvas.requestPointerLock()
        this.dragCursorLock = true
        this.showHover = false
      }
      const transform = this.ctx.getTransform()
      const { a, b, c, d, e, f } = transform
      let x = clamp(e + evt.movementX * MAP_MOVE_FACTOR, MAP_PADDING, this.getMaxXPos(a))
      let y = clamp(f + evt.movementY * MAP_MOVE_FACTOR, MAP_PADDING, this.getMaxYPos(a))

      this.ctx.setTransform(a, b, c, d, x, y)
    } else if (this.selectionDrag) {

      if (this.selectionStart) {
        const { x: x2, y: y2 } = this.ctx.transformedPoint(this.lastX, this.lastY)
        this.selectionEnd.x = x2 - this.selectionStart.x
        this.selectionEnd.y = y2 - this.selectionStart.y

        for (let i = 0; i < this.game.units.length; i++) {
          const unit = this.game.units[i];
          const isxInverted = this.selectionEnd.x < 0
          const isyInverted = this.selectionEnd.y < 0
          const x = isxInverted ? this.selectionStart.x + this.selectionEnd.x : this.selectionStart.x
          const xEnd = isxInverted ? this.selectionStart.x : this.selectionStart.x + this.selectionEnd.x
          const y = isyInverted ? this.selectionStart.y + this.selectionEnd.y : this.selectionStart.y
          const yEnd = isyInverted ? this.selectionStart.y : this.selectionStart.y + this.selectionEnd.y

          if (unit.x > x && unit.x < xEnd && unit.y > y && unit.y < yEnd) {
            unit.selected = true
          } else {
            unit.selected = false
          }
        }
      } else {
        const { x: x2, y: y2 } = this.ctx.transformedPoint(this.lastX, this.lastY)
        this.selectionStart = { x: x2, y: y2 }
        this.selectionEnd.x = 0
        this.selectionEnd.y = 0
        this.game.mode = 'unit'
        this.showHover = false
        this.game.state.set('selectedMapChunk', null)
      }
    } else {
      this.showHover = true
    }

  }
  private zoom = (clicks: number) => {
    // TODO refine zoom function, right now this function only approximates the zoom limits.
    const transform = this.ctx.getTransform()
    const scale = transform.a

    const factor = Math.pow(ZOOM_SCALE_FACTOR, clicks);
    if (scale < ZOOM_MAX_SCALE && factor > 1 || scale > ZOOM_MIN_SCALE && factor < 1) {

      const pt = this.ctx.transformedPoint(this.lastX, this.lastY);

      this.ctx.translate(pt.x, pt.y);

      this.ctx.scale(factor, factor);

      this.ctx.translate(-pt.x, -pt.y);
      // clamp position
      const { a, b, c, d, e, f } = this.ctx.getTransform()
      let x = clamp(e, MAP_PADDING, this.getMaxXPos(a))
      let y = clamp(f, MAP_PADDING, this.getMaxYPos(a))
      this.ctx.setTransform(a, b, c, d, x, y)

    }

  }

  private handleScroll = (evt: any) => {
    const delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
    if (delta) this.zoom(delta);
    return evt.preventDefault() && false;
  };

  private moveUnits(x: number, y: number) {
    const { x: x2, y: y2 } = this.ctx.transformedPoint(x, y);
    let movedUnit = false;

    for (let i = 0; i < this.game.units.length; i++) {
      const unit = this.game.units[i];
      if (unit.selected) {
        const targetX = x2;
        const targetY = y2;
        const endIndex = floor(targetX / MAP_CELL_SIZE) + MAP_CELLS_PER_ROW * floor(targetY / MAP_CELL_SIZE);
        if (!this.game.aStarNodes[endIndex].isObstacle) {
          const startIndex = floor(unit.x / MAP_CELL_SIZE) + MAP_CELLS_PER_ROW * floor(unit.y / MAP_CELL_SIZE);
          const path = findPath(this.game.aStarNodes[startIndex], this.game.aStarNodes[endIndex]);
          if (path) {
            unit.path.length = 0
            unit.path.push(...path);
            unit.endTarget.x = targetX;
            unit.endTarget.y = targetY;
            unit.moveToNewTarget(true)
          }
          movedUnit = true;
          restoreAStarNodes(this.game.aStarNodes);

        }
      }
    }

    return movedUnit;
  }

  private updateView() {
    let x = 0;
    let y = 0;
    const { a, b, c, d, e, f } = this.ctx.getTransform();
    const speed = (this.game.camera.speed);
    if (this.game.camera.move.up) {
      y += speed;
    }
    if (this.game.camera.move.down) {
      y += -speed;
    }
    if (this.game.camera.move.left) {
      x += speed;
    }
    if (this.game.camera.move.right) {
      x += -speed;
    }

    this.ctx.setTransform(a, b, c, d, clamp(e + x, MAP_PADDING, this.getMaxXPos(a)), clamp(f + y, MAP_PADDING, this.getMaxYPos(a)));
  }

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
