import { h } from 'dom-chef'
import { Battlemode } from '../battlemode'
import { BottomUI } from './bottomUI'
import { TopUI } from './topUI'

export function InitBattlemodeUI(game: Battlemode) {

  game.main.appendChild(<TopUI>
  </TopUI>)
  game.main.appendChild(<BottomUI>
  </BottomUI>)
}

