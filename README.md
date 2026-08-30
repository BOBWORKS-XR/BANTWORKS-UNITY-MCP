# Creator Works MCP

Creator Works MCP connects Codex, Claude Code, and other compatible MCP clients directly to Unity Editor. It provides guarded project awareness and tools for scenes, prefabs, components, assets, tests, native Unity Visual Scripting, SideQuest SDK workflows, and experimental Shader Graph authoring.

[Download Creator Works MCP 2.4.0-3](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/releases/tag/v2.4.0-3) | [Preview source](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/tree/feature/dual-sidequest-sdk) | [All releases](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/releases)

![Creator Works MCP configured Windows launcher](docs/images/creator-works-mcp-guided-launcher.png)

*The launcher shows the private runtime, connected MCP clients, active Unity project, detected Creator SDK/Banter SDK/Unity-only profiles, and each project's bridge status. Amber **Update available** labels mean the project-local bridge should be refreshed; they are not SDK compile or runtime results.*

## Highlights

- **Guided Windows setup:** bundles a private Node.js 24 LTS runtime and configures Codex and Claude Code without requiring a separate Node installation
- **Multi-project Unity workflow:** discovers Unity Hub projects, remembers the active project, routes MCP calls explicitly, and updates project-local bridges with backups
- **Creator and Banter SDK awareness:** identifies Creator SDK, legacy Banter SDK, hybrid, Unity-only, and unknown projects, then selects the appropriate `BS.*` or `Banter.*` contracts
- **Unity scene and asset tooling:** creates and modifies GameObjects, components, references, prefabs, scenes, build settings, and batches with preflight checks and Unity Undo support
- **Native Visual Scripting:** generates, validates, writes, imports, and checks Unity Visual Scripting graphs using a source-observed custom-node catalogue and SDK validator
- **Experimental Shader Graph tooling:** inspects real nodes, slots, and targets, uses content hashes for concurrency, protects occupied inputs, and verifies rollback after failed writes
- **Testing and diagnostics:** exposes compiler status, filtered Console logs, Unity Test Framework runs, screenshots, import status, package metadata, and bounded hierarchy queries
- **Low-overhead local bridge:** keeps command polling responsive without repeatedly serializing an unchanged scene hierarchy

## Quick Start

1. Download `Creator.Works.MCP_2.4.0-3_x64-setup.exe` from the [2.4.0-3 preview release](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/releases/tag/v2.4.0-3).
2. Open **Creator Works MCP** and choose a Unity project.
3. Select the MCP clients you want to configure.
4. Press **Set Up Creator Works MCP**.
5. Use **Update Bridges** for projects marked **Update available**.
6. Restart any MCP client that was already open, then call `get_bridge_status`.

A ready bridge reports `ready: true` and `stateStatus: "fresh"`. The launcher can import existing project and client settings from an earlier installation; verify the imported projects and update their bridges before removing the previous Windows application.

The Windows installers are currently unsigned, so Microsoft Defender SmartScreen can display an Unknown publisher warning. Verify downloads against the included `SHA256SUMS.txt`.

## SDK Profiles

Creator Works MCP treats SDK detection as project metadata, not proof that the project compiles or runs:

| Profile | New authoring contract | Validator |
|---|---|---|
| Creator SDK | `BS.*` and `BS.VisualScripting.*` | `BS.SDKEditor.ValidateVisualScripting` |
| Banter SDK | `Banter.SDK.*` and `Banter.VisualScripting.*` | Banter SDK validator |
| Hybrid | Creator contract for new work, legacy content preserved | Profile-aware |
| Unity only | Unity built-ins only | No SideQuest SDK claim |
| Unknown | Inspection only until package identity is resolved | No inferred claim |

The MCP contains source-checked knowledge of Banter components and 163 represented custom Visual Scripting node types. It also understands the Creator SDK namespace transition and refuses SideQuest-only shorthand when no matching SDK is detected.

## Visual Scripting

The Visual Scripting workflow is closed-loop:

1. Detect the selected project's SDK profile.
2. Generate a graph with profile-correct units and types.
3. Validate graph structure and required value inputs.
4. Write the native `.asset` while preserving an existing GUID.
5. Force Unity to import and deserialize the graph.
6. Run the installed SideQuest SDK validator when available.
7. Exercise the behavior in the target Unity and hosted client.

The bundled reference includes the Unity Visual Scripting JSON manual v2.2, source-observed compatibility corrections, and an extracted custom-node catalogue with serialized defaults and provenance.

## Bridge Performance

Automatic full-scene state export is disabled by default in both Edit and Play mode. The bridge keeps lightweight status and command polling active, while explicit **Creator Works MCP > Refresh State** and `export-state` requests still produce a full snapshot when needed.

