/**
 * Visual Scripting Graph Validator
 *
 * Validates VS graph JSON before writing to Unity.
 * Catches common mistakes that would cause import failures.
 */

import { BANTER_VS_NODES, VS_CRITICAL_NOTES } from "../resources/banter-vs-nodes.js";

export interface VSValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  nodeCount: number;
  connectionCount: number;
}

// Known Unity Visual Scripting node types
const UNITY_NODE_TYPES = new Set([
  "Unity.VisualScripting.Start",
  "Unity.VisualScripting.Update",
  "Unity.VisualScripting.FixedUpdate",
  "Unity.VisualScripting.OnCollisionEnter",
  "Unity.VisualScripting.OnCollisionExit",
  "Unity.VisualScripting.OnTriggerEnter",
  "Unity.VisualScripting.OnTriggerExit",
  "Unity.VisualScripting.If",
  "Unity.VisualScripting.Branch",
  "Unity.VisualScripting.While",
  "Unity.VisualScripting.For",
  "Unity.VisualScripting.ForEach",
  "Unity.VisualScripting.Sequence",
  "Unity.VisualScripting.Select",
  "Unity.VisualScripting.Switch",
  "Unity.VisualScripting.SetVariable",
  "Unity.VisualScripting.GetVariable",
  "Unity.VisualScripting.IsVariableDefined",
  "Unity.VisualScripting.Literal",
  "Unity.VisualScripting.This",
  "Unity.VisualScripting.Self",
  "Unity.VisualScripting.Null",
  "Unity.VisualScripting.GetMember",
  "Unity.VisualScripting.SetMember",
  "Unity.VisualScripting.InvokeMember",
  "Unity.VisualScripting.CreateStruct",
  "Unity.VisualScripting.Expose",
  "Unity.VisualScripting.Add",
  "Unity.VisualScripting.Subtract",
  "Unity.VisualScripting.Multiply",
  "Unity.VisualScripting.Divide",
  "Unity.VisualScripting.Modulo",
  "Unity.VisualScripting.Negate",
  "Unity.VisualScripting.Equal",
  "Unity.VisualScripting.NotEqual",
  "Unity.VisualScripting.Greater",
  "Unity.VisualScripting.GreaterOrEqual",
  "Unity.VisualScripting.Less",
  "Unity.VisualScripting.LessOrEqual",
  "Unity.VisualScripting.And",
  "Unity.VisualScripting.Or",
  "Unity.VisualScripting.Not",
  "Unity.VisualScripting.ExclusiveOr",
  "Unity.VisualScripting.ControlConnection",
  "Unity.VisualScripting.ValueConnection",
  "Unity.VisualScripting.Timer",
  "Unity.VisualScripting.Cooldown",
  "Unity.VisualScripting.WaitForSeconds",
  "Unity.VisualScripting.WaitUntil",
  "Unity.VisualScripting.WaitWhile",
  "Unity.VisualScripting.Debug",
  "Unity.VisualScripting.Log",
]);

// Known Banter node types
const BANTER_NODE_TYPES = new Set(
  Object.values(BANTER_VS_NODES).map((node) => node.fullType)
);

// Event nodes that require coroutine: false
const EVENT_NODES = new Set([
  "Banter.VisualScripting.OnGrab",
  "Banter.VisualScripting.OnRelease",
  "Banter.VisualScripting.OnClick",
  "Banter.VisualScripting.OnGunTrigger",
  "Banter.VisualScripting.OnControllerButtonPressed",
  "Banter.VisualScripting.OnControllerButtonReleased",
  "Banter.VisualScripting.OnControllerAxisUpdate",
  "Banter.VisualScripting.OnTriggerAxisUpdate",
  "Banter.VisualScripting.OnUserJoined",
  "Banter.VisualScripting.OnUserLeft",
  "Banter.VisualScripting.OnOneShot",
  "Banter.VisualScripting.OnSpaceStatePropsChanged",
  "Banter.VisualScripting.OnBanterTriggerEnter",
  "Banter.VisualScripting.OnSTT",
  "Banter.VisualScripting.OnAiImage",
  "Banter.VisualScripting.OnAiModel",
  "Unity.VisualScripting.Start",
  "Unity.VisualScripting.Update",
  "Unity.VisualScripting.OnCollisionEnter",
  "Unity.VisualScripting.OnCollisionExit",
  "Unity.VisualScripting.OnTriggerEnter",
  "Unity.VisualScripting.OnTriggerExit",
]);

