import './index.sass';
import { initMap, TerrainIndex } from './map';
import random from 'seedrandom'
import { degToRad } from './utils';

(async () => {
  const b = 32
  const a = new Array(b * b).fill([TerrainIndex['gras'], 0]).map((v, i) => [v[0], degToRad(Math.floor(random('' + i)() * 4)) * 90])

  a[0] = [TerrainIndex['water coast'], degToRad(180)]
  a[1] = [TerrainIndex['water coast'], degToRad(180)]
  a[2] = [TerrainIndex['water coast 2'], degToRad(90)]
  a[55] = [TerrainIndex['trees'], degToRad(90)]
  a[56] = [TerrainIndex['trees'], degToRad(90)]
  a[57] = [TerrainIndex['trees'], degToRad(90)]
  a[58] = [TerrainIndex['stone'], degToRad(90)]
  a[120] = [TerrainIndex['clay'], degToRad(90)]
  a[123] = [TerrainIndex['copper'], degToRad(90)]

  initMap(a as any, b)


})()

