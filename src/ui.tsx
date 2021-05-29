import { MapCell } from "./map";
import { State, GameState } from "./state";
import { toPx } from "./utils";
import { h } from 'dom-chef'
import { defaultResources, GameResources, checkAndSubtractResources } from "./resources";
import { buildingInfo, BuildingNames, cellBuildings, } from "./building";
import { fromNow } from "./time";
import { UiEvents } from "./uiEvents";
import { buildingUpgradeEndDate, buildingProductionEndDate, newBuilding, getLevelRequirement, convertBuildingLevel } from "./buildingFunctions";
import { Save } from './save';
import { checkAchievementRequirement } from './achievements';
import { cellIcons } from './icons';

export function InitUI(state: State<GameState>, gameSave: Save, topHeight: number, bottomHeight: number) {
  topUI(state, topHeight);
  bottomUI(state, gameSave, bottomHeight);
}

function topUI(state: State<GameState>, topHeight: number) {
  const elements: HTMLSpanElement[] = []
  for (const key in defaultResources) {
    if (Object.prototype.hasOwnProperty.call(defaultResources, key)) {
      const value = state.get(key as keyof GameResources)
      const val = <span>{value}</span>
      state.addListener(key as keyof GameResources, (v) => {
        val.textContent = v.toString()
      })
      elements.push(<span> {key}: {val}</span>)
    }
  }
  const top = <div className="ui-top">{elements}</div>;

  top.style.height = toPx(topHeight);
  document.body.appendChild(top);
}

function bottomUI(state: State<GameState>, gameSave: Save, bottomHeight: number,) {
  document.body.style.setProperty('--bottom-height', `${bottomHeight}px`)
  const uiEvents = new UiEvents()
  const cellName = <span> - </span>;
  const cellIcon = <div className="cell-icon"></div>;
  const cellResourcesAmount = <span></span>;
  const cellBuilding = <span className="building-cards"> </span>;

  const upgradeTimeLeftEvent = 'upgrade-time';
  state.addListener('selectedMapChunk', (v) => {
    uiEvents.remove(upgradeTimeLeftEvent)
    if (v) {
      const { cell } = v;
      cellIcon.style.backgroundImage = `url(${cellIcons[cell.type]})`
      cellName.textContent = cell.type;
      cellResourcesAmount.textContent = cell.resourceAmount === -1 ?
        '' :
        `(${cell.resourceAmount})` || 'Depleted';

      cellBuilding.innerHTML = ''
      const building = cell.building
      if (building) {
        const upgradeTime = <span></span>
        const prodTime = <span></span>
        const info = buildingInfo[building.name]

        if (building.isUpgrading) {
          const updateUpgradeTime = () => {
            upgradeTime.textContent = fromNow((buildingUpgradeEndDate(building, info)));
          };
          uiEvents.add(upgradeTimeLeftEvent, updateUpgradeTime);
          updateUpgradeTime()
        } else if (info.canProduce) {
          const updateProductionTime = () => {
            prodTime.textContent = fromNow((buildingProductionEndDate(building, info)));
          };
          uiEvents.add(upgradeTimeLeftEvent, updateProductionTime);
          updateProductionTime()

        }

        cellBuilding.appendChild(buildingCard(building.name, gameSave, building.level < 3 ? 3 : building.level, state, cell, upgradeTime, prodTime))
      } else {
        const availableBuildings = cellBuildings[cell.type]
        if (availableBuildings) {
          for (let i = 0; i < availableBuildings.length; i++) {
            const buildingName = availableBuildings[i];
            cellBuilding.appendChild(buildingCard(buildingName, gameSave, 3, state, cell))
          }
        }
      }

    }
  });

  const bottom = <div className="ui-bottom" style={{ height: bottomHeight }}>
    <div className="cell">
      <div className="cell-name">
        {cellName}
        {cellResourcesAmount}
      </div>
      {cellIcon}

    </div>
    <div>

      {cellBuilding}
    </div>

  </div>;

  document.body.appendChild(bottom);
}



function buildingCard(
  building: BuildingNames,
  gameSave: Save,
  level: number,
  state: State<GameState>,
  cell: MapCell,
  upgradeTime?: HTMLSpanElement,
  prodTime?: HTMLSpanElement
) {
  const isUpgrading = upgradeTime?.textContent;
  const isAlreadyBuilt = level > 3;
  const info = buildingInfo[building]
  const levelName = convertBuildingLevel(level);

  const req = info.achievementRequirement;

  let canBuild = true
  if (isAlreadyBuilt && req) {
    canBuild = checkAchievementRequirement(gameSave.achievements, req[levelName]);
  } else {
    canBuild = checkAchievementRequirement(gameSave.achievements, info.constructionAchievements);
  }

  const reqResources = isAlreadyBuilt ? getLevelRequirement(levelName, info.upgradeRequirements) : info.constructionRequirements;

  const buildResources = []
  if (reqResources && !isUpgrading) {
    for (let i = 0; i < reqResources.length; i++) {
      const resource = reqResources[i];
      buildResources.push(<div >{resource.type}: {resource.amount}</div>)
    }
  }
  return <div className="building-card">
    <span>{prodTime} {building} {levelName}</span>
    <div className="building-card-middle">
      <div className="building-card-icon">ICON</div>
      <span className="building-card-resources">
        {buildResources}
      </span>
    </div>

    <button
      className="button"
      disabled={!canBuild}
      onClick={() => {
        if (!reqResources) {
          console.error('This should not happen, UI - build building card, (ctrl f this, obviously)')
          return
        }

        if (canBuild && checkAndSubtractResources(state, reqResources)) {
          if (cell.building) {
            cell.building.isUpgrading = true
            cell.building.date = new Date()
          } else {
            cell.building = newBuilding(building);
          }
          state.resendListeners('selectedMapChunk');
        }
      }}
    >
      {isUpgrading ? upgradeTime : isAlreadyBuilt ? 'Upgrade' : 'Build'}
    </button>
  </div>
}