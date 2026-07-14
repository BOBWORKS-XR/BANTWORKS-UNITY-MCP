# BANTWORKS MCP

A Model Context Protocol (MCP) server and Unity Editor bridge for Banter SDK development. It gives Codex, Claude Code, and other compatible MCP clients awareness of a selected Unity project, with tools to create Visual Scripting graphs, WebRoot JavaScript, and more.

## Client Compatibility

BANTWORKS MCP uses the standard stdio MCP transport. Codex is a first-class supported client:

- The Windows launcher can write the selected Unity channel to Codex at `~/.codex/config.toml`.
- `setup.ps1` can configure Codex from its `[X] Apply to Codex` menu action.
- The launcher can keep Claude Code and Codex synchronized when a scene channel changes.
- Other stdio-compatible MCP clients can launch the same `dist/index.js` server with the `UNITY_PROJECT_PATH` environment variable.

The repository is intentionally generic. It contains no project-specific gameplay, respawn, or scene logic; those belong in the Unity project using the bridge.

## Features

- **Banter SDK Knowledge**: 68 SDK components, 163 unique captured Banter Visual Scripting node types, and the BS.* JavaScript API
- **Visual Scripting Authoring**: Create and validate VS graph `.asset` files using the bundled Unity Visual Scripting JSON manual
- **WebRoot JS Generation**: Write JavaScript for built Banter scenes
- **Unity Integration**: Query project state, check import status, refresh assets
- **Closed-Loop Workflow**: Validate → Write → Verify

## Banter Visual Scripting Expertise

BANTWORKS MCP is specifically informed by Banter's Visual Scripting model, not just generic Unity graph syntax:

- **Node catalogue:** 163 unique Banter node types are represented across the bundled references. This includes 162 exact custom node types extracted from a real Banter `AllCustomNodes.asset`, with categories, serialized defaults, sample GUIDs, and event metadata.
- **Graph-writing rules:** the bundled Unity Visual Scripting JSON manual v2.2 covers the YAML wrapper, graph structure, node IDs, real GUID generation, `$version: "A"`, control/value connections, variables, port names, Banter sandbox restrictions, troubleshooting, and complete examples.
- **Generation and validation:** `generate_vs_graph` resolves captured custom node names and applies their serialized defaults. `validate_vs_graph` accepts current `graph.elements` and older split-connection graph shapes, and checks the structural rules required for Unity to import the graph.

This knowledge improves graph generation and review, but a generated graph should still be imported and tested in the target Unity and Banter SDK version.

## Requirements

- Node.js 18 or later.
- A Unity project root containing `Assets`.
- The Banter SDK for Banter-specific components, Visual Scripting nodes, and WebRoot use.
- Unity 6000.3.10f1 is the latest editor version verified with the bridge. The bundled Visual Scripting manual is based on Unity 6000.3.2f1; validate generated graphs against the exact Unity and Banter SDK version used by the project.

## Quick Start

### 1. Install Dependencies

```bash
cd C:/tools/banter-mcp
npm ci
npm run build
```

### 2. Connect Codex or Claude Code

Both clients launch the same MCP server. Set `UNITY_PROJECT_PATH` in the client configuration so the server knows which Unity project to inspect and modify.

#### Codex

Add this to `~/.codex/config.toml` (on Windows, normally `C:/Users/<you>/.codex/config.toml`):

```toml
[mcp_servers.banter]
command = "node"
args = ["C:/tools/banter-mcp/dist/index.js"]
startup_timeout_sec = 20
tool_timeout_sec = 60

[mcp_servers.banter.env]
UNITY_PROJECT_PATH = "E:/unity/MCP_base"
```

#### Claude Code

```bash
claude mcp add banter --scope user -- node C:/tools/banter-mcp/dist/index.js
```

Or add the server directly to `.claude.json`:
```json
{
  "mcpServers": {
    "banter": {
      "command": "node",
      "args": ["C:/tools/banter-mcp/dist/index.js"],
      "env": {
        "UNITY_PROJECT_PATH": "E:/unity/MCP_base"
      }
    }
  }
}
```

Restart the selected MCP client after changing its configuration.

### 3. Configure Through the Windows Launcher (Optional)

