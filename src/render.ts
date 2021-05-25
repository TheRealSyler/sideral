import { getTextureOffset } from "./utils";
import { Map, MapCellTexturePos } from './map'
import terrain from './assets/terrains.png';
import { renderBuilding } from "./buildingRender";
import { TextureCache } from "./textureCache";
import { MAP_CELL_SIZE, MAP_CELLS_PER_ROW } from "./globalConstants";
import { CanvasCache } from "./canvasCache";
import { Building } from "./building";


const textureCache = new TextureCache({ terrain: terrain })

const mapCellCanvas = new CanvasCache(MAP_CELL_SIZE, 'Map Cell Render Canvas')

export async function render(mapCanvas: CanvasCache, buildingCanvas: CanvasCache, map: Map, width: number) {

  const img = await textureCache.getTexture('terrain')

  for (let i = 0; i < map.cells.length; i++) {
    const cell = map.cells[i];
    const rawX = (i % width)
    const rawY = Math.floor((i / width))
    const x = rawX * MAP_CELL_SIZE
    const y = rawY * MAP_CELL_SIZE

    const [offsetX, offsetY] = getTextureOffset(MapCellTexturePos[cell.type], MAP_CELL_SIZE, MAP_CELLS_PER_ROW)

    mapCellCanvas.ctx.translate(MAP_CELL_SIZE / 2, MAP_CELL_SIZE / 2)
    mapCellCanvas.ctx.rotate(cell.rotation)
    mapCellCanvas.ctx.translate(-MAP_CELL_SIZE / 2, -MAP_CELL_SIZE / 2)
    mapCellCanvas.ctx.drawImage(img, offsetX, offsetY, MAP_CELL_SIZE, MAP_CELL_SIZE, 0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)
    mapCellCanvas.ctx.resetTransform()

    mapCanvas.ctx.drawImage(mapCellCanvas.canvas, x, y, MAP_CELL_SIZE, MAP_CELL_SIZE)
    if (cell.building) {
      buildingCanvas.ctx.drawImage(await renderBuilding(cell.building), x, y, MAP_CELL_SIZE, MAP_CELL_SIZE)
    }

  }

}

export async function renderCellBuilding(point: DOMPoint, buildingCanvas: CanvasCache, building: Building) {

  const x = point.x * MAP_CELL_SIZE
  const y = point.y * MAP_CELL_SIZE

  buildingCanvas.ctx.clearRect(x, y, MAP_CELL_SIZE, MAP_CELL_SIZE)
  buildingCanvas.ctx.drawImage(await renderBuilding(building), x, y, MAP_CELL_SIZE, MAP_CELL_SIZE)

}


