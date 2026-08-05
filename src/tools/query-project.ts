/**
 * Query Project State
 *
 * Read Unity project state from the MCP Bridge extension.
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";
import { dispatchUnityBridgeCommand } from "../lib/unity-bridge-transport.js";

export type ProjectStateMatchMode = "contains" | "exact";

export interface ProjectStateQueryOptions {
  match?: ProjectStateMatchMode;
  rootPath?: string;
  includeDescendants?: boolean;
  maxDepth?: number;
  maxResults?: number;
  fields?: string[];
  componentType?: string;
  refresh?: boolean;
  timeoutMs?: number;
}

interface QuerySummary {
  totalMatches: number;
  returned: number;
  truncated: boolean;
  match: ProjectStateMatchMode;
  rootPath?: string;
  includeDescendants: boolean;
  maxDepth?: number;
  maxResults: number;
  fields?: string[];
  componentType?: string;
}

interface SnapshotInfo {
  timestamp?: number;
  ageMs?: number;
  refreshed: boolean;
  refreshRequested: boolean;
  refreshError?: string;
  editorStateTimestamp?: number;
  editorStateAgeMs?: number;
  sceneDirty?: boolean;
  isPlaying?: boolean;
  isCompiling?: boolean;
  isUpdating?: boolean;
}

interface RefreshResult {
  requested: boolean;
  refreshed: boolean;
  error?: string;
}

interface LiveHierarchyQueryResult {
  commandId?: string;
  success?: boolean;
  sceneName?: string;
  scenePath?: string;
  objects?: Array<Record<string, unknown>>;
  components?: Array<Record<string, unknown>>;
  totalMatches?: number;
  returned?: number;
  truncated?: boolean;
  timestamp?: number;
  error?: string;
}

export interface ProjectStateResult {
  success: boolean;
  data?: unknown;
  error?: string;
  warning?: string;
  source?: string;
  query?: QuerySummary;
  snapshot?: SnapshotInfo;
}

const DEFAULT_MAX_RESULTS = 200;
const MAX_RESULTS_LIMIT = 5000;
const DEFAULT_REFRESH_TIMEOUT_MS = 30000;
const HIERARCHY_FIELDS = new Set([
  "name",
  "globalObjectId",
  "path",
  "active",
  "layer",
  "tag",
  "depth",
  "position",
  "rotation",
  "scale",
  "localPosition",
  "localRotation",
  "localScale",
  "components",
]);
const COMPONENT_FIELDS = new Set([
  "objectName",
  "objectPath",
  "depth",
  "type",
  "fullType",
  "globalObjectId",
  "properties",
]);

/**
 * Query the Unity project state.
 */
