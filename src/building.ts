import { AchievementStack } from './achievements';
import { Citizen } from './citizen';
import { MapCellName } from "./map";
import { Resources, ResourceStack } from "./resources";

export interface Building {
  name: BuildingNames,
  level: number,
  /** started upgrading or extracting a resource */
  date: number // TODO think of a  better name.? maybe
  isUpgrading: boolean;
  workers: Citizen[]
}

export const cellBuildings: { [key in MapCellName]?: BuildingNames[] } = {
  gras: ['base', 'house', 'farm', 'bakery', 'wheat farm', 'wind mill'],
  forest: ['woodcutter'],
  stone: ['stone mine']
}

export type LevelRequirement<T> = {
  [key in BuildingLevel]?: T;
};

interface BaseBuildingInfo {
  /**build time in seconds */
  buildTime: number;
  constructionTime: number;
  /**build time multiplier per level */
  buildTimeMultiplier: number;
  workers: number;
  constructionRequirements: ResourceStack;
  constructionAchievements?: AchievementStack;
  upgradeRequirements: LevelRequirement<ResourceStack>;
  achievementRequirement?: LevelRequirement<AchievementStack>;
  achievementUnlocks?: LevelRequirement<AchievementStack>;
}

export interface ProductionBuildingInfo extends BaseBuildingInfo {
  canProduce: true
  production: Requirements
  productionType: keyof Resources
}
// TODO find better name
export type Requirements = {
  requirements?: LevelRequirement<ResourceStack>;
  rate: number;
  rateMultiplier: number;
};

export interface NonProductionBuildingInfo extends BaseBuildingInfo {
  canProduce?: false;
}

export type BuildingInfo = NonProductionBuildingInfo | ProductionBuildingInfo
export enum BuildingEnum {
  'base', 'house', 'bakery', 'stone mine', 'woodcutter', 'wheat farm', 'wind mill', 'farm',
}
export type BuildingNames = keyof typeof BuildingEnum

export enum BuildingLevelsEnum {
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'
}
export type BuildingLevel = keyof typeof BuildingLevelsEnum


export const buildingInfo: { [key in BuildingNames]: BuildingInfo } = {
  base: {
    workers: 2,
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 1,
    constructionRequirements: [{ amount: 20, type: 'wood' }, { amount: 10, type: 'stone' }],
    upgradeRequirements: { I: [{ amount: 40, type: 'wood' }, { amount: 20, type: 'stone' }], },
    achievementUnlocks: { I: 'Base I', II: 'Base II', III: 'Base III', IV: 'Base IV', V: 'Base V', VI: 'Base VI', VII: 'Base VII', VIII: 'Base VIII', IX: 'Base IX', X: 'Base X' },
    achievementRequirement: { I: 'Woodcutter I', II: 'Stone Mine I' },
  },
  house: {
    workers: 1,
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 2,
    achievementRequirement: { I: 'Base II' },
    constructionAchievements: 'Base I',
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] }
  },
  woodcutter: {
    workers: 1,
    buildTime: 3,
    buildTimeMultiplier: 2,
    constructionTime: 2,
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] },
    canProduce: true,
    production: {
      rate: 2,
      rateMultiplier: 0.75,
    },
    constructionAchievements: 'Base I',
    achievementRequirement: { I: 'Base II', II: 'Base III' },
    achievementUnlocks: { I: 'Woodcutter I' },
    productionType: 'wood',
  },
  "stone mine": {
    workers: 1,
    buildTime: 3,
    buildTimeMultiplier: 2,
    constructionTime: 2,
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 30, type: 'wood' }] },
    canProduce: true,
    production: {
      rate: 2,
      rateMultiplier: 0.75,
    },
    constructionAchievements: 'Base II',
    achievementRequirement: { I: 'Base III', },
    achievementUnlocks: { I: 'Stone Mine I' },
    productionType: 'stone',
  },
  bakery: {
    workers: 1,
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 2,
    canProduce: true,
    production: {
      rate: 2,
      rateMultiplier: 0.75,
      requirements: { I: [{ amount: 1, type: 'flour' }] }
    },
    productionType: 'food',
    constructionAchievements: 'Base IV',
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] },
  },
  "wheat farm": {
    workers: 1,
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 2,
    canProduce: true,
    production: {
      rate: 2,
      rateMultiplier: 0.75,
    },
    productionType: 'wheat',
    constructionAchievements: 'Base IV',
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] },
  },
  "wind mill": {
    workers: 1,
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 2,
    canProduce: true,
    production: {
      rate: 2,
      rateMultiplier: 0.75,
      requirements: { I: [{ amount: 1, type: 'wheat' }] }
    },
    productionType: 'flour',
    constructionAchievements: 'Base IV',
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] },
  },
  farm: {
    workers: 1,
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 2,
    canProduce: true,
    production: {
      rate: 2,
      rateMultiplier: 0.75,
    },
    productionType: 'food',
    constructionAchievements: 'Base I',
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] },
  },
}
