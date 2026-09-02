# Contributing to Creator Works MCP

## Feedback Before Code

You do not need to write code to contribute. Use the public process in
[FEEDBACK.md](FEEDBACK.md) to report friction, misleading behavior, missing
capabilities, and improvement ideas. A structured feedback issue gives the
maintainer enough context to classify the evidence and check feasibility.

When proposing code, open a draft pull request and link its feedback or bug
issue. Keep it in Draft until focused verification is complete.

## Local Checks

Node.js 20 or later is required. Run these checks before opening a pull request:

```powershell
npm ci
npm test
cd launcher/src-tauri
cargo check
```

Changes to `BanterMCPBridge.cs` should also be compiled by Unity in a representative project before release. Include the Unity version, Banter SDK version, and the observed Console result in the pull request.

For Banter graph, bridge, or release-compatibility changes, run the focused
fixture while iterating and the full expectation-based matrix before release:

```powershell
./scripts/smoke-unity-banter-vs.ps1
./scripts/smoke-unity-banter-matrix.ps1
```

The matrix passes when every pinned release matches its documented outcome;
that can include an exact known package-compilation incompatibility.

## Change Scope

- Keep the MCP bridge generic. Do not add project-specific gameplay or scene content.
- Add or update a focused test when TypeScript behavior changes.
- Preserve atomic writes and request/result correlation for every new bridge command.
- Do not add remote listeners, arbitrary C# execution, or broad filesystem writes without a documented security design and maintainer approval.
- Update README and protocol documentation when a tool, resource, configuration file, or supported client changes.

## Pull Requests

Describe the user-visible behavior, verification performed, and remaining Unity-side test gap. Use the pull request checklist, link the motivating issue, and distinguish source/build proof from runtime acceptance. Do not include generated Unity `Library`, `.bantworks-mcp`, or personal client configuration files.
