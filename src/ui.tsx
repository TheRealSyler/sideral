import { MapCellName } from "./map";
import { State, GameState } from "./state";
import { toPx } from "./utils";
import { Fragment, h } from 'dom-chef'
import { defaultResources, GameResources } from "./resources";
import { BuildingNames, buildings } from "./buildings";

export function InitUI(state: State<GameState>, topHeight: number, bottomHeight: number) {
  topUI(state, topHeight);
  bottomUI(state, bottomHeight);
}

function topUI(state: State<GameState>, topHeight: number) {
  const elements: HTMLSpanElement[] = []
  for (const key in defaultResources) {
    if (Object.prototype.hasOwnProperty.call(defaultResources, key)) {
      const value = state.get(key as keyof GameResources)
      const val = <span>{value}</span>
      state.addListener(key as keyof GameResources, (v) => {
        val.textContent = v.toString()
      })
      elements.push(<span> {key}: {val}</span>)
    }
  }
  const top = <div className="ui-top">{elements}</div>;

  top.style.height = toPx(topHeight);
  document.body.appendChild(top);
}

function bottomUI(state: State<GameState>, bottomHeight: number) {
  const mapCellName = <span></span>;
  const mapCellResources = <span></span>;
  const cellBuilding = <span></span>;

  state.addListener('selectedMapChunk', (v) => {
    if (v) {
      const { cell } = v;
      mapCellName.textContent = MapCellName[cell.type];
      mapCellResources.textContent = cell.resourceAmount === -1 ?
        'No Resource' :
        '' + cell.resourceAmount || 'Depleted';

      cellBuilding.innerHTML = ''
      if (cell.building) {
        cellBuilding.appendChild(<Fragment><span>
          Building: {BuildingNames[cell.building.name]}
        </span></Fragment>)
      } else {
        const availableBuildings = buildings[cell.type]
        if (availableBuildings) {
          for (let i = 0; i < availableBuildings.length; i++) {
            const building = availableBuildings[i];
            cellBuilding.appendChild(<span>{BuildingNames[building]} </span>)
          }
        }
      }

    }
  });

  const bottom = <div className="ui-bottom" style={{ height: bottomHeight }}>
    <div className="ui-map-chunk-info">
      <ul>
        <li> {mapCellName}</li>
        <li>Resource: {mapCellResources}</li>


      </ul>
    </div>
    {cellBuilding}

  </div>;

  document.body.appendChild(bottom);
}

