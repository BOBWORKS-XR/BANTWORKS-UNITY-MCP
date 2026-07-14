# Unity Bridge Protocol

BANTWORKS MCP uses a local, project-scoped file bridge. It does not open an HTTP or WebSocket listener.

## Locations

With a Unity project selected from `UNITY_PROJECT_PATH` or session routing, the bridge uses:

| Location | Direction | Purpose |
|----------|-----------|---------|
| `.bantworks-mcp/commands/*.json` | MCP to Unity | Scene, prefab, refresh, and state-export requests |
| `.bantworks-mcp/state/*.json` | Unity to MCP | Hierarchy, editor state, console, import status, and prefab catalogue |
| `.bantworks-mcp/state/project-instance.json` | Unity to MCP | Live editor process identity and heartbeat |
| `.bantworks-mcp/state/command-results/*.json` | Unity to MCP | Per-command acknowledgement or failure |
| `.bantworks-mcp/state/bounds-results/*.json` | Unity to MCP | Per-bounds-query result |
| `.bantworks-mcp/state/screenshot-results/*.png` | Unity to MCP | Correlated Game or Scene View captures |
| `.bantworks-mcp/state/asset-search-results/*.json` | Unity to MCP | Correlated AssetDatabase query results |
| `.bantworks-mcp/state/test-discovery/*.json` | Unity to MCP | Correlated, bounded Test Runner discovery results |
| `.bantworks-mcp/state/test-runs/*.json` | Unity to MCP | Persisted Test Runner state and bounded case results |
| `.bantworks-mcp/state/scene-results/*.json` | Unity to MCP | Correlated open-scene and build-settings results |

The bridge directory is project-local and ignored by Git through its own `.gitignore` file.

## Publication and Correlation

The MCP server and Unity bridge publish JSON by writing a temporary file in the same directory and renaming it into place. Unity therefore sees a complete command, and the MCP server sees complete exported state.

Each mutating command receives a UUID. Unity writes an acknowledgement under that UUID, and bounds queries use the same UUID for their result file. This prevents one request from consuming a concurrent request's result.

State-export requests also receive unique filenames, so simultaneous `query_project_state` calls do not overwrite each other before Unity reads them.

## Project Routing

`list_unity_projects` combines the initial `UNITY_PROJECT_PATH` with enabled or
disabled launcher channels, deduplicates canonical project paths, and assigns a
stable `unity-<hash>` route ID derived from each canonical path. It reports
project validity, bridge installation, state freshness, launcher metadata, and
the live editor identity when available.

`select_unity_project` changes only the current MCP server session. It does not
rewrite launcher, Codex, or Claude configuration. Every request receives an
immutable snapshot of the selected project paths, so a concurrent route change
cannot redirect an in-flight command or result poll.

The Unity bridge updates `project-instance.json` with process ID, process start,
Unity version, and a process-stable editor instance ID. That ID survives script
and Play Mode domain reloads but changes when the Unity editor process restarts.

## Stable Object Identity

Every GameObject and component in `scene-hierarchy.json` includes a Unity
`globalObjectId`. Scene and component tools prefer these identifiers while
retaining hierarchy paths for readability and compatibility with older clients.

| Target | Preferred field | Compatibility field |
|--------|-----------------|---------------------|
| GameObject | `objectId` | `objectPath` |
| Parent GameObject | `parentId` | `parentPath` |
| Component | `componentId` | `componentType` |
| Referenced GameObject | `targetId` | `targetPath` |

When both an ID and path are present, the bridge resolves the ID. It verifies
that GameObjects belong to the active scene and that component IDs belong to the
selected GameObject. A stale ID, mismatched component ID, ambiguous component
type, or duplicate hierarchy path fails without mutating the scene.

Global object IDs remain stable across hierarchy renames and reparenting, but an
ID can become stale when its object is deleted and recreated. Read fresh
`project://state` or call `query_project_state` before a sequence of mutations.

## Typed Inspector Values

`set_component_property` accepts a JSON value rather than requiring callers to
encode everything as a string. Supported shapes are:

| Unity property | JSON value |
|----------------|------------|
| Boolean | `true` |
| Integer, LayerMask | `3` |
| Float | `2.5` |
| String | `"hello"` |
| Vector2, Vector3, Vector4 | `[1, 2]`, `[1, 2, 3]`, `[1, 2, 3, 4]` |
| Vector2Int, Vector3Int | integer arrays of length 2 or 3 |
| Quaternion, Color | four-number arrays in `x,y,z,w` or `r,g,b,a` order |
| Enum | enum name, display name, or zero-based index |
| Rect | `[x, y, width, height]` or `{ "x": 0, "y": 0, "width": 1, "height": 1 }` |
| Bounds | `{ "center": [0, 0, 0], "size": [1, 1, 1] }` |

