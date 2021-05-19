import './index.sass';
import { renderMap, TerrainIndex } from './mapRenderer';
import random from 'seedrandom'
import { clamp, degToRad } from './utils';

(async () => {
  const b = 32
  const a = new Array(b * b).fill([TerrainIndex['gras'], 0]).map((v, i) => [v[0], degToRad(Math.floor(random('' + i)() * 4)) * 90])

  a[0] = [TerrainIndex['water coast'], degToRad(180)]
  a[1] = [TerrainIndex['water coast'], degToRad(180)]
  a[2] = [TerrainIndex['water coast 2'], degToRad(90)]

  const mapData = await renderMap(a as any, b)

  const map = document.createElement("img");
  map.src = mapData

  map.className = 'map'
  document.body.appendChild(map);

  let isMouseDown = false

  let x = 0
  let y = 0
  window.addEventListener('mousedown', () => isMouseDown = true)
  window.addEventListener('mouseup', () => isMouseDown = false)
  window.addEventListener('mouseleave', () => isMouseDown = false)
  let scale = 1
  window.addEventListener('wheel', (e) => {

    console.log(scale, e.deltaY)
    scale = clamp(scale - (Math.sign(e.deltaY) * 0.25), 30, 0.1)
    map.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
  })

  window.addEventListener('mousemove', (e) => {

    if (isMouseDown) {
      x += e.movementX
      y += e.movementY
      map.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
    }
  })
})()