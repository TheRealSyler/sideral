import { Position } from './interfaces';
import { Map } from './map';
import { floor } from './utils';

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

  while (!(nodesToTest.length === 0) && currentNode !== endNode) {

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


  return currentNode
}

export function findPath(startNode: AStarNode, endNode: AStarNode) {
  const end = FindAStar(startNode, endNode)

  if (end !== endNode) return false

  const path: Position[] = []
  let node = end
  while (node.parent) {
    path.push({ x: node.x, y: node.y })
    node = node.parent
  }
  return path
}


export function restoreAStarNode(node: AStarNode) {
  node.globalGoal = Infinity
  node.localGoal = Infinity
  node.wasVisited = false
  node.parent = null
}

function aStarDistance(a: AStarNode, b: AStarNode) {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
};

function aStarHeuristic(a: AStarNode, b: AStarNode) {
  return aStarDistance(a, b);
};

export function MapToAStarNodes(map: Map, width: number,) {
  const nodes: AStarNode[] = []

  const size = width * width
  for (let i = 0; i < size; i++) {
    const x = (i % width)
    const y = floor((i / width))
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


  return nodes
}
