import { GameState, State } from './state';

export interface GameResources {
  stone: number,
  wood: number,
  clay: number,
  bread: number,
}

export const defaultResources: GameResources = {
  clay: 10,
  stone: 20,
  wood: 80,
  bread: 20
}

export type ResourceStack = {
  amount: number;
  type: keyof GameResources;
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