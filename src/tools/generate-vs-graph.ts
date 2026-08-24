/**
 * Visual Scripting Graph Generator
 *
 * Generates valid VS graph JSON from high-level specifications.
 * Handles all the complexity of the Unity VS format.
 */

import { randomUUID } from "crypto";
import {
  GraphLayoutOptions,
  GraphLayoutResult,
  GraphSize,
  layoutDirectedGraph,
} from "../lib/graph-layout.js";
import { BANTER_CUSTOM_VS_NODES } from "../resources/banter-custom-vs-nodes.js";

export interface NodeSpec {
  type: string;
  id: string;
  properties?: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: GraphSize;
}

export interface ConnectionSpec {
  from: string;
  fromPort: string;
  to: string;
  toPort: string;
  type: "control" | "value";
}

export interface VariableSpec {
  name: string;
  type: string;
  defaultValue?: unknown;
  kind?: "Graph" | "Flow" | "Object";
}

export interface GenerateVSGraphParams {
  description?: string;
  graphName: string;
  nodes?: Array<unknown>;
  connections?: Array<unknown>;
  variables?: Array<unknown>;
  layout?: GraphLayoutOptions;
}

export interface GenerateVSGraphResult {
  success: boolean;
  graphJson?: string;
  assetContent?: string;
  error?: string;
  nodeCount: number;
  connectionCount: number;
  layout?: Omit<GraphLayoutResult, "positions">;
}

// Type mappings for variables
const TYPE_HANDLES: Record<string, string> = {
  bool: "System.Boolean, mscorlib",
  boolean: "System.Boolean, mscorlib",
  int: "System.Int32, mscorlib",
  integer: "System.Int32, mscorlib",
  float: "System.Single, mscorlib",
  single: "System.Single, mscorlib",
  double: "System.Double, mscorlib",
  string: "System.String, mscorlib",
  Vector2: "UnityEngine.Vector2, UnityEngine.CoreModule",
  Vector3: "UnityEngine.Vector3, UnityEngine.CoreModule",
  Vector4: "UnityEngine.Vector4, UnityEngine.CoreModule",
  Quaternion: "UnityEngine.Quaternion, UnityEngine.CoreModule",
  Color: "UnityEngine.Color, UnityEngine.CoreModule",
  GameObject: "UnityEngine.GameObject, UnityEngine.CoreModule",
  Transform: "UnityEngine.Transform, UnityEngine.CoreModule",
  BanterSyncedObject: "Banter.SDK.BanterSyncedObject, Banter.SDK",
  BanterRigidbody: "Banter.SDK.BanterRigidbody, Banter.SDK",
};

// Shorthand type names to full node types
const BANTER_CUSTOM_NODE_TYPE_MAP: Record<string, string> = Object.fromEntries(
  Object.values(BANTER_CUSTOM_VS_NODES).map((node) => [node.name, node.fullType])
);

const BANTER_CUSTOM_NODES_BY_FULL_TYPE = new Map(
  Object.values(BANTER_CUSTOM_VS_NODES).map((node) => [node.fullType, node])
);

