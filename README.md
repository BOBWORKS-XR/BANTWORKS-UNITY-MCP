# BANTWORKS MCP

A Model Context Protocol (MCP) server and Unity Editor bridge for Banter SDK development. It gives Codex, Claude Code, and other compatible MCP clients awareness of a selected Unity project, with tools to create Visual Scripting graphs, WebRoot JavaScript, and more.

## Client Compatibility

BANTWORKS MCP uses the standard stdio MCP transport. Codex is a first-class supported client:

- The Windows launcher can write the selected Unity channel to Codex at `~/.codex/config.toml`.
- `setup.ps1` can configure Codex from its `[X] Apply to Codex` menu action.
- The launcher can keep Claude Code and Codex synchronized when a scene channel changes.
- Other stdio-compatible MCP clients can launch the standalone `banter-mcp.mjs` bundle or the source build at `dist/index.js` with the `UNITY_PROJECT_PATH` environment variable.

The repository is intentionally generic. It contains no project-specific gameplay, respawn, or scene logic; those belong in the Unity project using the bridge.

## Features

- **Banter SDK Knowledge**: 63 source-checked public scene components, one runtime helper, 163 represented Banter Visual Scripting node types, and the BS.* JavaScript API
- **Visual Scripting Authoring**: Create, validate, and safely write native VS graph `.asset` files using the bundled Unity Visual Scripting JSON manual and source-observed errata
- **Banter Validation**: Invoke the selected SDK's own Visual Scripting allow-list validator and return bounded, structured diagnostics
- **Evidence-Linked Banter Workflows**: Execute synced-object, interaction, UI, audio, networking, and WebRoot contracts whose catalogue and tool references are enforced by tests
- **WebRoot JS Generation**: Write JavaScript for built Banter scenes
- **Unity Integration**: Query project state, check import status, refresh assets
- **Closed-Loop Workflow**: Validate → Write → Import and deserialize in Unity → Test
- **Capability Profiles**: Limit the exposed tool surface to inspection, authoring, testing, Banter workflows, or minimal project routing

## Banter Visual Scripting Expertise

BANTWORKS MCP is specifically informed by Banter's Visual Scripting model, not just generic Unity graph syntax:

- **Node catalogue:** 163 unique Banter node types are represented across the bundled references. This includes 162 exact custom node types extracted from a real Banter `AllCustomNodes.asset`, with categories, serialized defaults, sample GUIDs, event metadata, and source hashes.
- **SDK-aware coverage:** `get_banter_sdk_info` reads the selected project's manifest, lock file, git revision or package-cache identity, compares its C# source classes with the embedded catalogues, and matches exact public release and Unity evidence when available. It does not generalize evidence across different source revisions or editor versions.
- **Graph-writing rules:** the bundled Unity Visual Scripting JSON manual v2.2 is preceded by source-observed compatibility errata. Canonical output uses `graph.elements`; referenced nodes use string `$id` values; Visual Scripting 1.9.x may omit `$version` on connections.
- **Generation, validation, and writing:** `generate_vs_graph` resolves captured custom node names and applies their serialized defaults. `validate_vs_graph` accepts current `graph.elements` and older split layouts, checks node-reference integrity, and avoids rejecting valid unreferenced nodes. `write_vs_graph` validates again before writing, emits the ScriptGraphAsset class identifier and `NativeFormatImporter`, and preserves an existing asset GUID while migrating old MCP metadata.
- **Authoritative Editor checks:** `validate_vs_graph_in_unity` forces Unity import and deserialization of one graph. `validate_banter_visual_scripting` then invokes the installed SDK's public `CheckVsNodes()` validator across graph assets, embedded prefab graphs, and the active scene, returning the SDK's exact allow-list diagnostics.

This knowledge improves graph generation and review, but source-class coverage is not proof of runtime behavior. `validate_vs_graph_in_unity` provides an authoritative import and deserialization check in the selected Editor; generated graphs must still be exercised in the target Unity and Banter SDK version.

## Requirements

