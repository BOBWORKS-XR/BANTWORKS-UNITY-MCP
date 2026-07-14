import assert from "node:assert/strict";
import path from "node:path";

import { createConfigForProject } from "../dist/lib/config.js";
import { generateVSGraph } from "../dist/tools/generate-vs-graph.js";
import { writeVSGraph } from "../dist/tools/write-vs-graph.js";

const projectPath = process.argv[2];
if (!projectPath || !path.isAbsolute(projectPath)) {
  throw new Error("Usage: node scripts/write-banter-vs-fixture.mjs <absolute-unity-project-path>");
}

const generated = generateVSGraph({
  graphName: "BantworksOnGrabFixture",
  description: "Disposable Banter SDK import and allow-list fixture",
  nodes: [
    {
      type: "OnGrab",
      id: "on-grab",
      position: { x: 0, y: 0 },
    },
  ],
});

assert.equal(generated.success, true, generated.error);
assert.equal(generated.nodeCount, 1);
assert.equal(generated.connectionCount, 0);
assert.ok(generated.graphJson);

const config = {
  ...createConfigForProject(projectPath, "banter-fixture"),
  hasUnityExtension: false,
};
const written = await writeVSGraph(
  generated.graphJson,
  "BantworksOnGrabFixture",
  "BantworksFixtures",
  config
);

assert.equal(written.success, true, written.error ?? written.errors?.join("\n"));
assert.equal(
  written.assetPath?.replaceAll("\\", "/"),
  "Assets/BantworksFixtures/BantworksOnGrabFixture.asset"
);

process.stdout.write(JSON.stringify({ generated, written }, null, 2) + "\n");
