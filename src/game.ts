import { Building, BuildingInfo, buildingInfo } from "./building";
import { buildingProductionEndDate, buildingUpgradeEndDate } from "./buildingFunctions";
import { CanvasCache } from "./canvasCache";
import { MAP_CELL_SIZE, UI_TOP_HEIGHT, UI_BOTTOM_HEIGHT, MAP_PADDING, MAP_MOVE_FACTOR, ZOOM_SCALE_FACTOR, ZOOM_MAX_SCALE, ZOOM_MIN_SCALE } from "./globalConstants";
import { Map, MapCell } from "./map"
import { render, renderCellBuilding } from "./render";
import { defaultResources } from "./resources";
import { State, GameState } from "./state";
import { InitUI } from "./ui";
import { clamp, toPx } from "./utils";


export class Game {

  viewport = new CanvasCache(0, 'Main Canvas')
  lastX = 0
  lastY = 0;
  mapSize = this.mapWidth * MAP_CELL_SIZE
  mapTextureCanvas = new CanvasCache(this.mapSize, 'Map Texture Canvas')
  buildingTextureCanvas = new CanvasCache(this.mapSize, 'Building Texture Canvas')

  canDrag: boolean = false
  dragCursorLock: boolean = false

  getViewportHeight = () => window.innerHeight - (UI_TOP_HEIGHT + UI_BOTTOM_HEIGHT)
  getViewportWidth = () => window.innerWidth
  getMaxXPos = (scale: number) => this.getViewportWidth() - (this.mapSize * scale) - MAP_PADDING
  getMaxYPos = (scale: number) => this.getViewportHeight() - (this.mapSize * scale) - MAP_PADDING

  state = new State<GameState>({
    ...defaultResources,
    selectedMapChunk: null
  })
  constructor(public map: Map, public mapWidth: number) {
    InitUI(this.state, UI_TOP_HEIGHT, UI_BOTTOM_HEIGHT)


    window.addEventListener('resize', this.resize);

    this.viewport.canvas.addEventListener('DOMMouseScroll', this.handleScroll, false);
    this.viewport.canvas.addEventListener('mousewheel', this.handleScroll, false);

    this.viewport.canvas.addEventListener('mousedown', this.mousedown, false);

    this.viewport.canvas.addEventListener('mousemove', this.mousemove, false);

    this.viewport.canvas.addEventListener('mouseup', this.mouseup, false);

    this.start()

  }

  private async start() {
    document.body.appendChild(this.viewport.canvas)

    await render(this.mapTextureCanvas, this.buildingTextureCanvas, this.map, this.mapWidth,)


    this.addCtxTransformTacking(this.viewport.ctx)
    this.resize()
    this.draw()
    setInterval(this.logicLoop, 250)
  }

  private logicLoop = async () => {
    const time = Date.now()
    for (let i = 0; i < this.map.length; i++) {
      const { building } = this.map[i];
      const map = this.map[i];

      if (building) {
        const info = buildingInfo[building.name]
        if (building.isUpgrading) {
          await this.buildingUpgradeCheck(building, info, time, i);
        } else {
          this.buildingResourceCheck(info, building, time, map);
        }
      }
    }

  }

  private async buildingUpgradeCheck(building: Building, info: BuildingInfo, time: number, i: number) {
    const remainingTime = buildingUpgradeEndDate(building, info);
    const x = (i % this.mapWidth)
    const y = Math.floor((i / this.mapWidth))
    if (building.level < 4) {
      const progress = 1 - ((remainingTime - Date.now()) / (info.constructionTime * 1000));
      if (progress > (building.level + 1) * 0.25) {
        building.level++;
        await renderCellBuilding(new DOMPoint(x, y), this.buildingTextureCanvas, building)
      }
      if (progress > 1) {
        building.isUpgrading = false;
        this.state.resendListeners('selectedMapChunk')
      }
    } else if (remainingTime < time) {
      building.level++;
      building.isUpgrading = false;
      await renderCellBuilding(new DOMPoint(x, y), this.buildingTextureCanvas, building)
      this.state.resendListeners('selectedMapChunk')

    }

  }

  private buildingResourceCheck(info: BuildingInfo, building: Building, time: number, map: MapCell) {
    if (info.canProduce) {
      const requirements = info.productionResourceRequirements;
      if (requirements) {
      } else {
        if (buildingProductionEndDate(building, info) < time) {
          building.date = new Date;
          if (map.resourceAmount >= 1) {
            map.resourceAmount--;
            this.state.resendListeners('selectedMapChunk');
            this.state.setFunc('bread', (v) => v + 1);

          } else
            console.log('NO RESOURCES TODO implement warning or something');


        }
      }
    }
  }