- Node.js 18 or later.
- A Unity project root containing `Assets`.
- The Banter SDK for Banter-specific components, Visual Scripting nodes, and WebRoot use.
- Unity 6000.3.10f1 is the latest editor version verified with the generic bridge. On Unity 6000.3.2f1, the public Banter SDK 3.2.2 release passes generated graph import, `ScriptMachine.nest.macro` persistence, and SDK allow-list checks; public releases 3.0.2 and 3.1.2 have confirmed Unity 6 material-API compilation failures. The bundled Visual Scripting manual is based on Unity 6000.3.2f1; validate generated graphs against the exact Unity and Banter SDK version used by the project.

## Quick Start

### 1. Install BANTWORKS MCP

For a release build, either install the Windows launcher or extract the standalone ZIP. Both contain a versioned MCP server and Unity bridge and do not depend on a checkout at `C:/tools`. Node.js 18 or newer is still required to run the MCP server. Tagged releases include `SHA256SUMS.txt` for artifact verification.

From an extracted standalone ZIP, validate the included server with:

```powershell
.\setup.ps1 -Install
```

For development from source:

```powershell
Set-Location <path-to-bantworks-mcp>
npm ci
npm run release:server
```

### 2. Connect Codex or Claude Code

Both clients launch the same MCP server. Set `UNITY_PROJECT_PATH` to choose the initial project. When launcher channels exist, the server can also list and switch among them without restarting the MCP client.

#### Codex

Add this to `~/.codex/config.toml` (on Windows, normally `C:/Users/<you>/.codex/config.toml`):

```toml
[mcp_servers.banter]
command = "node"
args = ["C:/path/to/BANTWORKS-MCP/banter-mcp.mjs"]
startup_timeout_sec = 20
tool_timeout_sec = 600

[mcp_servers.banter.env]
UNITY_PROJECT_PATH = "E:/unity/MCP_base"
BANTWORKS_TOOL_GROUPS = "all"
```

#### Claude Code

```bash
claude mcp add banter --scope user -- node C:/path/to/BANTWORKS-MCP/banter-mcp.mjs
```

Or add the server directly to `.claude.json`:
```json
{
  "mcpServers": {
    "banter": {
      "command": "node",
      "args": ["C:/path/to/BANTWORKS-MCP/banter-mcp.mjs"],
      "env": {
        "UNITY_PROJECT_PATH": "E:/unity/MCP_base",
        "BANTWORKS_TOOL_GROUPS": "all"
      }
    }
  }
}
```

Restart the selected MCP client after changing its configuration.

### 3. Configure Through the Windows Launcher (Optional)

The BANTWORKS MCP launcher can manage multiple Unity scene channels, choose a capability profile, and install the Unity bridge. Select a channel, then use **Apply to Codex** or **Apply to Claude Code**. With **Auto-configure Clients** enabled, changing the active channel or capability profile updates both configurations.

At runtime, call `list_unity_projects` and pass one of its stable IDs to `select_unity_project`. Selection affects subsequent calls in the current MCP session only; launcher and client configuration remain unchanged.

`setup.ps1` offers the same workflow in PowerShell: use `[X] Apply to Codex` or `[C] Apply to Claude Code` after choosing an active project.

### 4. Install Unity Extension (Optional - for full feedback loop)

Use the launcher's **Install Unity Extension** action or the PowerShell setup menu. For a manual install, copy the included bridge to your project:
```
<BANTWORKS-MCP>/unity-extension/Editor/BanterMCPBridge.cs
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
| `banter://components` | 63 source-checked public scene components plus the `BanterObjectId` runtime helper |
| `banter://sdk-compatibility` | Catalogue hashes, observed package profiles, and interpretation limits |
| `banter://tool-groups` | Exact capability-group membership, special values, and launcher presets |
| `banter://workflows` | Evidence-linked execution contracts for six focused Banter domains |
| `banter://vs-nodes` | Hand-authored Banter node reference with port notes |
| `banter://custom-vs-nodes` | Exact catalogue of 162 custom Banter node types extracted from a real graph asset |
| `banter://custom-vs-node-log` | Markdown log with every captured custom node, category, and serialized default |
| `banter://js-api` | Complete BS.* JavaScript API |
| `banter://vs-instructions` | How to create Banter Visual Scripting graph files |
| `banter://unity-vs-json-manual` | Unity Visual Scripting JSON manual v2.2 with higher-priority BANTWORKS compatibility errata |
| `unity://types` | Unity fundamentals (Vector3, Quaternion, etc.) |
| `project://state` | Current scene hierarchy (requires extension) |
| `project://console` | Unity console logs (requires extension) |

