# Third-Party Notices and Research Attribution

## Code and Dependencies

No Unity-owned MCP code or relay binaries are copied, vendored, or linked into this repository. The hybrid bridge changes were independently authored against BANTWORKS MCP's existing command contracts and public platform APIs.

The Node dependency graph is tracked in `package-lock.json`; its direct runtime MCP dependency is `@modelcontextprotocol/sdk`. The release bundle is produced with [esbuild](https://github.com/evanw/esbuild), which is MIT-licensed. Review locked package metadata and licenses when redistributing a bundled build.

The Windows launcher bundles the unmodified official Node.js 24.17.0 Windows x64 executable so MCP clients do not require a separate Node.js installation. Node.js is distributed under the MIT license and includes third-party software under the terms recorded in the `LICENSE` file packaged beside the runtime. The release build verifies both the official archive and extracted executable with pinned SHA-256 checksums before packaging.

The Windows launcher uses [Tauri](https://github.com/tauri-apps/tauri), distributed under Apache-2.0 and MIT terms. GitHub release packaging uses the official [Tauri Action](https://github.com/tauri-apps/tauri-action); the action is CI infrastructure and is not shipped in the application.

## Unity MCP Research

The following MIT-licensed projects were reviewed on 2026-07-14 for public documentation, installation verification, focused-tool design, testing, and client-configuration ideas:

- [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp) - client configuration, focused tool catalogue, security policy, and CI/release documentation patterns.
- [CoderGamester/mcp-unity](https://github.com/CoderGamester/mcp-unity) - multi-client configuration examples and MCP Inspector verification workflow.
- [ozankasikci/unity-editor-mcp](https://github.com/ozankasikci/unity-editor-mcp) - connection-verification and editor automation documentation patterns.

The research informed this repository's `get_bridge_status` tool, connection-verification documentation, CI, security policy, and contribution guidance. These are independently authored changes; no third-party source, assets, or generated data were imported.

On 2026-07-29, Unity's official `com.unity.ai.assistant` MCP documentation and package metadata were reviewed for protocol versioning, local relay architecture, explicit Editor targeting, capability discovery, and main-thread Unity API boundaries. The Unity package is distributed under Unity's Terms of Service rather than an open-source licence. BANTWORKS MCP does not redistribute or derive code from that package.

[yecats/unity-mcp-toolkit](https://github.com/yecats/unity-mcp-toolkit), released under CC0 1.0 Universal, was also evaluated for optional settings, Scene View, Input System, Recorder, and domain-refresh tools. No toolkit code is included in version 2.2.0; those tools will be added only where they justify their maintenance and runtime surface.

On 2026-08-24, [AnkleBreaker-Studio/unity-mcp-plugin](https://github.com/AnkleBreaker-Studio/unity-mcp-plugin) was reviewed as a behavioral research reference for Shader Graph workflows and published failure modes. Its custom AnkleBreaker Open License v1.0 requires visible attribution and restricts commercial distribution of the software and derivatives. No source, assets, schemas, or serialized data from that repository were copied into BANTWORKS MCP. The implementation here was independently authored against the installed Unity package APIs and official Unity documentation.

[AlexeyPerov/Unity-Open-MCP](https://github.com/AlexeyPerov/Unity-Open-MCP), released under the MIT license, was also reviewed at commit `961fae1c4f1cb51046397a3fb6c06b522f094689` for extension discovery and fail-closed optional-package ideas. No source was imported. Its public Shader Graph behavior helped define independent negative tests around reflection availability, asset detection, and validation.

Unity's public Shader Graph documentation and locally installed package source were consulted to identify the GraphData, FileUtilities, MultiJson, target, block, node, slot, and importer contracts. Unity package source is governed by the Unity Companion License. No Unity source is redistributed; BANTWORKS calls the user's installed package through a version-checked reflection adapter.

## Deliberate Non-Adoptions

Remote WebSocket/HTTP listeners and arbitrary C# execution appear in parts of the broader Unity MCP ecosystem. They are not adopted here because BANTWORKS MCP is intentionally local and project-scoped, and those capabilities need a separate authentication and authorization design.