The BANTWORKS MCP launcher can manage multiple Unity scene channels and install the Unity bridge. Select a channel, then use **Apply to Codex** or **Apply to Claude Code**. With **Auto-configure Clients** enabled, changing the active channel updates both configurations.

`setup.ps1` offers the same workflow in PowerShell: use `[X] Apply to Codex` or `[C] Apply to Claude Code` after choosing an active project.

### 4. Install Unity Extension (Optional - for full feedback loop)

Copy the Unity extension to your project:
```
C:/tools/banter-mcp/unity-extension/Editor/BanterMCPBridge.cs
  → YourProject/Assets/Editor/BanterMCPBridge.cs
```

Unity will compile it automatically and start exporting project state to `YourProject/.bantworks-mcp/state`.

### 5. Verify the Bridge

Ask the MCP client to call `get_bridge_status`. A ready bridge reports `ready: true` and `stateStatus: "fresh"`. If it is not ready, the result contains a specific next step instead of requiring a guess at which part of setup failed.

The Unity Console should also show `[BANTWORKS MCP] Bridge initialized` after the extension compiles.

## Usage

### Resources (Knowledge available to MCP clients)

| Resource | Description |
|----------|-------------|
| `banter://components` | All 68 Banter components with properties |
| `banter://vs-nodes` | Hand-authored Banter node reference with port notes |
| `banter://custom-vs-nodes` | Exact catalogue of 162 custom Banter node types extracted from a real graph asset |
| `banter://custom-vs-node-log` | Markdown log with every captured custom node, category, and serialized default |
| `banter://js-api` | Complete BS.* JavaScript API |
| `banter://vs-instructions` | How to create Banter Visual Scripting graph files |
| `banter://unity-vs-json-manual` | Unity Visual Scripting JSON manual v2.2 with patterns, restrictions, and troubleshooting |
| `unity://types` | Unity fundamentals (Vector3, Quaternion, etc.) |
| `project://state` | Current scene hierarchy (requires extension) |
| `project://console` | Unity console logs (requires extension) |

### Tools (32 focused actions available to MCP clients)

| Category | Tools |
|----------|-------|
| Visual Scripting | `generate_vs_graph`, `validate_vs_graph`, `write_vs_graph` |
| Banter WebRoot | `write_webroot_js` |
| Bridge health and diagnostics | `get_bridge_status`, `query_project_state`, `check_import_status`, `get_console_logs`, `refresh_unity_assets` |
| Editor control and visual inspection | `control_play_mode`, `capture_unity_screenshot` |
| Project and asset discovery | `get_unity_packages`, `search_unity_assets` |
| Unity tests | `run_unity_tests`, `get_unity_test_run` |
| Scene lifecycle and builds | `get_unity_scenes`, `save_unity_scene`, `open_unity_scene`, `set_unity_build_scenes` |
| Scene object operations | `create_gameobject`, `delete_gameobject`, `modify_gameobject`, `get_object_bounds` |
| Components and references | `add_component`, `remove_component`, `set_component_property`, `set_object_reference` |
| Prefabs and batches | `batch_create`, `instantiate_prefab`, `batch_instantiate_prefabs`, `get_prefab_catalog`, `scan_prefabs` |

Scene-mutating tools run through the Unity bridge and return an explicit Unity acknowledgement when one arrives. Scene state exports stable Unity `globalObjectId` values for GameObjects and components; mutation tools prefer those IDs while retaining path selectors for older clients. Typed inspector writes support scalars, vectors, colors, enums, Rects, and Bounds with explicit validation. Ambiguous or stale selectors fail closed rather than modifying an arbitrary object.

Batch creation and prefab placement are preflighted and run as one Unity Undo transaction. They roll back on failure by default; partial progress requires the explicit `continueOnError` option.

Unity Test Framework runs support Edit Mode, Play Mode, exact names, regex groups, categories, and assembly filters. Results survive Play Mode domain reloads, remain queryable by run ID, and distinguish a completed runner operation from failed tests or a zero-test filter.

Scene lifecycle tools expose open and build-scene state, save without dialogs, and support Single or Additive loading. Single-mode loads fail closed on dirty scenes unless saving is explicitly requested, and build settings are replaced only after every ordered scene entry passes preflight.

