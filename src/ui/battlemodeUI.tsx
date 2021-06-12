import { h } from 'dom-chef'
import { Battlemode } from '../battlemode'
import { BottomUI } from './bottomUI'
import { TopUI } from './topUI'

export function InitBattlemodeUI(game: Battlemode) {

  game.main.appendChild(<TopUI>
  </TopUI>)


  const a = <span></span>
  game.state.addListener('selectedMapCell', (cell) => {
    if (cell) {

      a.textContent = JSON.stringify(cell)

    }
  })

  game.main.appendChild(<BottomUI>
    {a}
  </BottomUI>)
}