export async function queryProjectState(
  query: string,
  filter: string | undefined,
  config: BanterMCPConfig,
  options: ProjectStateQueryOptions = {}
): Promise<ProjectStateResult> {
  if (!config.unityProjectPath || !fs.existsSync(config.assetsPath)) {
    return {
      success: false,
      error: "Unity project not configured or Assets folder not found.",
    };
  }

  const validationError = validateQueryOptions(query, options);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const stateBackedQuery = query === "hierarchy" || query === "components" || query === "all";
    if ((query === "hierarchy" || query === "components") &&
        options.refresh !== false &&
        isTargetedHierarchyQuery(filter, options)) {
      if (!isBridgeLive(config)) {
        return {
          success: false,
          error: "Unity bridge heartbeat is stale or unavailable; a fresh targeted hierarchy query cannot be verified.",
        };
      }
      return requestTargetedHierarchyQuery(query, filter, config, options);
    }

    const refresh = stateBackedQuery
      ? await refreshHierarchyIfRequested(config, options)
      : { requested: false, refreshed: false };

    switch (query) {
      case "hierarchy":
        return readHierarchy(config, filter, options, refresh);

      case "components":
        return readComponentsFromHierarchy(config, filter, options, refresh);

      case "prefabs":
        return readPrefabCatalog(config, filter);

      case "assets":
        return readAssets(config, filter);

      case "all":
        return readAllState(config, refresh);

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

function validateQueryOptions(query: string, options: ProjectStateQueryOptions): string | undefined {
  if (options.match !== undefined && options.match !== "contains" && options.match !== "exact") {
    return "match must be either contains or exact.";
  }
  if (options.maxResults !== undefined &&
      (!Number.isInteger(options.maxResults) || options.maxResults < 1 || options.maxResults > MAX_RESULTS_LIMIT)) {
    return `maxResults must be a whole number between 1 and ${MAX_RESULTS_LIMIT}.`;
  }
  if (options.maxDepth !== undefined &&
      (!Number.isInteger(options.maxDepth) || options.maxDepth < 0 || options.maxDepth > 100)) {
    return "maxDepth must be a whole number between 0 and 100.";
  }
  if (options.timeoutMs !== undefined &&
      (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1000 || options.timeoutMs > 120000)) {
    return "timeoutMs must be between 1000 and 120000.";
  }
  if (options.fields !== undefined &&
      (!Array.isArray(options.fields) || options.fields.length > 50 || options.fields.some((field) => typeof field !== "string" || !field))) {
    return "fields must contain at most 50 non-empty field names.";
  }
  if (options.fields?.length) {
    const allowed = query === "hierarchy"
      ? HIERARCHY_FIELDS
      : query === "components"
        ? COMPONENT_FIELDS
        : undefined;
    if (!allowed) {
      return `fields are not supported for ${query} queries.`;
    }
    const unsupported = Array.from(new Set(options.fields.filter((field) => !allowed.has(field))));
    if (unsupported.length > 0) {
      return `Unsupported ${query} fields: ${unsupported.join(", ")}. Supported fields: ${Array.from(allowed).join(", ")}.`;
    }
  }
  return undefined;
}

function isTargetedHierarchyQuery(
  filter: string | undefined,
  options: ProjectStateQueryOptions
): boolean {
  return Boolean(
    normalizeObjectPath(options.rootPath) ||
    options.componentType ||
    (options.match === "exact" && filter)
  );
}

async function requestTargetedHierarchyQuery(
  query: "hierarchy" | "components",
  filter: string | undefined,
  config: BanterMCPConfig,
  options: ProjectStateQueryOptions
): Promise<ProjectStateResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REFRESH_TIMEOUT_MS;
  const dispatch = await dispatchUnityBridgeCommand({
    type: "query_hierarchy",
    queryKind: query,
    filter: filter || "",
    match: options.match ?? "contains",
    rootPath: normalizeObjectPath(options.rootPath) || "",
    includeDescendants: options.includeDescendants === true,
    maxDepth: options.maxDepth ?? -1,
    maxResults: options.maxResults ?? DEFAULT_MAX_RESULTS,
    componentType: options.componentType || "",
  }, config, Math.min(timeoutMs, 3000));

  if (dispatch.acknowledgement?.success === false) {
    return {
      success: false,
      error: dispatch.acknowledgement.error || "Unity rejected the targeted hierarchy query.",
    };
  }

  const resultPath = path.join(
    config.mcpStatePath,
    "hierarchy-query-results",
    `${dispatch.commandId}.json`
  );
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(resultPath)) {
      try {
        const result = JSON.parse(fs.readFileSync(resultPath, "utf-8")) as LiveHierarchyQueryResult;
        if (result.commandId !== dispatch.commandId) {
          throw new Error("Targeted hierarchy result correlation ID did not match the request.");
        }
        fs.unlinkSync(resultPath);
        if (result.success !== true) {
          return {
            success: false,
            error: result.error || "Unity could not complete the targeted hierarchy query.",
          };
        }

        const timestamp = result.timestamp;
        const fields = options.fields ? Array.from(new Set(options.fields)) : undefined;
        const rawItems = query === "hierarchy" ? result.objects || [] : result.components || [];
        const items = fields ? rawItems.map((item) => pickFields(item, fields)) : rawItems;
        const querySummary: QuerySummary = {
          totalMatches: result.totalMatches ?? items.length,
          returned: result.returned ?? items.length,
          truncated: result.truncated === true,
          match: options.match ?? "contains",
          rootPath: normalizeObjectPath(options.rootPath),
          includeDescendants: options.includeDescendants === true,
          maxDepth: options.maxDepth,
          maxResults: options.maxResults ?? DEFAULT_MAX_RESULTS,
          fields,
          componentType: options.componentType,
        };
        const snapshot = buildSnapshotInfo(
          config,
          { timestamp },
          { requested: true, refreshed: true }
        );

        return query === "hierarchy"
          ? {
              success: true,
              source: "unity-live-targeted-query",
              data: {
                sceneName: result.sceneName,
                scenePath: result.scenePath,
                objects: items,
                timestamp,
              },
              query: querySummary,
              snapshot,
            }
          : {
              success: true,
              source: "unity-live-targeted-query",
              data: items,
              query: querySummary,
              snapshot,
            };
      } catch (error) {
        if (error instanceof SyntaxError) {
          await sleep(50);
          continue;
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : "Could not read the targeted hierarchy result.",
        };
      }
    }
    await sleep(50);
  }

  return {
    success: false,
    error: `Timed out after ${timeoutMs}ms waiting for Unity's targeted hierarchy result; no stale snapshot was substituted.`,
  };
}

