import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  BRIDGE_PROTOCOL_VERSION,
  dispatchUnityBridgeCommand,
} from "../dist/lib/unity-bridge-transport.js";

function createConfig(projectPath) {
  const root = path.join(projectPath, ".bantworks-mcp");
  return {
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
