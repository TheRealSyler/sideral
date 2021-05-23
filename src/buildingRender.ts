import bakeryTex from './assets/bakery.png'
import { Building, BuildingNames } from './building';
import { CanvasCache } from './canvasCache';
import { MAP_CELL_SIZE } from './globalConstants';
import { TextureCache } from './textureCache';
import { getImageOffset } from "./utils";

const textureCache = new TextureCache<BuildingNames>({
  house: bakeryTex,
  bakery: bakeryTex,
  woodcutter: bakeryTex,
})

const buildingCanvas = new CanvasCache(MAP_CELL_SIZE, 'Building Renderer')

export async function renderBuilding(building: Building) {

  buildingCanvas.ctx.clearRect(0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)
  const [offsetX, offsetY] = getImageOffset(building.level, MAP_CELL_SIZE, 4)
  buildingCanvas.ctx.drawImage(await textureCache.getTexture(building.name), offsetX, offsetY, MAP_CELL_SIZE, MAP_CELL_SIZE, 0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)

  return buildingCanvas.canvas
}

