/**
 * Write Visual Scripting Graph to Unity Project
 *
 * Writes a validated VS graph as a .asset file that Unity can import.
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";
import { atomicWriteFileSync, resolvePathWithin } from "../lib/files.js";

export interface WriteVSGraphResult {
  success: boolean;
  assetPath?: string;
  error?: string;
  message?: string;
}

/**
 * Write a VS graph to the Unity project
 */
export async function writeVSGraph(
  graphJson: string,
  graphName: string,
  folder: string,
  config: BanterMCPConfig
): Promise<WriteVSGraphResult> {
  // Validate config
  if (!config.unityProjectPath) {
    return {
      success: false,
      error: "UNITY_PROJECT_PATH not set. Cannot write to Unity project.",
    };
  }

  if (!fs.existsSync(config.assetsPath)) {
    return {
      success: false,
      error: `Assets folder not found: ${config.assetsPath}`,
    };
  }

  try {
    // Parse and validate the JSON
    let graphData: unknown;
    try {
      graphData = JSON.parse(graphJson);
    } catch {
      return {
        success: false,
        error: "Invalid JSON provided for graph",
      };
    }

    // Ensure the graph has the expected structure
    if (!graphData || typeof graphData !== "object" || !("graph" in graphData)) {
      return {
        success: false,
        error: "Graph JSON must have a 'graph' root object",
      };
    }

    if (path.basename(graphName) !== graphName || graphName === "." || graphName === "..") {
      return {
        success: false,
        error: "graphName must be a file name without path separators",
      };
    }

    // Create the target directory, constrained to the Unity Assets folder.
    const targetDir = resolvePathWithin(config.assetsPath, folder, "folder");
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate the .asset file content
    const assetContent = generateAssetFile(graphName, graphJson);

    // Write the file
    const assetPath = resolvePathWithin(targetDir, `${graphName}.asset`, "graphName");
    atomicWriteFileSync(assetPath, assetContent);

    // Write a .meta file hint for Unity (helps with import)
    const metaPath = `${assetPath}.meta`;
    if (!fs.existsSync(metaPath)) {
      const metaContent = generateMetaFile();
      atomicWriteFileSync(metaPath, metaContent);
    }

    // Trigger Unity refresh if extension is installed
    if (config.hasUnityExtension) {
      await triggerUnityRefresh(config, assetPath);
    }

    const relativePath = path.relative(config.unityProjectPath, assetPath);

    return {
      success: true,
      assetPath: relativePath,
      message: `Graph written successfully to ${relativePath}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error writing graph",
    };
  }
}

function generateAssetFile(graphName: string, graphJson: string): string {
  // Escape single quotes for YAML
  const escapedJson = graphJson.replace(/'/g, "''");

  return `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 0}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 95e66c6366d904e98bc83428217d4fd7, type: 3}
  m_Name: ${graphName}
  m_EditorClassIdentifier:
  _data:
    _json: '${escapedJson}'
    _objectReferences: []
`;
}

function generateMetaFile(): string {
  // Generate a random GUID for the meta file
  const guid = generateUnityGuid();

  return `fileFormatVersion: 2
guid: ${guid}
MonoImporter:
  externalObjects: {}
  serializedVersion: 2
  defaultReferences: []
  executionOrder: 0
  icon: {instanceID: 0}
  userData:
  assetBundleName:
  assetBundleVariant:
`;
}

function generateUnityGuid(): string {
  // Unity uses 32-character lowercase hex GUIDs (no dashes)
  const chars = "0123456789abcdef";
  let guid = "";
  for (let i = 0; i < 32; i++) {
    guid += chars[Math.floor(Math.random() * 16)];
  }
  return guid;
}

async function triggerUnityRefresh(config: BanterMCPConfig, assetPath: string): Promise<void> {
  // Write a refresh command for Unity's MCP Bridge to pick up
    try {
      const { randomUUID } = await import("crypto");
      const commandPath = path.join(config.mcpCommandsPath, `refresh-${randomUUID()}.json`);
      const command = {
        type: "refresh",
        path: assetPath,
        timestamp: Date.now(),
      };

      atomicWriteFileSync(commandPath, JSON.stringify(command, null, 2));
  } catch {
    // Non-critical error, Unity will refresh eventually
  }
}