// GUID validation regex
const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAKE_GUID_PATTERNS = [
  /^(.)\1{7}-(.)\2{3}-(.)\3{3}-(.)\4{3}-(.)\5{11}$/i, // All same characters
  /^a1a1a1a1-/i, // Common fake pattern
  /^12345678-/i, // Sequential pattern
  /^00000000-/i, // All zeros
];

/**
 * Validate a Visual Scripting graph JSON
 */
export function validateVSGraph(graphJson: string): VSValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let nodeCount = 0;
  let connectionCount = 0;

  try {
    const graph = JSON.parse(graphJson);

    // Check for graph structure
    if (!graph.graph) {
      errors.push("Missing 'graph' root object");
      return { valid: false, errors, warnings, nodeCount, connectionCount };
    }

    const graphData = graph.graph;

    // Validate nodes
    if (graphData.units && Array.isArray(graphData.units.$content)) {
      const nodes = graphData.units.$content;
      nodeCount = nodes.length;
      const nodeIds = new Map<string, unknown>();

      for (const node of nodes) {
        validateNode(node, errors, warnings, nodeIds);
      }
    } else {
      warnings.push("No nodes found in graph (units.$content)");
    }

    // Validate connections
    if (graphData.controlConnections && Array.isArray(graphData.controlConnections.$content)) {
      connectionCount += graphData.controlConnections.$content.length;
      for (const conn of graphData.controlConnections.$content) {
        validateConnection(conn, "control", errors, warnings);
      }
    }

    if (graphData.valueConnections && Array.isArray(graphData.valueConnections.$content)) {
      connectionCount += graphData.valueConnections.$content.length;
      for (const conn of graphData.valueConnections.$content) {
        validateConnection(conn, "value", errors, warnings);
      }
    }

    // Validate variables
    if (graphData.variables && graphData.variables.collection) {
      validateVariables(graphData.variables, warnings);
    }

    // Check graph definitions (should be empty for Script Graphs)
    if (graphData.controlInputDefinitions?.length > 0 ||
        graphData.controlOutputDefinitions?.length > 0 ||
        graphData.valueInputDefinitions?.length > 0 ||
        graphData.valueOutputDefinitions?.length > 0) {
      warnings.push("Graph has input/output definitions - is this a Subgraph? Script Graphs should have empty definition arrays.");
    }

  } catch (e) {
    errors.push(`Invalid JSON: ${e instanceof Error ? e.message : "Unknown error"}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    nodeCount,
    connectionCount,
  };
}

function validateNode(
  node: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  nodeIds: Map<string, unknown>
): void {
  const nodeType = node.$type as string;
  const nodeId = node.$id as string;
  const guid = node.guid as string;

  // Check $id format
  if (typeof nodeId !== "string") {
    errors.push(`Node has invalid $id: ${JSON.stringify(nodeId)} (must be string)`);
  } else if (nodeIds.has(nodeId)) {
    errors.push(`Duplicate node $id: ${nodeId}`);
  } else {
    nodeIds.set(nodeId, node);
  }

  // Validate GUID
  if (!guid) {
    errors.push(`Node ${nodeId} missing guid`);
  } else if (!GUID_REGEX.test(guid)) {
    errors.push(`Node ${nodeId} has invalid GUID format: ${guid}`);
  } else if (FAKE_GUID_PATTERNS.some((pattern) => pattern.test(guid))) {
    errors.push(`Node ${nodeId} has fake/pattern GUID: ${guid}. Generate real random GUIDs!`);
  }

  // Validate node type
  if (!nodeType) {
    errors.push(`Node ${nodeId} missing $type`);
  } else if (nodeType.startsWith("Banter.VisualScripting.")) {
    // Check for wrong namespace patterns
    if (nodeType.includes(".Events.") || nodeType.includes(".User.") || nodeType.includes(".Player.")) {
      errors.push(
        `Node ${nodeId} has wrong Banter namespace: ${nodeType}. ` +
        `Use flat namespace like 'Banter.VisualScripting.OnGrab', not 'Banter.VisualScripting.Events.OnGrab'`
      );
    } else if (!BANTER_NODE_TYPES.has(nodeType)) {
      warnings.push(`Node ${nodeId} has unknown Banter type: ${nodeType}`);
    }
  } else if (nodeType.startsWith("Unity.VisualScripting.")) {
    // Check for GetComponent node (doesn't exist!)
    if (nodeType === "Unity.VisualScripting.GetComponent") {
      errors.push(
        `Node ${nodeId} uses 'Unity.VisualScripting.GetComponent' which doesn't exist! ` +
        `Use 'Unity.VisualScripting.InvokeMember' calling the GetComponent method instead.`
      );
    }
  }

  // Check event nodes for coroutine: false
  if (EVENT_NODES.has(nodeType)) {
    if (node.coroutine !== false) {
      errors.push(`Event node ${nodeId} (${nodeType}) missing 'coroutine: false'`);
    }
  }

  // Check InvokeMember/GetMember for defaultValues
  if (nodeType === "Unity.VisualScripting.InvokeMember" ||
      nodeType === "Unity.VisualScripting.GetMember") {
    if (!node.defaultValues) {
      warnings.push(`Node ${nodeId} (${nodeType}) missing defaultValues`);
    } else {
      const defaults = node.defaultValues as Record<string, unknown>;
      if (!("target" in defaults)) {
        warnings.push(`Node ${nodeId} (${nodeType}) defaultValues missing 'target: null'`);
      }
    }
  }

  // Check SetVariable for required structure
  if (nodeType === "Unity.VisualScripting.SetVariable") {
    const defaults = node.defaultValues as Record<string, unknown> | undefined;
    if (!defaults?.name) {
      errors.push(`SetVariable node ${nodeId} missing variable name in defaultValues.name`);
    }
  }

  // Check Literal nodes for value
  if (nodeType === "Unity.VisualScripting.Literal") {
    if (!node.type) {
      warnings.push(`Literal node ${nodeId} missing 'type' property`);
    }
    if (node.value === undefined) {
      warnings.push(`Literal node ${nodeId} missing 'value' property`);
    }
  }
}

