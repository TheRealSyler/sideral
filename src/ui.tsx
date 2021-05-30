import { MapCell } from "./map";
import { State, GameState } from "./state";
import { toPx } from "./utils";
import { Fragment, h } from 'dom-chef'
import { defaultResources, Resources, checkAndSubtractResources, ResourceName } from "./resources";
import { buildingInfo, BuildingNames, cellBuildings, } from "./building";
import { displaySeconds, fromNow } from "./time";
import { UiEvents } from "./uiEvents";
import { buildingUpgradeEndDate, buildingProductionEndDate, newBuilding, getLevelRequirement, convertBuildingLevel, buildingUpgradeFormula, buildingProductionFormula } from "./buildingFunctions";
import { Save } from './save';
import { checkAchievementRequirement } from './achievements';
import { getBuildingIcon, getCellIcon, getResourceIcon } from './icons';
import { MAP_CELL_ICON_SIZE } from './globalConstants';

export function InitUI(state: State<GameState>, gameSave: Save, topHeight: number, bottomHeight: number) {
  document.body.style.setProperty('--bottom-height', toPx(bottomHeight))
  document.body.style.setProperty('--cell-icon-size', toPx(MAP_CELL_ICON_SIZE))
  topUI(state, topHeight);
  bottomUI(state, gameSave, bottomHeight);
}

function topUI(state: State<GameState>, topHeight: number) {
  const elements: HTMLSpanElement[] = []
  for (const key in defaultResources) {
    if (Object.prototype.hasOwnProperty.call(defaultResources, key)) {
      const value = state.get(key as ResourceName)
      const val = <span>{value}</span>
      state.addListener(key as ResourceName, (v) => {
        val.textContent = v.toString()
      })
      elements.push(<span className="resource" title={key}>{val} {getResourceIcon(key as ResourceName)}</span>)
    }
  }
  const top = <div className="ui-top">{elements}</div>;

  top.style.height = toPx(topHeight);
  document.body.appendChild(top);
}

function bottomUI(state: State<GameState>, gameSave: Save, bottomHeight: number,) {
  const uiEvents = new UiEvents()
  const cellName = <span > </span>;
  const cellIcon = <div className="cell-icon"></div>;
  const cellResourcesAmount = <span></span>;
  const cellBuilding = <div className="building-cards"> </div>;

  const upgradeTimeLeftEvent = 'upgrade-time';
  state.addListener('selectedMapChunk', (selectedPos) => {
    uiEvents.remove(upgradeTimeLeftEvent)
    cellIcon.innerHTML = ''
    cellBuilding.innerHTML = ''
    cellName.textContent = ''
    cellResourcesAmount.textContent = ''
    if (selectedPos) {
      const { cell } = selectedPos;
      cellIcon.appendChild(getCellIcon(cell.type))
      cellName.textContent = cell.type;
      cellResourcesAmount.textContent = cell.resourceAmount === -1 ?
        '' :
        `(${cell.resourceAmount})` || 'Depleted';

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

    {cellBuilding}

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
  if (reqResources) {
    for (let i = 0; i < reqResources.length; i++) {
      const resource = reqResources[i];
      buildResources.push(<div className="resource" title={resource.type} >{getResourceIcon(resource.type)} {resource.amount}</div>)
    }
  }
  const productionTimeReduction = info.canProduce ?
    `-${displaySeconds(buildingProductionFormula(info, level) - buildingProductionFormula(info, level + 1))} Production time` : null;

  const aUnlocks = info.achievementUnlocks;
  const nextLevelAchievements = aUnlocks && aUnlocks[convertBuildingLevel(level + 1)];
  const aReq = info.achievementRequirement
  const aRequirements = aReq && aReq[levelName]

  const resourceProdReq = info.canProduce && getLevelRequirement(isAlreadyBuilt ? levelName : 'I', info.productionResourceRequirements)


  return <div className="building-card">
    <span>{building} {levelName}</span>
    <div className="building-card-middle">
      {getBuildingIcon(building)}
      <div className="building-card-resources" style={{ opacity: isUpgrading ? 0 : 1 }}>
        {isAlreadyBuilt ? 'Upgrade' : 'Build'}
        {buildResources}
        {isAlreadyBuilt ?
          (flattenArray(aRequirements))
          : <span>{info.constructionAchievements}</span>}
      </div>
      {
        info.canProduce && <div className="building-card-column" style={{ opacity: isUpgrading ? 0 : 1 }}>
          Produces
        {isAlreadyBuilt && <span>every {displaySeconds(buildingProductionFormula(info, level))}</span>}
          <span className="resource">{getResourceIcon(info.productionType)}
            {isAlreadyBuilt ?
              prodTime : `every ${displaySeconds(info.productionRate)}`}
          </span>
        </div>
      }
      {
        resourceProdReq && <div className="building-card-column" style={{ opacity: isUpgrading ? 0 : 1 }}>
          Uses
        {Array.isArray(resourceProdReq) && resourceProdReq.map((v) => <span className="resource">{v.amount} {getResourceIcon(v.type)}</span>)}
        </div>
      }
      {
        nextLevelAchievements && <div className="building-card-column" style={{ opacity: isUpgrading ? 0 : 1 }}>
          Unlocks
        {flattenArray(nextLevelAchievements)}
        </div>
      }
      {
        isAlreadyBuilt && productionTimeReduction ? <div className="building-card-column" style={{ opacity: isUpgrading ? 0 : 1 }}>
          Next Level
          <span>{productionTimeReduction}</span>
        </div> : null
      }
    </div>

    <button
      className="button"
      disabled={!canBuild || !!isUpgrading}
      onClick={() => {
        if (!reqResources) {
          console.error('This should not happen, UI - build building card, (ctrl f this, obviously)')
          return
        }

        if (canBuild && checkAndSubtractResources(state, reqResources)) {
          if (cell.building) {
            cell.building.isUpgrading = true
            cell.building.date = Date.now()
          } else {
            cell.building = newBuilding(building);
          }
          state.resendListeners('selectedMapChunk');
        }
      }}
    >
      {isUpgrading ? upgradeTime : isAlreadyBuilt ? 'Upgrade' : 'Build'} ({isAlreadyBuilt ?
        displaySeconds(buildingUpgradeFormula(info, level)).trimEnd() : displaySeconds(info.constructionTime)})
    </button>
  </div>
}

function flattenArray(aRequirements?: string | string[]) {
  return Array.isArray(aRequirements) ?
    aRequirements.map(v => <span>{v}</span>) : <span>{aRequirements}</span>;
}
