# Unity Bridge Protocol

BANTWORKS MCP uses a local, project-scoped file bridge. It does not open an HTTP or WebSocket listener.

## Locations

With `UNITY_PROJECT_PATH` set to a Unity project root, the bridge uses:

| Location | Direction | Purpose |
|----------|-----------|---------|
| `.bantworks-mcp/commands/*.json` | MCP to Unity | Scene, prefab, refresh, and state-export requests |
| `.bantworks-mcp/state/*.json` | Unity to MCP | Hierarchy, editor state, console, import status, and prefab catalogue |
| `.bantworks-mcp/state/command-results/*.json` | Unity to MCP | Per-command acknowledgement or failure |
| `.bantworks-mcp/state/bounds-results/*.json` | Unity to MCP | Per-bounds-query result |

The bridge directory is project-local and ignored by Git through its own `.gitignore` file.

## Publication and Correlation

The MCP server and Unity bridge publish JSON by writing a temporary file in the same directory and renaming it into place. Unity therefore sees a complete command, and the MCP server sees complete exported state.

Each mutating command receives a UUID. Unity writes an acknowledgement under that UUID, and bounds queries use the same UUID for their result file. This prevents one request from consuming a concurrent request's result.

State-export requests also receive unique filenames, so simultaneous `query_project_state` calls do not overwrite each other before Unity reads them.

## Health Check

`get_bridge_status` is read-only. It reports:

- whether `UNITY_PROJECT_PATH` points to a Unity project;
- whether `Assets/Editor/BanterMCPBridge.cs` is installed;
- whether the bridge state and command directories exist;
- which exported state files exist and their age; and
- the next setup step when the bridge is not ready.

`stateStatus: "fresh"` means at least one known state file was updated in the preceding 10 seconds. It is an observation of export freshness, not a guarantee that the Unity Editor will remain available for future commands.

## Security Boundary

The MCP client can invoke actions that write inside the configured Unity project and mutate the active Unity scene. Treat MCP client access as equivalent to trusted local developer access.

The server intentionally has no remote transport and no arbitrary C# execution feature. Adding either would require an explicit authentication, authorization, and threat-model design before it is appropriate for this repository.
