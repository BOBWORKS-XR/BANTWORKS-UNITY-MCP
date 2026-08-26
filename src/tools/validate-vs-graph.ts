/**
 * Visual Scripting Graph Validator
 *
 * Validates VS graph JSON before writing to Unity.
 * Catches common mistakes that would cause import failures.
 */

import { BANTER_VS_NODES, VS_CRITICAL_NOTES } from "../resources/banter-vs-nodes.js";
import { BANTER_CUSTOM_VS_NODES } from "../resources/banter-custom-vs-nodes.js";
import type { SidequestSDKProfile } from "./get-banter-sdk-info.js";

export interface VSValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  nodeCount: number;
  connectionCount: number;
}

export interface VSValidationOptions {
  sdkProfile?: SidequestSDKProfile;
}

// Known SideQuest node types are stored in their captured legacy catalogue
// form and normalized during validation for Creator SDK graphs.
const BANTER_NODE_TYPES = new Set(
  [
    ...Object.values(BANTER_VS_NODES).map((node) => node.fullType),
    ...Object.values(BANTER_CUSTOM_VS_NODES).map((node) => node.fullType),
  ]
);

// Event nodes that serialize Unity Visual Scripting's coroutine flag.
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
  "Unity.VisualScripting.CustomEvent",
  "Unity.VisualScripting.Start",
  "Unity.VisualScripting.Update",
  "Unity.VisualScripting.OnCollisionEnter",
  "Unity.VisualScripting.OnCollisionExit",
  "Unity.VisualScripting.OnTriggerEnter",
  "Unity.VisualScripting.OnTriggerExit",
  ...Object.values(BANTER_CUSTOM_VS_NODES)
    .filter((node) => node.isEvent)
    .map((node) => node.fullType),
]);

