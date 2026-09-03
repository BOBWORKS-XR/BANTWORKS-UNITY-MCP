import * as fs from "fs";
import * as path from "path";

import type { BanterMCPConfig } from "../lib/config.js";
import { dispatchUnityBridgeCommand } from "../lib/unity-bridge-transport.js";
import {
  layoutDirectedGraph,
  type GraphLayoutOptions,
  type GraphPoint,
  type GraphSize,
} from "../lib/graph-layout.js";

export interface ShaderGraphNodeSpec {
  id?: string;
  nodeType: string;
  position?: GraphPoint;
  size?: GraphSize;
}

export interface ShaderGraphConnectionSpec {
  from: string;
  fromSlot: number;
  to: string;
  toSlot: number;
  expectedContentHash?: string;
  replaceExistingInput?: boolean;
}

export interface CreateShaderGraphOptions {
  assetPath: string;
  pipeline?: "auto" | "built_in" | "urp";
  shaderType?: "lit" | "unlit";
  overwrite?: boolean;
  expectedContentHash?: string;
  openInEditor?: boolean;
  nodes?: ShaderGraphNodeSpec[];
  connections?: ShaderGraphConnectionSpec[];
  layout?: GraphLayoutOptions;
}

interface BridgeAcknowledgement {
  success?: boolean;
  error?: string;
}

export function normalizeShaderGraphAssetPath(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) {
    return undefined;
  }
  const normalized = path.posix.normalize(value.replace(/\\/g, "/").trim());
  if (!normalized.startsWith("Assets/") ||
      normalized.includes("\u0000") ||
      !normalized.toLowerCase().endsWith(".shadergraph")) {
    return undefined;
  }
  return normalized;
}

export function normalizeShaderGraphContentHash(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^[a-fA-F0-9]{64}$/.test(value.trim())) {
    return undefined;
  }
  return value.trim().toLowerCase();
}

export async function getShaderGraphCapabilities(config: BanterMCPConfig): Promise<unknown> {
  return dispatchShaderGraphCommand({ type: "shader_graph_capabilities" }, config, 30_000);
}

export async function listShaderGraphs(
  limit: number | undefined,
  config: BanterMCPConfig
): Promise<unknown> {
  return dispatchShaderGraphCommand({
    type: "list_shader_graphs",
    limit: Math.max(1, Math.min(1000, limit ?? 200)),
  }, config, 30_000);
}

export async function inspectShaderGraph(
  assetPath: string,
  openInEditor: boolean | undefined,
  config: BanterMCPConfig
): Promise<unknown> {
  const normalized = normalizeShaderGraphAssetPath(assetPath);
  if (!normalized) {
    return { success: false, error: "assetPath must be an Assets/... path ending in .shadergraph." };
  }
  return dispatchShaderGraphCommand({
    type: "inspect_shader_graph",
    assetPath: normalized,
    openInEditor: openInEditor === true,
  }, config, 60_000);
}

