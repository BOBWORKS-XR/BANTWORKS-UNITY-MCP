/**
 * Visual Scripting Graph Generator
 *
 * Generates valid VS graph JSON from high-level specifications.
 * Handles all the complexity of the Unity VS format.
 */

import { v4 as uuidv4 } from "uuid";

export interface NodeSpec {
  type: string;
  id: string;
  properties?: Record<string, unknown>;
  position?: { x: number; y: number };
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
}

export interface GenerateVSGraphResult {
  success: boolean;
  graphJson?: string;
  assetContent?: string;
  error?: string;
  nodeCount: number;
  connectionCount: number;
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
const NODE_TYPE_MAP: Record<string, string> = {
  // Banter events
  OnGrab: "Banter.VisualScripting.OnGrab",
  OnRelease: "Banter.VisualScripting.OnRelease",
  OnClick: "Banter.VisualScripting.OnClick",
  OnGunTrigger: "Banter.VisualScripting.OnGunTrigger",
  OnUserJoined: "Banter.VisualScripting.OnUserJoined",
  OnUserLeft: "Banter.VisualScripting.OnUserLeft",
  OnOneShot: "Banter.VisualScripting.OnOneShot",
  GetLocalUserState: "Banter.VisualScripting.GetLocalUserState",

  // Banter player control
  SetCanMove: "Banter.VisualScripting.SetCanMove",
  SetCanRotate: "Banter.VisualScripting.SetCanRotate",
  SetCanJump: "Banter.VisualScripting.SetCanJump",
  SetCanGrab: "Banter.VisualScripting.SetCanGrab",
  SetCanTeleport: "Banter.VisualScripting.SetCanTeleport",

  // Banter space
  SendOneShot: "Banter.VisualScripting.SendOneShot",
  SetSpaceStateProps: "Banter.VisualScripting.SetSpaceStateProps",
  AiImage: "Banter.VisualScripting.AiImage",
  AiModel: "Banter.VisualScripting.AiModel",

  // Unity events
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

// Event nodes that require coroutine: false
const EVENT_NODES = new Set([
  "Banter.VisualScripting.OnGrab",
  "Banter.VisualScripting.OnRelease",
  "Banter.VisualScripting.OnClick",
  "Banter.VisualScripting.OnGunTrigger",
  "Banter.VisualScripting.OnUserJoined",
  "Banter.VisualScripting.OnUserLeft",
  "Banter.VisualScripting.OnOneShot",
  "Unity.VisualScripting.Start",
  "Unity.VisualScripting.Update",
  "Unity.VisualScripting.OnCollisionEnter",
  "Unity.VisualScripting.OnTriggerEnter",
]);

/**
 * Generate a Visual Scripting graph from specifications
 */
export function generateVSGraph(params: GenerateVSGraphParams): GenerateVSGraphResult {
  try {
    const nodes = (params.nodes || []) as NodeSpec[];
    const connections = (params.connections || []) as ConnectionSpec[];
    const variables = (params.variables || []) as VariableSpec[];

    // Generate node objects
    const nodeObjects: unknown[] = [];
    const nodeIdMap = new Map<string, string>(); // user id -> $id

    let nodeIndex = 1;
    for (const node of nodes) {
      const $id = String(nodeIndex++);
      nodeIdMap.set(node.id, $id);

      const fullType = NODE_TYPE_MAP[node.type] || node.type;
      const nodeObj = createNodeObject(fullType, $id, node.position, node.properties);
      nodeObjects.push(nodeObj);
    }

    // Generate connections
    const controlConnections: unknown[] = [];
    const valueConnections: unknown[] = [];

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
        guid: uuidv4(),
        $type: conn.type === "control"
          ? "Unity.VisualScripting.ControlConnection"
          : "Unity.VisualScripting.ValueConnection",
      };

      if (conn.type === "control") {
        controlConnections.push(connObj);
      } else {
        valueConnections.push(connObj);
      }
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
        units: {
          $content: nodeObjects,
          $version: "A",
        },
        controlConnections: {
          $content: controlConnections,
          $version: "A",
        },
        valueConnections: {
          $content: valueConnections,
          $version: "A",
        },
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

function createNodeObject(
  type: string,
  $id: string,
  position?: { x: number; y: number },
  properties?: Record<string, unknown>
): Record<string, unknown> {
  const node: Record<string, unknown> = {
    position: position || { x: 0, y: 0 },
    guid: uuidv4(),
    $version: "A",
    $type: type,
    $id,
  };

  // Add coroutine: false for event nodes
  if (EVENT_NODES.has(type)) {
    node.coroutine = false;
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
  m_EditorClassIdentifier:
  _data:
    _json: '${escapedJson}'
    _objectReferences: []
`;
}
