import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createConfigForProject } from "../dist/lib/config.js";
import { generateVSGraph } from "../dist/tools/generate-vs-graph.js";
import { validateVSGraph } from "../dist/tools/validate-vs-graph.js";
import { writeVSGraph } from "../dist/tools/write-vs-graph.js";

const UUIDS = {
  one: "e75a9035-d931-46f4-ab5e-77a458827cea",
  two: "2f95b1ce-1063-4760-b53a-d4fb5aac7726",
  three: "9d20ba9a-d782-40ff-b3d0-c3ac0d509977",
};

function graphWith(elements) {
  return JSON.stringify({
    graph: {
      variables: { Kind: "Flow", collection: { $content: [], $version: "A" }, $version: "A" },
      controlInputDefinitions: [],
      controlOutputDefinitions: [],
      valueInputDefinitions: [],
      valueOutputDefinitions: [],
      elements,
      $version: "A",
    },
  });
}

function node(id, guid, type = "Unity.VisualScripting.GraphOutput") {
  return {
    defaultValues: {},
    position: { x: 0, y: 0 },
    guid,
    $version: "A",
    $type: type,
    ...(id === undefined ? {} : { $id: id }),
  };
}

test("generator emits canonical elements and versionless connections", () => {
  const result = generateVSGraph({
    graphName: "Grab Handler",
    nodes: [
      { type: "OnGrab", id: "grab", position: { x: 0, y: 0 } },
      { type: "SetCanMove", id: "move", position: { x: 240, y: 0 } },
    ],
    connections: [
      { from: "grab", fromPort: "trigger", to: "move", toPort: "enter", type: "control" },
    ],
  });

  assert.equal(result.success, true);
  const generated = JSON.parse(result.graphJson);
  assert.ok(Array.isArray(generated.graph.elements));
  assert.equal(generated.graph.units, undefined);
  assert.equal(generated.graph.controlConnections, undefined);

  const connection = generated.graph.elements.find((element) => element.$type.endsWith("Connection"));
  assert.equal(connection.$version, undefined);
  assert.match(connection.guid, /^[0-9a-f-]{36}$/);
  assert.equal(validateVSGraph(result.graphJson).valid, true);
  assert.match(result.assetContent, /m_EditorClassIdentifier: Unity\.VisualScripting\.Flow::Unity\.VisualScripting\.ScriptGraphAsset/);
});

test("generator auto-positions omitted nodes without overlap", () => {
  const result = generateVSGraph({
    graphName: "Auto Layout",
    nodes: [
      { type: "Start", id: "start" },
      { type: "Literal", id: "value", properties: { valueType: "System.Boolean", value: true } },
      { type: "SetVariable", id: "set", properties: { name: "ready" } },
    ],
    connections: [
      { from: "start", fromPort: "trigger", to: "set", toPort: "assign", type: "control" },
      { from: "value", fromPort: "output", to: "set", toPort: "input", type: "value" },
    ],
  });

  assert.equal(result.success, true);
  assert.equal(result.layout.autoPositionedNodeCount, 3);
  const generated = JSON.parse(result.graphJson);
  const nodes = generated.graph.elements.filter((element) => !element.$type.endsWith("Connection"));
  assert.equal(new Set(nodes.map((element) => `${element.position.x},${element.position.y}`)).size, 3);
  const set = nodes.find((element) => element.$type === "Unity.VisualScripting.SetVariable");
  const start = nodes.find((element) => element.$type === "Unity.VisualScripting.Start");
  const value = nodes.find((element) => element.$type === "Unity.VisualScripting.Literal");
  assert.ok(set.position.x > start.position.x);
  assert.ok(set.position.x > value.position.x);
});

test("generator preserves explicit positions while laying out missing nodes", () => {
  const result = generateVSGraph({
    graphName: "Mixed Layout",
    nodes: [
      { type: "Start", id: "start", position: { x: -720, y: 144 } },
      { type: "Debug", id: "debug" },
    ],
    connections: [
      { from: "start", fromPort: "trigger", to: "debug", toPort: "enter", type: "control" },
    ],
  });

  assert.equal(result.success, true);
  const generated = JSON.parse(result.graphJson);
  const start = generated.graph.elements.find((element) => element.$type === "Unity.VisualScripting.Start");
  const debug = generated.graph.elements.find((element) => element.$type === "Unity.VisualScripting.Debug");
  assert.deepEqual(start.position, { x: -720, y: 144 });
  assert.notDeepEqual(debug.position, start.position);
  assert.ok(debug.position.x > start.position.x);
  assert.ok(debug.position.x - start.position.x <= 360);
  assert.ok(Math.abs(debug.position.y - start.position.y) <= 24);
  assert.equal(result.layout.explicitNodeCount, 1);
  assert.equal(result.layout.autoPositionedNodeCount, 1);
});

test("generator uses the singular space-state type and valid empty Banter flow ports", () => {
  const result = generateVSGraph({
    graphName: "Networking",
    nodes: [
      { type: "SetSpaceStateProps", id: "state" },
      { type: "SendOneShot", id: "send" },
    ],
    connections: [
      { from: "state", fromPort: "", to: "send", toPort: "", type: "control" },
    ],
  });

  assert.equal(result.success, true);
  const generated = JSON.parse(result.graphJson);
  const stateNode = generated.graph.elements.find((element) => element.$id === "1");
  const connection = generated.graph.elements.find((element) => element.$type.endsWith("ControlConnection"));
  assert.equal(stateNode.$type, "Banter.VisualScripting.SetSpaceStateProp");
  assert.equal(connection.sourceKey, "");
  assert.equal(connection.destinationKey, "");
  assert.equal(validateVSGraph(result.graphJson).valid, true);
});

