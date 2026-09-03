import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  BRIDGE_PROTOCOL_VERSION,
  dispatchUnityBridgeCommand,
} from "../dist/lib/unity-bridge-transport.js";
import { getUnityCommandStatus } from "../dist/tools/get-unity-command-status.js";

function createConfig(projectPath) {
  const root = path.join(projectPath, ".bantworks-mcp");
  return {
    projectId: "unity-fixture",
    unityProjectPath: projectPath,
    assetsPath: path.join(projectPath, "Assets"),
    mcpStatePath: path.join(root, "state"),
    mcpCommandsPath: path.join(root, "commands"),
    webRootPath: path.join(projectPath, "Assets", "WebRoot"),
    hasUnityExtension: true,
  };
}

async function createFixture() {
  const projectPath = await mkdtemp(path.join(os.tmpdir(), "bantworks-transport-"));
  const config = createConfig(projectPath);
  await mkdir(config.mcpStatePath, { recursive: true });
  await mkdir(config.mcpCommandsPath, { recursive: true });
  return { projectPath, config };
}

async function writePipeDescriptor(config, pipeName) {
  await writeFile(path.join(config.mcpStatePath, "project-instance.json"), JSON.stringify({
    bridgeVersion: "2.2.0",
    protocolVersion: BRIDGE_PROTOCOL_VERSION,
    minimumProtocolVersion: BRIDGE_PROTOCOL_VERSION,
    capabilities: ["named_pipe_commands", "file_commands"],
    preferredTransport: "named_pipe",
    pipeName,
    editorInstanceId: "editor-fixture",
    projectPath: config.unityProjectPath,
    projectName: path.basename(config.unityProjectPath),
    updatedAt: Date.now(),
  }));
}

function pipePath(pipeName) {
  return `\\\\.\\pipe\\${pipeName}`;
}

