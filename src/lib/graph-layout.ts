export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphSize {
  width: number;
  height: number;
}

export interface SpatialGraphNode {
  id: string;
  position?: GraphPoint;
  size?: GraphSize;
}

export interface SpatialGraphEdge {
  from: string;
  to: string;
}

export interface GraphLayoutOptions {
  origin?: GraphPoint;
  gridSize?: number;
  horizontalGap?: number;
  verticalGap?: number;
  defaultNodeSize?: GraphSize;
}

export interface GraphLayoutBounds extends GraphPoint, GraphSize {}

export interface GraphLayoutResult {
  positions: Record<string, GraphPoint>;
  bounds: GraphLayoutBounds;
  explicitNodeCount: number;
  autoPositionedNodeCount: number;
  preservedExplicitOverlapCount: number;
}

interface LayoutRect extends GraphPoint, GraphSize {
  id: string;
  explicit: boolean;
}

const DEFAULT_NODE_SIZE: GraphSize = { width: 216, height: 120 };

export function layoutDirectedGraph(
  nodes: SpatialGraphNode[],
  edges: SpatialGraphEdge[],
  options: GraphLayoutOptions = {}
): GraphLayoutResult {
  const nodeById = new Map<string, SpatialGraphNode>();
  const inputOrder = new Map<string, number>();
  nodes.forEach((node, index) => {
    if (!node.id || nodeById.has(node.id)) {
      throw new Error(node.id ? `Duplicate graph node id: ${node.id}` : "Graph node id cannot be empty");
    }
    if (node.position !== undefined && !validPoint(node.position)) {
      throw new Error(`Graph node '${node.id}' has an invalid position`);
    }
    if (node.size !== undefined && !validSize(node.size)) {
      throw new Error(`Graph node '${node.id}' has an invalid layout size`);
    }
    nodeById.set(node.id, node);
    inputOrder.set(node.id, index);
  });

  if (options.origin !== undefined && !validPoint(options.origin)) {
    throw new Error("Graph layout origin must contain finite x and y values");
  }
  if (options.defaultNodeSize !== undefined && !validSize(options.defaultNodeSize)) {
    throw new Error("Graph layout defaultNodeSize must contain positive finite dimensions");
  }
  const origin = options.origin || { x: 0, y: 0 };
  const gridSize = layoutNumber(options.gridSize, 24, "gridSize");
  const horizontalGap = layoutNumber(options.horizontalGap, 96, "horizontalGap");
  const verticalGap = layoutNumber(options.verticalGap, 48, "verticalGap");
  const defaultNodeSize = options.defaultNodeSize || DEFAULT_NODE_SIZE;
  const sizeById = new Map(
    nodes.map((node) => [node.id, validSize(node.size) ? node.size : defaultNodeSize])
  );

  const validEdges = edges.filter((edge) => nodeById.has(edge.from) && nodeById.has(edge.to));
  const outgoing = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  const incoming = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of validEdges) {
    outgoing.get(edge.from)!.add(edge.to);
    incoming.get(edge.to)!.add(edge.from);
  }
  const weakComponentByNode = findWeakComponents(nodes, outgoing, incoming);

  const { componentByNode, components } = findStronglyConnectedComponents(nodes, outgoing, inputOrder);
  const componentRanks = rankComponents(components, componentByNode, validEdges, inputOrder);
  const rankByNode = new Map(
    nodes.map((node) => [node.id, componentRanks[componentByNode.get(node.id)!]])
  );

  const nodesByRank = new Map<number, SpatialGraphNode[]>();
  for (const node of nodes) {
    const rank = rankByNode.get(node.id)!;
    const rankedNodes = nodesByRank.get(rank) || [];
    rankedNodes.push(node);
    nodesByRank.set(rank, rankedNodes);
  }
  for (const [rank, rankedNodes] of nodesByRank) {
    rankedNodes.sort((a, b) => {
      const aScore = predecessorOrder(a.id, incoming, inputOrder);
      const bScore = predecessorOrder(b.id, incoming, inputOrder);
      return aScore - bScore || inputOrder.get(a.id)! - inputOrder.get(b.id)!;
    });
    nodesByRank.set(rank, rankedNodes);
  }

  const ranks = [...nodesByRank.keys()].sort((a, b) => a - b);
  const columnX = new Map<number, number>();
  let nextColumnX = snap(origin.x, gridSize);
  for (const rank of ranks) {
    columnX.set(rank, nextColumnX);
    const widest = Math.max(...nodesByRank.get(rank)!.map((node) => sizeById.get(node.id)!.width));
    nextColumnX = snap(nextColumnX + widest + horizontalGap, gridSize);
  }
  const componentOffsets = calculateComponentOffsets(
    nodes,
    weakComponentByNode,
    rankByNode,
    columnX,
    gridSize
  );

  const positions: Record<string, GraphPoint> = {};
  const placed: LayoutRect[] = [];
  for (const node of nodes) {
    if (!validPoint(node.position)) continue;
    const size = sizeById.get(node.id)!;
    positions[node.id] = { x: node.position.x, y: node.position.y };
    placed.push({ id: node.id, ...node.position, ...size, explicit: true });
  }

  const preservedExplicitOverlapCount = countOverlaps(placed, gridSize);
  const cursorByRank = new Map(ranks.map((rank) => [rank, snap(origin.y, gridSize)]));
  for (const rank of ranks) {
    for (const node of nodesByRank.get(rank)!) {
      if (validPoint(node.position)) continue;

      const size = sizeById.get(node.id)!;
      const connectedY = connectedCenterY(node.id, positions, sizeById, incoming, outgoing);
      const cursorY = cursorByRank.get(rank)!;
      let y = snap(connectedY === undefined ? cursorY : connectedY - size.height / 2, gridSize);
      const x = columnX.get(rank)! + componentOffsets.get(weakComponentByNode.get(node.id)!)!;
      let candidate: LayoutRect = { id: node.id, x, y, ...size, explicit: false };

      for (let attempts = 0; attempts < nodes.length * 4 + 32; attempts++) {
        const collisions = placed.filter((rect) => overlaps(candidate, rect, gridSize));
        if (collisions.length === 0) break;
        y = snap(Math.max(...collisions.map((rect) => rect.y + rect.height + verticalGap)), gridSize);
        candidate = { ...candidate, y };
      }
      if (placed.some((rect) => overlaps(candidate, rect, gridSize))) {
        throw new Error(`Could not place graph node '${node.id}' without overlap`);
      }

      positions[node.id] = { x: candidate.x, y: candidate.y };
      placed.push(candidate);
      cursorByRank.set(rank, Math.max(cursorY, snap(candidate.y + candidate.height + verticalGap, gridSize)));
    }
  }

  return {
    positions,
    bounds: calculateBounds(placed),
    explicitNodeCount: placed.filter((rect) => rect.explicit).length,
    autoPositionedNodeCount: placed.filter((rect) => !rect.explicit).length,
    preservedExplicitOverlapCount,
  };
}

