# Changelog

## 2.0.1 - 2026-07-17

### Fixed

- Replaced unchanged-scene full hierarchy exports in Edit mode with a lightweight editor-state heartbeat and debounced exports after actual Unity changes.
- Kept automatic full hierarchy export disabled during Play mode by default while preserving command polling and manual refresh/export commands.

### Verified

- Unity 2022.3.39f1 with a 13 MB exported hierarchy: no automatic full hierarchy rewrite during 22-second settled Edit-mode and Play-mode checks.
- Manual full exports and Play-mode control remained operational.
- The installed launcher updated every configured Unity project to the bundled bridge.