const NODE_TYPE_MAP: Record<string, string> = {
  ...BANTER_CUSTOM_NODE_TYPE_MAP,

  // Banter events
  OnGrab: "Banter.VisualScripting.OnGrab",
  OnRelease: "Banter.VisualScripting.OnRelease",
  OnClick: "Banter.VisualScripting.OnClick",
  OnGunTrigger: "Banter.VisualScripting.OnGunTrigger",
  OnUserJoined: "Banter.VisualScripting.OnUserJoined",
  OnUserLeft: "Banter.VisualScripting.OnUserLeft",
  OnOneShot: "Banter.VisualScripting.OnOneShot",
  OnSpaceStatePropsChanged: "Banter.VisualScripting.OnSpaceStatePropsChanged",
  GetLocalUserState: "Banter.VisualScripting.GetLocalUserState",

  // Banter player control
  SetCanMove: "Banter.VisualScripting.SetCanMove",
  SetCanRotate: "Banter.VisualScripting.SetCanRotate",
  SetCanJump: "Banter.VisualScripting.SetCanJump",
  SetCanGrab: "Banter.VisualScripting.SetCanGrab",
  SetCanTeleport: "Banter.VisualScripting.SetCanTeleport",

  // Banter space
  LoadGltfUrl: "Banter.VisualScripting.LoadGltfUrl",
  LoadTextUrl: "Banter.VisualScripting.LoadTextUrl",
  SendOneShot: "Banter.VisualScripting.SendOneShot",
  SetSpaceStateProp: "Banter.VisualScripting.SetSpaceStateProp",
  // Backwards-compatible shorthand for the old MCP spelling.
  SetSpaceStateProps: "Banter.VisualScripting.SetSpaceStateProp",
  AiImage: "Banter.VisualScripting.AiImage",
  AiModel: "Banter.VisualScripting.AiModel",

  // Unity events
  CustomEvent: "Unity.VisualScripting.CustomEvent",
  Start: "Unity.VisualScripting.Start",
  Update: "Unity.VisualScripting.Update",
  OnCollisionEnter: "Unity.VisualScripting.OnCollisionEnter",
  OnTriggerEnter: "Unity.VisualScripting.OnTriggerEnter",

  // Unity flow
  If: "Unity.VisualScripting.If",
  Branch: "Unity.VisualScripting.Branch",
  Sequence: "Unity.VisualScripting.Sequence",
  While: "Unity.VisualScripting.While",
  For: "Unity.VisualScripting.For",
  WaitForEndOfFrameUnit: "Unity.VisualScripting.WaitForEndOfFrameUnit",
  WaitForNextFrameUnit: "Unity.VisualScripting.WaitForNextFrameUnit",
  WaitForSeconds: "Unity.VisualScripting.WaitForSecondsUnit",
  WaitForSecondsUnit: "Unity.VisualScripting.WaitForSecondsUnit",
  WaitUntilUnit: "Unity.VisualScripting.WaitUntilUnit",
  WaitWhileUnit: "Unity.VisualScripting.WaitWhileUnit",

  // Unity variables
  SetVariable: "Unity.VisualScripting.SetVariable",
  GetVariable: "Unity.VisualScripting.GetVariable",
  Literal: "Unity.VisualScripting.Literal",

  // Unity members
  GetMember: "Unity.VisualScripting.GetMember",
  SetMember: "Unity.VisualScripting.SetMember",
  InvokeMember: "Unity.VisualScripting.InvokeMember",

  // Unity math/logic
  Add: "Unity.VisualScripting.Add",
  Subtract: "Unity.VisualScripting.Subtract",
  Multiply: "Unity.VisualScripting.Multiply",
  Divide: "Unity.VisualScripting.Divide",
  Greater: "Unity.VisualScripting.Greater",
  Less: "Unity.VisualScripting.Less",
  Equal: "Unity.VisualScripting.Equal",
  And: "Unity.VisualScripting.And",
  Or: "Unity.VisualScripting.Or",
  Not: "Unity.VisualScripting.Not",

  // Unity utility
  This: "Unity.VisualScripting.This",
  Self: "Unity.VisualScripting.Self",
  Debug: "Unity.VisualScripting.Debug",
};

// Event nodes that serialize Unity Visual Scripting's coroutine flag.
const EVENT_NODES = new Set([
  "Banter.VisualScripting.OnGrab",
  "Banter.VisualScripting.OnRelease",
  "Banter.VisualScripting.OnClick",
  "Banter.VisualScripting.OnGunTrigger",
  "Banter.VisualScripting.OnUserJoined",
  "Banter.VisualScripting.OnUserLeft",
  "Banter.VisualScripting.OnOneShot",
  "Banter.VisualScripting.OnSpaceStatePropsChanged",
  "Unity.VisualScripting.CustomEvent",
  "Unity.VisualScripting.Start",
  "Unity.VisualScripting.Update",
  "Unity.VisualScripting.OnCollisionEnter",
  "Unity.VisualScripting.OnTriggerEnter",
  ...Object.values(BANTER_CUSTOM_VS_NODES)
    .filter((node) => node.isEvent)
    .map((node) => node.fullType),
]);

const COROUTINE_UNIT_TYPES = new Set([
  "Banter.VisualScripting.LoadAudioUrl",
  "Banter.VisualScripting.LoadTextUrl",
  "Banter.VisualScripting.LoadTextureUrl",
  "Unity.VisualScripting.WaitForEndOfFrameUnit",
  "Unity.VisualScripting.WaitForFlow",
  "Unity.VisualScripting.WaitForNextFrameUnit",
  "Unity.VisualScripting.WaitForSecondsUnit",
  "Unity.VisualScripting.WaitUntilUnit",
  "Unity.VisualScripting.WaitWhileUnit",
]);

/**
 * Generate a Visual Scripting graph from specifications
 */