function validateConnection(
  conn: Record<string, unknown>,
  type: "control" | "value",
  errors: string[],
  warnings: string[]
): void {
  const guid = conn.guid as string;
  const connType = conn.$type as string;

  // Validate GUID
  if (!guid) {
    errors.push(`Connection missing guid`);
  } else if (!GUID_REGEX.test(guid)) {
    errors.push(`Connection has invalid GUID format: ${guid}`);
  } else if (FAKE_GUID_PATTERNS.some((pattern) => pattern.test(guid))) {
    errors.push(`Connection has fake/pattern GUID: ${guid}`);
  }

  // Validate connection type
  const expectedType = type === "control"
    ? "Unity.VisualScripting.ControlConnection"
    : "Unity.VisualScripting.ValueConnection";

  if (connType !== expectedType) {
    warnings.push(`Connection has wrong $type: ${connType}, expected ${expectedType}`);
  }

  const sourceUnit = conn.sourceUnit as Record<string, unknown> | undefined;
  const destUnit = conn.destinationUnit as Record<string, unknown> | undefined;
  if (!sourceUnit?.$ref) {
    errors.push(`Connection missing sourceUnit.$ref`);
  }
  if (!destUnit?.$ref) {
    errors.push(`Connection missing destinationUnit.$ref`);
  }
  if (!conn.sourceKey) {
    errors.push(`Connection missing sourceKey`);
  }
  if (!conn.destinationKey) {
    errors.push(`Connection missing destinationKey`);
  }

  // Check for common wrong port names
  const sourceKey = conn.sourceKey as string;
  if (sourceKey === "collision") {
    warnings.push(`Port name 'collision' is wrong - OnCollisionEnter outputs 'data', not 'collision'`);
  }
  if (sourceKey === "greater") {
    warnings.push(`Port name 'greater' is wrong - Greater node outputs 'comparison', not 'greater'`);
  }
}

function validateVariables(
  variables: Record<string, unknown>,
  warnings: string[]
): void {
  const collection = variables.collection as Record<string, unknown> | undefined;
  if (collection?.$content && Array.isArray(collection.$content)) {
    for (const v of collection.$content) {
      const varData = v as Record<string, unknown>;
      if (!varData.name) {
        warnings.push("Variable missing name");
      }
      if (!varData.typeHandle) {
        warnings.push(`Variable '${varData.name}' missing typeHandle`);
      }
    }
  }
}
