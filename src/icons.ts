import { MapCellName, MapCellTexturePos } from './map';
import resourceIcons from './assets/resourceIcons.png'
import cellIcons from './assets/cellIcons.png'
import buildingIcons from './assets/buildingIcons.png'
import { ResourceName, ResourcesEnum } from './resources';
import { floor, toPx } from './utils';
import { BUILDING_ICONS_PER_ROW, BUILDING_ICON_SIZE, MAP_CELL_ICONS_PER_ROW, MAP_CELL_ICON_SIZE, RESOURCE_ICONS_PER_ROW, RESOURCE_ICON_SIZE } from './globalConstants';
import { BuildingEnum, BuildingNames } from './building';

export function getResourceIcon(type: ResourceName) {
  return getGenericIcon(ResourcesEnum[type], RESOURCE_ICONS_PER_ROW, RESOURCE_ICON_SIZE, resourceIcons);
}

export function getCellIcon(type: MapCellName) {
  return getGenericIcon(MapCellTexturePos[type], MAP_CELL_ICONS_PER_ROW, MAP_CELL_ICON_SIZE, cellIcons);
}

export function getBuildingIcon(type: BuildingNames) {
  return getGenericIcon(BuildingEnum[type], BUILDING_ICONS_PER_ROW, BUILDING_ICON_SIZE, buildingIcons);
}

function getGenericIcon(i: number, perRow: number, size: number, src: string) {
  const el = document.createElement('span')
  const x = i % perRow;
  const y = floor(i / perRow);
  el.style.backgroundImage = `url(${src})`;
  el.style.backgroundPositionX = toPx(x * -size);
  el.style.backgroundPositionY = toPx(y * -size);
  el.style.height = toPx(size);
  el.style.width = toPx(size);
  el.style.display = 'inline-block';
  return el
}