import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createConfigForProject } from "../dist/lib/config.js";
import { BANTER_VS_NODES } from "../dist/resources/banter-vs-nodes.js";
import { generateVSGraph } from "../dist/tools/generate-vs-graph.js";
import { handleToolCall } from "../dist/tools/index.js";
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

test("generator emits Creator SDK namespaces and type handles for creator projects", () => {
  const result = generateVSGraph({
    graphName: "Creator Grab",
    sdkProfile: "creator",
    nodes: [
      { type: "OnGrab", id: "grab" },
      { type: "LoadTextUrl", id: "load" },
      { type: "CreateUIElement", id: "ui" },
    ],
    connections: [
      { from: "grab", fromPort: "trigger", to: "load", toPort: "Load", type: "control" },
    ],
    variables: [
      { name: "synced", type: "BanterSyncedObject" },
    ],
  });

  assert.equal(result.success, true, result.error);
  assert.equal(result.sdkProfile, "creator");
  assert.equal(result.customNodeNamespace, "BS.VisualScripting");
  const generated = JSON.parse(result.graphJson);
  const grab = generated.graph.elements.find((element) => element.$id === "1");
  const load = generated.graph.elements.find((element) => element.$id === "2");
  const ui = generated.graph.elements.find((element) => element.$id === "3");
  assert.equal(grab.$type, "BS.VisualScripting.OnGrab");
  assert.equal(grab.coroutine, true);
  assert.equal(load.$type, "BS.VisualScripting.LoadTextUrl");
  assert.equal(ui.$type, "BS.VisualScripting.CreateUIElement");
  assert.equal(ui.defaultValues["Element Type"].$type, "BS.VisualScripting.UIElementTypeVS");
  assert.equal(
    generated.graph.variables.collection.$content[0].typeHandle.Identification,
    "BS.BSSyncedObject, BS.SDK"
  );
  assert.equal(validateVSGraph(result.graphJson).valid, true);
});

test("generator refuses SideQuest custom nodes when no SDK is installed", () => {
  const result = generateVSGraph({
    graphName: "No SDK",
    sdkProfile: "none",
    nodes: [{ type: "OnGrab", id: "grab" }],
  });

  assert.equal(result.success, false);
  assert.match(result.error, /no supported SDK profile was detected/i);
});

test("generator refuses SideQuest variable aliases when no SDK is installed", () => {
  const result = generateVSGraph({
    graphName: "No SDK Variable",
    sdkProfile: "none",
    variables: [{ name: "synced", type: "BanterSyncedObject" }],
  });

  assert.equal(result.success, false);
  assert.match(result.error, /SideQuest variable type/i);
});

test("MCP graph tool detects the selected project profile automatically", async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "creator-works-profile-"));
  try {
    fs.mkdirSync(path.join(project, "Assets"));
    fs.mkdirSync(path.join(project, "Packages"));
    fs.writeFileSync(path.join(project, "Packages", "manifest.json"), JSON.stringify({
      dependencies: { "com.sidequest.creator-sdk": "3.2.17" },
    }));

    const response = await handleToolCall(
      "generate_vs_graph",
      { graphName: "Detected Creator", nodes: [{ type: "OnGrab", id: "grab" }] },
      createConfigForProject(project)
    );
    const result = JSON.parse(response.content[0].text);
    const graph = JSON.parse(result.graphJson);

    assert.equal(result.sdkProfile, "creator");
    assert.equal(graph.graph.elements[0].$type, "BS.VisualScripting.OnGrab");
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test("local user state contract exposes only the SDK head-pose value ports", () => {
  const localUserState = BANTER_VS_NODES.GetLocalUserState;
  assert.deepEqual(localUserState.inputs, []);
  assert.deepEqual(localUserState.outputs.map((port) => [port.name, port.type]), [
    ["Position", "value"],
    ["Rotation", "value"],
  ]);
  assert.match(localUserState.description, /tracked head/i);
});

test("validator rejects invented GetLocalUserState flow ports", () => {
  const graphJson = graphWith([
    node("1", UUIDS.one, "Banter.VisualScripting.GetLocalUserState"),
    node("2", UUIDS.two),
    {
      sourceUnit: { $ref: "1" },
      sourceKey: "exit",
      destinationUnit: { $ref: "2" },
      destinationKey: "enter",
      guid: UUIDS.three,
      $type: "Unity.VisualScripting.ControlConnection",
    },
  ]);

  const validation = validateVSGraph(graphJson);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("no control-flow ports")));
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

test("validator enforces project namespaces while allowing hybrid preservation", () => {
  const legacyGrab = node("1", UUIDS.one, "Banter.VisualScripting.OnGrab");
  legacyGrab.coroutine = false;
  const graphJson = graphWith([legacyGrab]);

  const creator = validateVSGraph(graphJson, { sdkProfile: "creator" });
  assert.equal(creator.valid, false);
  assert.ok(creator.errors.some((error) => error.includes("legacy type")));

  const hybrid = validateVSGraph(graphJson, { sdkProfile: "hybrid" });
  assert.equal(hybrid.valid, true, hybrid.errors.join("\n"));
  assert.ok(hybrid.warnings.some((warning) => warning.includes("hybrid project")));
});

test("validator classifies all SideQuest variable namespace handles", () => {
  const creatorGraph = JSON.parse(graphWith([]));
  creatorGraph.graph.variables.collection.$content.push({
    name: "ratio",
    value: null,
    typeHandle: { Identification: "BS.AiImageRatio", $version: "A" },
    $version: "A",
  });
  const legacyGraph = JSON.parse(graphWith([]));
  legacyGraph.graph.variables.collection.$content.push({
    name: "element",
    value: null,
    typeHandle: { Identification: "Banter.UI.BanterElement", $version: "A" },
    $version: "A",
  });

  const creatorInLegacy = validateVSGraph(JSON.stringify(creatorGraph), { sdkProfile: "banter" });
  assert.equal(creatorInLegacy.valid, false);
  assert.ok(creatorInLegacy.errors.some((error) => error.includes("Creator type handle")));

  const legacyInCreator = validateVSGraph(JSON.stringify(legacyGraph), { sdkProfile: "creator" });
  assert.equal(legacyInCreator.valid, false);
  assert.ok(legacyInCreator.errors.some((error) => error.includes("legacy type handle")));
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

test("writer rejects a legacy custom-node namespace in a Creator SDK project", async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "creator-works-vs-profile-"));
  const legacyGrab = node("1", UUIDS.one, "Banter.VisualScripting.OnGrab");
  legacyGrab.coroutine = false;
  try {
    fs.mkdirSync(path.join(project, "Assets"));
    fs.mkdirSync(path.join(project, "Packages"));
    fs.writeFileSync(path.join(project, "Packages", "manifest.json"), JSON.stringify({
      dependencies: { "com.sidequest.creator-sdk": "3.2.17" },
    }));

    const result = await writeVSGraph(
      graphWith([legacyGrab]),
      "Legacy In Creator",
      "Graphs",
      createConfigForProject(project)
    );
    assert.equal(result.success, false);
    assert.ok(result.errors.some((error) => error.includes("legacy type")));
    assert.equal(
      fs.existsSync(path.join(project, "Assets", "Graphs", "Legacy In Creator.asset")),
      false
    );
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
