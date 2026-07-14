# Security Policy

## Supported Versions

Security fixes are made on the current `1.4.x` release line.

## Reporting a Vulnerability

Use the repository's private GitHub Security Advisory reporting flow. Do not post proof-of-concept details in a public issue before maintainers have had time to investigate and release a fix.

Include the affected version, platform, reproduction steps, impact, and any mitigation already tested.

## Scope

In scope: the Node MCP server, the Tauri launcher, and `BanterMCPBridge.cs`.

Out of scope: vulnerabilities in a user's game content, Unity project assets, Banter SDK releases, or MCP clients themselves, unless BANTWORKS MCP directly causes the issue.

## Trust Model

MCP clients connected to this server can read project state and request changes inside the configured Unity project. Run the server only with trusted local clients and trusted `UNITY_PROJECT_PATH` values. The project intentionally exposes no HTTP or WebSocket listener and does not execute arbitrary C# supplied by an MCP client.
