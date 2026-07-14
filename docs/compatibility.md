# Compatibility Matrix

Reviewed: 2026-07-14

This matrix records exercised combinations, not assumptions based only on
package metadata. A row marked "manual" was run in a disposable local project,
an "automated local" row has a committed repeatable fixture, and CI rows are
enforced by the repository workflow.

## MCP Server and Clients

| Surface | Status | Verification |
|---------|--------|--------------|
| Node.js 18, 20, 22, 24 | CI target | TypeScript build, 43 server tests, standalone esbuild bundle, and isolated no-`node_modules` smoke |
| Codex desktop/CLI | Supported configuration | Launcher and `setup.ps1` write stdio configuration, project environment, 20-second startup timeout, and 600-second tool timeout |
| Claude Code/Desktop | Supported configuration | Launcher and `setup.ps1` write the same stdio server and selected project environment |
| Other MCP clients | Protocol-compatible | Requires stdio MCP support and a way to set `UNITY_PROJECT_PATH`; no client-specific integration is assumed |

The server intentionally rejects `--http`. It does not open a network listener.
Tool-surface restriction is client-independent through `BANTWORKS_TOOL_GROUPS`;
the default remains `all` for backward compatibility.

## Unity and Banter

| Unity | Visual Scripting | Banter SDK | Result |
|-------|------------------|------------|--------|
| 2022.3.39f1 | 1.9.4 | None | Manual: bridge compiled; canonical Start graph imported and deserialized with no missing elements |
| 6000.3.2f1 | 1.9.9 | 3.2.2, source fingerprint `c893607975bb44f319445b533b421d184f6a5285` | Manual: bridge and SDK compiled; generated `Banter.VisualScripting.OnGrab` graph imported with one node and no missing elements; SDK validator passed |
| 6000.3.2f1 | 1.9.9 | Same as above | Manual negative fixture: a forbidden custom unit imported, and the SDK validator returned the expected failure and exact forbidden type |
| 6000.3.2f1 | 1.9.9 | Public Git package 3.2.1 at `44e873c3dea26a2d4e12bd2f837d614da926c54f` | Automated local disposable fixture: BANTWORKS generated `OnGrab`; bridge import validation passed; `ScriptMachine` assignment survived scene reload; SDK allow-list positive, forbidden-unit negative, and recovery checks passed |
| 6000.3.10f1 | 1.9.9 | None | Automated local disposable fixture: bridge compiled; path/GUID assignment, clear, type mismatch, incompatible type, traversal, and non-reference rejection passed; a real `ScriptGraphAsset` attached to and cleared from `ScriptMachine.nest.macro` |

The observed Banter 3.2.2 package declares Unity 2022.3.39f1 metadata, but its
source references Unity 6 `PhysicsMaterial` and `PhysicsMaterialCombine` types.
A clean Unity 2022.3.39f1 compile therefore failed. The package compiled in
Unity 6000.3.2f1 after its declared test dependency was present. Treat the
package source and a clean compile as authoritative; do not infer compatibility
from the semantic version or package metadata alone.

The pinned public Banter 3.2.1 package imports NUnit from runtime code but does
not declare `com.unity.test-framework`. The repeatable fixture adds Test
Framework 1.1.33 explicitly so this upstream package requirement is visible and
reproducible rather than supplied accidentally by an existing project.

`get_banter_sdk_info` reports the selected package source identity and compares
its classes with the embedded catalogues. `validate_vs_graph_in_unity` checks
actual import/deserialization, and `validate_banter_visual_scripting` invokes
the installed SDK's public allow-list validator. These checks should be run in
the target project before treating a generated graph as ready.

## Unity Test Framework

| Package capability | Behavior |
|--------------------|----------|
| Test Framework 1.1-era API | Discovery and execution are supported; cancellation returns an explicit capability error |
| Test Framework 1.6+ public API | Discovery, execution, persisted results, polling, and cancellation are supported |

Play Mode domain reloads are expected. Run IDs and result files are persisted
under the project's `.bantworks-mcp` state so a client can resume polling.

## Windows Distribution

- The standalone server is one versioned ESM file and was smoke-tested from an
  isolated directory without `node_modules`.
- The Tauri NSIS build completed locally and included the server bundle, Unity
  bridge, license, and third-party notices as application resources.
- MSI and NSIS are release workflow targets. They are unsigned unless release
  signing secrets and certificate settings are supplied.
- Tagged draft releases include SHA-256 checksums for the standalone archive
  and generated Windows installers.

## Remaining Coverage

- The Unity fixtures are repeatable locally but are not yet automated on
  GitHub-hosted runners with a licensed Unity Editor.
- The launcher configuration writers have unit coverage, but client startup is
  not exercised end to end in CI.
- Banter runtime behavior still requires testing inside the target scene; graph
  import and allow-list validation do not prove multiplayer or runtime behavior.
