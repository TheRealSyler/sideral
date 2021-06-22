import { CanvasViewer } from '../canvas/canvasViewer';
import { sprites } from './sprites';
import { floor, loadTexture } from '../utils';


const spritesPerRow = 4;
const spriteSize = 64;

(async () => {
  const size = spriteSize * spritesPerRow
  const viewer = new CanvasViewer(size)
  document.title = 'Sprite Maker'
  for (let i = 0; i < sprites.length; i++) {
    const e = sprites[i];
    const x = i % spritesPerRow * spriteSize
    const y = floor(i / spritesPerRow) * spriteSize
    viewer.ctx.drawImage(await loadTexture(e), 0, 0, spriteSize, spriteSize, x, y, spriteSize, spriteSize)
  }
})()