# Tool Groups

Creator Works MCP exposes all tools by default. Set `CREATOR_WORKS_TOOL_GROUPS` in the
MCP server environment to reduce the tool surface for a session. The legacy
`BANTWORKS_TOOL_GROUPS` name remains accepted while existing installations migrate.

Accepted values are `all`, `none`, or a comma-separated combination of:

| Group | Purpose |
|-------|---------|
| `read` | Project inspection, logs, compiler settling/diagnostics, package/asset discovery, screenshots, and validation. It exposes no authoring tools, but Unity validation can force import/refresh and related Editor side effects. |
| `author` | Visual Scripting generation/writes, WebRoot writes, asset refresh, guarded custom Editor menu execution, scene lifecycle, GameObject/component changes, and prefab placement/scanning. |
| `test` | Test discovery/execution/cancellation/status, compile settling, Play Mode control, logs, and screenshots. |
| `banter` | Banter SDK provenance, Visual Scripting generation/validation/writes, SDK allow-list validation, and WebRoot authoring. |
| `shadergraph` | Shader Graph capability checks, structural inspection, transactional creation/mutation, and compiler validation. |

`list_unity_projects`, `select_unity_project`, and `get_bridge_status` remain
available for every selection, including `none`. Groups are unions, so
`read,test` exposes both sets. Direct calls to hidden tools are rejected.

Unknown groups and combinations such as `all,read` or `none,test` stop server
startup with an explicit error. This prevents a misspelled restriction from
silently starting with broader access.

## Launcher Profiles

| Profile | Value |
|---------|-------|
| Full Unity + Banter | `all` |
| Inspection | `read` |
| Banter workflow | `read,author,banter` |
| Unity authoring | `read,author` |
| Testing | `read,test` |
| Minimal routing | `none` |

The Windows launcher and `setup.ps1` write the selected value to both Codex and
Claude configuration. Other MCP clients can set the environment variable
directly. `banter://tool-groups` returns the exact machine-readable membership
from the running server build.

The Banter workflow preset includes `author` because component setup and scene
changes use the generic Unity authoring tools. A narrower `read,banter` custom
selection remains useful for graph/WebRoot work that does not modify scene
objects.
