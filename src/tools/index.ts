/**
 * MCP Tools - Actions Claude can take
 */

import type { BanterMCPConfig } from "../lib/config.js";
import { validateVSGraph, VSValidationResult } from "./validate-vs-graph.js";
import { writeVSGraph, WriteVSGraphResult } from "./write-vs-graph.js";
import { generateVSGraph, GenerateVSGraphResult } from "./generate-vs-graph.js";
import { queryProjectState, ProjectStateResult } from "./query-project.js";
import { checkImportStatus, ImportStatusResult } from "./check-import-status.js";
import { writeWebRootJS, WriteWebRootResult } from "./write-webroot-js.js";

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Register all available tools
 */
export function registerTools(): Tool[] {
  return [
    // VS Graph Tools
    {
      name: "validate_vs_graph",
      description: `Validate a Visual Scripting graph JSON before writing to Unity.
Checks:
- All node types exist in Banter/Unity
- Connections reference valid ports
- GUIDs are properly formatted
- Required properties are set
- No common mistakes (wrong namespaces, missing coroutine flags, etc.)

Use this BEFORE write_vs_graph to catch errors early.`,
      inputSchema: {
        type: "object",
        properties: {
          graphJson: {
            type: "string",
            description: "The VS graph JSON to validate",
          },
        },
        required: ["graphJson"],
      },
    },

    {
      name: "generate_vs_graph",
      description: `Generate a Visual Scripting graph JSON from a high-level description.
Handles all the complexity:
- Creates proper node structure
- Generates valid GUIDs
- Sets up connections
- Includes required properties

Returns the graph JSON which you should validate before writing.`,
      inputSchema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "High-level description of what the graph should do",
          },
          graphName: {
            type: "string",
            description: "Name for the graph asset",
          },
          nodes: {
            type: "array",
            description: "Array of node specifications",
            items: {
              type: "object",
              properties: {
                type: { type: "string", description: "Node type (e.g., 'OnGrab', 'SetVariable')" },
                id: { type: "string", description: "Node ID for connections" },
                properties: { type: "object", description: "Node-specific properties" },
                position: {
                  type: "object",
                  properties: { x: { type: "number" }, y: { type: "number" } },
                },
              },
            },
          },
          connections: {
            type: "array",
            description: "Array of connection specifications",
            items: {
              type: "object",
              properties: {
                from: { type: "string", description: "Source node ID" },
                fromPort: { type: "string", description: "Source port name" },
                to: { type: "string", description: "Destination node ID" },
                toPort: { type: "string", description: "Destination port name" },
                type: { type: "string", enum: ["control", "value"], description: "Connection type" },
              },
            },
          },
          variables: {
            type: "array",
            description: "Graph variables",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                defaultValue: { description: "Default value for the variable" },
              },
            },
          },
        },
        required: ["graphName"],
      },
    },

    {
      name: "write_vs_graph",
      description: `Write a validated Visual Scripting graph to the Unity project.
Creates a .asset file that Unity will import.

IMPORTANT: Always validate with validate_vs_graph first!

After writing, use check_import_status to verify Unity imported it correctly.`,
      inputSchema: {
        type: "object",
        properties: {
          graphJson: {
            type: "string",
            description: "The validated VS graph JSON",
          },
          graphName: {
            type: "string",
            description: "Name for the .asset file (without extension)",
          },
          folder: {
            type: "string",
            description: "Folder within Assets to write to (e.g., 'Scripts/VisualScripting')",
          },
        },
        required: ["graphJson", "graphName"],
      },
    },

    // WebRoot Tools
    {
      name: "write_webroot_js",
      description: `Write JavaScript code to the WebRoot folder for built Banter scenes.
This JS runs at runtime in the browser context.

Use BS.* API for all Banter functionality.`,
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "JavaScript code to write",
          },
          filename: {
            type: "string",
            description: "Filename (e.g., 'main.js', 'game-logic.js')",
          },
        },
        required: ["code", "filename"],
      },
    },

    // Project State Tools
    {
      name: "query_project_state",
      description: `Query the current Unity project state.
Returns scene hierarchy, components, and other project information.

Requires the BanterMCPBridge Unity extension to be installed and Unity Editor running.`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            enum: ["hierarchy", "components", "prefabs", "assets", "all"],
            description: "What to query",
          },
          filter: {
            type: "string",
            description: "Optional filter (e.g., object name, component type)",
          },
        },
        required: ["query"],
      },
    },

    {
      name: "check_import_status",
      description: `Check the status of the last asset import in Unity.
Use this after writing files to verify they imported correctly.

Returns success/failure and any error messages.`,
      inputSchema: {
        type: "object",
        properties: {
          assetPath: {
            type: "string",
            description: "Optional: specific asset path to check",
          },
          waitForImport: {
            type: "boolean",
            description: "Wait for import to complete (default: true)",
          },
          timeoutMs: {
            type: "number",
            description: "Timeout in milliseconds (default: 10000)",
          },
        },
      },
    },

    {
      name: "get_console_logs",
      description: `Get recent Unity console output.
Returns logs, warnings, and errors.

Useful for debugging after importing assets or running graphs.`,
      inputSchema: {
        type: "object",
        properties: {
          level: {
            type: "string",
            enum: ["all", "log", "warning", "error"],
            description: "Filter by log level (default: all)",
          },
          limit: {
            type: "number",
            description: "Maximum number of entries to return (default: 50)",
          },
        },
      },
    },

    {
      name: "refresh_unity_assets",
      description: `Trigger Unity to refresh/reimport assets.
Use after writing multiple files to force Unity to import them.`,
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Optional: specific path to refresh",
          },
        },
      },
    },

    // Unity Scene Manipulation Tools
    {
      name: "create_gameobject",
      description: `Create a new GameObject in the Unity scene.
Supports primitives (Cube, Sphere, Cylinder, Capsule, Plane, Quad) or empty objects.
The object will appear immediately in Unity Editor.
Requires BanterMCPBridge extension to be installed and Unity Editor running.`,
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the new GameObject",
          },
          primitiveType: {
            type: "string",
            description: "Type of primitive: Cube, Sphere, Cylinder, Capsule, Plane, Quad, or empty string for empty object",
          },
          position: {
            type: "array",
            items: { type: "number" },
            description: "Position as [x, y, z]",
          },
          rotation: {
            type: "array",
            items: { type: "number" },
            description: "Rotation in euler angles as [x, y, z]",
          },
          scale: {
            type: "array",
            items: { type: "number" },
            description: "Scale as [x, y, z]",
          },
          parentPath: {
            type: "string",
            description: "Path to parent object (e.g., 'ParentObject' or 'Parent/Child')",
          },
        },
        required: ["name"],
      },
    },

    {
      name: "delete_gameobject",
      description: `Delete a GameObject from the Unity scene.
Requires BanterMCPBridge extension.`,
      inputSchema: {
        type: "object",
        properties: {
          objectPath: {
            type: "string",
            description: "Path to the object (e.g., 'ObjectName' or 'Parent/Child')",
          },
        },
        required: ["objectPath"],
      },
    },

    {
      name: "modify_gameobject",
      description: `Modify an existing GameObject's transform (position, rotation, scale).
Requires BanterMCPBridge extension.`,
      inputSchema: {
        type: "object",
        properties: {
          objectPath: {
            type: "string",
            description: "Path to the object",
          },
          position: {
            type: "array",
            items: { type: "number" },
            description: "New position as [x, y, z]",
          },
          rotation: {
            type: "array",
            items: { type: "number" },
            description: "New rotation in euler angles as [x, y, z]",
          },
          scale: {
            type: "array",
            items: { type: "number" },
            description: "New scale as [x, y, z]",
          },
        },
        required: ["objectPath"],
      },
    },

    // Component Manipulation Tools
    {
      name: "add_component",
      description: `Add a component to a GameObject.
Supports Unity built-in components (Rigidbody, BoxCollider, etc.) and Banter components.
Requires BanterMCPBridge extension.`,
      inputSchema: {
        type: "object",
        properties: {
          objectPath: {
            type: "string",
            description: "Path to the GameObject (e.g., 'MyObject' or 'Parent/Child')",
          },
          componentType: {
            type: "string",
            description: "Component type name (e.g., 'Rigidbody', 'BoxCollider', 'AudioSource')",
          },
        },
        required: ["objectPath", "componentType"],
      },
    },

    {
      name: "remove_component",
      description: `Remove a component from a GameObject.
Requires BanterMCPBridge extension.`,
      inputSchema: {
        type: "object",
        properties: {
          objectPath: {
            type: "string",
            description: "Path to the GameObject",
          },
          componentType: {
            type: "string",
            description: "Component type name to remove (e.g., 'Rigidbody', 'BoxCollider')",
          },
        },
        required: ["objectPath", "componentType"],
      },
    },

    {
      name: "set_component_property",
      description: `Set a property value on a component.
Use query_project_state first to see available properties and their types.
Requires BanterMCPBridge extension.`,
      inputSchema: {
        type: "object",
        properties: {
          objectPath: {
            type: "string",
            description: "Path to the GameObject",
          },
          componentType: {
            type: "string",
            description: "Component type name (e.g., 'Rigidbody', 'Transform')",
          },
          propertyName: {
            type: "string",
            description: "Property name (e.g., 'mass', 'useGravity', 'isTrigger')",
          },
          value: {
            type: "string",
            description: "Property value as JSON string (e.g., '2.5', 'true', '[1,2,3]')",
          },
        },
        required: ["objectPath", "componentType", "propertyName", "value"],
      },
    },

    // Batch Operations
    {
      name: "batch_create",
      description: `Create multiple GameObjects in a single operation.
Use this instead of multiple create_gameobject calls for efficiency.
All objects are created in one Unity command - only one confirmation needed.

Example: Create an office with walls, desks, chairs all at once.`,
      inputSchema: {
        type: "object",
        properties: {
          objects: {
            type: "array",
            description: "Array of objects to create",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "GameObject name" },
                primitiveType: { type: "string", description: "Cube, Sphere, Cylinder, etc." },
                position: { type: "array", items: { type: "number" }, description: "[x, y, z]" },
                rotation: { type: "array", items: { type: "number" }, description: "[x, y, z] euler angles" },
                scale: { type: "array", items: { type: "number" }, description: "[x, y, z]" },
                parentPath: { type: "string", description: "Parent object path" },
              },
              required: ["name"],
            },
          },
        },
        required: ["objects"],
      },
    },

    // Prefab Operations
    {
      name: "instantiate_prefab",
      description: `Instantiate a prefab in the Unity scene.
Use the full asset path like "Assets/Prefabs/MyPrefab.prefab".
Requires BanterMCPBridge extension.`,
      inputSchema: {
        type: "object",
        properties: {
          prefabPath: {
            type: "string",
            description: "Asset path to the prefab (e.g., 'Assets/Prefabs/House.prefab')",
          },
          name: {
            type: "string",
            description: "Optional: rename the instantiated object",
          },
          position: {
            type: "array",
            items: { type: "number" },
            description: "Position as [x, y, z]",
          },
          rotation: {
            type: "array",
            items: { type: "number" },
            description: "Rotation in euler angles as [x, y, z]",
          },
          scale: {
            type: "array",
            items: { type: "number" },
            description: "Scale as [x, y, z]",
          },
          parentPath: {
            type: "string",
            description: "Path to parent object",
          },
        },
        required: ["prefabPath"],
      },
    },

    {
      name: "batch_instantiate_prefabs",
      description: `Instantiate multiple prefabs in a single operation.
Use this to place many prefabs at once - only one confirmation needed.

Example: Create a village with houses, trees, fences all at once.`,
      inputSchema: {
        type: "object",
        properties: {
          prefabs: {
            type: "array",
            description: "Array of prefabs to instantiate",
            items: {
              type: "object",
              properties: {
                prefabPath: { type: "string", description: "Asset path to the prefab" },
                name: { type: "string", description: "Optional: rename the instance" },
                position: { type: "array", items: { type: "number" }, description: "[x, y, z]" },
                rotation: { type: "array", items: { type: "number" }, description: "[x, y, z] euler angles" },
                scale: { type: "array", items: { type: "number" }, description: "[x, y, z]" },
                parentPath: { type: "string", description: "Parent object path" },
              },
              required: ["prefabPath"],
            },
          },
        },
        required: ["prefabs"],
      },
    },

    // Prefab Catalog Tool
    {
      name: "get_prefab_catalog",
      description: `Get the prefab catalog for the current Unity project.
Returns a categorized list of all prefabs available in the Assets folder.
The catalog is generated by Unity on startup and cached.

Use this to discover available prefabs before using instantiate_prefab.
Categories include: Buildings, Nature, Props, Characters, Vehicles, etc.`,
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Filter by category (e.g., 'Fantasy', 'Nature', 'Buildings'). Leave empty for all.",
          },
          search: {
            type: "string",
            description: "Search term to filter prefab names (case-insensitive)",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 100)",
          },
        },
      },
    },

    {
      name: "scan_prefabs",
      description: `Trigger Unity to scan and catalog all prefabs in the project.
Use this if the prefab catalog is missing or out of date.
The scan runs in Unity Editor and saves results to _MCP/state/prefab-catalog.json.`,
      inputSchema: {
        type: "object",
        properties: {},
      },
    },

    {
      name: "get_object_bounds",
      description: `Get the world-space bounding box of a GameObject in the scene.
Returns the combined bounds of all renderers/colliders in the object and its children.
Use this to understand object sizes and positions for layout planning.

Returns:
- center: World position of the bounds center [x, y, z]
- size: Dimensions of the bounding box [width, height, depth]
- min/max: World-space corners of the bounds`,
      inputSchema: {
        type: "object",
        properties: {
          objectPath: {
            type: "string",
            description: "Path to the GameObject (e.g., 'City/Buildings/Skyscraper_1')",
          },
        },
        required: ["objectPath"],
      },
    },
  ];
}