export async function createShaderGraph(
  options: CreateShaderGraphOptions,
  config: BanterMCPConfig
): Promise<unknown> {
  const normalized = normalizeShaderGraphAssetPath(options.assetPath);
  if (!normalized) {
    return { success: false, error: "assetPath must be an Assets/... path ending in .shadergraph." };
  }
  const expectedContentHash = normalizeShaderGraphContentHash(options.expectedContentHash);
  if (options.overwrite === true && !expectedContentHash) {
    return {
      success: false,
      error: "overwrite=true requires expectedContentHash from inspect_shader_graph.",
    };
  }
  const requestedNodes = options.nodes ?? [];
  const nodes = requestedNodes.map((node, index) => ({
    ...node,
    id: node.id || `node-${index + 1}`,
  }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (nodeIds.size !== nodes.length) {
    return { success: false, error: "Shader Graph node ids must be unique." };
  }
  const layout = layoutDirectedGraph(
    nodes.map((node) => ({
      id: node.id,
      position: node.position,
      size: node.size ?? estimateShaderGraphNodeSize(node.nodeType),
    })),
    (options.connections ?? [])
      .filter((connection) => nodeIds.has(connection.from) && nodeIds.has(connection.to))
      .map((connection) => ({ from: connection.from, to: connection.to })),
    options.layout
  );

  return dispatchShaderGraphCommand({
    type: "create_shader_graph",
    assetPath: normalized,
    pipeline: options.pipeline ?? "auto",
    shaderType: options.shaderType ?? "unlit",
    overwrite: options.overwrite === true,
    expectedContentHash,
    openInEditor: options.openInEditor === true,
    nodes: nodes.map((node) => ({
      id: node.id,
      nodeType: node.nodeType,
      position: layout.positions[node.id],
    })),
    connections: options.connections ?? [],
    layout: {
      bounds: layout.bounds,
      explicitNodeCount: layout.explicitNodeCount,
      autoPositionedNodeCount: layout.autoPositionedNodeCount,
    },
  }, config, 120_000);
}

export async function addShaderGraphNode(
  assetPath: string,
  nodeType: string,
  position: GraphPoint | undefined,
  expectedContentHash: string,
  config: BanterMCPConfig
): Promise<unknown> {
  const normalized = normalizeShaderGraphAssetPath(assetPath);
  if (!normalized) {
    return { success: false, error: "assetPath must be an Assets/... path ending in .shadergraph." };
  }
  const expectedHash = normalizeShaderGraphContentHash(expectedContentHash);
  if (!expectedHash) {
    return { success: false, error: "expectedContentHash must be a 64-character SHA-256 hash." };
  }
  return dispatchShaderGraphCommand({
    type: "add_shader_graph_node",
    assetPath: normalized,
    nodeType,
    hasPosition: position !== undefined,
    position: position ?? { x: 0, y: 0 },
    expectedContentHash: expectedHash,
  }, config, 120_000);
}

export async function connectShaderGraphNodes(
  assetPath: string,
  connection: ShaderGraphConnectionSpec,
  config: BanterMCPConfig
): Promise<unknown> {
  const normalized = normalizeShaderGraphAssetPath(assetPath);
  if (!normalized) {
    return { success: false, error: "assetPath must be an Assets/... path ending in .shadergraph." };
  }
  const expectedHash = normalizeShaderGraphContentHash(connection.expectedContentHash);
  if (!expectedHash) {
    return { success: false, error: "expectedContentHash must be a 64-character SHA-256 hash." };
  }
  return dispatchShaderGraphCommand({
    type: "connect_shader_graph_nodes",
    assetPath: normalized,
    sourceNodeId: connection.from,
    sourceSlotId: connection.fromSlot,
    destinationNodeId: connection.to,
    destinationSlotId: connection.toSlot,
    expectedContentHash: expectedHash,
    replaceExistingInput: connection.replaceExistingInput === true,
  }, config, 120_000);
}

export async function validateShaderGraph(
  assetPath: string,
  config: BanterMCPConfig
): Promise<unknown> {
  const normalized = normalizeShaderGraphAssetPath(assetPath);
  if (!normalized) {
    return { success: false, error: "assetPath must be an Assets/... path ending in .shadergraph." };
  }
  return dispatchShaderGraphCommand({
    type: "validate_shader_graph",
    assetPath: normalized,
  }, config, 120_000);
}

async function dispatchShaderGraphCommand(
  command: Record<string, unknown>,
  config: BanterMCPConfig,
  timeoutMs: number
): Promise<unknown> {
  try {
    const dispatch = await dispatchUnityBridgeCommand(command, config, Math.min(timeoutMs, 5_000));
    const acknowledgement = dispatch.acknowledgement as BridgeAcknowledgement | undefined;
    if (acknowledgement?.success === false) {
      return { success: false, commandId: dispatch.commandId, error: acknowledgement.error };
    }

    const resultPath = path.join(
      config.mcpStatePath,
      "shader-graph-results",
      `${dispatch.commandId}.json`
    );
    const commandResultPath = path.join(
      config.mcpStatePath,
      "command-results",
      `${dispatch.commandId}.json`
    );
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const result = consumeCorrelatedJson(resultPath, dispatch.commandId);
      if (result) return result;

      if (!dispatch.acknowledgement) {
        const late = consumeCorrelatedJson(commandResultPath, dispatch.commandId) as BridgeAcknowledgement | undefined;
        if (late?.success === false) {
          return { success: false, commandId: dispatch.commandId, error: late.error };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success: false,
      commandId: dispatch.commandId,
      error: `Timed out after ${timeoutMs}ms waiting for Unity's Shader Graph result.`,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function consumeCorrelatedJson(filePath: string, commandId: string): Record<string, unknown> | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
    if (parsed.commandId !== commandId) return undefined;
    fs.unlinkSync(filePath);
    return parsed;
  } catch {
    return undefined;
  }
}

function estimateShaderGraphNodeSize(nodeType: string): GraphSize {
  const label = nodeType.split(".").pop()?.replace(/Node$/i, "") || nodeType;
  return {
    width: Math.min(384, Math.max(216, Math.ceil((144 + label.length * 7) / 24) * 24)),
    height: 144,
  };
}
