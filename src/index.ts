import './index.sass';
import { generateBattleModeMap, generateMap } from './mapGenerator';
import { CanvasViewer } from './canvas/canvasViewer';
import { FindAStar, findPath, genAStarNodes, restoreAStarNodes } from './aStar';
import { setUIVariables } from './ui/setUIVariables';
import { Game } from './game';
import { floor, loadTexture } from './utils';

(async () => {
  document.addEventListener('contextmenu', event => event.preventDefault());
  setUIVariables()
  let a = false
  a = true
  const seed = 0
  if (a) {


    new Game(seed)

  } else {

    // const s = 64
    // const viewer = new CanvasViewer(s, 800 / s)
    // viewer.drawNumArray(oreMaskGen(seed, s, islandMaskGen(seed, s).mask))
    const MAP_CELLS_PER_ROW = 64
    const m = generateMap(MAP_CELLS_PER_ROW, seed)

    const size = 64

    const nodes = genAStarNodes(m.cells, MAP_CELLS_PER_ROW, (cell) => cell.type !== 'gras' || !!cell.building)

    // nodes[7].isObstacle = true
    // nodes[8].isObstacle = true
    // nodes[9].isObstacle = true
    // nodes[10].isObstacle = true
    // nodes[16].isObstacle = true
    // nodes[17].isObstacle = true
    // nodes[18].isObstacle = true
    // nodes[27].isObstacle = true
    // nodes[28].isObstacle = true
    // nodes[47].isObstacle = true
    const v = new Array(nodes.length).fill([1, 1, 1])
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      v[i] = node.isObstacle ? [0.3, 0.3, 0.3] : [1, 1, 1]
    }
    const k = nodes[8]
    const s = size
    const viewer = new CanvasViewer(s, 40, 0.4)
    const start = nodes[350];
    start.isObstacle = false
    const end = nodes[3412];
    end.isObstacle = false
    const g = FindAStar(start, end) // TODO remove export when removing this.
    setInterval(() => {
      FindAStar(start, end)
    }, 200)
    console.log(g === end)

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.wasVisited) {
        v[i] = [0, 0.3, 0.8]
      }
    }
    let node = g
    while (node.parent) {
      const i = node.x + size * node.y;
      v[i] = [v[i][0] * 1, 0.5, 0.5]
      node = node.parent
    }

    v[start.x + size * start.y] = [1, 0, 0]
    v[end.x + size * end.y] = [0, 1, 0]

    viewer.drawRGBNumArray(v)
    viewer.ctx.fillStyle = '#000'
    viewer.ctx.font = '10px sans-serif'
    for (let i = 0; i < nodes.length; i++) {

      const node = nodes[i];
      // viewer.ctx.fillText(`${i}`, node.x * viewer.scale, node.y * viewer.scale + 20)
      // viewer.ctx.fillText(`S: ${node.x} ${node.y}`, node.x * viewer.scale, node.y * viewer.scale + 40)
      // viewer.ctx.fillText(`P: ${node.parent && node.parent.x} ${node.parent && node.parent.y}`, node.x * viewer.scale, node.y * viewer.scale + 60)

    }

  }

})()
