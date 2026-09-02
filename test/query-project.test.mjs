import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
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
        localPosition: [1, 2, 3],
        localRotation: [0, 90, 0],
        localScale: [1, 1, 1],
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

test("hierarchy field projections include local transforms and reject unknown fields", async () => {
  const fixture = await createHierarchyFixture();
  try {
    const projected = await queryProjectState("hierarchy", undefined, fixture.config, {
      rootPath: "Root",
      refresh: false,
      fields: ["path", "localPosition", "localRotation", "localScale"],
    });
    const invalid = await queryProjectState("hierarchy", undefined, fixture.config, {
      refresh: false,
      fields: ["path", "worldMatrix"],
    });

    assert.deepEqual(projected.data.objects, [{
      path: "Root",
      localPosition: [1, 2, 3],
      localRotation: [0, 90, 0],
      localScale: [1, 1, 1],
    }]);
    assert.equal(invalid.success, false);
    assert.match(invalid.error ?? "", /Unsupported hierarchy fields: worldMatrix/);
  } finally {
    await rm(fixture.projectPath, { recursive: true, force: true });
  }
});

test("fresh targeted hierarchy queries use a correlated live result without rewriting the full snapshot", async () => {
  const fixture = await createHierarchyFixture();
  try {
    const resultsPath = path.join(fixture.config.mcpStatePath, "hierarchy-query-results");
    const commandResultsPath = path.join(fixture.config.mcpStatePath, "command-results");
    await mkdir(resultsPath, { recursive: true });
    await mkdir(commandResultsPath, { recursive: true });
    const snapshotPath = path.join(fixture.config.mcpStatePath, "scene-hierarchy.json");
    const snapshotBefore = await readFile(snapshotPath, "utf8");

    const bridge = (async () => {
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        const commands = (await readdir(fixture.config.mcpCommandsPath)).filter((name) => name.endsWith(".json"));
        if (commands.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }

        const commandPath = path.join(fixture.config.mcpCommandsPath, commands[0]);
        const command = JSON.parse(await readFile(commandPath, "utf8"));
        assert.equal(command.type, "query_hierarchy");
        assert.equal(command.rootPath, "Root");
        assert.equal(command.maxResults, 5);
        assert.deepEqual(command.propertyNames, ["m_Mass"]);
        await writeFile(path.join(resultsPath, `${command.id}.json`), JSON.stringify({
          commandId: command.id,
          success: true,
          sceneName: "Fixture",
          scenePath: "Assets/Fixture.unity",
          objects: [{ name: "Root", path: "Root", depth: 0, localPosition: [4, 5, 6] }],
          components: [],
          totalMatches: 1,
          returned: 1,
          truncated: false,
          timestamp: Date.now(),
        }));
        await writeFile(path.join(commandResultsPath, `${command.id}.json`), JSON.stringify({
          commandId: command.id,
          success: true,
        }));
        await unlink(commandPath);
        return;
      }
      throw new Error("Timed out waiting for targeted hierarchy command");
    })();

    const result = await queryProjectState("hierarchy", undefined, fixture.config, {
      rootPath: "Root",
      maxResults: 5,
      fields: ["path", "localPosition"],
      propertyNames: ["m_Mass"],
      timeoutMs: 2000,
    });
    await bridge;

    assert.equal(result.success, true);
    assert.equal(result.source, "unity-live-targeted-query");
    assert.equal(result.snapshot?.refreshed, true);
    assert.deepEqual(result.data.objects, [{ path: "Root", localPosition: [4, 5, 6] }]);
    assert.equal(await readFile(snapshotPath, "utf8"), snapshotBefore);
  } finally {
    await rm(fixture.projectPath, { recursive: true, force: true });
  }
});

test("saved hierarchy queries project only requested serialized properties", async () => {
  const fixture = await createHierarchyFixture();
  try {
    const result = await queryProjectState("hierarchy", undefined, fixture.config, {
      rootPath: "Root",
      includeDescendants: true,
      componentType: "Rigidbody",
      propertyNames: ["m_Mass"],
      refresh: false,
    });

    assert.equal(result.success, true);
    const properties = result.data.objects[0].components[0].properties;
    assert.deepEqual(properties, [{ name: "m_Mass", value: "1" }]);
    assert.deepEqual(result.query?.propertyNames, ["m_Mass"]);
  } finally {
    await rm(fixture.projectPath, { recursive: true, force: true });
  }
});

test("hierarchy response byte budgets truncate oversized snapshot results", async () => {
  const fixture = await createHierarchyFixture();
  try {
    const hierarchyPath = path.join(fixture.config.mcpStatePath, "scene-hierarchy.json");
    const hierarchy = JSON.parse(await readFile(hierarchyPath, "utf8"));
    hierarchy.objects = [
      { name: "LargeA", path: "LargeA", depth: 0, payload: "a".repeat(12000), components: [] },
      { name: "LargeB", path: "LargeB", depth: 0, payload: "b".repeat(12000), components: [] },
    ];
    await writeFile(hierarchyPath, JSON.stringify(hierarchy));

    const result = await queryProjectState("hierarchy", undefined, fixture.config, {
      refresh: false,
      maxResults: 10,
      maxResponseBytes: 16384,
    });

    assert.equal(result.success, true);
    assert.equal(result.data.objects.length, 1);
    assert.equal(result.query?.truncated, true);
    assert.ok((result.query?.responseBytes ?? Infinity) <= 16384);
  } finally {
    await rm(fixture.projectPath, { recursive: true, force: true });
  }
});
