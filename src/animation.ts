import { TextureCache } from './textureCache';
import buildPos from './assets/build.png'
import { CanvasCache } from './canvasCache';
import { MAP_CELL_SIZE } from './globalConstants';
import { getTextureOffset } from './utils';


interface Animation {
  texturesPerRow: number,
  /**approximate time each frame is shown, in ms */
  timePerFrame: number,
}

type Animations = 'build'

const animationInfo: { [key in Animations]: Animation } = {
  build: {
    texturesPerRow: 3,
    timePerFrame: 1000 / 18
  }
}

const textureCache = new TextureCache<Animations>({
  build: buildPos
})

const animationCanvas = new CanvasCache(MAP_CELL_SIZE, 'Animation Render Canvas')

export async function renderAnimation(name: Animations, delta: number) {
  const img = await textureCache.getTexture(name)
  const info = animationInfo[name]
  const frames = info.texturesPerRow * info.texturesPerRow;
  const frame = Math.floor((delta / info.timePerFrame) % frames)
  const [offsetX, offsetY] = getTextureOffset(frame, MAP_CELL_SIZE, info.texturesPerRow)
  animationCanvas.ctx.clearRect(0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)
  animationCanvas.ctx.drawImage(img, offsetX, offsetY, MAP_CELL_SIZE, MAP_CELL_SIZE, 0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)
  return animationCanvas.canvas
}