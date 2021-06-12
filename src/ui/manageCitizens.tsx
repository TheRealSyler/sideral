import { Fragment, h } from 'dom-chef';
import { Building, buildingInfo } from "../building";
import { Citizen } from '../citizen';
import { modal } from './modal';

export function manageCitizens(citizens: Citizen[], building?: Building) {

  const citizenElements = [];
  for (let i = 0; i < citizens.length; i++) {
    citizenElements.push(createCitizen('main', i, citizens[i]));
  }
  const prevent = (e: any) => e.preventDefault();
  const left = <div className="citizens-body" onDragOver={prevent} onDrop={(e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text");

    const el = document.getElementById(data);
    if (el) {
      left.appendChild(el);
    }
  }}>{citizenElements}</div>;

  modal(<Fragment>
    <div className="citizens">
      <h2>Available Citizens</h2>
      {left}
    </div>
    {manageCitizensRightPanel(building, prevent, citizens)}
  </Fragment>, 'Manage Citizen');
}

function manageCitizensRightPanel(building: Building | undefined, prevent: (e: any) => any, citizens: Citizen[]) {
  if (building) {
    const info = buildingInfo[building.name];
    const title = <h2></h2>;
    const setTitle = () => title.textContent = `a ${building.workers.length} / ${info.workers}`;

    const workersElements = [];
    for (let i = 0; i < building.workers.length; i++) {
      workersElements.push(createCitizen('right-panel-', i, building.workers[i]));
    }

    const workers = <div className="citizens-body" onDragOver={prevent} onDrop={(e) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("text");

      const el = document.getElementById(getCitizenID(data));
      if (el && building.workers.length < info.workers) {
        workers.appendChild(el);
        building.workers.push(citizens[+data]);
        setTitle();
      }
    }}>{workersElements}</div>;
    setTitle();
    return <div className="citizens">
      {title}
      {workers}
    </div>;
  }
}


function createCitizen(idPrefix: string, i: number, citizen: Citizen) {
  const id = `${idPrefix}-${i}`
  return <div id={getCitizenID(id)}
    className="button"
    draggable="true"
    onDragStart={(e) => e.dataTransfer.setData("text", id)}
  >
    {citizen.name}
  </div>;
}

function getCitizenID(id: string) {
  return id + '-citizen';
}