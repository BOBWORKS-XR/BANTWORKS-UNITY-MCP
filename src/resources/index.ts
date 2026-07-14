/**
 * MCP Resources - Knowledge and state available to connected MCP clients
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";
import { BANTER_COMPONENTS, BANTER_COMPONENT_CATALOG_METADATA } from "./banter-components.js";
import { BANTER_VS_NODES } from "./banter-vs-nodes.js";
import { BANTER_CUSTOM_VS_NODES, BANTER_CUSTOM_VS_NODE_LOG } from "./banter-custom-vs-nodes.js";
import { BANTER_JS_API } from "./banter-js-api.js";
import { UNITY_TYPES } from "./unity-types.js";
import { VS_GRAPH_INSTRUCTIONS } from "./vs-graph-instructions.js";
import { UNITY_VS_JSON_MANUAL } from "./unity-vs-json-manual.js";
import { UNITY_VS_JSON_ERRATA } from "./unity-vs-json-errata.js";
import { BANTER_SDK_COMPATIBILITY } from "./banter-sdk-compatibility.js";
import { BANTER_WORKFLOW_CONTRACT, BANTER_WORKFLOWS } from "./banter-workflows.js";
import {
  ALWAYS_AVAILABLE_TOOLS,
  TOOL_GROUP_MEMBERSHIP,
  TOOL_GROUP_NAMES,
} from "../tools/tool-groups.js";

/**
 * System prompt that guides connected MCP clients during Banter development
 */
const BANTER_SYSTEM_PROMPT = `# Banter MCP - Proactive Development Assistant

You are connected to a Unity project through the Banter MCP. You have DIRECT ACCESS to create, modify, and manage Unity GameObjects and Visual Scripting graphs.

## CRITICAL: Be Proactive, Not Advisory

**DO things, don't just explain how to do them.**

The server may expose a limited capability profile. Use only tools present in
\`tools/list\`; a missing tool is intentionally unavailable, not a reason to
invent an equivalent write path.

### Instead of:
- "You could add a BanterGrababble component..."
- "Here's how you would create a cube..."
- "You might want to add physics..."

### DO THIS:
- Use \`create_gameobject\` to CREATE the object directly
- Use \`generate_vs_graph\` + \`write_vs_graph\` to CREATE the behavior
- Use \`modify_gameobject\` to ADJUST transforms
- Then tell the user what you did

## Your Workflow

When the user asks for something in their scene:

1. **Choose a contract** - Read \`banter://workflows\` for synced objects, interaction, UI, audio, networking, or WebRoot work
2. **Query first** - Use \`get_bridge_status\`, \`get_banter_sdk_info\`, and \`query_project_state\`
3. **Create/modify** - Use the smallest applicable implementation path
4. **Verify** - Apply the workflow's import, SDK, console, and runtime gates
5. **Report** - Give stable target IDs, exact changes, validation evidence, and remaining runtime tests

## Available Actions

### Scene Manipulation
- \`create_gameobject\` - Create cubes, spheres, empty objects, etc.
- \`delete_gameobject\` - Remove objects from the scene
- \`modify_gameobject\` - Change position, rotation, scale
- \`set_asset_reference\` - Assign graph, material, texture, audio, prefab, and other Unity assets to component reference fields

### Visual Scripting
- \`generate_vs_graph\` - Create interaction logic
- \`validate_vs_graph\` - Check for errors
- \`write_vs_graph\` - Save to the project
- Before creating Visual Scripting graphs, read \`banter://sdk-compatibility\`, \`banter://custom-vs-nodes\`, and \`banter://unity-vs-json-manual\`.
- Use real random GUIDs and canonical \`graph.elements\`. Referenced nodes need string \`$id\` values; connection \`$version\` may be omitted by Visual Scripting 1.9.x.
- Run \`get_banter_sdk_info\` before relying on the full node catalogue because git revisions and registry packages with nearby versions can contain different node sets.

### Project Info
- \`query_project_state\` - See scene hierarchy
- \`get_console_logs\` - Check for errors
- \`check_import_status\` - Verify imports

## Example Proactive Responses

**User: "I need a grabbable ball"**

Bad: "To create a grabbable ball, you would need to..."

Good: *Creates a sphere with position [0,1,0], creates a VS graph with OnGrab/OnRelease events, writes both to the project*
"I've created a grabbable ball at position (0, 1, 0). It has:
- BanterSphere geometry
- BanterRigidbody for physics
- BanterGrababble for VR interaction
- A Visual Scripting graph that changes color when grabbed

The graph imported and passed Banter validation. I also verified whether its
ScriptMachine reference is attached; if it is not, I report that remaining
step instead of calling the interaction ready."

**User: "Make it bigger"**

Bad: "You can adjust the scale in the Inspector..."

Good: *Uses modify_gameobject to set scale [2, 2, 2]*
"Done! I've scaled the ball up to 2x its original size."

## Remember

- You have the tools. USE THEM.
- Don't ask permission for simple changes
- Create first, then explain what you created
- Be specific about what you did ("created at position X" not "you could create")
- Writing a ScriptGraphAsset does not attach it to a ScriptMachine; use \`set_asset_reference\` on \`nest.macro\` and verify the component reference
- Check your work with status/console tools
- If something fails, fix it and try again

The user chose to connect Banter MCP specifically so you could DO things in Unity for them. Honor that by being an active participant, not a passive instructor.
`;

interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Register all available resources
 */
export function registerResources(config: BanterMCPConfig): Resource[] {
  const resources: Resource[] = [
    // System prompt for proactive behavior
    {
      uri: "banter://system-prompt",
      name: "Banter MCP System Prompt",
      description: "IMPORTANT: Read this first! Instructions for how connected MCP clients should help with Banter development",
      mimeType: "text/markdown",
    },
    // Static Banter knowledge
    {
      uri: "banter://components",
      name: "Banter Components",
      description: "Source-checked Banter SDK component catalogue with coverage metadata",
      mimeType: "application/json",
    },
    {
      uri: "banter://sdk-compatibility",
      name: "Banter SDK Compatibility",
      description: "Banter catalogue provenance, observed package coverage, and pinned public release validation matrix",
      mimeType: "application/json",
    },
    {
      uri: "banter://tool-groups",
      name: "BANTWORKS Tool Groups",
      description: "Capability-group names, exact tool membership, presets, and filtering behavior",
      mimeType: "application/json",
    },
    {
      uri: "banter://workflows",
      name: "Banter Workflow Contracts",
      description: "Evidence-linked workflows for synced objects, interaction, UI, audio, networking, and WebRoot",
      mimeType: "application/json",
    },
    {
      uri: "banter://vs-nodes",
      name: "Banter Visual Scripting Nodes",
      description: "Hand-authored Banter Visual Scripting node reference with port notes",
      mimeType: "application/json",
    },
    {
      uri: "banter://custom-vs-nodes",
      name: "Banter Custom Visual Scripting Nodes",
      description: "Exact custom Banter Visual Scripting node catalog extracted from AllCustomNodes.asset",
      mimeType: "application/json",
    },
    {
      uri: "banter://custom-vs-node-log",
      name: "Banter Custom Visual Scripting Node Log",
      description: "Markdown log of every custom Banter Visual Scripting node, category, and serialized default value",
      mimeType: "text/markdown",
    },
    {
      uri: "banter://js-api",
      name: "Banter JavaScript API",
      description: "Complete BS.* JavaScript API reference for runtime scripting",
      mimeType: "application/json",
    },
    {
      uri: "banter://vs-instructions",
      name: "Visual Scripting Graph Instructions",
      description: "How to programmatically create Visual Scripting .asset files",
      mimeType: "text/markdown",
    },
    {
      uri: "banter://unity-vs-json-manual",
      name: "Unity Visual Scripting JSON Manual",
      description: "Complete Unity Visual Scripting JSON rules, pitfalls, and examples supplied by the user",
      mimeType: "text/markdown",
    },
    {
      uri: "unity://types",
      name: "Unity Type Reference",
      description: "Unity fundamentals (Vector3, Quaternion, GameObject, etc.)",
      mimeType: "application/json",
    },
  ];

  // Dynamic project state (if Unity extension is installed)
  if (config.hasUnityExtension) {
    resources.push(
      {
        uri: "project://state",
        name: "Project State",
        description: "Current Unity scene hierarchy exported by the Unity bridge",
        mimeType: "application/json",
      },
      {
        uri: "project://editor-state",
        name: "Editor State",
        description: "Unity editor play mode, compile state, active scene, and selected objects",
        mimeType: "application/json",
      },
      {
        uri: "project://console",
        name: "Console Logs",
        description: "Recent Unity console output (logs, warnings, errors)",
        mimeType: "application/json",
      },
      {
        uri: "project://import-status",
        name: "Import Status",
        description: "Status of the last asset import operation",
        mimeType: "application/json",
      },
      {
        uri: "project://prefab-catalog",
        name: "Prefab Catalog",
        description: "Categorized prefab catalog exported by the Unity bridge",
        mimeType: "application/json",
      }
    );
  }

  return resources;
}

