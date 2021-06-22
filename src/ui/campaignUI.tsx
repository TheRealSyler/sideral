import { h } from 'dom-chef'
import { defaultResources, ResourceName } from "../resources";
import { buildingInfo, cellBuildings, } from "../building";
import { fromNow } from "../time";
import { UiEvents } from "../uiEvents";
import { buildingUpgradeEndDate, buildingEndDate } from "../buildingFunctions";
import { deleteSave, saveCampaign } from '../save';
import { getCellIcon, getResourceIcon } from '../icons';
import { manageCitizens } from './manageCitizens';
import { buildingCard } from './buildingCard';
import { Campaign } from '../campaign';
import { TopUI } from './topUI';
import { BottomUI } from './bottomUI';

export function InitCampaignUI(game: Campaign) {
  game.main.appendChild(topUI(game))
  game.main.appendChild(bottomUI(game))
}

function topUI(game: Campaign) {
  const elements: HTMLSpanElement[] = []
  for (const key in defaultResources) {
    if (Object.prototype.hasOwnProperty.call(defaultResources, key)) {
      const value = game.state.get(key as ResourceName)
      const val = <span>{value}</span>
      game.state.addListener(key as ResourceName, (v) => {
        val.textContent = v.toString()
      })
      elements.push(<span className="resource" title={key}>{getResourceIcon(key as ResourceName)} {val}</span>)
    }
  }
  const playPauseText = <span>Pause</span>

  return <TopUI>
    <div className="ui-top-resources">{elements}</div>
    <div className="ui-top-resources">

      <button className="button button-no-height" onClick={() => {
        game.isPaused ? game.play() : game.pause()
        playPauseText.textContent = game.isPaused ? 'Play' : 'Pause'
      }}>{playPauseText}</button>

      <button className="button button-no-height" onClick={() => {
        manageCitizens(game.citizens)
      }}>Manage Citizens</button>
      <button className="button button-no-height" onClick={() => {
        deleteSave()
        location.reload()
      }}>Delete Save And Reload</button>
      <button className="button button-no-height" onClick={() => {
        saveCampaign(game)
      }}>Save</button>
      <button className="button button-no-height" onClick={() => {
        location.reload()
      }}>Reload</button>

    </div>
  </TopUI>
}

function bottomUI(game: Campaign) {
  const uiEvents = new UiEvents()
  const cellName = <span > </span>;
  const cellIcon = <div className="cell-icon"></div>;
  const cellResourcesAmount = <span></span>;
  const cellBuilding = <div className="cards"> </div>;

  const upgradeTimeLeftEvent = 'upgrade-time';
  game.state.addListener('selectedMapCell', (cell) => {
    uiEvents.remove(upgradeTimeLeftEvent)
    cellIcon.innerHTML = ''
    cellBuilding.innerHTML = ''
    cellName.textContent = ''
    cellResourcesAmount.textContent = ''
    if (cell) {
      cellIcon.appendChild(getCellIcon(cell.type))
      cellName.textContent = cell.type;
      cellResourcesAmount.textContent = cell.resourceAmount === -1 ?
        '' :
        `(${cell.resourceAmount})` || 'Depleted';

      const building = cell.building
      if (building) {
        const upgradeTime = <span></span>
        const prodTime = <span></span>
        const info = buildingInfo[building.name]

        if (building.isUpgrading) {
          const updateUpgradeTime = () => {
            upgradeTime.textContent = fromNow((buildingUpgradeEndDate(building, info)));
          };
          uiEvents.add(upgradeTimeLeftEvent, updateUpgradeTime);
          updateUpgradeTime()
        } else if (info.canProduce) {
          const updateProductionTime = () => {
            prodTime.textContent = fromNow((buildingEndDate(building, info.production)));
          };
          uiEvents.add(upgradeTimeLeftEvent, updateProductionTime);
          updateProductionTime()
        }

        cellBuilding.appendChild(buildingCard(game, building.name, building.level < 3 ? 3 : building.level, cell, building, upgradeTime, prodTime))
      } else {
        const availableBuildings = cellBuildings[cell.type]
        if (availableBuildings) {
          for (let i = 0; i < availableBuildings.length; i++) {
            const buildingName = availableBuildings[i];
            cellBuilding.appendChild(buildingCard(game, buildingName, 3, cell))
          }
        }
      }

    } else {
      for (let i = 0; i < game.armies.length; i++) {
        const army = game.armies[i];
        if (army.selected) {
          cellBuilding.appendChild(<div>
            {army.speed}
          </div>)
        }
      }
    }
  });


  return <BottomUI>
    <div className="cell">
      <div className="cell-name">
        {cellName}
        {cellResourcesAmount}
      </div>
      {cellIcon}

    </div>

    {cellBuilding}

  </BottomUI>
}


