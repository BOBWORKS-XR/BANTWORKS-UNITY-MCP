import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

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

test("console error filtering includes Unity Error, Exception, and Assert levels", async () => {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-console-test-"));
  const config = createConfig(projectPath);
  try {
    await mkdir(config.assetsPath, { recursive: true });
    await mkdir(config.mcpStatePath, { recursive: true });
    const now = Date.now();
    await writeFile(path.join(config.mcpStatePath, "editor-state.json"), JSON.stringify({ timestamp: now }));
    await writeFile(path.join(config.mcpStatePath, "console-log.json"), JSON.stringify({
      timestamp: now,
      logs: [
        { level: "Log", message: "ready", timestamp: now - 4 },
        { level: "Warning", message: "careful", timestamp: now - 3 },
        { level: "Error", message: "compile failed", stackTrace: "Assembly-CSharp", timestamp: now - 2 },
        { level: "Exception", message: "MissingValuePortInputException", stackTrace: "Flow.GetValue", timestamp: now - 1 },
        { level: "Assert", message: "assertion", timestamp: now },
      ],
    }));

    const response = await handleToolCall("get_console_logs", { level: "error" }, config);
    const result = JSON.parse(response.content[0].text);
    assert.equal(result.success, true);
    assert.equal(result.count, 3);
    assert.deepEqual(result.logs.map((entry) => entry.level), ["Error", "Exception", "Assert"]);
    assert.equal(result.stale, false);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});
test("console filters support time, text, regex, stack source, and stale warnings", async () => {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-console-test-"));
  const config = createConfig(projectPath);
  try {
    await mkdir(config.assetsPath, { recursive: true });
    await mkdir(config.mcpStatePath, { recursive: true });
    const now = Date.now();
    await writeFile(path.join(config.mcpStatePath, "editor-state.json"), JSON.stringify({ timestamp: now }));
    await writeFile(path.join(config.mcpStatePath, "console-log.json"), JSON.stringify({
      timestamp: now - 60000,
      logs: [
        { level: "Exception", message: "old portal failure", stackTrace: "Other.Assembly", timestamp: now - 10000 },
        { level: "Exception", message: "Missing input b", stackTrace: "Unity.VisualScripting.Flow", timestamp: now - 100 },
      ],
    }));

    const response = await handleToolCall("get_console_logs", {
      level: "error",
      sinceTimestamp: now - 1000,
      contains: "input",
      regex: "missing\\s+input",
      stackContains: "VisualScripting",
    }, config);
    const result = JSON.parse(response.content[0].text);
    assert.equal(result.count, 1);
    assert.equal(result.logs[0].message, "Missing input b");
    assert.equal(result.stale, true);
    assert.match(result.warning, /snapshot is stale/i);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});
