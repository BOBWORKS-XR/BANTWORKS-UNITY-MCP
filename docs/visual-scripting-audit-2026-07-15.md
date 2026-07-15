# BANTWORKS Visual Scripting Audit - 2026-07-15

## Scope

This follow-up used Unity 2022.3.39f1, Visual Scripting 1.9.4, Banter SDK 3.1.2, the installed Windows launcher, and the clean `E:\unity\BanterLivePreview` proof project. The relay, graph import, SDK allow-list, editor runtime, Node bundle, Rust launcher, and generated installer were checked separately.

## Confirmed Broken And Corrected

1. `validate_vs_graph` rejected `sourceKey: ""` and `destinationKey: ""`. Empty flow-port names are intentional in SDK nodes including `SendOneShot`, `SetSpaceStateProp`, and `LoadGltfUrl`. Validation now rejects only missing or non-string keys.
2. The curated catalogue and generator exposed the nonexistent plural type `Banter.VisualScripting.SetSpaceStateProps`. The canonical type is singular. The old shorthand remains as an input alias but emits `Banter.VisualScripting.SetSpaceStateProp`.
3. Static validation required every event to use `coroutine: false`. Unity requires `coroutine: true` when an event path enters wait units or coroutine-only URL loaders. Generation now infers this through reachable control connections, and validation rejects a false flag on such a path.
4. Networking port metadata was stale. `OnOneShot`, `OnSpaceStatePropsChanged`, `SendOneShot`, and `SetSpaceStateProp` now match the installed 3.1.2 C# definitions, including capitalization and empty flow ports.
5. `LoadGltfUrl` imported and passed the installed SDK validator but produced an unknown-type warning. It is now catalogued, with its SDK obsolete status documented.
6. The bundled manual's blanket Transform-setter warning conflicted with the installed SDK validator. Higher-priority errata now records the observed 3.1.2 behavior and keeps the selected SDK validator authoritative.

## Correct As-Is

- The Windows application is a Tauri configuration launcher. The standard-stdio MCP server is a separate bundled Node resource.
- The Unity bridge is editor-only and communicates through project-local atomic command/state files. It is not Banter runtime code.
- The custom-node capture is useful for exact type names, serialized defaults, event metadata, and source coverage.
- Graph structure validation, Unity deserialization, Banter allow-list validation, and runtime testing remain separate gates.

## Remaining Limits

- `validate_vs_graph_in_unity` proves that elements deserialize, but it does not yet enumerate every resolved input/output port and compare each connection key.
- The captured custom-node asset does not contain complete runtime port declarations. Exact ports can vary by SDK source identity, so installed source and Unity remain authoritative.
- Banter SDK 3.1.2 implements the `LoadTextUrl` POST option with `UnityWebRequest.Put`; this is an upstream behavior, not changed by the MCP.
- `BanterGLTF` logs that it is slow and not recommended for production. The proof project intentionally uses it to test creator-side model replacement.
- The production host is admin-gated. Cross-client Space State and OneShot behavior still requires a real Banter space with an admin and at least one receiving client.

## Verification

- `npm test`: 50 passed, 0 failed.
- Production host graph: 35 nodes, 38 connections, no static errors or warnings.
- Production receiver graph: 41 nodes, 55 connections, no static errors or warnings.
- Unity graph import: zero missing elements for both graphs.
- Banter SDK validator: zero diagnostics.
- Editor probe: relay model and transform endpoints were requested, the sample GLB rendered, and no console errors remained after enabling prototype HTTP.
- `cargo test`: 6 passed, 0 failed.
- Standalone bundle smoke: passed.
- NSIS and MSI builds: completed.
- Installed server bundle SHA-256 matches `release/banter-mcp.mjs`.
- Installed launcher startup smoke: passed.