test("generator enables coroutine events when their flow reaches a coroutine unit", () => {
  const result = generateVSGraph({
    graphName: "HTTP Loader",
    nodes: [
      { type: "Start", id: "start" },
      { type: "LoadTextUrl", id: "load" },
    ],
    connections: [
      { from: "start", fromPort: "trigger", to: "load", toPort: "Load", type: "control" },
    ],
  });

  assert.equal(result.success, true);
  const generated = JSON.parse(result.graphJson);
  const startNode = generated.graph.elements.find((element) => element.$id === "1");
  assert.equal(startNode.coroutine, true);
  assert.equal(validateVSGraph(result.graphJson).valid, true);
});

test("validator rejects a non-coroutine event that reaches a coroutine unit", () => {
  const start = node("1", UUIDS.one, "Unity.VisualScripting.Start");
  start.coroutine = false;
  const graphJson = graphWith([
    start,
    node("2", UUIDS.two, "Unity.VisualScripting.WaitForSecondsUnit"),
    {
      sourceUnit: { $ref: "1" },
      sourceKey: "trigger",
      destinationUnit: { $ref: "2" },
      destinationKey: "enter",
      guid: UUIDS.three,
      $type: "Unity.VisualScripting.ControlConnection",
    },
  ]);

  const validation = validateVSGraph(graphJson);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("reaches coroutine unit")));
});

test("validator accepts Unity 1.9 serialization details", () => {
  const graphJson = graphWith([
    node("1", UUIDS.one, "Unity.VisualScripting.This"),
    node("2", UUIDS.two),
    node(undefined, UUIDS.three),
    {
      sourceUnit: { $ref: "1" },
      sourceKey: "self",
      destinationUnit: { $ref: "2" },
      destinationKey: "value",
      guid: "c5773cf3-2733-43d5-806d-2cb355cd3b84",
      $type: "Unity.VisualScripting.ValueConnection",
    },
  ]);

  const validation = validateVSGraph(graphJson);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(validation.nodeCount, 3);
  assert.equal(validation.connectionCount, 1);
});

test("validator rejects duplicate IDs and dangling connection references", () => {
  const graphJson = graphWith([
    node("1", UUIDS.one),
    node("1", UUIDS.two),
    {
      sourceUnit: { $ref: "404" },
      sourceKey: "trigger",
      destinationUnit: { $ref: "1" },
      destinationKey: "enter",
      guid: UUIDS.three,
      $type: "Unity.VisualScripting.ControlConnection",
    },
  ]);

  const validation = validateVSGraph(graphJson);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("Duplicate node $id: 1")));
  assert.ok(validation.errors.some((error) => error.includes("missing source node $id: 404")));
});

test("validator rejects SetVariable without a value connection", () => {
  const setVariable = node("1", UUIDS.one, "Unity.VisualScripting.SetVariable");
  setVariable.kind = "Graph";
  setVariable.defaultValues = {
    name: { $content: "score", $type: "System.String" },
  };
  const validation = validateVSGraph(graphWith([setVariable]));
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("no value connection")));
});

test("writer rejects invalid graphs before writing", async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "bantworks-vs-invalid-"));
  try {
    fs.mkdirSync(path.join(project, "Assets"));
    const result = await writeVSGraph("{}", "Invalid", "Graphs", createConfigForProject(project));
    assert.equal(result.success, false);
    assert.equal(fs.existsSync(path.join(project, "Assets", "Graphs", "Invalid.asset")), false);
    assert.ok(result.errors.some((error) => error.includes("Missing 'graph'")));
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test("writer emits NativeFormatImporter and migrates old MCP metadata without changing GUID", async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "bantworks-vs-write-"));
  const graphJson = graphWith([node(undefined, UUIDS.one)]);
  try {
    fs.mkdirSync(path.join(project, "Assets"));
    const config = createConfigForProject(project);
    const first = await writeVSGraph(graphJson, "Respawn Graph", "Graphs", config);
    assert.equal(first.success, true);

    const assetPath = path.join(project, "Assets", "Graphs", "Respawn Graph.asset");
    const metaPath = `${assetPath}.meta`;
    assert.match(fs.readFileSync(assetPath, "utf8"), /m_EditorClassIdentifier: Unity\.VisualScripting\.Flow::Unity\.VisualScripting\.ScriptGraphAsset/);
    assert.match(fs.readFileSync(metaPath, "utf8"), /^NativeFormatImporter:/m);
    assert.match(fs.readFileSync(metaPath, "utf8"), /^  mainObjectFileID: 11400000$/m);

    const preservedGuid = "0123456789abcdef0123456789abcdef";
    fs.writeFileSync(metaPath, `fileFormatVersion: 2\nguid: ${preservedGuid}\nMonoImporter:\n  externalObjects: {}\n`);
    const migrated = await writeVSGraph(graphJson, "Respawn Graph", "Graphs", config);
    assert.equal(migrated.success, true);
    const migratedMeta = fs.readFileSync(metaPath, "utf8");
    assert.match(migratedMeta, new RegExp(`^guid: ${preservedGuid}$`, "m"));
    assert.match(migratedMeta, /^NativeFormatImporter:/m);
    assert.doesNotMatch(migratedMeta, /^MonoImporter:/m);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