function listen(server, endpoint) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(endpoint, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

test("command transport falls back to an atomic file for a legacy bridge", async () => {
  const { projectPath, config } = await createFixture();
  try {
    const result = await dispatchUnityBridgeCommand({ type: "refresh" }, config, 100);

    assert.equal(result.transport, "file");
    assert.equal(result.queued, true);
    const commandPath = path.join(config.mcpCommandsPath, `${result.commandId}.json`);
    const command = JSON.parse(await readFile(commandPath, "utf-8"));
    assert.equal(command.id, result.commandId);
    assert.equal(command.protocolVersion, BRIDGE_PROTOCOL_VERSION);
    assert.equal(command.type, "refresh");
    assert.equal(command.expectedProjectId, config.projectId);
    assert.equal(command.expectedProjectPath, config.unityProjectPath);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("command transport uses the advertised named pipe", {
  skip: process.platform !== "win32",
}, async () => {
  const { projectPath, config } = await createFixture();
  const pipeName = `bantworks-unity-test-${process.pid}-${crypto.randomUUID()}`;
  const received = [];
  const server = net.createServer((socket) => {
    let request = "";
    socket.on("data", (chunk) => {
      request += chunk.toString("utf-8");
      const newline = request.indexOf("\n");
      if (newline < 0) return;
      const command = JSON.parse(request.slice(0, newline));
      received.push(command);
      socket.end(`${JSON.stringify({
        commandId: command.id,
        success: true,
        message: "processed",
        timestamp: Date.now(),
        projectPath: config.unityProjectPath,
        editorInstanceId: "editor-fixture",
      })}\n`);
    });
  });

  try {
    await writePipeDescriptor(config, pipeName);
    await listen(server, pipePath(pipeName));
    const result = await dispatchUnityBridgeCommand(
      { type: "create_gameobject", name: "PipeObject" },
      config,
      1000
    );

    assert.equal(result.transport, "named_pipe");
    assert.equal(result.queued, false);
    assert.equal(result.acknowledgement?.success, true);
    assert.equal(received.length, 1);
    assert.equal(received[0].protocolVersion, BRIDGE_PROTOCOL_VERSION);
    assert.equal(received[0].expectedProjectId, config.projectId);
    assert.equal(received[0].expectedProjectPath, config.unityProjectPath);
    assert.equal(received[0].expectedEditorInstanceId, "editor-fixture");
    assert.equal(fs.existsSync(path.join(config.mcpCommandsPath, `${result.commandId}.json`)), false);
  } finally {
    await close(server);
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("an unavailable pipe falls back before sending the command", {
  skip: process.platform !== "win32",
}, async () => {
  const { projectPath, config } = await createFixture();
  const pipeName = `bantworks-unity-test-${process.pid}-${crypto.randomUUID()}`;

  try {
    await writePipeDescriptor(config, pipeName);
    const result = await dispatchUnityBridgeCommand({ type: "refresh" }, config, 100);

    assert.equal(result.transport, "file");
    assert.equal(result.queued, true);
    assert.match(result.fallbackReason ?? "", /unavailable/i);
    assert.equal(fs.existsSync(path.join(config.mcpCommandsPath, `${result.commandId}.json`)), true);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("a sent pipe command is not duplicated through the file fallback", {
  skip: process.platform !== "win32",
}, async () => {
  const { projectPath, config } = await createFixture();
  const pipeName = `bantworks-unity-test-${process.pid}-${crypto.randomUUID()}`;
  const server = net.createServer((socket) => {
    socket.once("data", () => socket.end());
  });

  try {
    await writePipeDescriptor(config, pipeName);
    await listen(server, pipePath(pipeName));
    const result = await dispatchUnityBridgeCommand(
      { type: "delete_gameobject", objectPath: "Example" },
      config,
      500
    );

    assert.equal(result.transport, "named_pipe");
    assert.equal(result.queued, true);
    assert.equal(fs.existsSync(path.join(config.mcpCommandsPath, `${result.commandId}.json`)), false);
  } finally {
    await close(server);
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("command transport refuses a descriptor from another Unity project", async () => {
  const { projectPath, config } = await createFixture();
  try {
    await writePipeDescriptor(config, "bantworks-unity-wrong-project");
    const descriptorPath = path.join(config.mcpStatePath, "project-instance.json");
    const descriptor = JSON.parse(await readFile(descriptorPath, "utf8"));
    descriptor.projectPath = path.join(projectPath, "OtherProject");
    await writeFile(descriptorPath, JSON.stringify(descriptor));

    await assert.rejects(
      dispatchUnityBridgeCommand({ type: "refresh" }, config, 100),
      /bridge project mismatch/i
    );
    assert.deepEqual(await readdir(config.mcpCommandsPath), []);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("file transport rejects an acknowledgement from another project", async () => {
  const { projectPath, config } = await createFixture();
  const commandResultsPath = path.join(config.mcpStatePath, "command-results");
  await mkdir(commandResultsPath, { recursive: true });

  const bridge = (async () => {
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline) {
      const commands = (await readdir(config.mcpCommandsPath)).filter((name) => name.endsWith(".json"));
      if (commands.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        continue;
      }
      const command = JSON.parse(await readFile(path.join(config.mcpCommandsPath, commands[0]), "utf8"));
      await writeFile(path.join(commandResultsPath, `${command.id}.json`), JSON.stringify({
        commandId: command.id,
        success: true,
        projectPath: path.join(projectPath, "OtherProject"),
      }));
      return;
    }
    throw new Error("Timed out waiting for file command");
  })();

  try {
    await assert.rejects(
      dispatchUnityBridgeCommand({ type: "refresh" }, config, 1000),
      /acknowledgement project mismatch/i
    );
    await bridge;
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});

test("command status stays scoped to its project and active Editor instance", async () => {
  const { projectPath, config } = await createFixture();
  const commandId = crypto.randomUUID();
  const resultFolder = path.join(config.mcpStatePath, "command-results");
  await mkdir(resultFolder, { recursive: true });

  try {
    await writePipeDescriptor(config, "bantworks-unity-status-test");
    await writeFile(path.join(config.mcpCommandsPath, `${commandId}.json`), "{}");
    const pending = getUnityCommandStatus(commandId, config.projectId, config);
    assert.equal(pending.status, "pending");
    assert.equal(pending.accepted, true);

    const wrongProject = getUnityCommandStatus(commandId, "unity-other", config);
    assert.equal(wrongProject.status, "unknown");
    assert.match(wrongProject.error ?? "", /Project mismatch/);

    await writeFile(path.join(resultFolder, `${commandId}.json`), JSON.stringify({
      commandId,
      success: true,
      projectPath: config.unityProjectPath,
      editorInstanceId: "different-editor",
    }));
    const wrongEditor = getUnityCommandStatus(commandId, config.projectId, config);
    assert.equal(wrongEditor.status, "unknown");
    assert.match(wrongEditor.error ?? "", /different-editor/);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
});
