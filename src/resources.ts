import { GameState, State } from './state';

export enum ResourcesEnum {
  wood,
  clay,
  stone,
  bread
}

export type ResourceName = keyof typeof ResourcesEnum;
export type Resources = { [key in ResourceName]: number }

export const defaultResources: Resources = {
  clay: 10,
  stone: 50,
  wood: 100,
  bread: 20
}


export type ResourceStack = {
  amount: number;
  type: ResourceName;
}[];


export function checkAndSubtractResources(state: State<GameState>, requiredResources: ResourceStack) {
  for (let i = 0; i < requiredResources.length; i++) {
    const resource = requiredResources[i];
    const stateResource = state.get(resource.type)
    if (stateResource - resource.amount < 0) {
      return false
    }
  }

  for (let i = 0; i < requiredResources.length; i++) {
    const resource = requiredResources[i];
    state.setFunc(resource.type, (v) => v - resource.amount)
  }

  return true
}