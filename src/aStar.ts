import { Map } from './map';

export interface AStarNode {
  wasVisited: boolean;
  globalGoal: number;
  localGoal: number;
  isObstacle: boolean;
  parent: AStarNode | null;
  x: number;
  y: number;
  neighbors: AStarNode[];
}


/** Adapted from https://github.com/OneLoneCoder/videos/blob/master/OneLoneCoder_PathFinding_AStar.cpp */
export function FindAStar(startNode: AStarNode, endNode: AStarNode) {

  let currentNode = startNode;
  startNode.localGoal = 0.0;
  startNode.globalGoal = aStarHeuristic(startNode, endNode);

  const nodesToTest: AStarNode[] = [];
  nodesToTest.push(startNode);

  while (!(nodesToTest.length === 0) && currentNode != endNode) {

    nodesToTest.sort((a, b) => a.globalGoal - b.globalGoal);

    while (!(nodesToTest.length === 0) && nodesToTest[0].wasVisited) {
      nodesToTest.shift();
    }

    if (nodesToTest.length === 0) break;

    currentNode = nodesToTest[0];
    currentNode.wasVisited = true;

    for (let nodeNeighbor of currentNode.neighbors) {

      if (!nodeNeighbor.wasVisited && !nodeNeighbor.isObstacle) {
        nodesToTest.push(nodeNeighbor);
      }

      const fPossiblyLowerGoal = currentNode.localGoal + aStarDistance(currentNode, nodeNeighbor);

      if (fPossiblyLowerGoal < nodeNeighbor.localGoal && !nodeNeighbor.isObstacle) {
        nodeNeighbor.parent = currentNode;
        nodeNeighbor.localGoal = fPossiblyLowerGoal;

        nodeNeighbor.globalGoal = nodeNeighbor.localGoal + aStarHeuristic(nodeNeighbor, endNode);

      }
    }
  }

  return currentNode;
}

function aStarDistance(a: AStarNode, b: AStarNode) {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
};

function aStarHeuristic(a: AStarNode, b: AStarNode) {
  return aStarDistance(a, b);
};

export function MapToAStarNodes(map: Map, width: number, diagonal = false) {
  const nodes: AStarNode[] = []

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < width; y++) {
      const i = x + width * y;
      const cell = map.cells[i]
      const node: AStarNode = {
        isObstacle: cell.type !== 'gras' || !!cell.building,
        globalGoal: Infinity,
        localGoal: Infinity,
        wasVisited: false,
        parent: null,
        neighbors: [],
        x,
        y
      }
      nodes[i] = node;

      if (diagonal) {
        const upperLeft = nodes[i - width - 1]
        if (upperLeft) {
          upperLeft.neighbors.push(node)
          node.neighbors.push(upperLeft)
        }
        const upperRight = nodes[i - width + 1]
        if (upperRight) {
          upperRight.neighbors.push(node)
          node.neighbors.push(upperRight)
        }
      }
      const left = nodes[i - 1]
      if (left) {
        left.neighbors.push(node)
        node.neighbors.push(left)
      }
      const right = nodes[i + 1]
      if (right) {
        right.neighbors.push(node)
        node.neighbors.push(right)
      }
      const up = nodes[i - width]
      if (up) {
        up.neighbors.push(node)
        node.neighbors.push(up)
      }
    }

  }
  return nodes
}