  private draw = () => {

    const p1 = this.viewport.ctx.transformedPoint(0, 0);
    const p2 = this.viewport.ctx.transformedPoint(this.viewport.canvas.width, this.viewport.canvas.height);
    this.viewport.ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

    this.viewport.ctx.save();
    this.viewport.ctx.setTransform(new DOMMatrix());
    this.viewport.ctx.clearRect(0, 0, this.viewport.canvas.width, this.viewport.canvas.height);
    this.viewport.ctx.restore();

    this.viewport.ctx.drawImage(this.mapTextureCanvas.canvas, 0, 0);
    this.viewport.ctx.drawImage(this.buildingTextureCanvas.canvas, 0, 0);

    // TODO improve this mess
    if (!this.dragCursorLock) {
      const transform = this.viewport.ctx.getTransform()
      const x = Math.round((this.lastX - transform.e) / transform.a)
      const y = Math.round((this.lastY - transform.f) / transform.d)
      const x2 = Math.floor(x / MAP_CELL_SIZE) * MAP_CELL_SIZE
      const y2 = Math.floor(y / MAP_CELL_SIZE) * MAP_CELL_SIZE
      this.viewport.ctx.strokeStyle = '#000'
      this.viewport.ctx.beginPath();
      this.viewport.ctx.moveTo(x2, y2);
      this.viewport.ctx.lineTo(x2 + MAP_CELL_SIZE, y2);
      this.viewport.ctx.lineTo(x2 + MAP_CELL_SIZE, y2 + MAP_CELL_SIZE);
      this.viewport.ctx.lineTo(x2, y2 + MAP_CELL_SIZE);
      this.viewport.ctx.lineTo(x2, y2);
      this.viewport.ctx.stroke();
    }
    const selectedPos = this.state.get('selectedMapChunk')
    if (selectedPos) {
      const x2 = selectedPos.x * MAP_CELL_SIZE
      const y2 = selectedPos.y * MAP_CELL_SIZE
      this.viewport.ctx.strokeStyle = '#f00'
      this.viewport.ctx.beginPath();
      this.viewport.ctx.moveTo(x2, y2);
      this.viewport.ctx.lineTo(x2 + MAP_CELL_SIZE, y2);
      this.viewport.ctx.lineTo(x2 + MAP_CELL_SIZE, y2 + MAP_CELL_SIZE);
      this.viewport.ctx.lineTo(x2, y2 + MAP_CELL_SIZE);
      this.viewport.ctx.lineTo(x2, y2);
      this.viewport.ctx.stroke();
    }
    requestAnimationFrame(this.draw)
  }

  private resize = () => {
    this.viewport.canvas.className = 'map';
    this.viewport.canvas.width = this.getViewportWidth();
    this.viewport.canvas.height = this.getViewportHeight();
    this.viewport.canvas.style.top = toPx(UI_TOP_HEIGHT);
    this.viewport.canvas.style.bottom = toPx(UI_BOTTOM_HEIGHT);
    this.viewport.ctx.setDomMatrix(new DOMMatrix())
  }

  private mousedown = (evt: any) => {
    //@ts-ignore
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
    this.lastX = evt.offsetX || (evt.pageX - this.viewport.canvas.offsetLeft);
    this.lastY = evt.offsetY || (evt.pageY - this.viewport.canvas.offsetTop);

    this.canDrag = true
  }
  private mouseup = (e: MouseEvent) => {

    if (!this.dragCursorLock) {

      const transform = this.viewport.ctx.getTransform()
      const x = Math.round((e.offsetX - transform.e) / transform.a)
      const y = Math.round((e.offsetY - transform.f) / transform.d)
      const x2 = Math.floor(x / MAP_CELL_SIZE)
      const y2 = Math.floor(y / MAP_CELL_SIZE)
      if (x >= 0 && x < this.mapSize && y >= 0 && y < this.mapSize) {
        this.state.set('selectedMapChunk', { cell: this.map[x2 + this.mapWidth * y2], x: x2, y: y2 })
      }

    }

    this.canDrag = false;
    this.dragCursorLock = false
    document.exitPointerLock()
  }

  private mousemove = (evt: MouseEvent) => {

    this.lastX = evt.offsetX || (evt.pageX - this.viewport.canvas.offsetLeft);
    this.lastY = evt.offsetY || (evt.pageY - this.viewport.canvas.offsetTop);


    if (this.canDrag) {
      if (!this.dragCursorLock) {
        this.viewport.canvas.requestPointerLock()
        this.dragCursorLock = true
      }
      const transform = this.viewport.ctx.getTransform()
      const { a, b, c, d, e, f } = transform
      let x = clamp(e + evt.movementX * MAP_MOVE_FACTOR, MAP_PADDING, this.getMaxXPos(a))
      let y = clamp(f + evt.movementY * MAP_MOVE_FACTOR, MAP_PADDING, this.getMaxYPos(a))

      this.viewport.ctx.setTransform(a, b, c, d, x, y)
    }
  }

  private zoom = (clicks: number) => {
    // TODO refine zoom function, right now this function only approximates the zoom limits.
    const transform = this.viewport.ctx.getTransform()
    const scale = transform.a

    const factor = Math.pow(ZOOM_SCALE_FACTOR, clicks);
    if (scale < ZOOM_MAX_SCALE && factor > 1 || scale > ZOOM_MIN_SCALE && factor < 1) {

      const pt = this.viewport.ctx.transformedPoint(this.lastX, this.lastY);
      this.viewport.ctx.translate(pt.x, pt.y);

      this.viewport.ctx.scale(factor, factor);

      this.viewport.ctx.translate(-pt.x, -pt.y);
      // clamp position
      const { a, b, c, d, e, f } = this.viewport.ctx.getTransform()
      let x = clamp(e, MAP_PADDING, this.getMaxXPos(a))
      let y = clamp(f, MAP_PADDING, this.getMaxYPos(a))
      this.viewport.ctx.setTransform(a, b, c, d, x, y)

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
