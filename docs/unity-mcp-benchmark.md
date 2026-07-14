# Unity MCP Benchmark and Roadmap

Reviewed: 2026-07-14

This benchmark is used to choose engineering work, not to make an unsupported
"best Unity MCP" claim. BANTWORKS MCP should lead on deterministic local Unity
automation and Banter knowledge while matching the strongest general Unity MCP
workflows where they fit its security model.

## Scope

BANTWORKS MCP is:

- a generic Unity Editor MCP with Banter as a deeper specialization;
- local-first and project-scoped;
- compatible with Codex, Claude Code, and other stdio MCP clients; and
- designed around explicit command correlation, atomic file publication, and
  inspectable project-local state.

It is not a repository for project-specific gameplay logic, an unauthenticated
remote-control server, or an arbitrary C# execution endpoint.

## External Benchmarks

| Project | Useful strengths | Decision for BANTWORKS |
|---------|------------------|------------------------|
| [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp) | Mature releases, focused tool groups, tests, screenshots, package/script workflows, and documented multi-instance routing | Use as the maturity and workflow benchmark. Reimplement selected ideas against the local file bridge; do not copy source or add HTTP by default. |
| [CoderGamester/mcp-unity](https://github.com/CoderGamester/mcp-unity) | Project-local client configuration, detailed resources, Unity Test Runner access, package operations, and batch rollback options | Adopt portable project configuration, test discovery/execution, and preflight/rollback concepts after the core identity contract is stable. |
| [ozankasikci/unity-editor-mcp](https://github.com/ozankasikci/unity-editor-mcp) | Broad scene/prefab analysis, Play Mode control, screenshots, references, and editor diagnostics | Use as a coverage checklist. Avoid copying a large tool count without focused schemas and verification. |

All three repositories identify as MIT-licensed. No code, assets, or generated
data from them is included here. See `THIRD_PARTY_NOTICES.md`.

## Current BANTWORKS Position

Strong today:

- deterministic project-local transport with no listening network socket;
- atomic command/state publication and per-command acknowledgement;
- stable Unity global IDs for GameObjects and components with path fallback;
- typed, validated inspector writes with legacy command compatibility;
- domain-reload-aware Play Mode control and correlated PNG capture;
- bounded Test Runner discovery plus filtered Edit Mode and Play Mode execution,
  persisted results, and version-aware cancellation;
- fail-closed scene save/load workflows and preflighted build settings;
- session-local multi-project routing with live editor instance identity;
- read-only package inventory and bounded AssetDatabase search;
- Codex and Claude Code launcher configuration;
- focused scene, component, prefab, bounds, console, and import tools;
- read-only bridge health diagnostics;
- Banter component, JavaScript, and Visual Scripting resources; and
- captured Banter custom-node defaults, source hashes, selected-package
  provenance/coverage, and fail-closed graph generation, validation, and writes.

Gaps that block a leadership claim:

- Banter graph output lacks a committed Unity import/open fixture suite; and
- Unity-side smoke testing is not yet automated in CI.

Compatibility limit: Test Framework 1.1 supports discovery and execution but
does not expose public cancellation. BANTWORKS fails with a capability error
instead of modifying internal runner state. Test Framework 1.6 and newer uses
its public cancellation API.

## Ordered Delivery

### P0 - Reliability Contract

1. **Complete:** export Unity `GlobalObjectId` values for GameObjects and components.
2. **Complete:** accept stable IDs on scene/component mutations while retaining
   paths for readability and backward compatibility.
3. **Complete:** replace string-only property writes with typed JSON values and
   explicit per-`SerializedPropertyType` validation.
4. **Complete:** preflight batches and roll back their Unity Undo group on
   failure unless partial progress is explicitly requested.

### P1 - General Unity Workflows

1. **Complete:** Play, pause, resume, stop, compilation, and domain-reload-aware readiness.
2. **Complete:** bounded Test Runner discovery, filtered execution, reload
   recovery, persisted progress/results, status polling, and public-API
   cancellation when supported by the installed package.
3. **Complete:** Game camera and Scene View screenshots with correlated result files and MCP image output.
4. **Complete:** AssetDatabase search, package inventory, scene save/load, and
   ordered build settings with full preflight.
5. **Complete:** stable path-derived project IDs, process-stable editor instance
   heartbeats, and explicit per-session routing with per-request config snapshots.

### P1 - Banter Advantage

1. **Complete:** record catalogue source hashes and observed SDK source profiles,
   then dynamically compare the selected package version/revision and source
   classes through `get_banter_sdk_info`.
2. **Complete (server-side):** maintain known-good Visual Scripting graph
   fixtures for canonical generation, Unity 1.9 serialization compatibility,
   referential integrity, native metadata, and old-MCP metadata migration.
3. Import, open, and validate fixtures in Unity during release testing.
4. Surface Banter build validation errors as structured MCP diagnostics.
5. Add focused Banter workflows for synced objects, interaction, UI, audio,
   networking, and WebRoot behavior.

### P2 - Distribution and Scale

1. Versioned launcher/server bundles without machine-specific source paths.
2. Project-local client configuration option and migration tooling.
3. Tool groups so clients can expose only the capabilities needed for a task.
4. Compatibility matrix across supported Unity, Banter SDK, Node, and clients.

## Release Gate

A feature is complete only when it has:

- a narrow schema and documented failure behavior;
- automated server-side tests;
- a Unity compile/import test where Unity behavior is involved;
- no project-specific assumptions;
- path, identity, and concurrency review;
- security and license review; and
- updated user-facing documentation.