function findWeakComponents(
  nodes: SpatialGraphNode[],
  outgoing: Map<string, Set<string>>,
  incoming: Map<string, Set<string>>
): Map<string, number> {
  const componentByNode = new Map<string, number>();
  let component = 0;
  for (const node of nodes) {
    if (componentByNode.has(node.id)) continue;
    const pending = [node.id];
    componentByNode.set(node.id, component);
    while (pending.length > 0) {
      const id = pending.shift()!;
      const neighbors = new Set([...(outgoing.get(id) || []), ...(incoming.get(id) || [])]);
      for (const neighbor of neighbors) {
        if (componentByNode.has(neighbor)) continue;
        componentByNode.set(neighbor, component);
        pending.push(neighbor);
      }
    }
    component++;
  }
  return componentByNode;
}

function calculateComponentOffsets(
  nodes: SpatialGraphNode[],
  componentByNode: Map<string, number>,
  rankByNode: Map<string, number>,
  columnX: Map<number, number>,
  gridSize: number
): Map<number, number> {
  const samples = new Map<number, number[]>();
  for (const node of nodes) {
    if (!validPoint(node.position)) continue;
    const component = componentByNode.get(node.id)!;
    const values = samples.get(component) || [];
    values.push(node.position.x - columnX.get(rankByNode.get(node.id)!)!);
    samples.set(component, values);
  }

  const offsets = new Map<number, number>();
  for (const component of new Set(componentByNode.values())) {
    const values = (samples.get(component) || []).sort((a, b) => a - b);
    if (values.length === 0) {
      offsets.set(component, 0);
      continue;
    }
    const middle = Math.floor(values.length / 2);
    const median = values.length % 2 === 1
      ? values[middle]
      : (values[middle - 1] + values[middle]) / 2;
    offsets.set(component, snap(median, gridSize));
  }
  return offsets;
}

