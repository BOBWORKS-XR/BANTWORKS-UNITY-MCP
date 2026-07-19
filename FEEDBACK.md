# BANTWORKS MCP Project Feedback

This is the canonical field-feedback guide for every Unity project that uses
BANTWORKS MCP. Point an AI client at this file when you want it to preserve
useful project evidence for later MCP improvements.

The guide is intentionally generic. A game's scene logic stays in that game;
only reusable MCP, Unity bridge, installer, Visual Scripting, and Banter SDK
findings should become changes to this repository.

## Recommended Project Instruction

Give an AI client this instruction from any Unity project:

```text
Read C:\tools\banter-mcp\FEEDBACK.md and follow it for BANTWORKS MCP feedback.
Keep this project's report at <UNITY_PROJECT_ROOT>/.bantworks-mcp/feedback.md.
Append evidence as work is performed, preserve earlier entries, and do not
classify a project-specific gameplay problem as an MCP defect without proof.
```

For a checkout on another machine, replace the first path with that checkout's
`FEEDBACK.md` path or use:

```text
https://raw.githubusercontent.com/BOBWORKS-XR/BANTWORKS-UNITY-MCP/master/FEEDBACK.md
```

## Project Report Location

Each Unity project owns one local report:

```text
<UNITY_PROJECT_ROOT>/.bantworks-mcp/feedback.md
```

This location is outside `Assets`, so Unity does not import it. It also keeps
large or private project evidence out of the MCP source repository. Do not
replace the file when a new test starts; update the environment section when
needed and append or revise individual findings.

## Evidence Rules

Classify every finding as exactly one of:

- **Confirmed broken**: reproducible behavior contradicts a documented or
  observed contract, with enough evidence to identify the failing boundary.
- **Likely wrong but not proven**: evidence points to the MCP or bridge, but a
  discriminating capture or clean reproduction is still missing.
- **Unknown / needs capture**: the symptom is real but its source is not yet
  isolated.
- **Correct as-is**: investigation showed the MCP followed its contract; keep
  the note when it prevents the same false diagnosis later.

Also label the scope as exactly one of:

- **Generic MCP**
- **Unity bridge**
- **Banter integration**
- **Installer / client configuration**
- **Project-specific**

Do not promote a finding into an MCP fix merely because it appeared in one
complex project. Prefer one of these proofs:

1. The same defect reproduces in two independent projects.
2. It reproduces in a minimal fixture or blank project.
3. Source, protocol, or SDK evidence proves the contract violation directly.

Record failed hypotheses as well as successful tests. Never claim a runtime
problem is fixed solely because code compiles or serialized data looks right.

## Required Project Header

Start a new project report with this header:

```markdown
# BANTWORKS MCP Feedback - <project name>

- Project path or safe alias:
- Report started:
- Last updated:
- Unity version:
- Visual Scripting version:
- Banter SDK version and package revision, if used:
- BANTWORKS MCP version or Git commit:
- Unity bridge status or SHA-256:
- MCP client and model:
- Windows version:
- Primary scenes, prefabs, or assets exercised:
```

Update a value when the environment changes during testing. Do not silently
carry results across different Unity, Visual Scripting, Banter SDK, bridge, or
MCP versions.

## Finding Template

Append one section for each distinct behavior:

```markdown
## BW-YYYYMMDD-NNN - <short title>

- Classification: Confirmed broken | Likely wrong but not proven | Unknown / needs capture | Correct as-is
- Scope: Generic MCP | Unity bridge | Banter integration | Installer / client configuration | Project-specific
- Severity: Blocking | Major | Moderate | Minor
- First observed:
- Last reproduced:
- Unity mode: Edit | Play | Both
- MCP tool, prompt, launcher action, or bridge command:
- Command/request correlation ID, if available:
- Affected object, asset, scene, or prefab:

### Expected

<The exact behavior or contract that should hold.>

### Actual

<The observed behavior, without guessing at the cause.>

### Reproduction

1. <Start from a named state.>
2. <Perform one exact action.>
3. <Observe one measurable result.>

Reproduction rate: <for example, 5/5>

### Evidence

- Console message or bounded log excerpt:
- Request/result/state file:
- Profiler marker, timestamp, screenshot, or video:
- Relevant source, SDK contract, serialized property, or graph unit:
- Comparison project or minimal fixture:

### Current Assessment

Known:

Inferred:

Unknown:

Next discriminating test:

### Proposed MCP Improvement

<Describe the smallest generic improvement, or state "None - project-specific".>

### Validation

- Compile/import result:
- Edit Mode result:
- Play Mode result:
- Headset or built-client result:
- Regression coverage added:
- Remaining gap:
```

Use stable IDs so later discussion can refer to a finding without relying on
its title. Split unrelated symptoms into separate findings.

## Useful Evidence

Prefer small, decisive evidence:

- `get_bridge_status` output and selected project identity
- exact tool name and bounded request/result payloads
- Unity Console errors with timestamps
- affected object global IDs, asset GUIDs, and normalized paths
- graph import and Banter validator results
- Unity Profiler captures for recurring performance symptoms
- bridge and package hashes when propagation is in question
- runtime confirmation from Play Mode, a built client, or a headset

Avoid copying full multi-megabyte hierarchy exports into Markdown. Reference
the local file and include its size, hash, relevant selector, and a short
extract instead.

## Privacy And Safety

- Never record access tokens, passwords, private keys, cookies, or client
  configuration secrets.
- Redact personal directory names and private project names before posting a
  report publicly.
- Do not include licensed Asset Store content or proprietary source in a public
  issue. Describe the contract and provide a minimal substitute when possible.
- Do not let a feedback task modify gameplay, project settings, packages, or
  MCP source unless the user separately requested that change.
- Preserve unrelated worktree and scene changes.

## Cross-Project Review

When reviewing several project reports:

1. Group findings by stable behavior, not by similar wording.
2. Compare exact Unity, Visual Scripting, Banter SDK, MCP, and bridge versions.
3. Separate shared failures from project-specific configuration.
4. Mark contradictions explicitly instead of averaging them away.
5. Create an MCP issue or code change only for evidence-supported generic work.
6. Record the test that would prove the proposed MCP change is complete.

Project reports are working evidence, not release claims. The MCP repository's
tests, compatibility matrix, and target Unity runtime remain the final
validation gates.