The complete command transport, identity, and inspector-value contract is documented in [docs/bridge-protocol.md](docs/bridge-protocol.md).

### Prompts (Guided workflows)

| Prompt | Description |
|--------|-------------|
| `create_interactive_object` | Guide for making grabbable VR objects |
| `create_vs_graph` | Step-by-step VS graph creation |
| `banter_best_practices` | Development best practices |
| `debug_vs_graph` | Help fix VS graph issues |
| `multiplayer_sync` | Multiplayer synchronization guide |

## Example Workflow

```
You: "Create a grabbable ball that changes color when grabbed"

Codex or Claude Code:
1. Reads banter://components for component info
2. Uses generate_vs_graph to create the logic
3. Uses validate_vs_graph to check for errors
4. Uses write_vs_graph to save to Unity
5. Uses check_import_status to verify it worked
6. Reports success with the asset path
```

## Project Structure

```
banter-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── lib/
│   │   ├── config.ts         # Project-path configuration
│   │   └── files.ts          # Atomic writes and path containment
│   ├── resources/            # Static knowledge
│   │   ├── banter-components.ts
│   │   ├── banter-custom-vs-nodes.ts
│   │   ├── banter-vs-nodes.ts
│   │   ├── banter-js-api.ts
│   │   ├── unity-types.ts
│   │   ├── unity-vs-json-manual.ts
│   │   └── vs-graph-instructions.ts
│   ├── tools/                # MCP tools
│   │   ├── validate-vs-graph.ts
│   │   ├── generate-vs-graph.ts
│   │   ├── write-vs-graph.ts
│   │   ├── write-webroot-js.ts
│   │   ├── query-project.ts
│   │   ├── check-import-status.ts
│   │   └── get-bridge-status.ts
│   └── prompts/              # Guided workflows
│       └── index.ts
├── test/                     # Node built-in test suite
├── docs/                     # Audit, protocol, and node reference material
├── unity-extension/
│   └── Editor/
│       └── BanterMCPBridge.cs  # Unity Editor extension
├── package.json
└── tsconfig.json
```

## Transport

This server currently supports stdio transport only:

```bash
node dist/index.js
```

The old `--http` flag is intentionally rejected until an HTTP transport is implemented.

## Local AI Support

This MCP follows the standard MCP protocol, so it works with any MCP-compatible client, including:
- Codex (desktop and CLI, via `~/.codex/config.toml`)
- Claude Code (stdio)
- Claude Desktop (stdio)
- Cursor (stdio)
- Any client with MCP support

No local-model host is bundled. Any local LLM client that supports stdio MCP can use the same `node dist/index.js` configuration shown above.

## Troubleshooting

### "UNITY_PROJECT_PATH not set"
Set the environment variable in the MCP client configuration. For a temporary PowerShell session:
```powershell
$env:UNITY_PROJECT_PATH = "E:/unity/MyProject"
```

### "Unity extension not detected"
1. Copy BanterMCPBridge.cs to Assets/Editor/
2. Open Unity and let it compile
3. Check Console for "[BANTWORKS MCP] Bridge initialized"

### Bridge status is stale
Call `get_bridge_status`. A `stale` state means the bridge exported state previously, but not in the last 10 seconds. Open the selected project in Unity, resolve any Unity compilation errors, and confirm the bridge initialization log.

### VS Graph validation errors
Common fixes:
- Use `Banter.VisualScripting.OnGrab`, not `Banter.VisualScripting.Events.OnGrab`
- Add `coroutine: false` to event nodes
- Generate real GUIDs, not patterns
- Use `InvokeMember` for GetComponent, not a GetComponent node

## Development

```powershell
npm ci
npm test
cd launcher/src-tauri
cargo check
```

The GitHub Actions workflow runs the Node test suite, dependency audit, and Tauri launcher check on every push and pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for change requirements, [SECURITY.md](SECURITY.md) for vulnerability reporting, and [docs/bridge-protocol.md](docs/bridge-protocol.md) for the local Unity bridge contract.

The evidence-based capability comparison and ordered roadmap are maintained in [docs/unity-mcp-benchmark.md](docs/unity-mcp-benchmark.md).

## License

MIT. See [LICENSE](LICENSE). External research attribution and licensing notes are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
