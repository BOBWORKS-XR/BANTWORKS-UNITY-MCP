# Changelog

## 2.1.0 - 2026-07-22

### Added

- Added bounded, explicitly fresh hierarchy/component queries with exact/root/depth/component/field controls and snapshot age plus dirty-scene metadata.
- Added `wait_for_unity_compile` and persistent `compilation-status.json` diagnostics from Unity's compilation pipeline.
- Added guarded `execute_editor_menu_item` support for project-defined custom menu commands with dirty-scene, Play Mode, built-in-menu, compilation, and update preconditions.
- Extended Unity Visual Scripting validation to fail on unresolved units and value inputs that have neither a valid connection nor a persisted default.
- Added Console filters for time, message text, regular expressions, and stack source.

### Fixed

- `get_console_logs({"level":"error"})` now includes Unity `Error`, `Exception`, and `Assert` entries while preserving the original Unity level.
- `check_import_status` no longer reports success over active, stale, or failed script compilation.
- Exact hierarchy queries no longer expand every descendant whose path contains the selected root name.
- Background full-state export is now disabled by default in Edit mode as well as Play mode. A persistent `BANTWORKS MCP/Background State Export In Edit Mode` menu toggle allows explicit opt-in without affecting command polling or manual refreshes.
- Pinned patched `@hono/node-server` and `fast-uri` transitive dependencies after the release audit exposed upstream advisories. Source and standalone installs now require Node 20 or newer; the Windows launcher continues to ship its private Node 24 runtime.

### Verified

- The updated bridge compiled with zero errors in Unity 2022.3.39f1 and Unity 6000.3.2f1.
- Strict Unity deserialization inspected 1,237 value inputs across 11 generated Banter kart graphs with zero missing elements or unbound inputs.
- A live custom menu execution returned correlated timing, clean synchronous diagnostics, unchanged scene state, and a settled Editor result.

## 2.0.1 - 2026-07-17

### Fixed

- Replaced unchanged-scene full hierarchy exports in Edit mode with a lightweight editor-state heartbeat and debounced exports after actual Unity changes.
- Kept automatic full hierarchy export disabled during Play mode by default while preserving command polling and manual refresh/export commands.

### Verified

- Unity 2022.3.39f1 with a 13 MB exported hierarchy: no automatic full hierarchy rewrite during 22-second settled Edit-mode and Play-mode checks.
- Manual full exports and Play-mode control remained operational.
- The installed launcher updated every configured Unity project to the bundled bridge.
