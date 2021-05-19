import './index.sass';
import 'regenerator-runtime'
import { renderMap } from './mapRenderer';

enum MapType {
  'gras',
  'trees',
  'stone',
  'clay',
  'bush',
  'berries',
  'tin',
  'copper',
  'gold',
  'iron',
  'water',
  'water coast',
  'water coast 2',
  'water coast 3',
  'fruit trees',
  '',
  'road bend',
  'road',
  'road end',
  'stone road end',
  'stone road',
  'stone road bend',
}
window.addEventListener('load', () => {
  const a = new Array(16).fill(0)
  a[0] = 5
  a[15] = 1
  renderMap(a, 4)
})