import { floor, getTextureOffset } from "./utils";
import { SimpleMap, MapCell, MapCellTexturePos } from './map'
import terrain from './assets/terrains.png';
import { renderBuilding } from "./buildingRender";
import { TextureCache } from "./textureCache";
import { MAP_CELL_SIZE, MAP_TEXTURE_CHUNKS_PER_ROW } from "./globalConstants";
import { CanvasCache } from "./canvas/canvasCache";
import { Building } from "./building";


const textureCache = new TextureCache({ terrain: terrain })

const mapCellCanvas = new CanvasCache(MAP_CELL_SIZE, 'Map Cell Render Canvas')

export async function render(mapCanvas: CanvasCache, mapCells: MapCell[], width: number, additional?: (i: number, x: number, y: number) => Promise<void>) {

  const img = await textureCache.getTexture('terrain')
  const func = additional ? additional : () => undefined
  for (let i = 0; i < mapCells.length; i++) {
    const cell = mapCells[i];

    const rawX = (i % width)
    const rawY = floor((i / width))
    const x = rawX * MAP_CELL_SIZE
    const y = rawY * MAP_CELL_SIZE

    const [offsetX, offsetY] = getTextureOffset(MapCellTexturePos[cell.type], MAP_CELL_SIZE, MAP_TEXTURE_CHUNKS_PER_ROW)

    mapCellCanvas.ctx.translate(MAP_CELL_SIZE / 2, MAP_CELL_SIZE / 2)
    mapCellCanvas.ctx.rotate(cell.rotation)
    mapCellCanvas.ctx.translate(-MAP_CELL_SIZE / 2, -MAP_CELL_SIZE / 2)
    mapCellCanvas.ctx.drawImage(img, offsetX, offsetY, MAP_CELL_SIZE, MAP_CELL_SIZE, 0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)
    mapCellCanvas.ctx.resetTransform()

    mapCanvas.ctx.drawImage(mapCellCanvas.canvas, x, y, MAP_CELL_SIZE, MAP_CELL_SIZE)
    await func(i, x, y)

  }
}

export async function renderCellBuilding(point: DOMPoint, buildingCanvas: CanvasCache, building: Building) {

  const x = point.x * MAP_CELL_SIZE
  const y = point.y * MAP_CELL_SIZE

  buildingCanvas.ctx.clearRect(x, y, MAP_CELL_SIZE, MAP_CELL_SIZE)
  buildingCanvas.ctx.drawImage(await renderBuilding(building), x, y, MAP_CELL_SIZE, MAP_CELL_SIZE)

}


