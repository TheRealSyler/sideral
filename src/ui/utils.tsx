import { Fragment, h } from 'dom-chef';
import { ResourceStack } from "../resources";
import { BuildingInfo, BuildingLevel } from "../building";
import { displaySeconds } from "../time";
import { getLevelRequirement, buildingFormula } from "../buildingFunctions";
import { getResourceIcon } from '../icons';
import { CardColumn } from './card';

export interface Props {
  children?: any
}

type displayResourceStuffArgs = {
  info: BuildingInfo;
  opacity: number;
  isAlreadyBuilt: boolean;
  levelName: BuildingLevel;
  level: number;
  prodTime?: HTMLSpanElement;
};

export function displayResourceStuff({ info, opacity, isAlreadyBuilt, levelName, level, prodTime }: displayResourceStuffArgs) {
  if (info.canProduce) {
    const resourceProdReq = getLevelRequirement(isAlreadyBuilt
      ? levelName : 'I', info.production.requirements);

    return <Fragment>
      <CardColumn style={{ opacity }}>
        Produces
        {isAlreadyBuilt && <span>every {displaySeconds(buildingFormula(info.production, level))}</span>}
        <span className="resource">{getResourceIcon(info.productionType)}
          {isAlreadyBuilt ?
            prodTime : `every ${displaySeconds(info.production.rate)}`}
        </span>
      </CardColumn>
      {resourceProdReq && <CardColumn style={{ opacity }}>
        Uses
        {resourceArray(resourceProdReq)}
      </CardColumn>}
    </Fragment>;
  }
}

export function resourceArray(stack: ResourceStack) {
  return stack.map((v) => <span className="resource">
    {v.amount} {getResourceIcon(v.type)}
  </span>
  );
}

export function flattenArray(requirements?: string | string[]) {
  return Array.isArray(requirements) ?
    requirements.map(v => <span>{v}</span>) : <span>{requirements}</span>;
}
