import { BattlemodeCell } from './battlemode';
import { CampaignCell } from './campaign';
import { Resources } from "./resources";

export class State<State extends { [key: string]: any }> {
  private listeners: [keyof State, (val: any) => void][] = []
  constructor(private state: State) {
  }
  setFunc<K extends keyof State>(key: K, val: (v: State[K]) => State[K]) {
    this.state[key] = val(this.state[key])
    this.resendListeners(key)
  }
  set<K extends keyof State>(key: K, val: State[K]) {
    this.state[key] = val
    this.resendListeners(key)
  }
  get<K extends keyof State>(key: K) {
    return this.state[key]
  }

  addListener<K extends keyof State>(key: K, func: (val: State[K]) => void) {
    this.listeners.push([key, func])
  }

  resendListeners<K extends keyof State>(key: K) {
    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      if (listener[0] === key) {
        listener[1](this.state[key])
      }
    }
  }

  getState() {
    return this.state
  }
}

export interface CampaignState extends Resources {
  selectedMapCell: null | CampaignCell
}

export interface BattlemodeState {
  canStartBattle: boolean
  startedBattle: boolean
  playerTurn: boolean
  aiTurn: boolean;
  selectedMapCell: null | BattlemodeCell
}

