import { A_START_ENABLE_DIAGONAL } from './globalConstants';
import { Position } from './interfaces';
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

      const fPossiblyLowerGoal = currentNode.localGoal + aStarHeuristic(currentNode, nodeNeighbor);

      if (fPossiblyLowerGoal < nodeNeighbor.localGoal && !nodeNeighbor.isObstacle) {
        nodeNeighbor.parent = currentNode;
        nodeNeighbor.localGoal = fPossiblyLowerGoal;

        nodeNeighbor.globalGoal = nodeNeighbor.localGoal + aStarHeuristic(nodeNeighbor, endNode);

      }
    }
  }

  return currentNode
}

function aStarDistance(a: AStarNode, b: AStarNode) {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
};

function aStarHeuristic(a: AStarNode, b: AStarNode) {
  return aStarDistance(a, b);
};

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

export function restoreAStarNodes(nodes: AStarNode[]) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.globalGoal = Infinity
    node.localGoal = Infinity
    node.wasVisited = false
    node.parent = null
  }
}
export function restoreAStarNodesClearObstacle(nodes: AStarNode[]) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.globalGoal = Infinity
    node.localGoal = Infinity
    node.wasVisited = false
    node.parent = null
    node.isObstacle = false
  }
}

export function genAStarNodes<T>(cells: T[], width: number, isObstacle: (cell: T) => boolean) {
  const nodes: AStarNode[] = []

  const size = width * width
  for (let i = 0; i < size; i++) {
    const x = (i % width)
    const y = floor((i / width))
    const cell = cells[i]
    const node = createAStartNode(x, y, isObstacle(cell))
    nodes[i] = node;
    addAStarNodeNeighbors(i, width, nodes, node);
  }

  return nodes
}

function addAStarNodeNeighbors(i: number, width: number, nodes: AStarNode[], node: AStarNode) {
  const upperLeft = nodes[i - width - 1];
  const mod = i % width;
  if (A_START_ENABLE_DIAGONAL) {
    if (upperLeft && mod !== 0) {
      upperLeft.neighbors.push(node);
      node.neighbors.push(upperLeft);
    }

    const upperRight = nodes[i - width + 1];
    if (upperRight && mod !== width - 1) {
      upperRight.neighbors.push(node);
      node.neighbors.push(upperRight);
    }
  }

  const left = nodes[i - 1];
  if (left && mod !== 0) {
    left.neighbors.push(node);
    node.neighbors.push(left);
  }

  const up = nodes[i - width];
  if (up) {
    up.neighbors.push(node);
    node.neighbors.push(up);
  }
}

function createAStartNode(x: number, y: number, isObstacle: boolean): AStarNode {
  return {
    isObstacle,
    globalGoal: Infinity,
    localGoal: Infinity,
    wasVisited: false,
    parent: null,
    neighbors: [],
    x,
    y
  }
}