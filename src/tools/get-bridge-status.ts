/**
 * Read-only diagnostics for the project-local Unity bridge.
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";

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
  const ready = assetsExists && bridgeInstalled && stateDirectoryExists && stateStatus === "fresh";

  const nextSteps: string[] = [];
  if (!projectExists || !assetsExists) {
    nextSteps.push("Point UNITY_PROJECT_PATH at a Unity project root containing an Assets folder.");
  } else if (!bridgeInstalled) {
    nextSteps.push("Install unity-extension/Editor/BanterMCPBridge.cs into Assets/Editor, then let Unity compile it.");
  } else if (!stateDirectoryExists || stateStatus === "missing") {
    nextSteps.push("Open the project in Unity and wait for BANTWORKS MCP to export state.");
  } else if (stateStatus === "stale") {
    nextSteps.push("Open Unity and confirm the bridge is running; the most recent bridge state is older than 10 seconds.");
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
    },
    nextSteps,
  };
}
