import { AchievementName, AchievementStack } from './achievements';
import { MapCellName } from "./map";
import { GameResources, ResourceStack } from "./resources";

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
  productionType: keyof GameResources
}


interface NonProductionBuildingInfo extends BaseBuildingInfo {
  canProduce?: false
}

export type BuildingInfo = NonProductionBuildingInfo | ProductionBuildingInfo

export type BuildingNames = 'base' | 'house' | 'woodcutter' | 'bakery'

export enum BuildingLevelsEnum {
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'
}
export type BuildingLevel = keyof typeof BuildingLevelsEnum


export const buildingInfo: { [key in BuildingNames]: BuildingInfo } = {
  base: {
    buildTime: 4,
    buildTimeMultiplier: 4.5,
    constructionTime: 3,
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 20, type: 'wood' }, { amount: 10, type: 'stone' }], II: [{ amount: 40, type: 'wood' }, { amount: 10, type: 'stone' }] },
    achievementUnlocks: { I: 'baseI', II: 'baseII', III: 'baseIII', IV: 'baseIV', V: 'baseV', VI: 'baseVI', VII: 'baseVII', VIII: 'baseVIII', IX: 'baseIX', X: 'baseX' }
  },
  house: {
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 10,
    achievementRequirement: { I: 'baseII' },
    constructionAchievements: 'baseI',
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] }
  },
  woodcutter: {
    buildTime: 20,
    buildTimeMultiplier: 2,
    constructionTime: 6,
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] },
    canProduce: true,
    productionRate: 10,
    productionRateMultiplier: 0.75,
    constructionAchievements: 'baseI',
    achievementRequirement: { I: 'baseII', II: 'baseIII' },
    productionType: 'wood'
  },
  bakery: {
    buildTime: 60,
    buildTimeMultiplier: 4.5,
    constructionTime: 10,
    canProduce: true,
    productionRate: 100,
    productionType: 'bread',
    constructionAchievements: 'baseI',
    achievementRequirement: { I: 'baseI' },
    productionRateMultiplier: 0.75,
    constructionRequirements: [{ amount: 20, type: 'wood' }],
    upgradeRequirements: { I: [{ amount: 10, type: 'wood' }] }
  },
}