function findStronglyConnectedComponents(
  nodes: SpatialGraphNode[],
  outgoing: Map<string, Set<string>>,
  inputOrder: Map<string, number>
): { componentByNode: Map<string, number>; components: string[][] } {
  let nextIndex = 0;
  const indexByNode = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];

  const visit = (id: string): void => {
    indexByNode.set(id, nextIndex);
    lowLink.set(id, nextIndex);
    nextIndex++;
    stack.push(id);
    onStack.add(id);

    for (const next of outgoing.get(id) || []) {
      if (!indexByNode.has(next)) {
        visit(next);
        lowLink.set(id, Math.min(lowLink.get(id)!, lowLink.get(next)!));
      } else if (onStack.has(next)) {
        lowLink.set(id, Math.min(lowLink.get(id)!, indexByNode.get(next)!));
      }
    }

    if (lowLink.get(id) !== indexByNode.get(id)) return;
    const component: string[] = [];
    while (stack.length > 0) {
      const member = stack.pop()!;
      onStack.delete(member);
      component.push(member);
      if (member === id) break;
    }
    component.sort((a, b) => inputOrder.get(a)! - inputOrder.get(b)!);
    components.push(component);
  };

  for (const node of nodes) {
    if (!indexByNode.has(node.id)) visit(node.id);
  }

  components.sort((a, b) => inputOrder.get(a[0])! - inputOrder.get(b[0])!);
  const componentByNode = new Map<string, number>();
  components.forEach((component, componentIndex) => {
    component.forEach((id) => componentByNode.set(id, componentIndex));
  });
  return { componentByNode, components };
}

function rankComponents(
  components: string[][],
  componentByNode: Map<string, number>,
  edges: SpatialGraphEdge[],
  inputOrder: Map<string, number>
): number[] {
  const outgoing = components.map(() => new Set<number>());
  const indegree = components.map(() => 0);
  for (const edge of edges) {
    const source = componentByNode.get(edge.from)!;
    const destination = componentByNode.get(edge.to)!;
    if (source === destination || outgoing[source].has(destination)) continue;
    outgoing[source].add(destination);
    indegree[destination]++;
  }

  const componentOrder = components.map((component) => Math.min(...component.map((id) => inputOrder.get(id)!)));
  const pending = components
    .map((_, index) => index)
    .filter((index) => indegree[index] === 0)
    .sort((a, b) => componentOrder[a] - componentOrder[b]);
  const ranks = components.map(() => 0);
  while (pending.length > 0) {
    const source = pending.shift()!;
    for (const destination of outgoing[source]) {
      ranks[destination] = Math.max(ranks[destination], ranks[source] + 1);
      indegree[destination]--;
      if (indegree[destination] === 0) {
        pending.push(destination);
        pending.sort((a, b) => componentOrder[a] - componentOrder[b]);
      }
    }
  }
  return ranks;
}

function predecessorOrder(
  id: string,
  incoming: Map<string, Set<string>>,
  inputOrder: Map<string, number>
): number {
  const predecessors = [...(incoming.get(id) || [])];
  if (predecessors.length === 0) return inputOrder.get(id)!;
  return predecessors.reduce((sum, predecessor) => sum + inputOrder.get(predecessor)!, 0) / predecessors.length;
}

function connectedCenterY(
  id: string,
  positions: Record<string, GraphPoint>,
  sizes: Map<string, GraphSize>,
  incoming: Map<string, Set<string>>,
  outgoing: Map<string, Set<string>>
): number | undefined {
  const connected = new Set([...(incoming.get(id) || []), ...(outgoing.get(id) || [])]);
  const centers = [...connected]
    .filter((connectedId) => positions[connectedId] !== undefined)
    .map((connectedId) => positions[connectedId].y + sizes.get(connectedId)!.height / 2);
  if (centers.length === 0) return undefined;
  return centers.reduce((sum, center) => sum + center, 0) / centers.length;
}

function countOverlaps(rects: LayoutRect[], padding: number): number {
  let count = 0;
  for (let left = 0; left < rects.length; left++) {
    for (let right = left + 1; right < rects.length; right++) {
      if (overlaps(rects[left], rects[right], padding)) count++;
    }
  }
  return count;
}

function overlaps(left: LayoutRect, right: LayoutRect, padding: number): boolean {
  return left.x < right.x + right.width + padding &&
    left.x + left.width + padding > right.x &&
    left.y < right.y + right.height + padding &&
    left.y + left.height + padding > right.y;
}

function calculateBounds(rects: LayoutRect[]): GraphLayoutBounds {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x, y, width: right - x, height: bottom - y };
}

function validPoint(value: GraphPoint | undefined): value is GraphPoint {
  return value !== undefined && Number.isFinite(value.x) && Number.isFinite(value.y);
}

function validSize(value: GraphSize | undefined): value is GraphSize {
  return value !== undefined && Number.isFinite(value.width) && value.width > 0 &&
    Number.isFinite(value.height) && value.height > 0;
}

function layoutNumber(value: number | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Graph layout ${name} must be a positive finite number`);
  }
  return value;
}

function snap(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
