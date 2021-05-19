import terrain from './assets/terrains.png';
const terrainsPerRow = 8
const terrainSize = 64



export async function initMap(map: [TerrainIndex, number][], width: number, size = terrainSize) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const mapData = await renderMap(map, width, size)
  canvas.className = 'map'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  document.body.appendChild(canvas)

  window.addEventListener('resize', () => {

    ctx.canvas.width = window.innerWidth
    ctx.canvas.height = window.innerHeight
    trackTransforms(ctx);
    redraw();
  });

  trackTransforms(ctx);

  function redraw() {

    // Clear the entire canvas
    const p1 = ctx.transformedPoint(0, 0);
    const p2 = ctx.transformedPoint(canvas.width, canvas.height);
    ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.drawImage(mapData, 0, 0);

  }
  redraw();

  let lastX = canvas.width / 2, lastY = canvas.height / 2;

  let dragStart: DOMPoint | null = null
  let dragged = false;

  canvas.addEventListener('click', (e) => {

    const transform = ctx.getTransform()
    const x = Math.round((e.offsetX - transform.e) / transform.a)
    const y = Math.round((e.offsetY - transform.f) / transform.d)

    console.log(x, y, 'maps.ts | canvas click')
  })

  canvas.addEventListener('mousedown', function (evt) {
    //@ts-ignore
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
    lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
    lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);

    dragStart = ctx.transformedPoint(lastX, lastY);
    dragged = false;
  }, false);

  canvas.addEventListener('mousemove', function (evt) {
    lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
    lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
    dragged = true;
    if (dragStart) {
      const pt = ctx.transformedPoint(lastX, lastY);
      ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
      redraw();
    }
  }, false);

  canvas.addEventListener('mouseup', function (evt) {
    dragStart = null;
    // if (!dragged) zoom(evt.shiftKey ? -1 : 1);
  }, false);

  const scaleFactor = 1.1;

  const zoom = function (clicks: number) {
    const pt = ctx.transformedPoint(lastX, lastY);
    ctx.translate(pt.x, pt.y);
    const factor = Math.pow(scaleFactor, clicks);
    ctx.scale(factor, factor);
    ctx.translate(-pt.x, -pt.y);
    redraw();
  }

  const handleScroll = function (evt: any) {
    const delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
    if (delta) zoom(delta);
    return evt.preventDefault() && false;
  };

  canvas.addEventListener('DOMMouseScroll', handleScroll, false);
  canvas.addEventListener('mousewheel', handleScroll, false);


  // Adds ctx.getTransform() - returns an SVGMatrix
  // Adds ctx.transformedPoint(x,y) - returns an SVGPoint
  function trackTransforms(ctx: CanvasRenderingContext2D) {

    let domMatrix = new DOMMatrix()
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

    // const setTransform = ctx.setTransform;

    // ctx.setTransform = function (a: number, b: number, c: number, d: number, e: number, f: number) {
    //   domMatrix.a = a;
    //   domMatrix.b = b;
    //   domMatrix.c = c;
    //   domMatrix.d = d;
    //   domMatrix.e = e;
    //   domMatrix.f = f;

    //   return setTransform.call(ctx, a, b, c, d, e, f);
    // };


    const pt = new DOMPoint();

    ctx.transformedPoint = (x: number, y: number) => {
      pt.x = x; pt.y = y;
      return pt.matrixTransform(domMatrix.inverse());
    }
  }
}



async function renderMap(map: [TerrainIndex, number][], width: number, size: number) {
  const canvas = document.createElement('canvas')
  const canvas2 = document.createElement('canvas')

  canvas.width = width * size
  canvas.height = width * size

  canvas2.width = size
  canvas2.height = size

  const ctx = canvas.getContext('2d')!
  const ctx2 = canvas2.getContext('2d')!

  const img = await loadTerrain() as any
  for (let i = 0; i < map.length; i++) {
    const mapItem = map[i];
    const rawX = (i % width)
    const rawY = Math.floor((i / width))
    const x = rawX * size
    const y = rawY * size

    const [offsetX, offsetY] = getImageOffset(mapItem[0], size, terrainsPerRow)


    ctx2.translate(size / 2, size / 2)
    ctx2.rotate(mapItem[1])
    ctx2.translate(-size / 2, -size / 2)
    ctx2.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)

    ctx?.drawImage(canvas2, x, y, size, size)

    ctx2.resetTransform()

  }

  const out = new Image;
  out.src = canvas.toDataURL('image/png');
  return out
}


function getImageOffset(index: TerrainIndex, size: number, width: number) {
  const x = (index % width) * size
  const y = Math.floor((index / width)) * size
  return [x, y]
}

function scaleNonUniform(sx: number, sy: number) {
  const m: DOMMatrix2DInit = {
    a: sx, b: 0, c: 0, d: sy, e: 0, f: 0
  }
  return m
}

async function loadTerrain() {
  const img = document.createElement('img')
  img.src = terrain

  return new Promise((res) => {
    img.onload = () => res(img)
  })
}


export enum TerrainIndex {
  'gras',
  'trees',
  'stone',
  'clay',
  'bush',
  'berries',
  'tin',
  'copper',
  'gold',
  'iron',
  'water',
  'water coast',
  'water coast 2',
  'water coast 3',
  'water coast 4',
  'fruit trees',
}
