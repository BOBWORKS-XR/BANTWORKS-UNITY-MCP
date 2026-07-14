/**
 * Query Project State
 *
 * Read Unity project state from the MCP Bridge extension.
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";
import { atomicWriteFileSync } from "../lib/files.js";

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
  if (!config.unityProjectPath || !fs.existsSync(config.assetsPath)) {
    return {
      success: false,
      error: "Unity project not configured or Assets folder not found.",
    };
  }

  try {
    switch (query) {
      case "hierarchy":
        return await readStateFile(config, "scene-hierarchy.json", filter);

      case "components":
        return await readComponentsFromHierarchy(config, filter);

      case "prefabs":
        return await readPrefabCatalog(config, filter);

      case "assets":
        return await readAssets(config, filter);

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
    if (filter) {
      data = applyFilter(data, filter);
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
  const files = [
    "scene-hierarchy.json",
    "editor-state.json",
    "console-log.json",
    "import-status.json",
    "prefab-catalog.json",
  ];
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

async function readComponentsFromHierarchy(
  config: BanterMCPConfig,
  filter?: string
): Promise<ProjectStateResult> {
  const hierarchyResult = await readStateFile(config, "scene-hierarchy.json");
  if (!hierarchyResult.success) {
    return hierarchyResult;
  }

  const hierarchy = hierarchyResult.data as { objects?: Array<Record<string, unknown>> };
  const components: Array<Record<string, unknown>> = [];

  for (const obj of hierarchy.objects || []) {
    const objectComponents = Array.isArray(obj.components) ? obj.components : [];
    for (const component of objectComponents as Array<Record<string, unknown>>) {
      components.push({
        objectName: obj.name,
        objectPath: obj.path,
        depth: obj.depth,
        ...component,
      });
    }
  }

  return {
    success: true,
    data: filter ? applyFilter(components, filter) : components,
    source: path.join(config.mcpStatePath, "scene-hierarchy.json"),
  };
}

async function readPrefabCatalog(
  config: BanterMCPConfig,
  filter?: string
): Promise<ProjectStateResult> {
  const catalogPath = path.join(config.mcpStatePath, "prefab-catalog.json");

  if (fs.existsSync(catalogPath)) {
    const data = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    return {
      success: true,
      data: filter ? applyFilter(flattenPrefabCatalog(data), filter) : data,
      source: catalogPath,
    };
  }

  const prefabs = scanAssets(config.assetsPath, [".prefab"], filter);
  return {
    success: true,
    data: {
      generatedBy: "filesystem-scan",
      totalCount: prefabs.length,
      prefabs,
    },
    source: config.assetsPath,
  };
}

async function readAssets(
  config: BanterMCPConfig,
  filter?: string
): Promise<ProjectStateResult> {
  const assets = scanAssets(config.assetsPath, undefined, filter);
  return {
    success: true,
    data: {
      totalCount: assets.length,
      assets,
    },
    source: config.assetsPath,
  };
}

function flattenPrefabCatalog(data: unknown): Array<Record<string, unknown>> {
  const catalog = data as {
    categories?: Record<string, { prefabs?: Array<Record<string, unknown>> }>;
  };
  const prefabs: Array<Record<string, unknown>> = [];

  for (const category of Object.values(catalog.categories || {})) {
    prefabs.push(...(category.prefabs || []));
  }

  return prefabs;
}

function scanAssets(
  assetsPath: string,
  extensions?: string[],
  filter?: string
): Array<Record<string, unknown>> {
  const results: Array<Record<string, unknown>> = [];
  const ignoredDirs = new Set(["Library", "Temp", "Logs", "obj", "bin"]);
  const maxResults = 2000;

  function walk(dir: string): void {
    if (results.length >= maxResults) {
      return;
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (results.length >= maxResults) {
        return;
      }

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          walk(fullPath);
        }
        continue;
      }

      if (entry.name.endsWith(".meta")) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (extensions && !extensions.includes(ext)) {
        continue;
      }

      const relativePath = path.relative(assetsPath, fullPath).replace(/\\/g, "/");
      if (filter && !relativePath.toLowerCase().includes(filter.toLowerCase())) {
        continue;
      }

      results.push({
        name: entry.name,
        path: `Assets/${relativePath}`,
        extension: ext,
      });
    }
  }

  walk(assetsPath);
  return results;
}

function applyFilter(data: unknown, filter: string): unknown {
  const filterLower = filter.toLowerCase();

  if (Array.isArray(data)) {
    return data.filter((item) => objectContains(item, filterLower));
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.objects)) {
      return {
        ...obj,
        objects: obj.objects.filter((item) => objectContains(item, filterLower)),
      };
    }
  }

  return data;
}

function objectContains(item: unknown, filterLower: string): boolean {
  if (typeof item !== "object" || item === null) {
    return String(item).toLowerCase().includes(filterLower);
  }

  return JSON.stringify(item).toLowerCase().includes(filterLower);
}

async function requestStateExport(config: BanterMCPConfig, stateType: string): Promise<void> {
  try {
    const { randomUUID } = await import("crypto");
    const commandPath = path.join(config.mcpCommandsPath, `export-state-${randomUUID()}.json`);
    const command = {
      type: "export-state",
      stateType: stateType.replace(".json", ""),
      timestamp: Date.now(),
    };

    // Publish a uniquely named, complete command so concurrent state queries
    // cannot overwrite one another or expose partial JSON to Unity.
    atomicWriteFileSync(commandPath, JSON.stringify(command, null, 2));
  } catch {
    // Non-critical
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
