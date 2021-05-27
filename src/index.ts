import './index.sass';
import { Game } from './game';
import { generateMap } from './mapGenerator';
import { MAP_CELLS_PER_ROW } from './globalConstants';
import { CanvasViewer } from './canvasViewer';
import { forestMaskGen, islandMaskGen, oreMaskGen } from './mapMasks';



(async () => {


  // const t = performance.now()

  // console.log('S T', performance.now() - t)
  // new Game(generateMap(MAP_CELLS_PER_ROW, 0), MAP_CELLS_PER_ROW)

  const s = 64
  const viewer = new CanvasViewer(s, 800 / s)
  viewer.drawNumArray(oreMaskGen(0, s, islandMaskGen(0, s).mask))

})()
