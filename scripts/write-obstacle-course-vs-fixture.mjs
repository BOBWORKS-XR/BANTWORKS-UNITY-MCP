import assert from "node:assert/strict";
import path from "node:path";

import { createConfigForProject } from "../dist/lib/config.js";
import { generateVSGraph } from "../dist/tools/generate-vs-graph.js";
import { writeVSGraph } from "../dist/tools/write-vs-graph.js";

const projectPath = process.argv[2];
const mode = process.argv[3] ?? "unity";
if (!projectPath || !path.isAbsolute(projectPath) || !["unity", "banter"].includes(mode)) {
  throw new Error(
    "Usage: node scripts/write-obstacle-course-vs-fixture.mjs " +
    "<absolute-unity-project-path> <unity|banter>"
  );
}

const nodeType = mode === "banter" ? "OnGrab" : "Start";
const expectedType = mode === "banter"
  ? "Banter.VisualScripting.OnGrab"
  : "Unity.VisualScripting.Start";
const graphName = "BantworksVisualScriptingProbe";
const folder = "BANTWORKSCompatibility/Generated/VisualScripting";
const generated = generateVSGraph({
  graphName,
  description: "Cross-version BANTWORKS bridge import and persistence probe",
  nodes: [
    {
      type: nodeType,
      id: "fixture-event",
      position: { x: 0, y: 0 },
    },
  ],
});

assert.equal(generated.success, true, generated.error);
assert.equal(generated.nodeCount, 1);
assert.equal(generated.connectionCount, 0);
assert.ok(generated.graphJson);

const config = {
  ...createConfigForProject(projectPath, "obstacle-course-fixture"),
  hasUnityExtension: false,
};
const written = await writeVSGraph(
  generated.graphJson,
  graphName,
  folder,
  config
);

assert.equal(written.success, true, written.error ?? written.errors?.join("\n"));
assert.equal(
  written.assetPath?.replaceAll("\\", "/"),
  `Assets/${folder}/${graphName}.asset`
);

process.stdout.write(JSON.stringify({ mode, nodeType, expectedType, generated, written }, null, 2) + "\n");