/**
 * Read resource content
 */
export function handleResourceRead(
  uri: string,
  config: BanterMCPConfig
): { contents: Array<{ uri: string; mimeType: string; text: string }> } {
  let content: string;
  let mimeType = "application/json";

  switch (uri) {
    // System prompt for proactive behavior
    case "banter://system-prompt":
      content = BANTER_SYSTEM_PROMPT;
      mimeType = "text/markdown";
      break;

    // Static Banter knowledge
    case "banter://components":
      content = JSON.stringify({ metadata: BANTER_COMPONENT_CATALOG_METADATA, components: BANTER_COMPONENTS }, null, 2);
      break;

    case "banter://sdk-compatibility":
      content = JSON.stringify(BANTER_SDK_COMPATIBILITY, null, 2);
      break;

    case "banter://tool-groups":
      content = JSON.stringify({
        environmentVariable: "BANTWORKS_TOOL_GROUPS",
        default: "all",
        specialValues: {
          all: "Expose all tools",
          none: "Expose only project routing and bridge health tools",
        },
        alwaysAvailable: [...ALWAYS_AVAILABLE_TOOLS],
        groups: Object.fromEntries(
          TOOL_GROUP_NAMES.map((group) => [group, [...TOOL_GROUP_MEMBERSHIP[group]]])
        ),
        launcherProfiles: {
          full: "all",
          inspection: "read",
          banterWorkflow: "read,author,banter",
          unityAuthoring: "read,author",
          testing: "read,test",
          minimalRouting: "none",
        },
      }, null, 2);
      break;

    case "banter://workflows":
      content = JSON.stringify({
        contract: BANTER_WORKFLOW_CONTRACT,
        workflows: BANTER_WORKFLOWS,
      }, null, 2);
      break;

    case "banter://vs-nodes":
      content = JSON.stringify(BANTER_VS_NODES, null, 2);
      break;

    case "banter://custom-vs-nodes":
      content = JSON.stringify(BANTER_CUSTOM_VS_NODES, null, 2);
      break;

    case "banter://custom-vs-node-log":
      content = BANTER_CUSTOM_VS_NODE_LOG;
      mimeType = "text/markdown";
      break;

    case "banter://js-api":
      content = JSON.stringify(BANTER_JS_API, null, 2);
      break;

    case "banter://vs-instructions":
      content = VS_GRAPH_INSTRUCTIONS;
      mimeType = "text/markdown";
      break;

    case "banter://unity-vs-json-manual":
      content = `${UNITY_VS_JSON_ERRATA}\n\n---\n\n${UNITY_VS_JSON_MANUAL}`;
      mimeType = "text/markdown";
      break;

    case "unity://types":
      content = JSON.stringify(UNITY_TYPES, null, 2);
      break;

    // Dynamic project state
    case "project://state":
      content = readProjectFile(config.mcpStatePath, "scene-hierarchy.json");
      break;

    case "project://editor-state":
      content = readProjectFile(config.mcpStatePath, "editor-state.json");
      break;

    case "project://console":
      content = readProjectFile(config.mcpStatePath, "console-log.json");
      break;

    case "project://import-status":
      content = readProjectFile(config.mcpStatePath, "import-status.json");
      break;

    case "project://prefab-catalog":
      content = readProjectFile(config.mcpStatePath, "prefab-catalog.json");
      break;

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }

  return {
    contents: [{ uri, mimeType, text: content }],
  };
}

/**
 * Read a file from the project state directory
 */
function readProjectFile(stateDir: string, filename: string): string {
  const filePath = path.join(stateDir, filename);

  if (!fs.existsSync(filePath)) {
    return JSON.stringify({
      error: "File not found",
      message: `${filename} does not exist. Is Unity Editor running with the BanterMCPBridge extension?`,
      path: filePath,
    });
  }

  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    return JSON.stringify({
      error: "Read error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
