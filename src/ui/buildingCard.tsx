import { h } from 'dom-chef'
import { MapCell } from "../map";
import { checkAndSubtractResources } from "../resources";
import { Building, buildingInfo, BuildingNames } from "../building";
import { displaySeconds } from "../time";
import { newBuilding, getLevelRequirement, convertBuildingLevel, buildingUpgradeFormula, buildingFormula } from "../buildingFunctions";
import { checkAchievementRequirement } from '../achievements';
import { getBuildingIcon } from '../icons';
import { Game } from '../game';
import { manageCitizens } from './manageCitizens';
import { resourceArray, flattenArray, displayResourceStuff } from "./utils";

export function buildingCard(
  game: Game,
  buildingName: BuildingNames,
  level: number,
  cell: MapCell,
  building?: Building,
  upgradeTime?: HTMLSpanElement,
  prodTime?: HTMLSpanElement) {
  const isUpgrading = upgradeTime?.textContent;
  const isAlreadyBuilt = level > 3;
  const info = buildingInfo[buildingName];
  const levelName = convertBuildingLevel(level);

  const req = info.achievementRequirement;

  let canBuild = true;
  if (isAlreadyBuilt && req) {
    canBuild = checkAchievementRequirement(game.achievements, req[levelName]);
  } else {
    canBuild = checkAchievementRequirement(game.achievements, info.constructionAchievements);
  }

  const reqResources = isAlreadyBuilt ? getLevelRequirement(levelName, info.upgradeRequirements) : info.constructionRequirements;

  const productionTimeReduction = info.canProduce ?
    `-${displaySeconds(buildingFormula(info.production, level) - buildingFormula(info.production, level + 1))} Production time` : null;

  const aUnlocks = info.achievementUnlocks;
  const nextLevelAchievements = aUnlocks && aUnlocks[convertBuildingLevel(level + 1)];
  const aReq = info.achievementRequirement;
  const achievementReq = aReq && aReq[levelName];

  const opacity = isUpgrading ? 0 : 1;


  return <div className="building-card">
    <span>{buildingName} {levelName}</span>
    <div className="building-card-middle">
      {getBuildingIcon(buildingName)}
      <div className="building-card-resources" style={{ opacity }}>
        {isAlreadyBuilt ? 'Upgrade' : 'Build'}
        {reqResources && resourceArray(reqResources)}
        {isAlreadyBuilt ?
          (flattenArray(achievementReq))
          : <span>{info.constructionAchievements}</span>}
      </div>
      {displayResourceStuff({ info, isAlreadyBuilt, level, levelName, opacity, prodTime })}
      {nextLevelAchievements && <div className="building-card-column" style={{ opacity }}>
        Unlocks
        {flattenArray(nextLevelAchievements)}
      </div>}
      {isAlreadyBuilt && productionTimeReduction && <div className="building-card-column" style={{ opacity }}>
        Next Level
          <span>{productionTimeReduction}</span>
      </div>}
      {building && isAlreadyBuilt ? <button className="button" onClick={() => manageCitizens(game.citizens, building)}>Manage</button> : null}

    </div>

    <button
      className="button"
      disabled={!canBuild || !!isUpgrading}
      onClick={() => {
        if (!reqResources) {
          console.error('This should not happen, UI - build building card, (ctrl f this, obviously)');
          return;
        }
        if (canBuild && checkAndSubtractResources(game.state, reqResources)) {
          if (cell.building) {
            cell.building.isUpgrading = true;
            cell.building.date = Date.now();
          } else {
            cell.building = newBuilding(buildingName);
          }
          game.state.resendListeners('selectedMapCell');
        }
      }}
    >
      {isUpgrading ? upgradeTime : isAlreadyBuilt ? 'Upgrade' : 'Build'} ({isAlreadyBuilt ?
        displaySeconds(buildingUpgradeFormula(info, level)).trimEnd() : displaySeconds(info.constructionTime)})
    </button>
  </div>;
}