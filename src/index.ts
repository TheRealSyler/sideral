import './index.sass';
import { MapCell, MapCellName } from './map';
import random from 'seedrandom'
import { clamp, degToRad, distance, map } from './utils';
import { Game } from './game';
import { buildingInfo, BuildingNames, } from './building';
import { generateMap, islandMask } from './mapGenerator';
import { CanvasCache } from './canvasCache';
import { } from './noise';


function createMapCell(type: MapCellName, rotation: number, resourceAmount: number, building = null): MapCell {
  return { type, rotation, resourceAmount, building }
}

(async () => {
  const b = 64
  const map = new Array(b * b).fill(createMapCell('gras', 0, -1)).map((v, i) =>
  ({
    type: v.type, rotation: degToRad(Math.floor(random('aw' + i)() * 4) * 90), resourceAmount: 10000,
    building: null

    // {
    //   name: 'bakery',
    //   isUpgrading: false,
    //   date: new Date(),
    //   level: Math.floor(random('aw' + i)() * 15)
    // } as any

  }));
  const t = performance.now()
  const m = generateMap(b, 0)
  console.log('S T', performance.now() - t)
  new Game(m, b)
})()
const mapWidth = 64

const a = new CanvasCache(mapWidth, 'awd')
const s = mapWidth * mapWidth
a.canvas.style.width = `${mapWidth * 4}px`
a.canvas.style.height = `${mapWidth * 4}px`
a.canvas.style.imageRendering = 'pixelated'
a.canvas.style.imageRendering = 'crisp-edges'



// const mask = islandMask(2, mapWidth)
// draw();
// document.body.appendChild(a.canvas)


function draw() {
  // console.log(color, rgbToHex(color, color, color));


  a.ctx.strokeStyle = '#f00'
  a.ctx.fillStyle = '#f00'
  // for (let j = 0; j < g.length; j++) {
  //   const val = 2 + g[j];
  //   a.ctx.fillRect(j, 0, 1, val * 20)
  // }
  // for (let x = 0; x < ppp.length; x++) {
  //   const awd = ppp[x] as any as number[];
  //   for (let y = 0; y < awd.length; y++) {
  //     const val = awd[y];


  //     // const x = Math.floor(x % mapWidth);
  //     // const y = Math.floor((y / mapWidth));

  //     const color = Math.floor(val * 255)

  //     a.ctx.fillStyle = rgbToHex(color, color, color);
  //     a.ctx.fillRect(x, y, 1, 1)
  //   }
  // }
  for (let j = 0; j < mapWidth * mapWidth; j++) {

    const x = (j % mapWidth);
    const y = Math.floor((j / mapWidth));

    const color = 2 //mask[j] * 255//> 0.5 ? 255 : 0

    a.ctx.fillStyle = rgbToHex(color, color, color);

    a.ctx.fillRect(x, y, 1, 1)

  }

  // for (let i = 0; i < s; i++) {
  //   const x = Math.floor(i % mapWidth);
  //   const y = Math.floor((i / mapWidth));
  //   // const o = ((g[x])) * 255
  //   const color = Math.round(n(x, y) * 255)

  //   a.ctx.fillStyle = rgbToHex(color, color, color);

  //   a.ctx.fillRect(x, y, 1, 1);
  // }
}

// checkBuildingUpgradeTimes(BuildingNames['bakery'])
// checkBuildingProductionTimes(BuildingNames['bakery'])


// console.log(buildingInfo['bakery'])

function componentToHex(c: number) {
  var hex = clamp(Math.round(c), 255, 0).toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}