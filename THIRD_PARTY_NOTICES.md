# Third-Party Notices and Research Attribution

## Code and Dependencies

No code from the Unity MCP projects listed below is copied, vendored, or linked into this repository. The hardening changes in this repository were implemented independently against the existing BANTWORKS MCP file-bridge design.

The Node dependency graph is tracked in `package-lock.json`; its direct runtime MCP dependency is `@modelcontextprotocol/sdk`. The release bundle is produced with [esbuild](https://github.com/evanw/esbuild), which is MIT-licensed. Review locked package metadata and licenses when redistributing a bundled build.

The Windows launcher uses [Tauri](https://github.com/tauri-apps/tauri), distributed under Apache-2.0 and MIT terms. GitHub release packaging uses the official [Tauri Action](https://github.com/tauri-apps/tauri-action); the action is CI infrastructure and is not shipped in the application.

## Unity MCP Research

The following MIT-licensed projects were reviewed on 2026-07-14 for public documentation, installation verification, focused-tool design, testing, and client-configuration ideas:

- [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp) - client configuration, focused tool catalogue, security policy, and CI/release documentation patterns.
- [CoderGamester/mcp-unity](https://github.com/CoderGamester/mcp-unity) - multi-client configuration examples and MCP Inspector verification workflow.
- [ozankasikci/unity-editor-mcp](https://github.com/ozankasikci/unity-editor-mcp) - connection-verification and editor automation documentation patterns.

The research informed this repository's `get_bridge_status` tool, connection-verification documentation, CI, security policy, and contribution guidance. These are independently authored changes; no third-party source, assets, or generated data were imported.

## Deliberate Non-Adoptions

Remote WebSocket/HTTP listeners and arbitrary C# execution appear in parts of the broader Unity MCP ecosystem. They are not adopted here because BANTWORKS MCP is intentionally local and project-scoped, and those capabilities need a separate authentication and authorization design.
