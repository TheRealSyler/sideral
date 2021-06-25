import { TextureCache } from './textureCache';
import buildPos from './assets/build.png'
import disabledPos from './assets/disabled.png'

import idle_down from './assets/unit_test_idle_down.png'
import walk_down from './assets/unit_test_walk_down.png'
import idle_up from './assets/unit_test_idle_up.png'
import walk_up from './assets/unit_test_walk_up.png'
import idle_right from './assets/unit_test_idle_right.png'
import walk_right from './assets/unit_test_walk_right.png'
import idle_left from './assets/unit_test_idle_left.png'
import walk_left from './assets/unit_test_walk_left.png'
import { CanvasCache } from './canvas/canvasCache';
import { MAP_CELL_SIZE } from './globalConstants';
import { floor, getTextureOffset } from './utils';
import { addCtxTransformTacking } from './canvas/viewport';


interface AnimationInfo {
  texturesPerRow: number,
  /**approximate time each frame is shown, in ms */
  timePerFrame: number,
}

export type Animations =
  'build'
  | 'disabled'
  | 'idle_down'
  | 'idle_right'
  | 'walk_down'
  | 'walk_right'
  | 'walk_left'
  | 'walk_up'
  | 'idle_left'
  | 'idle_up'

const unitAnimationInfo: AnimationInfo = {
  texturesPerRow: 5,
  timePerFrame: 1000 / 25
};
const animationInfo: { [key in Animations]: AnimationInfo } = {
  build: {
    texturesPerRow: 3,
    timePerFrame: 1000 / 18
  },
  disabled: {
    texturesPerRow: 3,
    timePerFrame: 1000 / 18
  },
  walk_right: unitAnimationInfo,
  idle_right: unitAnimationInfo,
  idle_down: unitAnimationInfo,
  walk_down: unitAnimationInfo,
  walk_left: unitAnimationInfo,
  walk_up: unitAnimationInfo,
  idle_left: unitAnimationInfo,
  idle_up: unitAnimationInfo,
}

const textureCache = new TextureCache<Animations>({
  build: buildPos,
  disabled: disabledPos,
  idle_right,
  idle_down,
  walk_down,
  walk_right,
  walk_left,
  walk_up,
  idle_left,
  idle_up,
})

const animationCanvas = new CanvasCache(MAP_CELL_SIZE, 'Animation Render Canvas')
addCtxTransformTacking(animationCanvas.ctx)

export async function renderAnimation(name: Animations, delta: number) {
  const img = await textureCache.getTexture(name)
  const info = animationInfo[name]
  const frames = info.texturesPerRow * info.texturesPerRow;
  const frame = floor((delta / info.timePerFrame) % frames)
  const [offsetX, offsetY] = getTextureOffset(frame, MAP_CELL_SIZE, info.texturesPerRow)

  animationCanvas.ctx.clearRect(0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)

  animationCanvas.ctx.drawImage(img, offsetX, offsetY, MAP_CELL_SIZE, MAP_CELL_SIZE, 0, 0, MAP_CELL_SIZE, MAP_CELL_SIZE)

  return animationCanvas.canvas
}