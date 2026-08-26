# Creator Works MCP Shader Graph Preview for Aline

Version: `2.4.0-1`

Branch: `preview/creator-works-shader-aline`

This is an unsigned preview build. Windows may show an Unknown publisher or SmartScreen warning. Verify the downloaded file against `SHA256SUMS.txt` before running it.

## Setup

1. Run `Creator Works MCP_2.4.0-1_x64-setup.exe`.
2. Select a Unity project folder in the launcher.
3. Select Codex and/or Claude Code, then choose **Set Up Creator Works MCP**.
4. Restart the selected AI client. It should list the MCP as `creator-works`, not `banter`.
5. Keep the Unity project under version control or use a disposable copy for Shader Graph tests.

The launcher keeps the existing `BanterMCPBridge.cs` filename and `.bantworks-mcp` project folder as internal compatibility contracts. Those names do not change the AI-facing Creator Works identity.

## Shader Graph Test Flow

1. Call `get_shader_graph_capabilities` and stop if the installed package API is unsupported.
2. Call `inspect_shader_graph` and retain the returned `contentHash`, node IDs, and slot IDs.
3. Pass the latest `contentHash` as `expectedContentHash` to every mutation.
4. Reinspect after each mutation and use the new hash for the next operation.
5. Finish with `validate_shader_graph`, inspect the material in Unity, and test it in the target render pipeline.

Do not keep the Shader Graph editor window open while mutating that asset through MCP.

## Verified Matrix

- Unity 2022.3.39f1 with Shader Graph 14.0.11
- Unity 6000.1.14f1 with Shader Graph 17.1.0
- Unity 6000.3.10f1 with Shader Graph 17.3.0
- Bridge compilation without Shader Graph installed

## Preview Limits

This build is not the stable Creator Works release. Unity 2021, Shader Graph 10/12, HDRP, Sub Graph authoring, blackboard properties and keywords, node-specific settings, open-window collaboration, untested package patches, and target-device rendering are not yet accepted. Test on disposable assets first and report the Unity version, Shader Graph package version, render pipeline, exact tool call, returned error, and whether the original asset bytes were preserved.

See [shader-graph-experiment.md](shader-graph-experiment.md) for the full clean-room implementation and safety boundary.
