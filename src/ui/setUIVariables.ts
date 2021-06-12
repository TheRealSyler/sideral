import { UI_BOTTOM_HEIGHT, MAP_CELL_ICON_SIZE, UI_TOP_HEIGHT } from '../globalConstants'
import { toPx } from '../utils'

export function setUIVariables() {
  document.body.style.setProperty('--bottom-height', toPx(UI_BOTTOM_HEIGHT))
  document.body.style.setProperty('--top-height', toPx(UI_TOP_HEIGHT))
  document.body.style.setProperty('--cell-icon-size', toPx(MAP_CELL_ICON_SIZE))
}