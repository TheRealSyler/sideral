import './index.sass';
import { Game } from './game';
import { generateMap } from './mapGenerator';
import { MAP_CELLS_PER_ROW } from './globalConstants';
import { CanvasViewer } from './canvasViewer';
import { islandMaskGen, oreMaskGen } from './mapMasks';

(async () => {

  let a = false
  a = true

  const seed = 0
  if (a) {
    // const t = performance.now()
    const m = generateMap(MAP_CELLS_PER_ROW, seed)
    // console.log('S T', performance.now() - t)
    new Game(m, MAP_CELLS_PER_ROW)
  } else {

    const s = 64
    const viewer = new CanvasViewer(s, 800 / s)
    viewer.drawNumArray(oreMaskGen(seed, s, islandMaskGen(seed, s).mask))
  }

})()
