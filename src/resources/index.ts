/**
 * MCP Resources - Knowledge and state that Claude can read
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";
import { BANTER_COMPONENTS } from "./banter-components.js";
import { BANTER_VS_NODES } from "./banter-vs-nodes.js";
import { BANTER_JS_API } from "./banter-js-api.js";
import { UNITY_TYPES } from "./unity-types.js";
import { VS_GRAPH_INSTRUCTIONS } from "./vs-graph-instructions.js";

/**
 * System prompt that instructs Claude to be proactive in Banter development
 */
const BANTER_SYSTEM_PROMPT = `# Banter MCP - Proactive Development Assistant

You are connected to a Unity project through the Banter MCP. You have DIRECT ACCESS to create, modify, and manage Unity GameObjects and Visual Scripting graphs.

## CRITICAL: Be Proactive, Not Advisory

**DO things, don't just explain how to do them.**

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

1. **Query first** - Use \`query_project_state\` to see what exists
2. **Create/modify** - Use your tools to make changes directly
3. **Verify** - Use \`check_import_status\` or \`get_console_logs\` to confirm
4. **Report** - Tell the user what you created/changed

## Available Actions

### Scene Manipulation
- \`create_gameobject\` - Create cubes, spheres, empty objects, etc.
- \`delete_gameobject\` - Remove objects from the scene
- \`modify_gameobject\` - Change position, rotation, scale

### Visual Scripting
- \`generate_vs_graph\` - Create interaction logic
- \`validate_vs_graph\` - Check for errors
- \`write_vs_graph\` - Save to the project

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

The ball is ready in your scene. Try grabbing it in VR!"

**User: "Make it bigger"**

Bad: "You can adjust the scale in the Inspector..."

Good: *Uses modify_gameobject to set scale [2, 2, 2]*
"Done! I've scaled the ball up to 2x its original size."

## Remember

- You have the tools. USE THEM.
- Don't ask permission for simple changes
- Create first, then explain what you created
- Be specific about what you did ("created at position X" not "you could create")
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
      description: "IMPORTANT: Read this first! Instructions for how Claude should behave when helping with Banter development",
      mimeType: "text/markdown",
    },
    // Static Banter knowledge
    {
      uri: "banter://components",
      name: "Banter Components",
      description: "All 68 Banter SDK components with properties, methods, and usage",
      mimeType: "application/json",
    },
    {
      uri: "banter://vs-nodes",
      name: "Banter Visual Scripting Nodes",
      description: "All 164 Visual Scripting nodes available in Banter",
      mimeType: "application/json",
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
        description: "Current Unity project state including scene hierarchy",
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
      content = JSON.stringify(BANTER_COMPONENTS, null, 2);
      break;

    case "banter://vs-nodes":
      content = JSON.stringify(BANTER_VS_NODES, null, 2);
      break;

    case "banter://js-api":
      content = JSON.stringify(BANTER_JS_API, null, 2);
      break;

    case "banter://vs-instructions":
      content = VS_GRAPH_INSTRUCTIONS;
      mimeType = "text/markdown";
      break;

    case "unity://types":
      content = JSON.stringify(UNITY_TYPES, null, 2);
      break;

    // Dynamic project state
    case "project://state":
      content = readProjectFile(config.mcpStatePath, "project-state.json");
      break;

    case "project://console":
      content = readProjectFile(config.mcpStatePath, "console-log.json");
      break;

    case "project://import-status":
      content = readProjectFile(config.mcpStatePath, "import-status.json");
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
