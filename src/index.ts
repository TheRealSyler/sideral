import './index.sass';
import { Game } from './game';
import { generateMap } from './mapGenerator';
import { MAP_CELLS_PER_ROW } from './globalConstants';



(async () => {


  const t = performance.now()
  const m = generateMap(MAP_CELLS_PER_ROW, 0)
  console.log('S T', performance.now() - t)
  new Game(m, MAP_CELLS_PER_ROW)
})()
