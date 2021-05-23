import { MapCellName } from "./map";
import { GameResources } from "./resources";

export interface Building {
  name: BuildingNames,
  level: number,
  /** started upgrading or extracting a resource */
  date: Date // TODO think of a  better name.? maybe
  isUpgrading: boolean;
}

export type BuildingNames = 'house' | 'woodcutter' | 'bakery'


// TODO think of a better name
export const buildings: { [key in MapCellName]: null | BuildingNames[] } = {
  gras: ['house', 'bakery'],
  forest: ['woodcutter'],
  "water coast 2": null,
  "water coast 3": null,
  "water coast 4": null,
  "water coast": null,
  berries: null,
  bush: null,
  clay: null,
  copper: null,
  fruits: null,
  gold: null,
  iron: null,
  stone: null,
  tin: null,
  water: null,
}

interface BaseBuildingInfo {
  /**build time in seconds */
  buildTime: number;
  constructionTime: number;
  // /**build time multiplier per level */
  buildTimeMultiplier: number;
}

type ResourceStack = {
  amount: number;
  resource: keyof GameResources;
}[];

export interface ProductionBuildingInfo extends BaseBuildingInfo {
  canProduce?: boolean
  /**resource production per second */
  productionRate: number;
  // /**production rate  multiplier per level */
  productionRateMultiplier: number;
  /** if specified it uses the resources otherwise the cell resources are used */
  productionResourceRequirements?: ResourceStack
  productionType: keyof GameResources
}


interface NonProductionBuildingInfo extends BaseBuildingInfo {
  canProduce?: false
}

export type BuildingInfo = NonProductionBuildingInfo | ProductionBuildingInfo

export const buildingInfo: { [key in BuildingNames]: BuildingInfo } = {
  house: { // # house
    buildTime: 2,
    buildTimeMultiplier: 4.5,
    constructionTime: 10,
  },
  woodcutter: { // # woodcutter
    buildTime: 1,
    buildTimeMultiplier: 4.5,
    constructionTime: 60,
  },
  bakery: { // # bakery
    buildTime: 60,
    buildTimeMultiplier: 4.5,
    constructionTime: 10,
    canProduce: true,
    productionRate: 100,
    productionType: 'bread',
    productionRateMultiplier: 0.75
  },
}
