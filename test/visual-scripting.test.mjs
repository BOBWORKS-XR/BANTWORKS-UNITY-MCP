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