/**
 * Handle tool calls
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  config: BanterMCPConfig
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  let result: unknown;

  switch (name) {
    case "validate_vs_graph":
      result = validateVSGraph(args.graphJson as string);
      break;

    case "generate_vs_graph":
      result = generateVSGraph({
        description: args.description as string,
        graphName: args.graphName as string,
        nodes: args.nodes as Array<unknown>,
        connections: args.connections as Array<unknown>,
        variables: args.variables as Array<unknown>,
      });
      break;

    case "write_vs_graph":
      result = await writeVSGraph(
        args.graphJson as string,
        args.graphName as string,
        (args.folder as string) || "Scripts/VisualScripting",
        config
      );
      break;

    case "write_webroot_js":
      result = await writeWebRootJS(
        args.code as string,
        args.filename as string,
        config
      );
      break;

    case "query_project_state":
      result = await queryProjectState(
        args.query as string,
        args.filter as string | undefined,
        config
      );
      break;

    case "check_import_status":
      result = await checkImportStatus(
        args.assetPath as string | undefined,
        args.waitForImport as boolean | undefined,
        args.timeoutMs as number | undefined,
        config
      );
      break;

    case "get_console_logs":
      result = await getConsoleLogs(
        args.level as string | undefined,
        args.limit as number | undefined,
        config
      );
      break;

    case "refresh_unity_assets":
      result = await refreshUnityAssets(args.path as string | undefined, config);
      break;

    case "create_gameobject":
      result = await createGameObject(
        args.name as string,
        args.primitiveType as string | undefined,
        args.position as number[] | undefined,
        args.rotation as number[] | undefined,
        args.scale as number[] | undefined,
        args.parentPath as string | undefined,
        config
      );
      break;

    case "delete_gameobject":
      result = await deleteGameObject(args.objectPath as string, config);
      break;

    case "modify_gameobject":
      result = await modifyGameObject(
        args.objectPath as string,
        args.position as number[] | undefined,
        args.rotation as number[] | undefined,
        args.scale as number[] | undefined,
        config
      );
      break;

    case "add_component":
      result = await addComponent(
        args.objectPath as string,
        args.componentType as string,
        config
      );
      break;

    case "remove_component":
      result = await removeComponent(
        args.objectPath as string,
        args.componentType as string,
        config
      );
      break;

    case "set_component_property":
      result = await setComponentProperty(
        args.objectPath as string,
        args.componentType as string,
        args.propertyName as string,
        args.value as string,
        config
      );
      break;

    case "batch_create":
      result = await batchCreate(
        args.objects as Array<{
          name: string;
          primitiveType?: string;
          position?: number[];
          rotation?: number[];
          scale?: number[];
          parentPath?: string;
        }>,
        config
      );
      break;

    case "instantiate_prefab":
      result = await instantiatePrefab(
        args.prefabPath as string,
        args.name as string | undefined,
        args.position as number[] | undefined,
        args.rotation as number[] | undefined,
        args.scale as number[] | undefined,
        args.parentPath as string | undefined,
        config
      );
      break;

    case "batch_instantiate_prefabs":
      result = await batchInstantiatePrefabs(
        args.prefabs as Array<{
          prefabPath: string;
          name?: string;
          position?: number[];
          rotation?: number[];
          scale?: number[];
          parentPath?: string;
        }>,
        config
      );
      break;

    case "get_prefab_catalog":
      result = await getPrefabCatalog(
        args.category as string | undefined,
        args.search as string | undefined,
        args.limit as number | undefined,
        config
      );
      break;

    case "scan_prefabs":
      result = await scanPrefabs(config);
      break;

    case "get_object_bounds":
      result = await getObjectBounds(
        args.objectPath as string,
        config
      );
      break;

    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [
      {
        type: "text",
        text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
      },
    ],
  };
}

// Helper functions for simple tools

async function getConsoleLogs(
  level: string | undefined,
  limit: number | undefined,
  config: BanterMCPConfig
): Promise<unknown> {
  const fs = await import("fs");
  const path = await import("path");

  const logPath = path.join(config.mcpStatePath, "console-log.json");

  if (!fs.existsSync(logPath)) {
    return {
      success: false,
      error: "Console log file not found. Is Unity running with BanterMCPBridge?",
      logs: [],
    };
  }

  try {
    const data = JSON.parse(fs.readFileSync(logPath, "utf-8"));
    let logs = data.logs || [];

    // Filter by level if specified
    if (level && level !== "all") {
      logs = logs.filter((log: { level: string }) => log.level === level);
    }

    // Limit results
    const maxLimit = limit || 50;
    logs = logs.slice(-maxLimit);

    return {
      success: true,
      count: logs.length,
      logs,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      logs: [],
    };
  }
}

async function refreshUnityAssets(
  assetPath: string | undefined,
  config: BanterMCPConfig
): Promise<unknown> {
  const fs = await import("fs");
  const path = await import("path");

  // Write a refresh command for Unity to pick up
  const commandPath = path.join(config.mcpCommandsPath, "refresh.json");

  try {
    // Ensure command directory exists
    if (!fs.existsSync(config.mcpCommandsPath)) {
      fs.mkdirSync(config.mcpCommandsPath, { recursive: true });
    }

    const command = {
      type: "refresh",
      path: assetPath || null,
      timestamp: Date.now(),
    };

    fs.writeFileSync(commandPath, JSON.stringify(command, null, 2));

    return {
      success: true,
      message: "Refresh command sent to Unity",
      path: assetPath || "all assets",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function sendUnityCommand(
  command: Record<string, unknown>,
  config: BanterMCPConfig
): Promise<{ success: boolean; error?: string; commandId?: string }> {
  const fs = await import("fs");
  const path = await import("path");
  const crypto = await import("crypto");

  try {
    // Ensure command directory exists
    if (!fs.existsSync(config.mcpCommandsPath)) {
      fs.mkdirSync(config.mcpCommandsPath, { recursive: true });
    }

    // Generate unique command ID
    const commandId = crypto.randomUUID();
    const commandFile = path.join(config.mcpCommandsPath, `${commandId}.json`);

    // Write command file
    fs.writeFileSync(commandFile, JSON.stringify({
      ...command,
      id: commandId,
      timestamp: Date.now(),
    }, null, 2));

    return { success: true, commandId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function createGameObject(
  name: string,
  primitiveType: string | undefined,
  position: number[] | undefined,
  rotation: number[] | undefined,
  scale: number[] | undefined,
  parentPath: string | undefined,
  config: BanterMCPConfig
): Promise<unknown> {
  const command = {
    type: "create_gameobject",
    name,
    primitiveType: primitiveType || "",
    position: position || [0, 0, 0],
    rotation: rotation || [0, 0, 0],
    scale: scale || [1, 1, 1],
    parentPath: parentPath || null,
  };

  const result = await sendUnityCommand(command, config);

  if (result.success) {
    return {
      success: true,
      message: `Created GameObject '${name}'${primitiveType ? ` (${primitiveType})` : ""}`,
      commandId: result.commandId,
      details: {
        name,
        primitiveType: primitiveType || "Empty",
        position: position || [0, 0, 0],
        rotation: rotation || [0, 0, 0],
        scale: scale || [1, 1, 1],
        parent: parentPath || "Scene Root",
      },
    };
  }

  return result;
}

async function deleteGameObject(
  objectPath: string,
  config: BanterMCPConfig
): Promise<unknown> {
  const command = {
    type: "delete_gameobject",
    objectPath,
  };

  const result = await sendUnityCommand(command, config);

  if (result.success) {
    return {
      success: true,
      message: `Delete command sent for '${objectPath}'`,
      commandId: result.commandId,
    };
  }

  return result;
}

async function modifyGameObject(
  objectPath: string,
  position: number[] | undefined,
  rotation: number[] | undefined,
  scale: number[] | undefined,
  config: BanterMCPConfig
): Promise<unknown> {
  const command = {
    type: "modify_gameobject",
    objectPath,
    position: position || null,
    rotation: rotation || null,
    scale: scale || null,
  };

  const result = await sendUnityCommand(command, config);

  if (result.success) {
    const changes: string[] = [];
    if (position) changes.push(`position: [${position.join(", ")}]`);
    if (rotation) changes.push(`rotation: [${rotation.join(", ")}]`);
    if (scale) changes.push(`scale: [${scale.join(", ")}]`);

    return {
      success: true,
      message: `Modify command sent for '${objectPath}'`,
      commandId: result.commandId,
      changes: changes.length > 0 ? changes : ["No changes specified"],
    };
  }

  return result;
}

async function addComponent(
  objectPath: string,
  componentType: string,
  config: BanterMCPConfig
): Promise<unknown> {
  const command = {
    type: "add_component",
    objectPath,
    componentType,
  };

  const result = await sendUnityCommand(command, config);

  if (result.success) {
    return {
      success: true,
      message: `Add component command sent: ${componentType} to '${objectPath}'`,
      commandId: result.commandId,
    };
  }

  return result;
}

async function removeComponent(
  objectPath: string,
  componentType: string,
  config: BanterMCPConfig
): Promise<unknown> {
  const command = {
    type: "remove_component",
    objectPath,
    componentType,
  };

  const result = await sendUnityCommand(command, config);

  if (result.success) {
    return {
      success: true,
      message: `Remove component command sent: ${componentType} from '${objectPath}'`,
      commandId: result.commandId,
    };
  }

  return result;
}

async function setComponentProperty(
  objectPath: string,
  componentType: string,
  propertyName: string,
  value: string,
  config: BanterMCPConfig
): Promise<unknown> {
  const command = {
    type: "set_component_property",
    objectPath,
    componentType,
    propertyName,
    value,
  };

  const result = await sendUnityCommand(command, config);

  if (result.success) {
    return {
      success: true,
      message: `Set property command sent: ${componentType}.${propertyName} = ${value} on '${objectPath}'`,
      commandId: result.commandId,
    };
  }

  return result;
}

async function batchCreate(
  objects: Array<{
    name: string;
    primitiveType?: string;
    position?: number[];
    rotation?: number[];
    scale?: number[];
    parentPath?: string;
  }>,
  config: BanterMCPConfig
): Promise<unknown> {
  // Convert each object to a create_gameobject command JSON string
  const commands = objects.map((obj) =>
    JSON.stringify({
      type: "create_gameobject",
      name: obj.name,
      primitiveType: obj.primitiveType || "",
      position: obj.position || [0, 0, 0],
      rotation: obj.rotation || [0, 0, 0],
      scale: obj.scale || [1, 1, 1],
      parentPath: obj.parentPath || null,
    })
  );

  const batchCommand = {
    type: "batch",
    commands,
  };

  const result = await sendUnityCommand(batchCommand, config);

  if (result.success) {
    return {
      success: true,
      message: `Batch create command sent: ${objects.length} objects`,
      commandId: result.commandId,
      objectCount: objects.length,
      objects: objects.map((o) => o.name),
    };
  }

  return result;
}

async function instantiatePrefab(
  prefabPath: string,
  name: string | undefined,
  position: number[] | undefined,
  rotation: number[] | undefined,
  scale: number[] | undefined,
  parentPath: string | undefined,
  config: BanterMCPConfig
): Promise<unknown> {
  const command = {
    type: "instantiate_prefab",
    prefabPath,
    name: name || null,
    position: position || [0, 0, 0],
    rotation: rotation || [0, 0, 0],
    scale: scale || [1, 1, 1],
    parentPath: parentPath || null,
  };

  const result = await sendUnityCommand(command, config);

  if (result.success) {
    return {
      success: true,
      message: `Instantiate prefab command sent: ${prefabPath}`,
      commandId: result.commandId,
      details: {
        prefabPath,
        name: name || "(prefab name)",
        position: position || [0, 0, 0],
        rotation: rotation || [0, 0, 0],
        scale: scale || [1, 1, 1],
        parent: parentPath || "Scene Root",
      },
    };
  }

  return result;
}

async function batchInstantiatePrefabs(
  prefabs: Array<{
    prefabPath: string;
    name?: string;
    position?: number[];
    rotation?: number[];
    scale?: number[];
    parentPath?: string;
  }>,
  config: BanterMCPConfig
): Promise<unknown> {
  // Convert each prefab to an instantiate_prefab command JSON string
  const commands = prefabs.map((p) =>
    JSON.stringify({
      type: "instantiate_prefab",
      prefabPath: p.prefabPath,
      name: p.name || null,
      position: p.position || [0, 0, 0],
      rotation: p.rotation || [0, 0, 0],
      scale: p.scale || [1, 1, 1],
      parentPath: p.parentPath || null,
    })
  );

  const batchCommand = {
    type: "batch",
    commands,
  };

  const result = await sendUnityCommand(batchCommand, config);

  if (result.success) {
    return {
      success: true,
      message: `Batch instantiate command sent: ${prefabs.length} prefabs`,
      commandId: result.commandId,
      prefabCount: prefabs.length,
      prefabs: prefabs.map((p) => p.prefabPath.split("/").pop()),
    };
  }

  return result;
}

interface PrefabCatalogEntry {
  path: string;
  name: string;
  category: string;
  subcategory?: string;
  boundsSize?: number[];    // [width, height, depth]
  boundsCenter?: number[];  // [x, y, z] offset from pivot
}

interface PrefabCatalog {
  version: number;
  timestamp: number;
  totalCount: number;
  categories: Record<string, {
    count: number;
    subcategories?: Record<string, number>;
    prefabs: PrefabCatalogEntry[];
  }>;
}

async function getPrefabCatalog(
  category: string | undefined,
  search: string | undefined,
  limit: number | undefined,
  config: BanterMCPConfig
): Promise<unknown> {
  const fs = await import("fs");
  const path = await import("path");

  const catalogPath = path.join(config.mcpStatePath, "prefab-catalog.json");

  if (!fs.existsSync(catalogPath)) {
    return {
      success: false,
      error: "Prefab catalog not found. Use scan_prefabs to generate it, or ensure Unity is running with BanterMCPBridge.",
      hint: "The catalog is automatically generated when Unity Editor starts with BanterMCPBridge installed.",
    };
  }

  try {
    const catalog: PrefabCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    const maxLimit = limit || 100;
    let results: PrefabCatalogEntry[] = [];

    // Collect prefabs from categories
    if (category) {
      // Filter by specific category (case-insensitive partial match)
      const categoryLower = category.toLowerCase();
      for (const [catName, catData] of Object.entries(catalog.categories)) {
        if (catName.toLowerCase().includes(categoryLower)) {
          results.push(...catData.prefabs);
        }
      }
    } else {
      // Get all prefabs
      for (const catData of Object.values(catalog.categories)) {
        results.push(...catData.prefabs);
      }
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter((p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.path.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    const totalMatches = results.length;
    results = results.slice(0, maxLimit);

    // Build category summary
    const categorySummary: Record<string, number> = {};
    for (const [catName, catData] of Object.entries(catalog.categories)) {
      categorySummary[catName] = catData.count;
    }

    return {
      success: true,
      totalInCatalog: catalog.totalCount,
      matchingResults: totalMatches,
      returnedResults: results.length,
      catalogAge: `${Math.round((Date.now() - catalog.timestamp) / 1000 / 60)} minutes ago`,
      categories: categorySummary,
      prefabs: results.map((p) => ({
        name: p.name,
        path: p.path,
        category: p.category,
        boundsSize: p.boundsSize,
        boundsCenter: p.boundsCenter,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error reading catalog",
    };
  }
}

async function scanPrefabs(config: BanterMCPConfig): Promise<unknown> {
  const command = {
    type: "scan_prefabs",
  };

  const result = await sendUnityCommand(command, config);

  if (result.success) {
    return {
      success: true,
      message: "Scan prefabs command sent to Unity. The catalog will be generated shortly.",
      commandId: result.commandId,
      note: "Use get_prefab_catalog after a few seconds to retrieve the results.",
    };
  }

  return result;
}

async function getObjectBounds(
  objectPath: string,
  config: BanterMCPConfig
): Promise<unknown> {
  const fs = await import("fs");
  const pathModule = await import("path");

  const command = {
    type: "get_object_bounds",
    objectPath,
  };

  const result = await sendUnityCommand(command, config);

  if (!result.success) {
    return result;
  }

  // Wait for Unity to write the bounds result
  const boundsPath = pathModule.join(config.mcpStatePath, "bounds-result.json");
  const startTime = Date.now();
  const timeout = 5000;

  while (Date.now() - startTime < timeout) {
    if (fs.existsSync(boundsPath)) {
      try {
        const boundsData = JSON.parse(fs.readFileSync(boundsPath, "utf-8"));

        // Check if this is the result we're waiting for
        if (boundsData.objectPath === objectPath && boundsData.timestamp > startTime - 1000) {
          // Clean up the file
          fs.unlinkSync(boundsPath);

          if (boundsData.success) {
            return {
              success: true,
              objectPath,
              bounds: boundsData.bounds,
            };
          } else {
            return {
              success: false,
              objectPath,
              error: boundsData.error || "Object not found",
            };
          }
        }
      } catch {
        // File might be partially written, wait and retry
      }
    }

    // Wait a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    success: false,
    error: "Timeout waiting for bounds result from Unity",
    objectPath,
  };
}