### Tools (40 focused actions available to MCP clients)

All 40 tools are exposed by default. Set `BANTWORKS_TOOL_GROUPS` to `read`, `author`, `test`, `banter`, a comma-separated union, or `none` for routing/health only. Hidden tools are removed from `tools/list` and rejected on direct invocation. See [docs/tool-groups.md](docs/tool-groups.md).

| Category | Tools |
|----------|-------|
| Visual Scripting | `generate_vs_graph`, `validate_vs_graph`, `write_vs_graph`, `validate_vs_graph_in_unity`, `validate_banter_visual_scripting` |
| Banter WebRoot | `write_webroot_js` |
| Project routing | `list_unity_projects`, `select_unity_project` |
| Bridge health and diagnostics | `get_bridge_status`, `query_project_state`, `check_import_status`, `get_console_logs`, `refresh_unity_assets` |
| Editor control and visual inspection | `control_play_mode`, `capture_unity_screenshot` |
| Project and asset discovery | `get_unity_packages`, `get_banter_sdk_info`, `search_unity_assets` |
| Unity tests | `discover_unity_tests`, `run_unity_tests`, `cancel_unity_test_run`, `get_unity_test_run` |
| Scene lifecycle and builds | `get_unity_scenes`, `save_unity_scene`, `open_unity_scene`, `set_unity_build_scenes` |
| Scene object operations | `create_gameobject`, `delete_gameobject`, `modify_gameobject`, `get_object_bounds` |
| Components and references | `add_component`, `remove_component`, `set_component_property`, `set_object_reference`, `set_asset_reference` |
| Prefabs and batches | `batch_create`, `instantiate_prefab`, `batch_instantiate_prefabs`, `get_prefab_catalog`, `scan_prefabs` |

Scene-mutating tools run through the Unity bridge and return an explicit Unity acknowledgement when one arrives. Scene state exports stable Unity `globalObjectId` values for GameObjects and components; mutation tools prefer those IDs while retaining path selectors for older clients. Typed inspector writes support scalars, vectors, colors, enums, Rects, and Bounds with explicit validation. Ambiguous or stale selectors fail closed rather than modifying an arbitrary object.

Batch creation and prefab placement are preflighted and run as one Unity Undo transaction. They roll back on failure by default; partial progress requires the explicit `continueOnError` option.

Unity Test Framework support includes bounded test discovery plus Edit Mode and Play Mode runs filtered by exact names, regex groups, categories, or assemblies. Results survive Play Mode domain reloads, remain queryable by run ID, and distinguish a completed runner operation from failed tests, cancellation, or a zero-test filter. Cancellation uses the public Test Framework API when available (1.6+) and returns an explicit capability error on older packages.

Scene lifecycle tools expose open and build-scene state, save without dialogs, and support Single or Additive loading. Single-mode loads fail closed on dirty scenes unless saving is explicitly requested, and build settings are replaced only after every ordered scene entry passes preflight.

Project routing deduplicates environment and launcher projects by canonical path, assigns stable path-derived IDs, and reports the live Unity editor process identity. Each tool call snapshots its selected project, so switching projects cannot redirect an already-running command.

The complete command transport, identity, and inspector-value contract is documented in [docs/bridge-protocol.md](docs/bridge-protocol.md). The versions exercised in release checks and their known limits are documented in [docs/compatibility.md](docs/compatibility.md). The latest Visual Scripting and desktop integration findings are in [docs/visual-scripting-audit-2026-07-15.md](docs/visual-scripting-audit-2026-07-15.md).

### Prompts (Guided workflows)

