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
- filtered Edit Mode and Play Mode Test Runner execution with persisted results;
- read-only package inventory and bounded AssetDatabase search;
- Codex and Claude Code launcher configuration;
- focused scene, component, prefab, bounds, console, and import tools;
- read-only bridge health diagnostics;
- Banter component, JavaScript, and Visual Scripting resources; and
- captured Banter custom-node defaults plus graph generation and validation.

Gaps that block a leadership claim:

- no first-class Test Runner discovery tree or cancellation workflow;
- no session-level routing across multiple open Unity projects;
- Banter graph output lacks a committed Unity import/open fixture suite; and
- Unity-side smoke testing is still manual.

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
2. **Partial:** filtered Unity Test Runner execution, reload recovery, bounded
   case results, and status polling are complete; discovery and cancellation remain.
3. **Complete:** Game camera and Scene View screenshots with correlated result files and MCP image output.
4. **Partial:** AssetDatabase search and package inventory are complete; scene
   save/load and build settings remain.
5. **Pending:** stable project instance IDs and explicit per-session routing.

### P1 - Banter Advantage

1. Version the Banter node/component catalogue by SDK version.
2. Maintain known-good Visual Scripting graph fixtures.
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
