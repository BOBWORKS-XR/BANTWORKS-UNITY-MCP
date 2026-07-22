import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { queryProjectState } from "../dist/tools/query-project.js";

function createConfig(projectPath) {
  const assetsPath = path.join(projectPath, "Assets");
  const mcpRoot = path.join(projectPath, ".bantworks-mcp");
  return {
    unityProjectPath: projectPath,
    assetsPath,
    mcpStatePath: path.join(mcpRoot, "state"),
    mcpCommandsPath: path.join(mcpRoot, "commands"),
    webRootPath: path.join(assetsPath, "WebRoot"),
    hasUnityExtension: true,
  };
}

async function createHierarchyFixture() {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-query-test-"));
  const config = createConfig(projectPath);
  await mkdir(config.assetsPath, { recursive: true });
  await mkdir(config.mcpStatePath, { recursive: true });
  await mkdir(config.mcpCommandsPath, { recursive: true });

  const timestamp = Date.now() - 2000;
  await writeFile(path.join(config.mcpStatePath, "editor-state.json"), JSON.stringify({
    timestamp: Date.now(),
    activeSceneDirty: true,
    isPlaying: false,
    isCompiling: false,
    isUpdating: false,
  }));
  await writeFile(path.join(config.mcpStatePath, "scene-hierarchy.json"), JSON.stringify({
    sceneName: "Fixture",
    timestamp,
    objects: [
      {
        name: "Root",
        path: "Root",
        active: true,
        depth: 0,
        components: [{ type: "Transform", fullType: "UnityEngine.Transform", properties: [] }],
      },
      {
        name: "Child",
        path: "Root/Child",
        active: true,
        depth: 1,
        components: [
          { type: "Transform", fullType: "UnityEngine.Transform", properties: [] },
          { type: "Rigidbody", fullType: "UnityEngine.Rigidbody", properties: [{ name: "m_Mass", value: "1" }] },
        ],
      },
      {
        name: "Grandchild",
        path: "Root/Child/Grandchild",
        active: false,
        depth: 2,
        components: [{ type: "Transform", fullType: "UnityEngine.Transform", properties: [] }],
      },
      {
        name: "Other",
        path: "Other",
        active: true,
        depth: 0,
        components: [{ type: "Rigidbody", fullType: "UnityEngine.Rigidbody", properties: [] }],
      },
    ],
  }));

  return { projectPath, config, timestamp };
}

test("hierarchy root queries exclude descendants by default and report snapshot state", async () => {
  const fixture = await createHierarchyFixture();
  try {
    const result = await queryProjectState("hierarchy", undefined, fixture.config, {
      rootPath: "Root",
      refresh: false,
      fields: ["name", "path", "active"],
    });

    assert.equal(result.success, true);
    assert.equal(result.query?.totalMatches, 1);
    assert.deepEqual(result.data.objects, [{ name: "Root", path: "Root", active: true }]);
    assert.equal(result.snapshot?.timestamp, fixture.timestamp);
    assert.equal(result.snapshot?.sceneDirty, true);
    assert.equal(result.snapshot?.refreshRequested, false);
  } finally {
    await rm(fixture.projectPath, { recursive: true, force: true });
  }
});
test("hierarchy queries bound descendants, depth, and component projection", async () => {
  const fixture = await createHierarchyFixture();
  try {
    const result = await queryProjectState("hierarchy", undefined, fixture.config, {
      rootPath: "Root",
      includeDescendants: true,
      maxDepth: 1,
      componentType: "UnityEngine.Rigidbody",
      maxResults: 1,
      refresh: false,
    });

    assert.equal(result.success, true);
    assert.equal(result.query?.totalMatches, 1);
    assert.equal(result.query?.truncated, false);
    assert.equal(result.data.objects[0].path, "Root/Child");
    assert.deepEqual(result.data.objects[0].components.map((component) => component.type), ["Rigidbody"]);
  } finally {
    await rm(fixture.projectPath, { recursive: true, force: true });
  }
});

test("exact filters do not expand matching descendant paths", async () => {
  const fixture = await createHierarchyFixture();
  try {
    const exact = await queryProjectState("hierarchy", "Root", fixture.config, {
      match: "exact",
      refresh: false,
    });
    const contains = await queryProjectState("hierarchy", "Root", fixture.config, {
      match: "contains",
      refresh: false,
    });

    assert.equal(exact.query?.totalMatches, 1);
    assert.equal(contains.query?.totalMatches, 3);
  } finally {
    await rm(fixture.projectPath, { recursive: true, force: true });
  }
});