| Prompt | Description |
|--------|-------------|
| `banter_workflow` | Execute one of the six evidence-linked workflow domains |
| `banter_*_workflow` | Focused synced-object, interaction, UI, audio, networking, and WebRoot prompts |
| `create_interactive_object` | Route object creation through the interaction contract |
| `create_vs_graph` | Create a graph with server, Unity import, and SDK validation gates |
| `debug_vs_graph` | Diagnose a graph through the same validation stack |
| `multiplayer_sync` | Classify work as object sync, transient messaging, or persistent state |
| `banter_best_practices` | Apply the source-checked workflow contract |

See [docs/banter-workflows.md](docs/banter-workflows.md) for the workflow and completion gates.

## Example Workflow

```
You: "Create a grabbable ball that changes color when grabbed"

Codex or Claude Code:
1. Uses get_banter_sdk_info to verify the selected SDK source and node coverage
2. Reads banter://components for component info
3. Uses generate_vs_graph to create the logic
4. Uses validate_vs_graph to check for errors
5. Uses write_vs_graph to validate again and save to Unity
6. Uses validate_vs_graph_in_unity to force import and verify deserialization
7. Uses validate_banter_visual_scripting to run the SDK allow-list scan
8. Runs the relevant Unity or Banter behavior test
9. Reports the verified asset path and target SDK identity
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
│   │   ├── banter-sdk-compatibility.ts
│   │   ├── banter-vs-nodes.ts
│   │   ├── banter-js-api.ts
│   │   ├── unity-types.ts
│   │   ├── unity-vs-json-manual.ts
│   │   ├── unity-vs-json-errata.ts
│   │   └── vs-graph-instructions.ts
│   ├── tools/                # MCP tools
│   │   ├── validate-vs-graph.ts
│   │   ├── generate-vs-graph.ts
│   │   ├── get-banter-sdk-info.ts
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

This server currently supports stdio transport only. Run the release bundle:

```bash
node banter-mcp.mjs
```

From a source checkout, `node dist/index.js` is equivalent after `npm run build`.

The old `--http` flag is intentionally rejected until an HTTP transport is implemented.

## Local AI Support

This MCP follows the standard MCP protocol, so it works with any MCP-compatible client, including:
- Codex (desktop and CLI, via `~/.codex/config.toml`)
- Claude Code (stdio)
- Claude Desktop (stdio)
- Cursor (stdio)
- Any client with MCP support

No local-model host is bundled. Any local LLM client that supports stdio MCP can use the same `node banter-mcp.mjs` configuration shown above.

## Troubleshooting

### "UNITY_PROJECT_PATH not set"
Set the environment variable in the MCP client configuration, or configure at least one enabled launcher channel. For a temporary PowerShell session:
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
./scripts/smoke-unity-asset-reference.ps1
./scripts/smoke-unity-banter-vs.ps1
./scripts/smoke-unity-banter-matrix.ps1
cd launcher/src-tauri
cargo check
```

The Banter smoke creates and removes a disposable blank Unity project. It pins
the public SideQuestVR/BanterSDK Git package to a known revision and does not
read or modify a user project. The matrix runs one isolated project per pinned
public release and writes an ignored JSON evidence report under `artifacts/`.
Expected incompatibilities only satisfy the matrix when their exact compiler
diagnostics recur.

The GitHub Actions workflow runs the Node test suite and standalone-bundle smoke on Node 18, 20, 22, and 24, plus the dependency audit and Tauri launcher tests. Version tags build draft NSIS/MSI releases and a standalone ZIP. See [CONTRIBUTING.md](CONTRIBUTING.md) for change requirements, [SECURITY.md](SECURITY.md) for vulnerability reporting, [docs/compatibility.md](docs/compatibility.md) for the verified matrix, and [docs/bridge-protocol.md](docs/bridge-protocol.md) for the local Unity bridge contract.

The evidence-based capability comparison and ordered roadmap are maintained in [docs/unity-mcp-benchmark.md](docs/unity-mcp-benchmark.md).

## License

MIT. See [LICENSE](LICENSE). External research attribution and licensing notes are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
