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

- **Banter SDK Knowledge**: Complete reference for all 68 components, 164 VS nodes, and JavaScript API
- **Visual Scripting Generation**: Create and validate VS graph `.asset` files
- **WebRoot JS Generation**: Write JavaScript for built Banter scenes
- **Unity Integration**: Query project state, check import status, refresh assets
- **Closed-Loop Workflow**: Validate → Write → Verify

## Quick Start

### 1. Install Dependencies

```bash
cd C:/tools/banter-mcp
npm install
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

## Usage

### Resources (Knowledge available to MCP clients)

| Resource | Description |
|----------|-------------|
| `banter://components` | All 68 Banter components with properties |
| `banter://vs-nodes` | All 164 Visual Scripting nodes |
| `banter://js-api` | Complete BS.* JavaScript API |
| `banter://vs-instructions` | How to create VS graph files |
| `unity://types` | Unity fundamentals (Vector3, Quaternion, etc.) |
| `project://state` | Current scene hierarchy (requires extension) |
| `project://console` | Unity console logs (requires extension) |

### Tools (Actions available to MCP clients)

| Tool | Description |
|------|-------------|
| `validate_vs_graph` | Validate VS graph JSON before writing |
| `generate_vs_graph` | Generate VS graph from specifications |
| `write_vs_graph` | Write validated graph to Unity project |
| `write_webroot_js` | Write JavaScript to WebRoot folder |
| `query_project_state` | Query scene hierarchy, components, assets |
| `check_import_status` | Verify Unity imported assets correctly |
| `get_console_logs` | Read Unity console output |
| `refresh_unity_assets` | Trigger Unity to reimport assets |

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
│   │   └── config.ts         # Configuration management
│   ├── resources/            # Static knowledge
│   │   ├── banter-components.ts
│   │   ├── banter-vs-nodes.ts
│   │   ├── banter-js-api.ts
│   │   ├── unity-types.ts
│   │   └── vs-graph-instructions.ts
│   ├── tools/                # MCP tools
│   │   ├── validate-vs-graph.ts
│   │   ├── generate-vs-graph.ts
│   │   ├── write-vs-graph.ts
│   │   ├── write-webroot-js.ts
│   │   ├── query-project.ts
│   │   └── check-import-status.ts
│   └── prompts/              # Guided workflows
│       └── index.ts
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

For local LLMs (Ollama, llama.cpp), use an MCP bridge like:
- [ollama-mcp-server](https://github.com/example/ollama-mcp)
- [llama-cpp-mcp-bridge](https://github.com/example/llama-mcp)

## Troubleshooting

### "UNITY_PROJECT_PATH not set"
Set the environment variable to your Unity project root:
```bash
export UNITY_PROJECT_PATH="/path/to/your/unity/project"
```

### "Unity extension not detected"
1. Copy BanterMCPBridge.cs to Assets/Editor/
2. Open Unity and let it compile
3. Check Console for "[BanterMCP] Bridge initialized"

### VS Graph validation errors
Common fixes:
- Use `Banter.VisualScripting.OnGrab`, not `Banter.VisualScripting.Events.OnGrab`
- Add `coroutine: false` to event nodes
- Generate real GUIDs, not patterns
- Use `InvokeMember` for GetComponent, not a GetComponent node

## License

MIT
