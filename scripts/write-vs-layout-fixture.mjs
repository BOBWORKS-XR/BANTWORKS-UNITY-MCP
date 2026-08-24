import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { createConfigForProject } from "../dist/lib/config.js";
import { generateVSGraph } from "../dist/tools/generate-vs-graph.js";
import { writeVSGraph } from "../dist/tools/write-vs-graph.js";

const projectPath = process.argv[2];
if (!projectPath || !path.isAbsolute(projectPath)) {
  throw new Error("Usage: node scripts/write-vs-layout-fixture.mjs <absolute-unity-project-path>");
}

const graphName = "BantworksSpatialLayoutProbe";
const folder = "BantworksFixtures";
const generated = generateVSGraph({
  graphName,
  description: "Disposable topology-aware Visual Scripting layout probe",
  nodes: [
    { type: "Start", id: "start", position: { x: -720, y: 144 } },
    {
      type: "Literal",
      id: "ready-value",
      properties: { valueType: "System.Boolean", value: true },
    },
    { type: "SetVariable", id: "set-ready", properties: { name: "ready" } },
  ],
  connections: [
    { from: "start", fromPort: "trigger", to: "set-ready", toPort: "assign", type: "control" },
    { from: "ready-value", fromPort: "output", to: "set-ready", toPort: "input", type: "value" },
  ],
});

assert.equal(generated.success, true, generated.error);
assert.equal(generated.nodeCount, 3);
assert.equal(generated.connectionCount, 2);
assert.equal(generated.layout?.explicitNodeCount, 1);
assert.equal(generated.layout?.autoPositionedNodeCount, 2);
assert.ok(generated.graphJson);

const config = {
  ...createConfigForProject(projectPath, "vs-layout-fixture"),
  hasUnityExtension: false,
};
const written = await writeVSGraph(generated.graphJson, graphName, folder, config);

assert.equal(written.success, true, written.error ?? written.errors?.join("\n"));
assert.equal(
  written.assetPath?.replaceAll("\\", "/"),
  `Assets/${folder}/${graphName}.asset`
);

const parsed = JSON.parse(generated.graphJson);
const expectedUnits = parsed.graph.elements
  .filter((element) => typeof element.$type === "string" && element.$type.startsWith("Unity.VisualScripting.") && element.position)
  .map((element) => ({
    type: element.$type,
    x: element.position.x,
    y: element.position.y,
  }));
assert.equal(expectedUnits.length, 3);

const expectedPath = path.join(projectPath, "vs-layout-expected.json");
fs.writeFileSync(expectedPath, JSON.stringify({ units: expectedUnits }, null, 2) + "\n", "utf8");

process.stdout.write(JSON.stringify({ generated, written, expectedUnits }, null, 2) + "\n");
