import { MapCellTexturePos } from "./map";
import { State, GameState } from "./state";
import { toPx } from "./utils";
import { Fragment, h } from 'dom-chef'
import { defaultResources, GameResources } from "./resources";
import { buildingInfo, BuildingNames, buildings, } from "./building";
import { fromNow } from "./time";
import { Game } from "./game";
import { UiEvents } from "./uiEvents";
import { buildingUpgradeEndDate, buildingProductionEndDate, displayBuildingLevel, newBuilding } from "./buildingFunctions";

export function InitUI(state: State<GameState>, topHeight: number, bottomHeight: number) {
  topUI(state, topHeight);
  bottomUI(state, bottomHeight,);
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

function bottomUI(state: State<GameState>, bottomHeight: number,) {
  const uiEvents = new UiEvents()
  const cellName = <span></span>;
  const mapCellResources = <span></span>;
  const cellBuilding = <span></span>;

  const upgradeTimeLeftEvent = 'upgrade-time';
  state.addListener('selectedMapChunk', (v) => {
    uiEvents.remove(upgradeTimeLeftEvent)
    if (v) {
      const { cell } = v;
      cellName.textContent = cell.type;
      mapCellResources.textContent = cell.resourceAmount === -1 ?
        'No Resource' :
        '' + cell.resourceAmount || 'Depleted';

      cellBuilding.innerHTML = ''
      const building = cell.building
      if (building) {
        const upgradeTime = <span></span>
        const info = buildingInfo[building.name]
        // TODO this might cause issues and a clean up
        if (building.isUpgrading) {
          const updateUpgradeTime = () => {
            if (!building.isUpgrading) {
              uiEvents.remove(upgradeTimeLeftEvent);
              return;
            }
            upgradeTime.textContent = fromNow((buildingUpgradeEndDate(building, info)));
          };
          uiEvents.add(upgradeTimeLeftEvent, updateUpgradeTime);
          updateUpgradeTime()
        } else if (info.canProduce) {
          const updateProductionTime = () => {

            upgradeTime.textContent = fromNow((buildingProductionEndDate(building, info)));
          };
          uiEvents.add(upgradeTimeLeftEvent, updateProductionTime);
          updateProductionTime()

        }

        cellBuilding.appendChild(<Fragment>
          <span>Building: {building.name}  </span><br />
          <span>Level: {displayBuildingLevel(building.level)}</span><br />
          <span>Time: {upgradeTime}</span><br />
          {!building.isUpgrading && <button onClick={() => {
            building.date = new Date()
            building.isUpgrading = true
            state.resendListeners('selectedMapChunk')
          }}>Upgrade</button>}

        </Fragment>)
      } else {
        const availableBuildings = buildings[cell.type]
        if (availableBuildings) {
          for (let i = 0; i < availableBuildings.length; i++) {
            const buildingName = availableBuildings[i];
            cellBuilding.appendChild(<button onClick={() => {
              cell.building = newBuilding(buildingName)
              state.resendListeners('selectedMapChunk')
            }}>{buildingName} </button>)
          }
        }
      }

    }
  });

  const bottom = <div className="ui-bottom" style={{ height: bottomHeight }}>
    <div className="ui-map-chunk-info">
      <ul>
        <li> {cellName}</li>
        <li>Resource: {mapCellResources}</li>


      </ul>
    </div>
    {cellBuilding}

  </div>;

  document.body.appendChild(bottom);
}

