import { Building, BuildingInfo, BuildingNames, buildingInfo, BuildingLevel, BuildingLevelsEnum, LevelRequirement, Requirements } from "./building";
import { fromNow } from "./time";

export function newBuilding(type: BuildingNames): Building {
  return {
    workers: [],
    date: Date.now(),
    isUpgrading: true,
    level: -1,
    name: type,
  }
}

export function getLevelRequirement<T>(level: BuildingLevel, requirement?: LevelRequirement<T>) {
  if (requirement) {
    if (requirement[level]) return requirement[level];
    let res: T | undefined;
    const levelNum = BuildingLevelsEnum[level]
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
    return building.date + (info.constructionTime * 1000)
  }
  return building.date + buildingUpgradeFormula(info, building.level) * 1000;
}
export function buildingUpgradeFormula(info: BuildingInfo, level: number) {
  return Math.round(info.buildTime * (Math.pow(level - 3, info.buildTimeMultiplier)));
}

/** @internal @debug */
export function checkBuildingUpgradeTimes(name: BuildingNames) {
  const info = buildingInfo[name]
  for (let i = 3; i < 14; i++) {
    console.log(fromNow(buildingUpgradeEndDate({ level: i, date: Date.now() } as Building, info)))
  }
}

// # MAINTENANCE | PRODUCTION
export function buildingEndDate(building: Building, req: Requirements) {
  return building.date + buildingFormula(req, building.level) * 1000;
}

export function buildingFormula(info: Requirements, level: number) {
  return Math.round(info.rate / (Math.pow(level - 3, info.rateMultiplier)));
}

/** @internal @debug */
export function checkBuildingProductionTimes(name: BuildingNames) {
  const info = buildingInfo[name]
  if (info.canProduce) {
    for (let i = 4; i < 14; i++) {
      console.log(fromNow(buildingEndDate({ level: i, date: Date.now() } as Building, info.production)))
    }
  }
}