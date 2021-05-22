import { MapCell } from "./map";
import { GameResources } from "./resources";

export class State<State extends { [key: string]: any }> {
  private listeners: [keyof State, (val: any) => void][] = []
  constructor(private state: State) {
  }

  set<K extends keyof State>(key: K, val: State[K]) {
    this.state[key] = val
    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      if (listener[0] === key) {
        listener[1](val)
      }
    }
  }
  get<K extends keyof State>(key: K) {
    return this.state[key]
  }

  addListener<K extends keyof State>(key: K, func: (val: State[K]) => void) {
    this.listeners.push([key, func])
  }
}




export interface GameState extends GameResources {

  selectedMapChunk: null | { cell: MapCell, x: number, y: number }
}

