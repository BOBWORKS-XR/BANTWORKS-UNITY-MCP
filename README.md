# Banter MCP

A Model Context Protocol (MCP) server for Banter SDK development. Provides Claude with full awareness of your Unity project and tools to create Visual Scripting graphs, WebRoot JavaScript, and more.

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

### 2. Add to Claude Code

```bash
claude mcp add banter --scope user -- node C:/tools/banter-mcp/dist/index.js
```

Set your Unity project path:
```bash
# Windows PowerShell
$env:UNITY_PROJECT_PATH = "E:/unity/MCP_base"
```

Or add to your `.claude.json`:
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

### 3. Install Unity Extension (Optional - for full feedback loop)

Copy the Unity extension to your project:
```
C:/tools/banter-mcp/unity-extension/Editor/BanterMCPBridge.cs
  → YourProject/Assets/Editor/BanterMCPBridge.cs
```

Unity will compile it automatically and start exporting project state.

## Usage

### Resources (Knowledge Claude can read)

| Resource | Description |
|----------|-------------|
| `banter://components` | All 68 Banter components with properties |
| `banter://vs-nodes` | All 164 Visual Scripting nodes |
| `banter://js-api` | Complete BS.* JavaScript API |
| `banter://vs-instructions` | How to create VS graph files |
| `unity://types` | Unity fundamentals (Vector3, Quaternion, etc.) |
| `project://state` | Current scene hierarchy (requires extension) |
| `project://console` | Unity console logs (requires extension) |

### Tools (Actions Claude can take)

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

Claude:
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
│   │   ├── config.ts         # Configuration management
│   │   └── http-server.ts    # HTTP transport (optional)
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

## HTTP Mode (Optional)

For sharing or remote access:

```bash
node dist/index.js --http --port 42067
```

Then configure clients to connect to `http://localhost:42067/mcp`

## Local AI Support

This MCP follows the standard MCP protocol, so it works with any MCP-compatible client, including:
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
