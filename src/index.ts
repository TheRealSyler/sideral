import './index.sass';
import { TerrainIndex } from './map';
import random from 'seedrandom'
import { degToRad } from './utils';
import { Game } from './game';

(async () => {
  const b = 32
  const map = new Array(b * b).fill([TerrainIndex['gras'], 0, 0]).map((v, i) => [v[0], degToRad(Math.floor(random('' + i)() * 4)) * 90, 0])

  map[0] = [TerrainIndex['water coast 4'], degToRad(180)]
  map[1] = [TerrainIndex['water coast'], degToRad(180)]
  map[2] = [TerrainIndex['water coast 2'], degToRad(90)]
  map[55] = [TerrainIndex['trees'], degToRad(90), random('aw' + 1)() * 100]
  map[56] = [TerrainIndex['trees'], degToRad(90), random('aw' + 2)() * 100]
  map[57] = [TerrainIndex['trees'], degToRad(90), random('aw' + 3)() * 100]
  map[58] = [TerrainIndex['stone'], degToRad(90), random('aw' + 4)() * 100]
  map[120] = [TerrainIndex['clay'], degToRad(90), random('aw' + 5)() * 100]
  map[123] = [TerrainIndex['copper'], degToRad(90)]
  map[127] = [TerrainIndex['water coast 4'], degToRad(90)]
  map[1023] = [TerrainIndex['water coast 4'], degToRad(0)]

  const game = new Game(map as any, b)

})()