// Units whose control input can only run from a coroutine-enabled event path.
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
export function validateVSGraph(graphJson: string, options: VSValidationOptions = {}): VSValidationResult {
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
    if (graphData.$version !== "A") {
      errors.push(`Graph root missing required "$version": "A"`);
    }

    const connections = collectConnections(graphData);
    connectionCount = connections.length;
    const connectedInputs = new Set(
      connections.flatMap(({ conn }) => {
        const destinationRef = (conn.destinationUnit as Record<string, unknown> | undefined)?.$ref;
        const destinationKey = conn.destinationKey;
        return typeof destinationRef === "string" && typeof destinationKey === "string"
          ? [`${destinationRef}:${destinationKey}`]
          : [];
      })
    );

    // Validate nodes
    const nodes = collectNodes(graphData);
    nodeCount = nodes.length;
    const nodeIds = new Map<string, unknown>();

    if (nodes.length > 0) {
      for (const node of nodes) {
        validateNode(node, connectedInputs, errors, warnings, nodeIds, options.sdkProfile);
      }
    } else {
      warnings.push("No nodes found in graph (expected graph.elements or units.$content)");
    }

    // Validate connections
    for (const { conn, type } of connections) {
      validateConnection(conn, type, nodeIds, errors, warnings);
    }
    validateCoroutinePaths(nodes, connections, errors);

    // Validate variables
    if (graphData.variables && graphData.variables.collection) {
      validateVariables(graphData.variables, errors, warnings, options.sdkProfile);
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

function collectNodes(graphData: Record<string, unknown>): Array<Record<string, unknown>> {
  const nodes: Array<Record<string, unknown>> = [];

  if (Array.isArray(graphData.elements)) {
    nodes.push(
      ...(graphData.elements as Array<Record<string, unknown>>).filter((element) => {
        const type = element.$type as string | undefined;
        return Boolean(type) &&
          type !== "Unity.VisualScripting.GraphGroup" &&
          type !== "Unity.VisualScripting.ControlConnection" &&
          type !== "Unity.VisualScripting.ValueConnection";
      })
    );
    return nodes;
  }

  const units = graphData.units as Record<string, unknown> | undefined;
  if (Array.isArray(units?.$content)) {
    nodes.push(...(units.$content as Array<Record<string, unknown>>));
  }

  return nodes;
}

function collectConnections(
  graphData: Record<string, unknown>
): Array<{ conn: Record<string, unknown>; type: "control" | "value" }> {
  const connections: Array<{ conn: Record<string, unknown>; type: "control" | "value" }> = [];

  if (Array.isArray(graphData.elements)) {
    for (const element of graphData.elements as Array<Record<string, unknown>>) {
      if (element.$type === "Unity.VisualScripting.ControlConnection") {
        connections.push({ conn: element, type: "control" });
      } else if (element.$type === "Unity.VisualScripting.ValueConnection") {
        connections.push({ conn: element, type: "value" });
      }
    }
    return connections;
  }

  const controlConnections = graphData.controlConnections as Record<string, unknown> | undefined;
  if (Array.isArray(controlConnections?.$content)) {
    for (const conn of controlConnections.$content as Array<Record<string, unknown>>) {
      connections.push({ conn, type: "control" });
    }
  }

  const valueConnections = graphData.valueConnections as Record<string, unknown> | undefined;
  if (Array.isArray(valueConnections?.$content)) {
    for (const conn of valueConnections.$content as Array<Record<string, unknown>>) {
      connections.push({ conn, type: "value" });
    }
  }

  return connections;
}

function validateNode(
  node: Record<string, unknown>,
  connectedInputs: Set<string>,
  errors: string[],
  warnings: string[],
  nodeIds: Map<string, unknown>,
  sdkProfile?: SidequestSDKProfile
): void {
  const nodeType = node.$type as string;
  const nodeId = node.$id as string;
  const guid = node.guid as string;

  if (node.$version !== "A") {
    errors.push(`Node ${nodeId ?? "(missing id)"} (${nodeType ?? "missing type"}) missing required "$version": "A"`);
  }

  // Unity omits $id on elements that are not referenced by another element.
  if (node.$id !== undefined && typeof nodeId !== "string") {
    errors.push(`Node has invalid $id: ${JSON.stringify(nodeId)} (must be string)`);
  } else if (typeof nodeId === "string" && nodeIds.has(nodeId)) {
    errors.push(`Duplicate node $id: ${nodeId}`);
  } else if (typeof nodeId === "string") {
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
  } else if (isSidequestNodeType(nodeType)) {
    const catalogType = toLegacyCatalogType(nodeType);
    validateSidequestNamespace(nodeId, nodeType, sdkProfile, errors, warnings);
    // Check for wrong namespace patterns
    if (nodeType.includes(".Events.") || nodeType.includes(".User.") || nodeType.includes(".Player.")) {
      errors.push(
        `Node ${nodeId} has wrong SideQuest SDK namespace: ${nodeType}. ` +
        `Use the selected SDK's flat namespace, such as 'BS.VisualScripting.OnGrab' or ` +
        `'Banter.VisualScripting.OnGrab', rather than a source-folder namespace.`
      );
    } else if (!BANTER_NODE_TYPES.has(catalogType)) {
      warnings.push(`Node ${nodeId} has unknown SideQuest SDK type: ${nodeType}`);
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

  // Event units must serialize the flag, but true is required for coroutine paths.
  if (isEventNodeType(nodeType)) {
    if (typeof node.coroutine !== "boolean") {
      errors.push(`Event node ${nodeId} (${nodeType}) missing boolean 'coroutine' flag`);
    }
  }

  // Check SetVariable for required structure
  if (nodeType === "Unity.VisualScripting.SetVariable") {
    const defaults = node.defaultValues as Record<string, unknown> | undefined;
    if (!defaults?.name) {
      errors.push(`SetVariable node ${nodeId} missing variable name in defaultValues.name`);
    }
    if (typeof nodeId !== "string" || !connectedInputs.has(`${nodeId}:input`)) {
      errors.push(`SetVariable node ${nodeId ?? "(missing id)"} has no value connection to its 'input' port`);
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
  nodeIds: Map<string, unknown>,
  errors: string[],
  warnings: string[]
): void {
  const guid = conn.guid as string;
  const connType = conn.$type as string;

  // Visual Scripting 1.9.x omits $version on connection elements.
  if (conn.$version !== undefined && conn.$version !== "A") {
    errors.push(`Connection ${guid ?? "(missing guid)"} has unsupported "$version": ${JSON.stringify(conn.$version)}`);
  }

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
  const sourceRef = sourceUnit?.$ref;
  const destinationRef = destUnit?.$ref;
  if (typeof sourceRef !== "string" || sourceRef.length === 0) {
    errors.push(`Connection missing sourceUnit.$ref`);
  } else if (!nodeIds.has(sourceRef)) {
    errors.push(`Connection references missing source node $id: ${sourceRef}`);
  }
  if (typeof destinationRef !== "string" || destinationRef.length === 0) {
    errors.push(`Connection missing destinationUnit.$ref`);
  } else if (!nodeIds.has(destinationRef)) {
    errors.push(`Connection references missing destination node $id: ${destinationRef}`);
  }
  // Banter deliberately uses an empty string for flow ports on many action units.
  if (typeof conn.sourceKey !== "string") {
    errors.push(`Connection missing sourceKey`);
  }
  if (typeof conn.destinationKey !== "string") {
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

function validateCoroutinePaths(
  nodes: Array<Record<string, unknown>>,
  connections: Array<{ conn: Record<string, unknown>; type: "control" | "value" }>,
  errors: string[]
): void {
  const nodesById = new Map<string, Record<string, unknown>>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    if (typeof node.$id === "string") {
      nodesById.set(node.$id, node);
    }
  }

  for (const { conn, type } of connections) {
    if (type !== "control") continue;
    const source = (conn.sourceUnit as Record<string, unknown> | undefined)?.$ref;
    const destination = (conn.destinationUnit as Record<string, unknown> | undefined)?.$ref;
    if (typeof source !== "string" || typeof destination !== "string") continue;
    const destinations = outgoing.get(source) || [];
    destinations.push(destination);
    outgoing.set(source, destinations);
  }

  for (const eventNode of nodes) {
    const eventId = eventNode.$id;
    const eventType = eventNode.$type;
    if (
      typeof eventId !== "string" ||
      typeof eventType !== "string" ||
      !isEventNodeType(eventType) ||
      eventNode.coroutine !== false
    ) {
      continue;
    }

    const visited = new Set<string>([eventId]);
    const pending = [...(outgoing.get(eventId) || [])];
    while (pending.length > 0) {
      const nodeId = pending.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodesById.get(nodeId);
      const nodeType = node?.$type;
      if (typeof nodeType === "string" && isCoroutineUnitType(nodeType)) {
        errors.push(
          `Event node ${eventId} (${eventType}) has 'coroutine: false' but reaches coroutine unit ` +
          `${nodeId} (${nodeType}); set 'coroutine: true'`
        );
        break;
      }

      pending.push(...(outgoing.get(nodeId) || []));
    }
  }
}

function validateSidequestNamespace(
  nodeId: string,
  nodeType: string,
  sdkProfile: SidequestSDKProfile | undefined,
  errors: string[],
  warnings: string[]
): void {
  if (!sdkProfile) return;

  const isCreatorNode = nodeType.startsWith("BS.VisualScripting.");
  const isLegacyNode = nodeType.startsWith("Banter.VisualScripting.");
  if (sdkProfile === "creator" && isLegacyNode) {
    errors.push(
      `Node ${nodeId} uses legacy type ${nodeType} in a Creator SDK project. ` +
      "Use the concrete BS.VisualScripting type for new content."
    );
  } else if (sdkProfile === "banter" && isCreatorNode) {
    errors.push(
      `Node ${nodeId} uses Creator SDK type ${nodeType} in a legacy Banter project.`
    );
  } else if (
    (sdkProfile === "none" || sdkProfile === "unknown") &&
    (isCreatorNode || isLegacyNode)
  ) {
    errors.push(
      `Node ${nodeId} uses SideQuest SDK type ${nodeType}, but no supported SDK profile was detected.`
    );
  } else if (sdkProfile === "hybrid" && isLegacyNode) {
    warnings.push(
      `Node ${nodeId} retains legacy type ${nodeType} in a hybrid project; ` +
      "preserve it unless an explicit migration is requested."
    );
  }
}

function isSidequestNodeType(type: string): boolean {
  return type.startsWith("Banter.VisualScripting.") || type.startsWith("BS.VisualScripting.");
}

function toLegacyCatalogType(type: string): string {
  return type.startsWith("BS.VisualScripting.")
    ? `Banter.VisualScripting.${type.slice("BS.VisualScripting.".length)}`
    : type;
}

function isEventNodeType(type: string): boolean {
  return EVENT_NODES.has(toLegacyCatalogType(type));
}

function isCoroutineUnitType(type: string): boolean {
  return COROUTINE_UNIT_TYPES.has(toLegacyCatalogType(type));
}

function validateVariables(
  variables: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  sdkProfile?: SidequestSDKProfile
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
        continue;
      }

      const typeHandle = varData.typeHandle as Record<string, unknown>;
      const identification = typeHandle.Identification;
      if (typeof identification !== "string" || !sdkProfile) continue;

      const isLegacyType = /(?:^|,\s*)Banter(?:\.|$)/.test(identification);
      const isCreatorType = /(?:^|,\s*)BS(?:\.|$)/.test(identification);
      if (sdkProfile === "creator" && isLegacyType) {
        errors.push(
          `Variable '${varData.name}' uses legacy type handle ${identification} in a Creator SDK project.`
        );
      } else if (sdkProfile === "banter" && isCreatorType) {
        errors.push(
          `Variable '${varData.name}' uses Creator type handle ${identification} in a legacy Banter project.`
        );
      } else if (
        (sdkProfile === "none" || sdkProfile === "unknown") &&
        (isLegacyType || isCreatorType)
      ) {
        errors.push(
          `Variable '${varData.name}' uses SideQuest SDK type handle ${identification}, ` +
          "but no supported SDK profile was detected."
        );
      } else if (sdkProfile === "hybrid" && isLegacyType) {
        warnings.push(
          `Variable '${varData.name}' retains legacy type handle ${identification} in a hybrid project.`
        );
      }
    }
  }
}
