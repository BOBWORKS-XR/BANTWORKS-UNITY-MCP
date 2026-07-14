import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { handleToolCall } from "../dist/tools/index.js";

function createConfig(projectPath) {
  const mcpRoot = path.join(projectPath, ".bantworks-mcp");
  return {
    unityProjectPath: projectPath,
    assetsPath: path.join(projectPath, "Assets"),
    mcpStatePath: path.join(mcpRoot, "state"),
    mcpCommandsPath: path.join(mcpRoot, "commands"),
    webRootPath: path.join(projectPath, "Assets", "WebRoot"),
    hasUnityExtension: true,
  };
}

async function callStatus(runId, config) {
  const response = await handleToolCall("get_unity_test_run", { runId }, config);
  return JSON.parse(response.content[0].text);
}

test("test status distinguishes a queued Unity command from a missing run", async () => {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-test-status-"));
  const config = createConfig(projectPath);
  const runId = "f66ed37a-cac2-4f71-a309-757e055e18cc";

  try {
    await mkdir(config.mcpCommandsPath, { recursive: true });
    await writeFile(path.join(config.mcpCommandsPath, `${runId}.json`), "{}");

    const result = await callStatus(runId, config);
    assert.equal(result.success, true);
    assert.equal(result.status, "queued");
    assert.equal(result.runId, runId);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("test status surfaces a late bridge rejection", async () => {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-test-status-"));
  const config = createConfig(projectPath);
  const runId = "926f0102-455f-4386-8175-6411b6132aba";

  try {
    const resultsPath = path.join(config.mcpStatePath, "command-results");
    await mkdir(resultsPath, { recursive: true });
    await writeFile(path.join(resultsPath, `${runId}.json`), JSON.stringify({
      commandId: runId,
      success: false,
      error: "Unity is compiling",
    }));

    const result = await callStatus(runId, config);
    assert.equal(result.success, false);
    assert.equal(result.status, "failed");
    assert.match(result.error, /compiling/);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("test cancellation rejects unsafe run IDs before writing a Unity command", async () => {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-test-cancel-"));
  const config = createConfig(projectPath);

  try {
    const response = await handleToolCall("cancel_unity_test_run", { runId: "../outside" }, config);
    const result = JSON.parse(response.content[0].text);
    assert.equal(result.success, false);
    assert.match(result.error, /letters, numbers, and hyphens/);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});