export function generateVSGraph(params: GenerateVSGraphParams): GenerateVSGraphResult {
  try {
    const nodes = (params.nodes || []) as NodeSpec[];
    const connections = (params.connections || []) as ConnectionSpec[];
    const variables = (params.variables || []) as VariableSpec[];
    const coroutineEventIds = inferCoroutineEventIds(nodes, connections);
    const layout = layoutDirectedGraph(
      nodes.map((node) => ({
        id: node.id,
        position: node.position,
        size: node.size || estimateVisualScriptingNodeSize(node),
      })),
      connections.map((connection) => ({ from: connection.from, to: connection.to })),
      params.layout
    );

    // Generate node objects
    const nodeObjects: unknown[] = [];
    const nodeIdMap = new Map<string, string>(); // user id -> $id

    let nodeIndex = 1;
    for (const node of nodes) {
      const $id = String(nodeIndex++);
      nodeIdMap.set(node.id, $id);

      const fullType = NODE_TYPE_MAP[node.type] || node.type;
      const nodeObj = createNodeObject(
        fullType,
        $id,
        layout.positions[node.id],
        node.properties,
        coroutineEventIds.has(node.id)
      );
      nodeObjects.push(nodeObj);
    }

    // Generate connections
    const connectionObjects: unknown[] = [];

    for (const conn of connections) {
      const sourceId = nodeIdMap.get(conn.from);
      const destId = nodeIdMap.get(conn.to);

      if (!sourceId || !destId) {
        throw new Error(`Connection references unknown node: ${conn.from} -> ${conn.to}`);
      }

      const connObj = {
        sourceUnit: { $ref: sourceId },
        sourceKey: conn.fromPort,
        destinationUnit: { $ref: destId },
        destinationKey: conn.toPort,
        guid: randomUUID(),
        $type: conn.type === "control"
          ? "Unity.VisualScripting.ControlConnection"
          : "Unity.VisualScripting.ValueConnection",
      };

      connectionObjects.push(connObj);
    }

    // Generate variables
    const variableObjects = variables.map((v) => createVariableObject(v));

    // Build the graph object
    const graph = {
      graph: {
        variables: {
          Kind: "Flow",
          collection: {
            $content: variableObjects,
            $version: "A",
          },
          $version: "A",
        },
        controlInputDefinitions: [],
        controlOutputDefinitions: [],
        valueInputDefinitions: [],
        valueOutputDefinitions: [],
        elements: [...nodeObjects, ...connectionObjects],
        $version: "A",
      },
    };

    const graphJson = JSON.stringify(graph);

    // Generate the full .asset content
    const assetContent = generateAssetFile(params.graphName, graphJson);

    return {
      success: true,
      graphJson,
      assetContent,
      nodeCount: nodes.length,
      connectionCount: connections.length,
      layout: {
        bounds: layout.bounds,
        explicitNodeCount: layout.explicitNodeCount,
        autoPositionedNodeCount: layout.autoPositionedNodeCount,
        preservedExplicitOverlapCount: layout.preservedExplicitOverlapCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      nodeCount: 0,
      connectionCount: 0,
    };
  }
}

function estimateVisualScriptingNodeSize(node: NodeSpec): GraphSize {
  const fullType = NODE_TYPE_MAP[node.type] || node.type;
  const displayName = fullType.split(".").pop() || fullType;
  const customNode = BANTER_CUSTOM_NODES_BY_FULL_TYPE.get(fullType);
  const defaults = node.properties?.defaultValues;
  const defaultRows = defaults && typeof defaults === "object" && !Array.isArray(defaults)
    ? Object.keys(defaults).length
    : 0;
  const rowCount = Math.max(1, customNode?.defaultValues.length || 0, defaultRows);
  const width = Math.min(360, Math.max(216, Math.ceil((144 + displayName.length * 7) / 24) * 24));
  const height = Math.ceil((88 + rowCount * 24) / 24) * 24;
  return { width, height };
}

function createNodeObject(
  type: string,
  $id: string,
  position?: { x: number; y: number },
  properties?: Record<string, unknown>,
  inferredCoroutine = false
): Record<string, unknown> {
  const customNode = BANTER_CUSTOM_NODES_BY_FULL_TYPE.get(type);
  const node: Record<string, unknown> = {
    position: position || { x: 0, y: 0 },
    guid: randomUUID(),
    $version: "A",
    $type: type,
    $id,
  };

  // Coroutine events are required when any reachable control path enters a wait/loader.
  if (EVENT_NODES.has(type)) {
    node.coroutine = typeof properties?.coroutine === "boolean"
      ? properties.coroutine
      : inferredCoroutine;
    node.defaultValues = properties?.defaultValues || {};
  }

  // Handle specific node types
  if (type === "Unity.VisualScripting.Literal") {
    node.type = properties?.valueType || "System.Boolean";
    node.value = {
      $content: properties?.value ?? false,
      $type: properties?.valueType || "System.Boolean",
    };
    node.defaultValues = {};
  } else if (type === "Unity.VisualScripting.SetVariable") {
    node.kind = properties?.kind || "Graph";
    node.defaultValues = {
      name: { $content: properties?.name || "variable", $type: "System.String" },
    };
  } else if (type === "Unity.VisualScripting.GetVariable") {
    node.specifyFallback = false;
    node.kind = properties?.kind || "Graph";
    node.defaultValues = {
      name: { $content: properties?.name || "variable", $type: "System.String" },
      object: null,
    };
  } else if (type === "Unity.VisualScripting.InvokeMember") {
    node.chainable = properties?.chainable ?? false;
    node.parameterNames = properties?.parameterNames || [];
    node.member = properties?.member || {
      name: "Method",
      parameterTypes: [],
      targetType: "System.Object",
      targetTypeName: "System.Object",
      $version: "A",
    };
    node.defaultValues = properties?.defaultValues || { target: null };
  } else if (type === "Unity.VisualScripting.GetMember") {
    node.member = properties?.member || {
      name: "property",
      parameterTypes: null,
      targetType: "System.Object",
      targetTypeName: "System.Object",
      $version: "A",
    };
    node.defaultValues = properties?.defaultValues || { target: null };
  } else if (type === "Unity.VisualScripting.This" || type === "Unity.VisualScripting.Self") {
    node.defaultValues = {};
  } else if (customNode) {
    node.defaultValues = {
      ...customDefaultValuesToSerializedDefaults(customNode.defaultValues),
      ...(properties?.defaultValues as Record<string, unknown> | undefined),
    };

    // Only copy sample scalar fields that are safe across generated nodes.
    const serializedFields = customNode.serializedFields as Record<string, unknown>;
    if (typeof serializedFields.argumentCount === "number") {
      node.argumentCount = serializedFields.argumentCount;
    }

    if (properties) {
      const { defaultValues: _defaultValues, ...rest } = properties;
      Object.assign(node, rest);
    }
  } else if (properties) {
    // Apply any other properties
    Object.assign(node, properties);
    if (!node.defaultValues) {
      node.defaultValues = {};
    }
  } else {
    node.defaultValues = {};
  }

  return node;
}

function inferCoroutineEventIds(nodes: NodeSpec[], connections: ConnectionSpec[]): Set<string> {
  const typeById = new Map(
    nodes.map((node) => [node.id, NODE_TYPE_MAP[node.type] || node.type])
  );
  const outgoing = new Map<string, string[]>();

  for (const connection of connections) {
    if (connection.type !== "control") continue;
    const destinations = outgoing.get(connection.from) || [];
    destinations.push(connection.to);
    outgoing.set(connection.from, destinations);
  }

  const coroutineEvents = new Set<string>();
  for (const node of nodes) {
    const nodeType = typeById.get(node.id);
    if (!nodeType || !EVENT_NODES.has(nodeType)) continue;

    const visited = new Set<string>([node.id]);
    const pending = [...(outgoing.get(node.id) || [])];
    while (pending.length > 0) {
      const nodeId = pending.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const reachableType = typeById.get(nodeId);
      if (reachableType && COROUTINE_UNIT_TYPES.has(reachableType)) {
        coroutineEvents.add(node.id);
        break;
      }
      pending.push(...(outgoing.get(nodeId) || []));
    }
  }

  return coroutineEvents;
}

function customDefaultValuesToSerializedDefaults(
  defaults: Array<{ name: string; type: string | null; defaultValue: unknown }>
): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};

  for (const item of defaults) {
    serialized[item.name] = customDefaultValueToSerializedValue(item.type, item.defaultValue);
  }

  return serialized;
}

function customDefaultValueToSerializedValue(type: string | null, value: unknown): unknown {
  if (value === null || type === null) {
    return value;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return {
      ...(value as Record<string, unknown>),
      $type: type,
    };
  }

  return {
    $content: value,
    $type: type,
  };
}

function createVariableObject(v: VariableSpec): Record<string, unknown> {
  const typeHandle = TYPE_HANDLES[v.type] || v.type;

  const variable: Record<string, unknown> = {
    name: v.name,
    value: v.defaultValue !== undefined
      ? { $content: v.defaultValue, $type: typeHandle.split(",")[0] }
      : null,
    typeHandle: {
      Identification: typeHandle,
      $version: "A",
    },
    $version: "A",
  };

  return variable;
}

function generateAssetFile(graphName: string, graphJson: string): string {
  // Escape the JSON for YAML embedding
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
  m_EditorClassIdentifier: Unity.VisualScripting.Flow::Unity.VisualScripting.ScriptGraphAsset
  _data:
    _json: '${escapedJson}'
    _objectReferences: []
`;
}
