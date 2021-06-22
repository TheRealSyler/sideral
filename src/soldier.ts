import { BattlemodeCell, Battlemode, SoldierSave } from './battlemode'
import { Unit } from './unit'
import { angleTo, distance, floor } from './utils'

export interface SoldierAttributes {
  name: string
  range?: number
  team?: 'ai' | 'player'
  health?: 'wounded' | 'healthy' | 'dead'
}

export class Soldier extends Unit implements Required<SoldierAttributes> {
  name: string
  range: number
  health: NonNullable<SoldierAttributes['health']>
  team: NonNullable<SoldierAttributes['team']>

  attack: BattlemodeCell | undefined = undefined

  isInTurn = false

  static soldierSpeed = 3
  constructor(game: Battlemode, { name, range, team, health }: SoldierAttributes, save?: SoldierSave) {
    super(game, undefined, save, Soldier.soldierSpeed)
    this.selected = true
    // this.canMove = false
    this.avoidOtherUnits = false

    this.name = name
    this.range = range || 4
    this.team = team || 'player'
    this.health = health || 'healthy'
  }

  save(): SoldierSave {
    return {
      ...super.save(),
      attribs: { name: this.name, range: this.range, team: this.team, health: this.health }
    }
  }

  protected updatePosition() {
    if (this.isInTurn) {
      const angle = angleTo(this.x, this.y, this.target.x, this.target.y)
      const d = distance(this.x, this.y, this.target.x, this.target.y)

      if (d > 2) {
        const movementX = Math.sin(angle) * (this.speed)
        const movementY = Math.cos(angle) * (this.speed)
        this.x += movementX
        this.y += movementY
      } else {
        this.isInTurn = !!this.moveToNewTarget();
      }

    }
  }

  async update(ctx: CanvasRenderingContext2D) {
    this.updatePosition()
    let color

    switch (this.health) {
      case 'dead':
        color = '#f00'
        break;
      case 'wounded':
        color = '#f0f'
        break;
      case 'healthy':
        color = '#0f0'


    }

    await super.draw(ctx, color, this.team === 'ai' ? '#f00' : undefined)
  }


  getRange() {
    switch (this.health) {
      case 'dead':
        return 0;
      case 'wounded':
        return floor(this.range / 2)
      case 'healthy':
        return this.range
    }
  }
}