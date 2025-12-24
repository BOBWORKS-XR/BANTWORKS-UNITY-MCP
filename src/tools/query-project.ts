/**
 * Query Project State
 *
 * Read Unity project state from the MCP Bridge extension.
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";

export interface ProjectStateResult {
  success: boolean;
  data?: unknown;
  error?: string;
  source?: string;
}

/**
 * Query the Unity project state
 */
export async function queryProjectState(
  query: string,
  filter: string | undefined,
  config: BanterMCPConfig
): Promise<ProjectStateResult> {
  if (!config.hasUnityExtension) {
    return {
      success: false,
      error: "Unity MCP Bridge extension not detected. Is Unity Editor running with BanterMCPBridge.cs installed?",
    };
  }

  try {
    switch (query) {
      case "hierarchy":
        return await readStateFile(config, "scene-hierarchy.json", filter);

      case "components":
        return await readStateFile(config, "components.json", filter);

      case "prefabs":
        return await readStateFile(config, "prefabs.json", filter);

      case "assets":
        return await readStateFile(config, "assets.json", filter);

      case "all":
        return await readAllState(config);

      default:
        return {
          success: false,
          error: `Unknown query type: ${query}. Valid options: hierarchy, components, prefabs, assets, all`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error querying project",
    };
  }
}

async function readStateFile(
  config: BanterMCPConfig,
  filename: string,
  filter?: string
): Promise<ProjectStateResult> {
  const filePath = path.join(config.mcpStatePath, filename);

  if (!fs.existsSync(filePath)) {
    // Try to trigger Unity to export state
    await requestStateExport(config, filename);

    // Wait briefly and retry
    await sleep(500);

    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `State file not found: ${filename}. Unity may need to export project state.`,
        source: filePath,
      };
    }
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    let data = JSON.parse(content);

    // Apply filter if provided
    if (filter && Array.isArray(data)) {
      data = data.filter((item: unknown) => {
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return (
            String(obj.name || "").toLowerCase().includes(filter.toLowerCase()) ||
            String(obj.type || "").toLowerCase().includes(filter.toLowerCase())
          );
        }
        return false;
      });
    }

    return {
      success: true,
      data,
      source: filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error reading ${filename}: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: filePath,
    };
  }
}

async function readAllState(config: BanterMCPConfig): Promise<ProjectStateResult> {
  const files = ["scene-hierarchy.json", "components.json", "prefabs.json", "assets.json"];
  const result: Record<string, unknown> = {};

  for (const file of files) {
    const fileResult = await readStateFile(config, file);
    const key = file.replace(".json", "").replace(/-/g, "_");

    if (fileResult.success) {
      result[key] = fileResult.data;
    } else {
      result[key] = { error: fileResult.error };
    }
  }

  return {
    success: true,
    data: result,
  };
}

async function requestStateExport(config: BanterMCPConfig, stateType: string): Promise<void> {
  const commandPath = path.join(config.mcpCommandsPath, "export-state.json");

  try {
    if (!fs.existsSync(config.mcpCommandsPath)) {
      fs.mkdirSync(config.mcpCommandsPath, { recursive: true });
    }

    const command = {
      type: "export-state",
      stateType: stateType.replace(".json", ""),
      timestamp: Date.now(),
    };

    fs.writeFileSync(commandPath, JSON.stringify(command, null, 2));
  } catch {
    // Non-critical
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