Targeted hierarchy queries serialize only the requested subtree or matching components. Unity object traversal remains on Unity's main thread; the bridge does not use background threads to access Unity objects.

## MCP Clients

The Windows launcher configures Codex and Claude Code directly. Any stdio-compatible MCP client can launch the standalone bundle:

```toml
[mcp_servers.creator-works]
command = "node"
args = ["C:/path/to/Creator-Works-MCP/creator-works-mcp.mjs"]
startup_timeout_sec = 20
tool_timeout_sec = 600

[mcp_servers.creator-works.env]
UNITY_PROJECT_PATH = "E:/unity/MyProject"
CREATOR_WORKS_TOOL_GROUPS = "all"
```

The standalone ZIP requires Node.js 20 or newer. The Windows setup executable and MSI include the private runtime.

Tool profiles can expose `read`, `author`, `test`, `banter`, `shadergraph`, a comma-separated combination, `all`, or `none` for routing and health only.

## Manual Bridge Installation

The launcher installs the bridge automatically. For a manual setup, download the [2.4.0-3 bridge script](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/blob/v2.4.0-3/unity-extension/Editor/BanterMCPBridge.cs) and [matching logo asset](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/blob/v2.4.0-3/unity-extension/Editor/CreatorWorksMCPLogo.png), then copy both files:

```text
BanterMCPBridge.cs
  -> YourProject/Assets/Editor/BanterMCPBridge.cs
CreatorWorksMCPLogo.png
  -> YourProject/Assets/Editor/CreatorWorksMCPLogo.png
```

After Unity compiles, call `get_bridge_status`. Scene-changing tools require an explicit acknowledgement from the selected Unity Editor and fail closed on stale or ambiguous object selectors.

## Preview Status

The `2.4.0-3` release gate passed:

- 119 Node tests
- 13 native launcher tests
- Node 20, 22, and 24 CI
- Windows launcher packaging and standalone installation smoke tests
- zero C# errors for the exact bridge in isolated Unity 2022.3.39f1 and Unity 6000.3.21f1 projects
- checksum verification after downloading the published release assets

Shader Graph mutation remains experimental. Hosted Creator/Greenfield behavior, headset behavior, multiplayer behavior, and project-specific gameplay remain separate runtime acceptance gates.

## AI-Generated Unity Examples

These project screenshots show scene hierarchy construction, configured Banter components, object references, and native Unity Visual Scripting graphs created through an AI client using Creator Works MCP.

![AI-generated portal scene and Visual Scripting graph](docs/images/ai-generated-banter-portal-graph.png)

*Generated portal scene, component setup, graph variables, and portal-state logic.*

![AI-generated portal-placement interaction](docs/images/ai-generated-banter-portal-placement.png)

*Generated portal-placement interaction with held events, object references, and native Visual Scripting logic.*

## Documentation

- [Bridge protocol](docs/bridge-protocol.md)
- [Compatibility matrix](docs/compatibility.md)
- [Tool groups](docs/tool-groups.md)
- [Banter custom Visual Scripting nodes](docs/banter-custom-visual-scripting-nodes.md)
- [SideQuest workflows](docs/banter-workflows.md)
- [Unity MCP benchmark](docs/unity-mcp-benchmark.md)
- [Creator/Banter SDK transition](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/blob/feature/dual-sidequest-sdk/docs/sidequest-sdk-transition.md)
- [Shader Graph experiment](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/blob/feature/dual-sidequest-sdk/docs/shader-graph-experiment.md)

## Legacy Release

Looking for the former **BANTWORKS MCP** name or old launcher layout? [Open the preserved v2.3.0 README](https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP/tree/v2.3.0#readme), from before the project became Creator Works MCP.

## Development

```powershell
git clone https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP.git
Set-Location CREATOR-WORKS-UNITY-MCP
git switch feature/dual-sidequest-sdk
npm ci
npm test
Set-Location launcher/src-tauri
cargo test
```

```bash
# Linux / macOS
git clone https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP.git
cd CREATOR-WORKS-UNITY-MCP
git switch feature/dual-sidequest-sdk
npm ci
npm test
(cd launcher/src-tauri && cargo test)
```

The Tauri launcher builds on Windows (NSIS/MSI), Linux (`.deb`/`.rpm`), and macOS (DMG). See [BUILD_TAURI.md](BUILD_TAURI.md) for host-specific toolchain setup. The setup CLI (`./setup.sh` on Linux/macOS, `setup.ps1` on Windows) configures Codex and Claude Code without the GUI.

See [CONTRIBUTING.md](CONTRIBUTING.md) for change requirements and [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

MIT. See [LICENSE](LICENSE). External research attribution and licensing notes are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
