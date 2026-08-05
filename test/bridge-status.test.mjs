import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { getBridgeStatus } from "../dist/tools/get-bridge-status.js";
import { handleToolCall } from "../dist/tools/index.js";

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

test("get_bridge_status reports a ready bridge with fresh Unity state", async () => {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-mcp-test-"));
  const config = createConfig(projectPath);

  try {
    await mkdir(path.dirname(path.join(config.assetsPath, "Editor", "BanterMCPBridge.cs")), { recursive: true });
    await mkdir(config.mcpStatePath, { recursive: true });
    await mkdir(config.mcpCommandsPath, { recursive: true });
    await writeFile(path.join(config.assetsPath, "Editor", "BanterMCPBridge.cs"), "// test bridge");
    await writeFile(path.join(config.mcpStatePath, "scene-hierarchy.json"), "{}");
    await writeFile(path.join(config.mcpStatePath, "project-instance.json"), JSON.stringify({
      bridgeVersion: "2.2.0",
      protocolVersion: 1,
      minimumProtocolVersion: 1,
      capabilities: ["named_pipe_commands", "file_commands"],
      preferredTransport: "named_pipe",
      pipeName: "bantworks-unity-123-test",
      updatedAt: Date.now(),
    }));

    const result = getBridgeStatus(config);

    assert.equal(result.success, true);
    assert.equal(result.ready, true);
    assert.equal(result.bridge?.stateStatus, "fresh");
    assert.equal(result.bridge?.installed, true);
    assert.equal(result.bridge?.protocol.compatible, true);
    assert.equal(result.bridge?.protocol.bridgeRelease, "2.2.0");
    assert.equal(result.bridge?.transport.preferred, "named_pipe");
    assert.deepEqual(result.nextSteps, []);

    const response = await handleToolCall("get_bridge_status", {}, config);
    const publicResult = JSON.parse(response.content[0].text);
    assert.equal(publicResult.ready, true);
    assert.equal(publicResult.bridge.stateStatus, "fresh");
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("get_bridge_status explains how to recover from an unconfigured project", () => {
  const result = getBridgeStatus({
    unityProjectPath: "",
    assetsPath: "Assets",
    mcpStatePath: ".bantworks-mcp/state",
    mcpCommandsPath: ".bantworks-mcp/commands",
    webRootPath: "Assets/WebRoot",
    hasUnityExtension: false,
  });

  assert.equal(result.success, false);
  assert.match(result.error, /UNITY_PROJECT_PATH/);
  assert.match(result.nextSteps?.[0] ?? "", /restart the MCP client/i);
});

test("get_bridge_status rejects an incompatible live bridge protocol", async () => {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-mcp-test-"));
  const config = createConfig(projectPath);

  try {
    await mkdir(path.join(config.assetsPath, "Editor"), { recursive: true });
    await mkdir(config.mcpStatePath, { recursive: true });
    await mkdir(config.mcpCommandsPath, { recursive: true });
    await writeFile(path.join(config.assetsPath, "Editor", "BanterMCPBridge.cs"), "// test bridge");
    await writeFile(path.join(config.mcpStatePath, "project-instance.json"), JSON.stringify({
      bridgeVersion: "future",
      protocolVersion: 99,
      minimumProtocolVersion: 99,
      capabilities: ["named_pipe_commands"],
      pipeName: "bantworks-unity-123-future",
      updatedAt: Date.now(),
    }));

    const result = getBridgeStatus(config);
    assert.equal(result.ready, false);
    assert.equal(result.bridge?.protocol.compatible, false);
    assert.match(result.nextSteps?.[0] ?? "", /update the Unity bridge/i);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});
