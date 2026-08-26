# Shader Graph Experiment

Shader Graph support is available in the `preview/creator-works-shader-aline` preview branch while its compatibility matrix and mutation-safety review continue. It adds focused authoring without making Shader Graph a required Unity package.

## Safe Workflow

1. Call `get_shader_graph_capabilities`. Stop if the installed package API is unsupported.
2. Call `inspect_shader_graph` for existing assets. Use its exact node IDs, slot IDs, target data, diagnostics, and `contentHash`.
3. Pass that `contentHash` as `expectedContentHash` to `add_shader_graph_node` or `connect_shader_graph_nodes`.
4. Inspect again after each mutation and use the new hash for the next mutation.
5. Finish with `validate_shader_graph` and exercise the material in the target render pipeline.

`create_shader_graph` can create Built-in or URP Lit/Unlit graphs with functional targets and output blocks. Optional nodes use the same deterministic topology layout as Visual Scripting. Overwriting an existing graph requires both `overwrite=true` and its current inspection hash.

## Failure Shields

- The bridge never hand-parses or edits Shader Graph JSON. It uses `FileUtilities.TryReadGraphDataFromDisk` when available, otherwise the package's `MultiJson.Deserialize<GraphData>` path used by older importers, and always serializes through the installed package's `MultiJson.Serialize`.
- Internal API signatures are probed before authoring. Shifted or missing members fail closed while the bridge continues to compile when Shader Graph is absent.
- Short node names must resolve uniquely. Use a fully qualified type when packages provide duplicate names.
- Connections validate slot direction and compatibility. Occupied inputs are preserved unless `replaceExistingInput=true` is explicit.
- Existing assets fail on a stale SHA-256 or while their Shader Graph editor window is open.
- Writes use a temporary file and atomic replacement. Failed import, deserialization, target, unresolved-object, or compiler checks restore and hash-verify the original bytes. Existing `.meta` files are not rewritten.
- Unity object traversal and package reflection stay on the Editor main thread.

## Current Scope

Verified combinations:

- Unity 2022.3.39f1 with Shader Graph 14.0.11
- Unity 6000.1.14f1 with Shader Graph 17.1.0
- Unity 6000.3.10f1 with Shader Graph 17.3.0

Each fixture covers Built-in Unlit creation, exact inspection, generic Time-node insertion, connection to Base Color, synchronous import/compiler validation, stale-hash and occupied-input rejection, reverse-direction rejection, and byte-preserving rollback after an invalid node completes its write. The bridge also compiles and executes without Shader Graph installed.

Not yet accepted: Shader Graph 10.x/12.x, Unity 2021, untested patch versions, URP Lit/Unlit runtime materials, Built-in Lit, HDRP, Sub Graph authoring, blackboard properties/keywords/dropdowns, node-specific setting mutation, open-window collaboration, and target-device rendering. `pipeline=auto` rejects unknown render pipelines instead of treating them as Built-in.

Generic node construction is deliberately narrow. Nodes that require extra bindings or configuration should get a typed adapter and an acceptance fixture before being advertised as supported.

## Clean-Room Boundary

The AnkleBreaker plugin's public documentation and changelog were used only to identify behavior and failure cases. Its custom license imposes attribution and commercial-distribution conditions that do not match Creator Works MCP's MIT distribution goals, so no implementation material was copied.

Unity-Open-MCP is MIT-licensed and was reviewed for optional-extension behavior, but no code was transplanted. BANTWORKS independently uses the installed Unity package's real object model, optimistic concurrency, transactional writes, compiler acceptance, and deterministic layout.

Research attribution and exact repository references are recorded in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
