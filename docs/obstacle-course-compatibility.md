# Obstacle Course Compatibility Harness

Reviewed: 2026-07-15

The obstacle-course harness is a local, repeatable integration test for the
BANTWORKS server, Unity bridge, Unity physics, Visual Scripting serialization,
and optional Banter SDK integration. It is generic and does not depend on any
existing game project.

## What It Builds

- start and finish platforms, stepping stones, and stairs
- kinematic moving platforms driven from `FixedUpdate` with `MovePosition`
- rotating hazards driven from `FixedUpdate` with `MoveRotation`
- three pivot-parent doors with one deterministic locked door per seed
- paired 45-degree ball ramps and a global trigger volume
- ball respawn that restores world position and rotation and clears velocity
  and angular velocity
- optional visual dressing discovered from a user-supplied `.unitypackage`
- an optional Banter integration scene with two real `BanterSyncedObject`
  components when a pinned SDK revision is supplied

External dressing is visual-only in the harness: imported MonoBehaviours are
disabled, Rigidbodies do not participate in physics, and colliders are disabled.
Purchased or otherwise redistributable-restricted assets remain in the local
fixture project and are never copied into this repository.

## Safety Contract

The provisioner creates a marker named `.bantworks-obstacle-project.json`. It
refuses to modify an existing project without that marker. Updates replace only
the fixture's own `Runtime`, `Editor`, and `Tests` folders after resolving and
checking their paths. Batch editor runs have a bounded timeout; timeout cleanup
is restricted to the exact Unity process tree and project-local Banter link
processes.
The default batch timeout is 300 seconds and can be adjusted from 60 to 3600
seconds with `-UnityTimeoutSeconds`.

## Run It

Without Banter:

```powershell
.\scripts\setup-unity-obstacle-course.ps1 `
  -UnityEditorPath <path-to-Unity.exe> `
  -ProjectPath <new-or-marked-fixture-project> `
  -AssetPackagePath <optional-environment.unitypackage> `
  -RunTests
```

With Banter, add a pinned 40-character public SDK revision:

```powershell
  -BanterRevision <full-git-commit>
```

The run fails unless all applicable checks pass:

1. Unity compiles the fixture and bridge.
2. The course and optional Banter integration scene survive serialized read-back.
3. The MCP generator writes a canonical `ScriptGraphAsset`.
4. The bridge imports the graph with no missing elements.
5. The bridge assigns it to `ScriptMachine.nest.macro`.
6. The assignment survives scene save and reload.
7. Banter's own Visual Scripting allow-list validator passes when installed.
8. Four Play Mode tests pass for respawn, motion reset, moving hazards, and
   deterministic doors/Banter metadata.

Reports are written to the fixture root as
`bantworks-obstacle-course.json` and
`bantworks-obstacle-visual-scripting.json`; Unity test results are written under
`BantworksLogs`.

## Exercised Matrix

| Unity | Visual Scripting | Banter | Graph | Result |
|-------|------------------|--------|-------|--------|
| 6000.3.10f1 | 1.9.9 | None | `Unity.VisualScripting.Start` | bridge import and persistence passed; 4/4 Play Mode tests passed |
| 6000.3.2f1 | 1.9.9 | 3.2.2 at `8cff56ed80a7f694d0de204a4fa7bfc660f6d503` | `Banter.VisualScripting.OnGrab` | bridge import/persistence and SDK allow-list passed; 4/4 Play Mode tests passed |
| 2022.3.39f1 | 1.9.4 | 3.1.2 at `c75593e029cfcb7aecca6a880082f6d5d6853883` | `Banter.VisualScripting.OnGrab` | bridge import/persistence and SDK allow-list passed; 4/4 Play Mode tests passed |

The local runs used ten optional environment prefabs as visual dressing in each
project. The package identity is deliberately not part of the public fixture or
its compatibility claim.

## Remaining Boundary

The harness proves editor compilation, serialization, deterministic local
physics, bridge command transport, graph import, SDK allow-list acceptance, and
persisted Banter components. It does not prove runtime multiplayer replication
inside a hosted Banter space. That remains a separate end-to-end test.
