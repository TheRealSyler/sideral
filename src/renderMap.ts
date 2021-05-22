import { BuildingRenderer } from "./buildings";
import { loadTerrain, getImageOffset } from "./utils";
import { Map } from './map'
import terrain from './assets/terrains.png';

export async function renderMap(map: Map, width: number, cellSize: number, mapCellsPerRow: number) {
  const mapCanvas = document.createElement('canvas')
  const mapCellCanvas = document.createElement('canvas')
  const out = new Image;

  mapCanvas.width = width * cellSize
  mapCanvas.height = width * cellSize

  mapCellCanvas.width = cellSize
  mapCellCanvas.height = cellSize

  const mapCtx = mapCanvas.getContext('2d')
  const mapCellCtx = mapCellCanvas.getContext('2d')
  // TODO add notification 
  if (!mapCtx) return out
  if (!mapCellCtx) return out

  const img = await loadTerrain(terrain)
  const BR = new BuildingRenderer(cellSize)

  for (let i = 0; i < map.length; i++) {
    const cell = map[i];
    const rawX = (i % width)
    const rawY = Math.floor((i / width))
    const x = rawX * cellSize
    const y = rawY * cellSize

    const [offsetX, offsetY] = getImageOffset(cell.type, cellSize, mapCellsPerRow)

    mapCellCtx.translate(cellSize / 2, cellSize / 2)
    mapCellCtx.rotate(cell.rotation)
    mapCellCtx.translate(-cellSize / 2, -cellSize / 2)
    mapCellCtx.drawImage(img, offsetX, offsetY, cellSize, cellSize, 0, 0, cellSize, cellSize)

    mapCtx.drawImage(mapCellCanvas, x, y, cellSize, cellSize)

    if (cell.building) {

      mapCtx.drawImage(await BR.renderBuilding(cell.building), x, y, cellSize, cellSize)
    }

    mapCellCtx.resetTransform()

  }

  out.src = mapCanvas.toDataURL('image/png');
  return out
}



