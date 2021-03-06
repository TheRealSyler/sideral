import { h } from 'dom-chef'
import { Battlemode } from '../battlemode'
import { deleteSave, saveBattlemode } from '../save'
import { Soldier } from '../soldier'
import { BottomUI } from './bottomUI'
import { TopUI } from './topUI'

export function InitBattlemodeUI(game: Battlemode) {

  const endButton = <button className="button button-no-height" onClick={() => game.endTurn()}>End Turn</button>
  endButton.style.display = game.state.get('startedBattle') ? 'block' : 'none'
  const startButton = <button className="button" disabled onClick={(e) => {
    startButton.remove()
    endButton.style.display = 'block'
    game.state.set('startedBattle', true)
    game.state.resendListeners('selectedMapCell')
  }}>Start</button>
  game.state.addListener('canStartBattle', (canStart) => {
    (startButton as any as HTMLButtonElement).disabled = !canStart
  })

  game.state.addListener('playerTurn', (isPlayerTurn) => {
    (endButton as any as HTMLButtonElement).disabled = !isPlayerTurn
  })

  game.main.appendChild(<TopUI>
    <div></div>
    <div className="ui-top-resources">

      {endButton}

      <button className="button button-no-height" onClick={() => {
        deleteSave('saveTestBattleMode')
        location.reload()
      }}>Delete Save And Reload</button>

      <button className="button button-no-height" onClick={() => {
        saveBattlemode(game)
      }}>Save</button>
      <button className="button button-no-height" onClick={() => {
        location.reload()
      }}>Reload</button>
    </div>
  </TopUI>)


  const bottom = <BottomUI></BottomUI>

  game.state.addListener('selectedMapCell', (cell) => {

    bottom.innerHTML = ''
    const startedBattle = game.state.get('startedBattle')
    if (startedBattle) {
      if (cell) {
        const soldier = cell.currentUnit
        if (soldier) {

          bottom.appendChild(<div>
            <div>


              Name: {soldier.name}<br />
              Range: {soldier.getRange()}
            </div>
          </div>)
        } else {

          bottom.appendChild(<div>
            AWD
          </div>)

        }

      }


    } else {


      bottom.appendChild(<div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>

        {game.playerArmy.soldiers.map((soldier, i) =>
          createSoldierUI(i, soldier, game)
        )}
        <div>{startButton}</div>
      </div>)


    }
  })


  game.main.appendChild(bottom)
}

function createSoldierUI(i: number, soldier: Soldier, game: Battlemode) {
  const cell = game.state.get('selectedMapCell')

  const isInSelectedCell = cell === soldier.currentCell
  let button

  if (cell && !isInSelectedCell && (cell.currentUnit ? cell.currentUnit.team === soldier.team : true)) {
    button = <button className="button" onClick={() => {
      game.deploySoldier(cell, soldier)
    }}>{soldier.currentCell ? 'Re Deploy' : 'Deploy'}</button>
  } else if (soldier.currentCell) {
    button = <button className="button" onClick={() => {
      game.recallSoldier(soldier)
    }}>Recall</button>
  }

  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.2rem', }}>
    <div
      style={{ background: '#000', padding: '0.5rem 2rem' }}
      draggable="true"
      onDragOver={(e) => e.preventDefault()}
      onDragStart={(e) => {
        e.dataTransfer.setData('soldier', '' + i)
      }}
    >
      <span>{soldier.name}</span>


    </div>
    {button}
  </div>
}

