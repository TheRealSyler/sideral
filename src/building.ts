import { AchievementName, AchievementStack } from './achievements';
import { MapCellName } from "./map";
import { Resources, ResourceStack } from "./resources";

export interface Building {
  name: BuildingNames,
  level: number,
  /** started upgrading or extracting a resource */
  date: Date // TODO think of a  better name.? maybe
  isUpgrading: boolean;
}

export const cellBuildings: { [key in MapCellName]?: BuildingNames[] } = {
  gras: ['base', 'house', 'bakery',],
  forest: ['woodcutter']
}

export type LevelRequirement<T> = {
  [key in BuildingLevel]?: T;
};

interface BaseBuildingInfo {
  /**build time in seconds */
  buildTime: number;
  constructionTime: number;
  // /**build time multiplier per level */
  buildTimeMultiplier: number;
  constructionRequirements: ResourceStack;
  constructionAchievements?: AchievementStack;
  upgradeRequirements: LevelRequirement<ResourceStack>;
  achievementRequirement?: LevelRequirement<AchievementStack>;
  achievementUnlocks?: LevelRequirement<AchievementStack>;
}


export interface ProductionBuildingInfo extends BaseBuildingInfo {
  canProduce?: boolean
  /**resource production per second */
  productionRate: number;
  // /**production rate  multiplier per level */
  productionRateMultiplier: number;
  /** if specified it uses the resources otherwise the cell resources are used */
  productionResourceRequirements?: LevelRequirement<ResourceStack>;
  productionType: keyof Resources
}


interface NonProductionBuildingInfo extends BaseBuildingInfo {
  canProduce?: false
}

export type BuildingInfo = NonProductionBuildingInfo | ProductionBuildingInfo
export enum BuildingEnum {
  'base', 'house', 'woodcutter', 'bakery'
}
export type BuildingNames = keyof typeof BuildingEnum

export enum BuildingLevelsEnum {
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'
}
export type BuildingLevel = keyof typeof BuildingLevelsEnum


export const buildingInfo: { [key in BuildingNames]: BuildingInfo } = {
  base: {
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 1,
    constructionRequirements: [{ amount: 20, type: 'wood' }, { amount: 10, type: 'stone' }],
    upgradeRequirements: { I: [{ amount: 40, type: 'wood' }, { amount: 20, type: 'stone' }], },
    achievementUnlocks: { I: 'Base I', II: 'Base II', III: 'Base III', IV: 'Base IV', V: 'Base V', VI: 'Base VI', VII: 'Base VII', VIII: 'Base VIII', IX: 'Base IX', X: 'Base X' },
    achievementRequirement: { I: 'Woodcutter I' }
  },
  house: {
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 10,
    achievementRequirement: { I: 'Base II' },
    constructionAchievements: 'Base I',
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] }
  },
  woodcutter: {
    buildTime: 3,
    buildTimeMultiplier: 2,
    constructionTime: 2,
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] },
    canProduce: true,
    productionRate: 10,
    productionRateMultiplier: 0.75,
    constructionAchievements: 'Base I',
    achievementRequirement: { I: 'Base II', II: 'Base III' },
    achievementUnlocks: { I: 'Woodcutter I' },
    productionType: 'wood'
  },
  bakery: {
    buildTime: 60,
    buildTimeMultiplier: 4.5,
    constructionTime: 2,
    canProduce: true,
    productionRate: 5,
    productionType: 'bread',
    constructionAchievements: 'Base I',
    achievementRequirement: { I: 'Base I' },
    productionResourceRequirements: { I: [{ amount: 1, type: 'clay' }, { amount: 1, type: 'wood' }] },
    productionRateMultiplier: 0.75,
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] }
  },
}
