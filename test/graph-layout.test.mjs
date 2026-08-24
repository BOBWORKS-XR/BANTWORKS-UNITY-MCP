import assert from "node:assert/strict";
import test from "node:test";

import { layoutDirectedGraph } from "../dist/lib/graph-layout.js";

const size = { width: 216, height: 120 };

function rect(id, position, nodeSize = size) {
  return { id, ...position, ...nodeSize };
}

function overlaps(left, right, padding = 24) {
  return left.x < right.x + right.width + padding &&
    left.x + left.width + padding > right.x &&
    left.y < right.y + right.height + padding &&
    left.y + left.height + padding > right.y;
}

test("topology layout places a connected chain left to right", () => {
  const nodes = ["start", "branch", "finish"].map((id) => ({ id, size }));
  const result = layoutDirectedGraph(nodes, [
    { from: "start", to: "branch" },
    { from: "branch", to: "finish" },
  ]);

  assert.ok(result.positions.start.x < result.positions.branch.x);
  assert.ok(result.positions.branch.x < result.positions.finish.x);
  assert.equal(result.positions.start.y, result.positions.branch.y);
  assert.equal(result.positions.branch.y, result.positions.finish.y);
  assert.equal(result.autoPositionedNodeCount, 3);
});

test("fan-in layout keeps sibling inputs separate and their consumer nearby", () => {
  const nodes = ["left", "right", "merge"].map((id) => ({ id, size }));
  const result = layoutDirectedGraph(nodes, [
    { from: "left", to: "merge" },
    { from: "right", to: "merge" },
  ]);
  const left = rect("left", result.positions.left);
  const right = rect("right", result.positions.right);
  const merge = rect("merge", result.positions.merge);

  assert.equal(overlaps(left, right), false);
  assert.equal(overlaps(left, merge), false);
  assert.equal(overlaps(right, merge), false);
  assert.ok(merge.x > left.x && merge.x > right.x);
  const inputCenter = ((left.y + left.height / 2) + (right.y + right.height / 2)) / 2;
  assert.ok(Math.abs((merge.y + merge.height / 2) - inputCenter) <= 24);
});

test("cycles share a column without overlapping or losing determinism", () => {
  const nodes = ["a", "b", "c"].map((id) => ({ id, size }));
  const edges = [
    { from: "a", to: "b" },
    { from: "b", to: "a" },
    { from: "b", to: "c" },
  ];
  const first = layoutDirectedGraph(nodes, edges);
  const second = layoutDirectedGraph(nodes, edges);

  assert.deepEqual(first.positions, second.positions);
  assert.equal(first.positions.a.x, first.positions.b.x);
  assert.ok(first.positions.c.x > first.positions.b.x);
  assert.equal(overlaps(rect("a", first.positions.a), rect("b", first.positions.b)), false);
});

test("explicit positions are preserved and automatic nodes avoid them", () => {
  const result = layoutDirectedGraph([
    { id: "authored", position: { x: 0, y: 0 }, size },
    { id: "auto", size },
  ], []);

  assert.deepEqual(result.positions.authored, { x: 0, y: 0 });
  assert.equal(overlaps(rect("authored", result.positions.authored), rect("auto", result.positions.auto)), false);
  assert.equal(result.explicitNodeCount, 1);
  assert.equal(result.autoPositionedNodeCount, 1);
});

test("automatic nodes stay near an explicitly positioned connected neighbor", () => {
  const result = layoutDirectedGraph([
    { id: "authored", position: { x: -720, y: 144 }, size },
    { id: "auto", size },
  ], [{ from: "authored", to: "auto" }]);

  assert.deepEqual(result.positions.authored, { x: -720, y: 144 });
  assert.ok(result.positions.auto.x > result.positions.authored.x);
  assert.ok(result.positions.auto.x - result.positions.authored.x <= size.width + 120);
  assert.ok(Math.abs(result.positions.auto.y - result.positions.authored.y) <= 24);
});

test("custom origin, spacing, grid, and size hints are honored", () => {
  const result = layoutDirectedGraph([
    { id: "large", size: { width: 360, height: 240 } },
    { id: "next", size },
  ], [{ from: "large", to: "next" }], {
    origin: { x: -480, y: 72 },
    gridSize: 24,
    horizontalGap: 120,
  });

  assert.deepEqual(result.positions.large, { x: -480, y: 72 });
  assert.equal(result.positions.next.x, 0);
  assert.equal(result.positions.next.y % 24, 0);
  assert.equal(overlaps(
    rect("large", result.positions.large, { width: 360, height: 240 }),
    rect("next", result.positions.next)
  ), false);
});

test("invalid layout hints fail instead of silently changing the requested layout", () => {
  assert.throws(
    () => layoutDirectedGraph([{ id: "bad", position: { x: Number.NaN, y: 0 } }], []),
    /invalid position/
  );
  assert.throws(
    () => layoutDirectedGraph([{ id: "bad", size: { width: 0, height: 120 } }], []),
    /invalid layout size/
  );
  assert.throws(
    () => layoutDirectedGraph([{ id: "node" }], [], { gridSize: 0 }),
    /gridSize must be a positive finite number/
  );
});
