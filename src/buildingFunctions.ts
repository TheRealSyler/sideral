import { Building, BuildingInfo, BuildingNames, buildingInfo, ProductionBuildingInfo, BuildingLevel, BuildingLevelsEnum, LevelRequirement } from "./building";
import { fromNow } from "./time";

export function displayBuildingLevel(level: number) {
  switch (level) {
    case -1:
    case 0:
    case 1:
    case 2:
    case 3:
      return 'In Construction'
    case 14:
    case 15:
      return 'Destroyed'
    default:
      return convertBuildingLevel(level)
  }
}

export function newBuilding(type: BuildingNames): Building {
  return {
    date: new Date,
    isUpgrading: true,
    level: -1,
    name: type,
  }
}

export function getLevelRequirement<T>(level: BuildingLevel, requirement?: LevelRequirement<T>) {
  if (requirement) {
    if (requirement[level]) return requirement[level];
    let res: T | undefined;
    const levelNum = BuildingLevelsEnum[level] - 1
    let highest = -1

    for (const key in requirement) {
      if (Object.prototype.hasOwnProperty.call(requirement, key)) {
        const keyNum = BuildingLevelsEnum[key as keyof LevelRequirement<T>];
        if (levelNum > keyNum && keyNum >= highest) {
          highest = keyNum
          res = requirement[key as keyof LevelRequirement<T>]!;
        }
      }
    }
    return res

  }
}

export function convertBuildingLevel(level: number) {
  return BuildingLevelsEnum[level - 4] as BuildingLevel
}


// # UPGRADE
export function buildingUpgradeEndDate(building: Building, info: BuildingInfo) {
  if (building.level < 4) {
    return building.date.getTime() + (info.constructionTime * 1000)
  }
  return building.date.getTime() + (Math.round(info.buildTime * (Math.pow(building.level - 3, info.buildTimeMultiplier))) * 1000);
}
/** @internal @debug */
export function checkBuildingUpgradeTimes(name: BuildingNames) {
  const info = buildingInfo[name]
  for (let i = 3; i < 14; i++) {
    console.log(fromNow(buildingUpgradeEndDate({ level: i, date: new Date() } as Building, info)))
  }
}
// # PRODUCTION
export function buildingProductionEndDate(building: Building, info: ProductionBuildingInfo) {
  return building.date.getTime() + (Math.round(info.productionRate / (Math.pow(building.level - 3, info.productionRateMultiplier))) * 1000);
}

/** @internal @debug */
export function checkBuildingProductionTimes(name: BuildingNames) {
  const info = buildingInfo[name]
  for (let i = 4; i < 14; i++) {
    console.log(fromNow(buildingProductionEndDate({ level: i, date: new Date() } as Building, info as any)))
  }
}