# SideQuest SDK Transition

Creator Works MCP supports the two SideQuest Unity package contracts that can
exist during the Banter-to-Creator SDK transition:

| Profile | Package | Components | Visual Scripting | SDK validator |
|---|---|---|---|---|
| Creator SDK | `com.sidequest.creator-sdk` | `BS.*` | `BS.VisualScripting.*` | `BS.SDKEditor.ValidateVisualScripting` |
| Legacy Banter | `com.sidequest.banter` | `Banter.SDK.*` | `Banter.VisualScripting.*` | `Banter.SDKEditor.ValidateVisualScripting` |

The launcher labels each configured project as **Creator SDK**, **Banter SDK**,
**Hybrid**, **Unity only**, or **SDK unknown**. The MCP reports the same state as
`sdkProfile` from `get_banter_sdk_info`. The tool keeps its legacy name so
existing Codex, Claude Code, and other MCP client configurations continue to
work.

## Authoring Rules

- Creator SDK projects use concrete `BS` types for new components, graph nodes,
  member targets, and variable type handles.
- Legacy Banter projects retain their Banter types.
- Hybrid projects prefer Creator types for new content and preserve existing
  legacy content until it has been audited.
- Projects with no detected SDK may still use generic Unity tools, but the graph
  generator refuses SideQuest-only shorthand rather than guessing a namespace.
- Graph validation and writing enforce the selected package namespace. Hybrid
  projects may preserve both families, with legacy references called out rather
  than silently converted.
- The installed package source and selected SDK validator are authoritative for
  authoring. The hosted target client remains authoritative for runtime support.

Creator SDK packages can contain legacy Banter stubs. A stub that compiles in
the Editor is not proof that the hosted runtime accepts the legacy component.
This distinction was observed in a Greenfield-hosted project where a legacy
attached-object component was dropped while other legacy content still loaded.
Creator Works therefore does not apply a blanket namespace or class-name rename.

## Visual Scripting

`generate_vs_graph` selects the custom-node namespace from the active project.
For a Creator profile, shorthand such as `OnGrab` becomes
`BS.VisualScripting.OnGrab`; for a legacy profile it becomes
`Banter.VisualScripting.OnGrab`. Captured serialized enum types are translated
to their concrete Creator namespaces when a Creator graph is generated.

Use all three validation layers for SideQuest graphs:

1. `validate_vs_graph` checks portable JSON structure, references, required
   fields, event coroutine flags, and known custom-node names.
2. `validate_vs_graph_in_unity` imports the specific graph, defines its units,
   and checks unresolved or unbound value inputs.
3. `validate_banter_visual_scripting` invokes the installed Creator SDK or
   Banter SDK allow-list validator. Its legacy name is retained for compatibility.

These checks are intentionally reported separately. Some SDK validator versions
do not enumerate every nested or additional embedded machine, so an SDK pass is
not a substitute for Creator Works' graph-specific integrity check.

## Guarded Conversion Design

A future SDK Compatibility converter should run inside Unity and use Unity's
serialization and Visual Scripting APIs. Its default operation must be a
read-only audit.

The accepted workflow is:

1. Select a registered Unity project and an asset inside that project's
   `Assets` folder. An orphan `.unity` file is not enough because script GUIDs,
   packages, assemblies, and object references are project-relative.
2. Detect the source and target SDK profiles.
3. Scan components, Script Machines, State Machines, graph unit types, member
   targets, variable type handles, object references, and package dependencies.
4. Classify every finding as **proven mapping**, **runtime unproven**,
   **unsupported**, or **already target-native**.
5. Show a preview with exact assets and changes. Do not mutate on scan.
6. Duplicate approved assets under a dedicated migration folder and preserve
   the originals, metadata, and object references.
7. Apply only explicit versioned mappings through Unity APIs. Never search and
   replace raw scene, prefab, or graph YAML.
8. Reimport, compile, run graph integrity checks, invoke the target SDK
   validator, and compare before/after semantic inventories.
9. Report unsupported and non-reversible entries. Enable reverse conversion
   only for mappings whose two directions are separately proven.
10. Treat hosted Banter/Greenfield execution as the final runtime gate.

The launcher can eventually present this as an **SDK Compatibility** workspace
with source and target selectors. A swap control should only enable directions
supported by the selected mapping set; it must not imply that every Creator SDK
feature has a legacy Banter equivalent.

## Current Boundary

This release adds detection, profile-aware authoring, dual validator discovery,
launcher status, and migration safety guidance. It does not mutate existing
scenes or prefabs. That boundary is intentional until component mappings,
serialized field transfer, graph rewriting, rollback, and hosted runtime checks
have dedicated fixtures.