async function refreshHierarchyIfRequested(
  config: BanterMCPConfig,
  options: ProjectStateQueryOptions
): Promise<RefreshResult> {
  if (options.refresh === false) {
    return { requested: false, refreshed: false };
  }

  if (!isBridgeLive(config)) {
    return {
      requested: true,
      refreshed: false,
      error: "Unity bridge heartbeat is stale or unavailable; returning the latest saved snapshot.",
    };
  }

  return requestStateExport(
    config,
    "scene-hierarchy",
    options.timeoutMs ?? DEFAULT_REFRESH_TIMEOUT_MS
  );
}

function isBridgeLive(config: BanterMCPConfig): boolean {
  const editorState = readJsonFile(path.join(config.mcpStatePath, "editor-state.json"));
  const timestamp = numberValue(editorState?.timestamp);
  return timestamp !== undefined && Date.now() - timestamp <= 5000;
}

function readHierarchy(
  config: BanterMCPConfig,
  filter: string | undefined,
  options: ProjectStateQueryOptions,
  refresh: RefreshResult
): ProjectStateResult {
  const state = readStateFile(config, "scene-hierarchy.json", refresh);
  if (!state.success) {
    return state;
  }

  const hierarchy = state.data as Record<string, unknown>;
  const objects = Array.isArray(hierarchy.objects)
    ? hierarchy.objects.filter(isRecord)
    : [];
  const selected = selectHierarchyObjects(objects, filter, options);

  return {
    ...state,
    data: {
      ...hierarchy,
      objects: selected.items,
    },
    query: selected.summary,
  };
}

