/**
 * Read-only diagnostics for the project-local Unity bridge.
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";
import {
  BRIDGE_PROTOCOL_VERSION,
  readBridgeInstanceDescriptor,
} from "../lib/unity-bridge-transport.js";

const STATE_FILES = [
  "scene-hierarchy.json",
  "editor-state.json",
  "project-instance.json",
  "console-log.json",
  "import-status.json",
  "compilation-status.json",
  "prefab-catalog.json",
];

interface StateFileStatus {
  name: string;
  exists: boolean;
  updatedAt?: string;
  ageMs?: number;
}

export interface BridgeStatusResult {
  success: boolean;
  ready?: boolean;
  error?: string;
  project?: {
    id?: string;
    path: string;
    exists: boolean;
    assetsPath: string;
    assetsExists: boolean;
  };
  bridge?: {
    path: string;
    installed: boolean;
    stateDirectory: string;
    stateDirectoryExists: boolean;
    commandsDirectory: string;
    commandsDirectoryExists: boolean;
    stateStatus: "fresh" | "stale" | "missing";
    stateFiles: StateFileStatus[];
    protocol: {
      serverVersion: number;
      bridgeVersion?: number;
      minimumBridgeVersion?: number;
      compatible: boolean;
      bridgeRelease?: string;
      capabilities: string[];
    };
    transport: {
      preferred: "named_pipe" | "file";
      namedPipeAdvertised: boolean;
      pipeName?: string;
    };
  };
  nextSteps?: string[];
}

/**
 * Inspect the local bridge state without creating commands or modifying Unity.
 */
export function getBridgeStatus(config: BanterMCPConfig): BridgeStatusResult {
  if (!config.unityProjectPath) {
    return {
      success: false,
      error: "UNITY_PROJECT_PATH is not set.",
      nextSteps: [
        "Set UNITY_PROJECT_PATH to the Unity project root, then restart the MCP client.",
      ],
    };
  }

  const projectExists = fs.existsSync(config.unityProjectPath);
  const assetsExists = fs.existsSync(config.assetsPath);
  const bridgePath = path.join(config.assetsPath, "Editor", "BanterMCPBridge.cs");
  const bridgeInstalled = fs.existsSync(bridgePath);
  const stateDirectoryExists = fs.existsSync(config.mcpStatePath);
  const commandsDirectoryExists = fs.existsSync(config.mcpCommandsPath);
  const descriptor = readBridgeInstanceDescriptor(config);
  const now = Date.now();

  const stateFiles = STATE_FILES.map((name): StateFileStatus => {
    const filePath = path.join(config.mcpStatePath, name);
    if (!fs.existsSync(filePath)) {
      return { name, exists: false };
    }

    const modifiedAt = fs.statSync(filePath).mtime;
    return {
      name,
      exists: true,
      updatedAt: modifiedAt.toISOString(),
      ageMs: Math.max(0, now - modifiedAt.getTime()),
    };
  });

  const ages = stateFiles
    .map((file) => file.ageMs)
    .filter((age): age is number => typeof age === "number");
  const newestAge = ages.length > 0 ? Math.min(...ages) : undefined;
  const stateStatus = newestAge === undefined
    ? "missing"
    : newestAge <= 10_000
      ? "fresh"
      : "stale";
  const bridgeProtocol = descriptor?.protocolVersion;
  const minimumBridgeProtocol = descriptor?.minimumProtocolVersion ?? bridgeProtocol;
  const protocolCompatible = bridgeProtocol === undefined ||
    (bridgeProtocol === BRIDGE_PROTOCOL_VERSION &&
      (minimumBridgeProtocol ?? BRIDGE_PROTOCOL_VERSION) <= BRIDGE_PROTOCOL_VERSION);
  const capabilities = Array.isArray(descriptor?.capabilities)
    ? descriptor.capabilities.filter((item): item is string => typeof item === "string")
    : [];
  const namedPipeAdvertised = capabilities.includes("named_pipe_commands") &&
    typeof descriptor?.pipeName === "string";
  const ready = assetsExists && bridgeInstalled && stateDirectoryExists &&
    stateStatus === "fresh" && protocolCompatible;

  const nextSteps: string[] = [];
  if (!projectExists || !assetsExists) {
    nextSteps.push("Point UNITY_PROJECT_PATH at a Unity project root containing an Assets folder.");
  } else if (!bridgeInstalled) {
    nextSteps.push("Install unity-extension/Editor/BanterMCPBridge.cs into Assets/Editor, then let Unity compile it.");
  } else if (!stateDirectoryExists || stateStatus === "missing") {
    nextSteps.push("Open the project in Unity and wait for BANTWORKS MCP to export state.");
  } else if (stateStatus === "stale") {
    nextSteps.push("Open Unity and confirm the bridge is running; the most recent bridge state is older than 10 seconds.");
  } else if (!protocolCompatible) {
    nextSteps.push("Update the Unity bridge; its command protocol does not match this MCP server.");
  }

  return {
    success: true,
    ready,
    project: {
      id: config.projectId,
      path: config.unityProjectPath,
      exists: projectExists,
      assetsPath: config.assetsPath,
      assetsExists,
    },
    bridge: {
      path: bridgePath,
      installed: bridgeInstalled,
      stateDirectory: config.mcpStatePath,
      stateDirectoryExists,
      commandsDirectory: config.mcpCommandsPath,
      commandsDirectoryExists,
      stateStatus,
      stateFiles,
      protocol: {
        serverVersion: BRIDGE_PROTOCOL_VERSION,
        bridgeVersion: bridgeProtocol,
        minimumBridgeVersion: minimumBridgeProtocol,
        compatible: protocolCompatible,
        bridgeRelease: descriptor?.bridgeVersion,
        capabilities,
      },
      transport: {
        preferred: namedPipeAdvertised ? "named_pipe" : "file",
        namedPipeAdvertised,
        pipeName: namedPipeAdvertised ? descriptor?.pipeName : undefined,
      },
    },
    nextSteps,
  };
}
