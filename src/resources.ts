export interface GameResources {
  stone: number,
  wood: number,
  clay: number,
  bread: number,
}

export const defaultResources: GameResources = {
  clay: 10,
  stone: 10,
  wood: 40,
  bread: 20
}