function readStateFile(
  config: BanterMCPConfig,
  filename: string,
  refresh: RefreshResult = { requested: false, refreshed: false }
): ProjectStateResult {
  const filePath = path.join(config.mcpStatePath, filename);

  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      error: `State file not found: ${filename}. Unity may need to export project state.`,
      source: filePath,
      snapshot: buildSnapshotInfo(config, undefined, refresh),
    };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return {
      success: true,
      data,
      warning: refresh.error,
      source: filePath,
      snapshot: buildSnapshotInfo(config, data, refresh),
    };
  } catch (error) {
    return {
      success: false,
      error: `Error reading ${filename}: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: filePath,
      snapshot: buildSnapshotInfo(config, undefined, refresh),
    };
  }
}

function buildSnapshotInfo(
  config: BanterMCPConfig,
  data: unknown,
  refresh: RefreshResult
): SnapshotInfo {
  const state = isRecord(data) ? data : undefined;
  const editorState = readJsonFile(path.join(config.mcpStatePath, "editor-state.json"));
  const timestamp = numberValue(state?.timestamp);
  const editorStateTimestamp = numberValue(editorState?.timestamp);

  return {
    timestamp,
    ageMs: timestamp === undefined ? undefined : Math.max(0, Date.now() - timestamp),
    refreshed: refresh.refreshed,
    refreshRequested: refresh.requested,
    refreshError: refresh.error,
    editorStateTimestamp,
    editorStateAgeMs: editorStateTimestamp === undefined
      ? undefined
      : Math.max(0, Date.now() - editorStateTimestamp),
    sceneDirty: booleanValue(editorState?.activeSceneDirty),
    isPlaying: booleanValue(editorState?.isPlaying),
    isCompiling: booleanValue(editorState?.isCompiling),
    isUpdating: booleanValue(editorState?.isUpdating),
  };
}

function selectHierarchyObjects(
  objects: Array<Record<string, unknown>>,
  filter: string | undefined,
  options: ProjectStateQueryOptions
): { items: Array<Record<string, unknown>>; summary: QuerySummary } {
  const match = options.match ?? "contains";
  const rootPath = normalizeObjectPath(options.rootPath);
  const includeDescendants = options.includeDescendants === true;
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
  const root = rootPath
    ? objects.find((object) => stringValue(object.path)?.toLowerCase() === rootPath.toLowerCase())
    : undefined;
  const rootDepth = numberValue(root?.depth);

  let matches = objects.filter((object) => {
    const objectPath = stringValue(object.path) ?? "";
    const objectDepth = numberValue(object.depth) ?? 0;

    if (rootPath) {
      const exactRoot = objectPath.toLowerCase() === rootPath.toLowerCase();
      const descendant = objectPath.toLowerCase().startsWith(`${rootPath.toLowerCase()}/`);
      if (!exactRoot && !(includeDescendants && descendant)) {
        return false;
      }
      if (options.maxDepth !== undefined && rootDepth !== undefined && objectDepth - rootDepth > options.maxDepth) {
        return false;
      }
    } else if (options.maxDepth !== undefined && objectDepth > options.maxDepth) {
      return false;
    }

    if (options.componentType && !objectHasComponent(object, options.componentType)) {
      return false;
    }
    return !filter || matchesFilter(object, filter, match);
  });

  if (options.componentType) {
    matches = matches.map((object) => projectMatchingComponents(object, options.componentType as string));
  }

  const totalMatches = matches.length;
  const fields = options.fields ? Array.from(new Set(options.fields)) : undefined;
  const items = matches
    .slice(0, maxResults)
    .map((object) => fields ? pickFields(object, fields) : object);

  return {
    items,
    summary: {
      totalMatches,
      returned: items.length,
      truncated: totalMatches > items.length,
      match,
      rootPath,
      includeDescendants,
      maxDepth: options.maxDepth,
      maxResults,
      fields,
      componentType: options.componentType,
    },
  };
}

function projectMatchingComponents(
  object: Record<string, unknown>,
  componentType: string
): Record<string, unknown> {
  const components = Array.isArray(object.components)
    ? object.components.filter(isRecord).filter((component) => componentMatchesType(component, componentType))
    : [];
  return { ...object, components };
}

function objectHasComponent(object: Record<string, unknown>, componentType: string): boolean {
  return Array.isArray(object.components) &&
    object.components.filter(isRecord).some((component) => componentMatchesType(component, componentType));
}

function componentMatchesType(component: Record<string, unknown>, componentType: string): boolean {
  const requested = componentType.toLowerCase();
  return stringValue(component.type)?.toLowerCase() === requested ||
    stringValue(component.fullType)?.toLowerCase() === requested;
}

function matchesFilter(
  item: Record<string, unknown>,
  filter: string,
  match: ProjectStateMatchMode
): boolean {
  const filterLower = filter.toLowerCase();
  if (match === "contains") {
    return JSON.stringify(item).toLowerCase().includes(filterLower);
  }

  const candidates = [item.name, item.path, item.type, item.fullType, item.objectName, item.objectPath]
    .filter((value): value is string => typeof value === "string");
  if (candidates.some((value) => value.toLowerCase() === filterLower)) {
    return true;
  }

  return Array.isArray(item.components) && item.components.filter(isRecord).some((component) =>
    stringValue(component.type)?.toLowerCase() === filterLower ||
    stringValue(component.fullType)?.toLowerCase() === filterLower
  );
}

function pickFields(item: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(item, field)) {
      result[field] = item[field];
    }
  }
  return result;
}

function normalizeObjectPath(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function readAllState(config: BanterMCPConfig, refresh: RefreshResult): ProjectStateResult {
  const files = [
    "scene-hierarchy.json",
    "editor-state.json",
    "console-log.json",
    "import-status.json",
    "compilation-status.json",
    "prefab-catalog.json",
  ];
  const result: Record<string, unknown> = {};

  for (const file of files) {
    const fileResult = readStateFile(
      config,
      file,
      file === "scene-hierarchy.json" ? refresh : { requested: false, refreshed: false }
    );
    const key = file.replace(".json", "").replace(/-/g, "_");
    result[key] = fileResult.success ? fileResult.data : { error: fileResult.error };
  }

  const hierarchy = readJsonFile(path.join(config.mcpStatePath, "scene-hierarchy.json"));
  return {
    success: true,
    data: result,
    warning: refresh.error,
    snapshot: buildSnapshotInfo(config, hierarchy, refresh),
  };
}

function readComponentsFromHierarchy(
  config: BanterMCPConfig,
  filter: string | undefined,
  options: ProjectStateQueryOptions,
  refresh: RefreshResult
): ProjectStateResult {
  const hierarchyResult = readStateFile(config, "scene-hierarchy.json", refresh);
  if (!hierarchyResult.success) {
    return hierarchyResult;
  }

  const hierarchy = hierarchyResult.data as { objects?: Array<Record<string, unknown>> };
  const selectedObjects = selectHierarchyObjects(hierarchy.objects || [], undefined, {
    ...options,
    fields: undefined,
    componentType: undefined,
    maxResults: Math.max(1, hierarchy.objects?.length || 0),
  });
  let components: Array<Record<string, unknown>> = [];

  for (const object of selectedObjects.items) {
    const objectComponents = Array.isArray(object.components) ? object.components : [];
    for (const component of objectComponents.filter(isRecord)) {
      components.push({
        objectName: object.name,
        objectPath: object.path,
        depth: object.depth,
        ...component,
      });
    }
  }

  if (options.componentType) {
    components = components.filter((component) => componentMatchesType(component, options.componentType as string));
  }
  if (filter) {
    components = components.filter((component) => matchesFilter(component, filter, options.match ?? "contains"));
  }

  const totalMatches = components.length;
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
  const fields = options.fields ? Array.from(new Set(options.fields)) : undefined;
  const items = components
    .slice(0, maxResults)
    .map((component) => fields ? pickFields(component, fields) : component);

  return {
    ...hierarchyResult,
    data: items,
    query: {
      ...selectedObjects.summary,
      totalMatches,
      returned: items.length,
      truncated: totalMatches > items.length,
      fields,
      componentType: options.componentType,
    },
  };
}

function readPrefabCatalog(
  config: BanterMCPConfig,
  filter?: string
): ProjectStateResult {
  const catalogPath = path.join(config.mcpStatePath, "prefab-catalog.json");

  if (fs.existsSync(catalogPath)) {
    const data = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    return {
      success: true,
      data: filter ? applySimpleFilter(flattenPrefabCatalog(data), filter) : data,
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

function readAssets(
  config: BanterMCPConfig,
  filter?: string
): ProjectStateResult {
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

function applySimpleFilter(data: unknown, filter: string): unknown {
  const filterLower = filter.toLowerCase();
  return Array.isArray(data)
    ? data.filter((item) => JSON.stringify(item).toLowerCase().includes(filterLower))
    : data;
}

async function requestStateExport(
  config: BanterMCPConfig,
  stateType: string,
  timeoutMs: number
): Promise<RefreshResult> {
  const statePath = path.join(config.mcpStatePath, `${stateType}.json`);
  const beforeModifiedAt = fs.existsSync(statePath) ? fs.statSync(statePath).mtimeMs : 0;

  try {
    const dispatch = await dispatchUnityBridgeCommand({
      type: "export-state",
      stateType,
    }, config, Math.min(timeoutMs, 3000));
    const resultPath = path.join(
      config.mcpStatePath,
      "command-results",
      `${dispatch.commandId}.json`
    );

    if (dispatch.acknowledgement?.success === false) {
      return {
        requested: true,
        refreshed: false,
        error: dispatch.acknowledgement.error || "Unity rejected the state export command.",
      };
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const stateChanged = fs.existsSync(statePath) && fs.statSync(statePath).mtimeMs > beforeModifiedAt;
      if (fs.existsSync(resultPath)) {
        try {
          const result = JSON.parse(fs.readFileSync(resultPath, "utf-8")) as Record<string, unknown>;
          if (result.commandId === dispatch.commandId) {
            fs.unlinkSync(resultPath);
            if (result.success === false) {
              return {
                requested: true,
                refreshed: false,
                error: stringValue(result.error) || "Unity rejected the state export command.",
              };
            }
            return stateChanged || fs.existsSync(statePath)
              ? { requested: true, refreshed: true }
              : { requested: true, refreshed: false, error: "Unity acknowledged the export but no snapshot was written." };
          }
        } catch {
          // Unity may still be atomically replacing the result file.
        }
      }
      if (stateChanged) {
        return { requested: true, refreshed: true };
      }
      if (dispatch.acknowledgement?.success === true && fs.existsSync(statePath)) {
        return { requested: true, refreshed: true };
      }
      await sleep(100);
    }

    return {
      requested: true,
      refreshed: false,
      error: `Timed out after ${timeoutMs}ms waiting for Unity to export project state; returning the latest snapshot.`,
    };
  } catch (error) {
    return {
      requested: true,
      refreshed: false,
      error: error instanceof Error ? error.message : "Could not request a Unity state export.",
    };
  }
}

function readJsonFile(filePath: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return isRecord(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