Object references use `set_object_reference`, not
`set_component_property`. Unsupported serialized property types return an
explicit command failure.

The MCP server sends both `valueJson` for current bridges and a legacy `value`
string. Bridges also continue to accept commands that contain only the legacy
field.

## Batch Transactions

Batch commands are fully parsed and preflighted before the first scene change.
Preflight validates command types, object selectors, prefab assets, primitive
types, transform array lengths and finite values, parent dependencies, and
duplicate output paths.

The bridge applies a batch inside one Unity Undo group. The default
`continueOnError: false` behavior reverts that group when any operation fails,
then returns a failed command acknowledgement. Successful batches remain one
normal Undo action in the Unity Editor.

`continueOnError: true` is an explicit opt-in for partial progress. In that
mode, successful operations remain applied and the acknowledgement still reports
the failed operations. Use it only when operations are independent.

## Editor Workflows

`control_play_mode` supports `play`, `pause`, `resume`, and `stop`. The MCP
server does not treat the command acknowledgement as the final state. It polls
`editor-state.json` until Unity reaches the requested state and compilation has
finished, including after a Play Mode domain reload.

`capture_unity_screenshot` renders either an active game Camera or the current
Scene View camera into a bounded RenderTexture. The PNG is published under the
command UUID and returned to the client as an MCP image block. Callers cannot
choose an arbitrary filesystem destination. The bridge retains only the 20 most
recent screenshot files.

`search_unity_assets` uses `AssetDatabase.FindAssets` and publishes a correlated
JSON result containing GUIDs, paths, names, and main asset types. Searches are
bounded to 500 results and default to the `Assets` tree; package search requires
an explicit option. `get_unity_packages` is read-only and parses the project's
package manifest, lock file, and Unity version without requiring a running Editor.

## Unity Test Runner

The test tools use the optional `com.unity.test-framework` package through
reflection, so projects without that package still compile the bridge.
`discover_unity_tests` returns bounded leaf test cases with exact full and unique
names, assemblies, categories, modes, and run states. `run_unity_tests` supports
Edit Mode, Play Mode, exact test names, regex group names, categories, and
assembly filters. The Editor must be out of Play Mode and finished
compiling/importing before discovery or execution starts.

The bridge writes each run to `state/test-runs/<runId>.json`, updates the file as
individual cases finish, and re-registers its callback after a Play Mode domain
reload. A call may stop waiting while the Unity job continues; use
`get_unity_test_run` with the returned run ID. Per-case retention is bounded, old
runs are pruned, and a zero-test run reports `noTests: true` and
`testsPassed: false` rather than silently passing.

`cancel_unity_test_run` is exposed only through the Test Framework's public
`CancelTestRun` contract, available in package 1.6 and newer. Older packages
return an explicit unsupported-capability error. A cancellation may trigger a
Play Mode domain reload after the terminal callback. In that case the bridge
marks cleanup complete only after the accepted cancellation is at least two
seconds old, the Editor has left Play Mode, and the framework reports no active
test job. The persisted result remains `testsPassed: false` and identifies
`completionSource` as either `run_finished` or
`cancellation_cleanup_observed`.

## Scene Lifecycle and Build Settings

`get_unity_scenes` returns every open scene plus the complete ordered
`EditorBuildSettings.scenes` list. Results include active and dirty state, scene
handles, asset GUIDs, build indices, and enabled flags.

`save_unity_scene` saves the active scene or an identified open scene without an
Editor dialog. Save As paths must remain under an existing `Assets/` folder, and
an existing different scene is protected unless `overwrite=true`.

`open_unity_scene` accepts Single or Additive mode. A Single-mode load fails if
it would discard dirty scenes. `saveModifiedScenes=true` saves scenes that already
have asset paths first; untitled scenes still require an explicit Save As.

`set_unity_build_scenes` replaces the ordered build list. The bridge validates
the entire bounded list, rejects duplicates and missing scene assets, and leaves
the previous build settings untouched when preflight fails.

## Health Check

`get_bridge_status` is read-only. It reports:

- whether the currently selected route points to a Unity project;
- whether `Assets/Editor/BanterMCPBridge.cs` is installed;
- whether the bridge state and command directories exist;
- which exported state files exist and their age; and
- the next setup step when the bridge is not ready.

`stateStatus: "fresh"` means at least one known state file was updated in the preceding 10 seconds. It is an observation of export freshness, not a guarantee that the Unity Editor will remain available for future commands.

## Security Boundary

The MCP client can invoke actions that write inside the configured Unity project and mutate the active Unity scene. Treat MCP client access as equivalent to trusted local developer access.

The server intentionally has no remote transport and no arbitrary C# execution feature. Adding either would require an explicit authentication, authorization, and threat-model design before it is appropriate for this repository.
