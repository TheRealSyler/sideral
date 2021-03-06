import bakeryTex from './assets/bakery.png'
import house from './assets/house.png'
import base from './assets/base.png'
import woodcutter from './assets/woodcutter.png'
import { Building, BuildingNames } from './building';
import { CanvasCache } from './canvas/canvasCache';
import { MAP_CELL_SIZE } from './globalConstants';
import { TextureCache } from './textureCache';
import { getTextureOffset } from "./utils";

const textureCache = new TextureCache<BuildingNames>({
  base: base,
  house: house,
  bakery: bakeryTex,
  woodcutter: woodcutter,
  'stone mine': bakeryTex,
  'wheat farm': bakeryTex,
  'wind mill': bakeryTex,
  farm: bakeryTex,
})

const buildingCanvas = new CanvasCache(MAP_CELL_SIZE, 'Building Renderer')

export async function renderBuilding(building: Building) {

  buildingCanvas.ctx.clearRect(0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)
  const [offsetX, offsetY] = getTextureOffset(building.level, MAP_CELL_SIZE, 4)
  buildingCanvas.ctx.drawImage(
    await textureCache.getTexture(building.name),
    offsetX,
    offsetY,
    MAP_CELL_SIZE,
    MAP_CELL_SIZE,
    0, 0,
    MAP_CELL_SIZE,
    MAP_CELL_SIZE
  )

  return buildingCanvas.canvas
}

