/**
 * Visual Scripting Graph Creation Instructions
 *
 * Detailed guide for programmatically creating .asset files.
 * Based on working patterns from the Creator SDK and legacy Banter SDK.
 */

export const VS_GRAPH_INSTRUCTIONS = `
# Instructions for Creating Unity Visual Scripting Graphs

## Overview
This guide explains how to programmatically create Unity Visual Scripting \`.asset\` files that work with the selected SideQuest SDK contract.

## Critical Rules

### 0. Inspect the Selected SideQuest SDK
- Run \`get_banter_sdk_info\` before using SideQuest custom nodes. The legacy tool name covers both SDK families.
- Follow its \`sdkProfile\`, \`namespaces\`, and \`compatibility.authoringPolicy\` fields.
- Creator SDK: use concrete \`BS.*\` component types and \`BS.VisualScripting.*\` nodes for new content.
- Legacy Banter SDK: use \`Banter.SDK.*\` component types and \`Banter.VisualScripting.*\` nodes.
- Hybrid: prefer Creator types for new content, but do not rewrite existing legacy assets without an explicit migration audit.
- Match the package source and revision, not only its semantic version.
- The 162-node captured catalogue is complete for observed SDK 3.2.2 and selected git revisions, but older registry packages contain fewer nodes.

### 1. GUID Format
- **NEVER** use fake/pattern GUIDs like \`"a1a1a1a1-1a1a-1a1a-1a1a-a1a1a1a1a1a1"\`
- **ALWAYS** generate real random hex GUIDs
- Unity's deserializer will fail with "Could not find any recognizable digits" if GUIDs aren't valid

### 2. SideQuest SDK Node Type Names
Custom nodes use one flat namespace selected by the installed package, NOT their source-code subdirectories:

**CORRECT for Creator SDK:**
- \`BS.VisualScripting.OnGrab\`
- \`BS.VisualScripting.OnRelease\`
- \`BS.VisualScripting.GetLocalUserState\`

**CORRECT for legacy Banter SDK:**
- \`Banter.VisualScripting.OnGrab\`
- \`Banter.VisualScripting.OnRelease\`
- \`Banter.VisualScripting.GetLocalUserState\`

**WRONG:**
- Using \`Banter.VisualScripting.*\` for new Creator SDK content merely because legacy stubs compile
- \`Banter.VisualScripting.Events.OnGrab\` ❌
- \`Banter.VisualScripting.User.GetLocalUserState\` ❌

### 3. GetComponent Pattern
Don't use \`Unity.VisualScripting.GetComponent\` - it doesn't exist as a node type!

**CORRECT - Use InvokeMember:**
\`\`\`json
{
  "chainable": false,
  "parameterNames": ["type"],
  "member": {
    "name": "GetComponent",
    "parameterTypes": ["System.Type"],
    "targetType": "UnityEngine.Component",
    "targetTypeName": "UnityEngine.Component",
    "$version": "A"
  },
  "defaultValues": {
    "target": null,
    "%type": {"$content": "BS.BSSyncedObject", "$type": "System.RuntimeType"}
  },
  "position": {"x": -456.0, "y": -321.0},
  "guid": "d3bb1652-1c16-4f7b-ad2a-6f7e88c31091",
  "$version": "A",
  "$type": "Unity.VisualScripting.InvokeMember",
  "$id": "49"
}
\`\`\`

**Note:** The \`%type\` parameter must specify a type using \`System.RuntimeType\`, not null. The example is for Creator SDK; use \`Banter.SDK.BanterSyncedObject\` only when \`sdkProfile\` is \`banter\`.

### 4. SetVariable and GetVariable Structure

**CRITICAL:** SetVariable nodes MUST have a value connected to their "input" port!

**SetVariable Structure:**
\`\`\`json
{
  "kind": "Graph",
  "defaultValues": {
    "name": {"$content": "variableName", "$type": "System.String"}
  },
  "position": {"x": -102.0, "y": -290.0},
  "guid": "030052d8-7dee-4f4d-ab64-ab2aeb0879f0",
  "$version": "A",
  "$type": "Unity.VisualScripting.SetVariable",
  "$id": "17"
}
\`\`\`

**IMPORTANT:** SetVariable nodes need:
1. The variable name in \`defaultValues.name.$content\`
2. A VALUE CONNECTION to the "input" port
3. Without a value connection, you'll get "New Value is missing" error!

### 5. GetMember Structure
Include \`defaultValues.target: null\` when an instance target is not connected. Unity may omit it for static members or connected targets:

\`\`\`json
{
  "member": {
    "name": "collider",
    "parameterTypes": null,
    "targetType": "UnityEngine.Collision",
    "targetTypeName": "UnityEngine.Collision",
    "$version": "A"
  },
  "defaultValues": {"target": null},
  "position": {"x": -207.0, "y": 497.0},
  "guid": "d5bbc3fa-e169-4ea0-8eb3-5a88d30daead",
  "$version": "A",
  "$type": "Unity.VisualScripting.GetMember",
  "$id": "53"
}
\`\`\`

### 6. InvokeMember Structure
Include \`defaultValues.target: null\` when an instance target is not connected. Static calls and connected targets can omit it:

\`\`\`json
{
  "chainable": false,
  "parameterNames": ["a", "b"],
  "member": {
    "name": "Distance",
    "parameterTypes": ["UnityEngine.Vector3", "UnityEngine.Vector3"],
    "targetType": "UnityEngine.Vector3",
    "targetTypeName": "UnityEngine.Vector3",
    "$version": "A"
  },
  "defaultValues": {
    "%a": {"x": 0.0, "y": 0.0, "z": 0.0, "$type": "UnityEngine.Vector3"},
    "%b": {"x": 0.0, "y": 0.0, "z": 0.0, "$type": "UnityEngine.Vector3"}
  },
  "position": {"x": 827.0, "y": 548.0},
  "guid": "47b81317-ae99-4621-8134-b45a67422f75",
  "$version": "A",
  "$type": "Unity.VisualScripting.InvokeMember",
  "$id": "41"
}
\`\`\`

### 7. Event Nodes
Must have \`"coroutine": false\`:

\`\`\`json
{
  "coroutine": false,
  "defaultValues": {"banterHeldEvents": null},
  "position": {"x": -800.0, "y": 0.0},
  "guid": "19f0bbfa-1c40-494e-b284-0c58c1b3819e",
  "$version": "A",
  "$type": "BS.VisualScripting.OnGrab",
  "$id": "45"
}
\`\`\`

### 8. Output Port Names (Critical!)

**OnCollisionEnter:**
- Output port is \`"data"\` NOT \`"collision"\`

**Greater node:**
- Output port is \`"comparison"\` NOT \`"greater"\`

**GetLocalUserState:**
- Output ports are \`"Position"\` and \`"Rotation"\` (capitalized!)
- It is a pure value unit with no \`enter\` or \`exit\` control ports.
- The outputs are the local user's tracked head pose, not a body/root transform.
- For a pet or NavMesh follower, connect \`Position\` directly to the target-position or destination input. Do not use a Scene variable named \`player\` unless the selected project explicitly creates that variable.
- Until Banter registers the local user, the node returns \`Vector3.zero\` and \`Quaternion.identity\`.

### 9. Script Graph vs Subgraph
For **Script Graphs** (run on GameObjects):
\`\`\`json
"controlInputDefinitions": [],
"controlOutputDefinitions": [],
"valueInputDefinitions": [],
"valueOutputDefinitions": []
\`\`\`
All are EMPTY arrays!

### 10. Elements, IDs, and Connection Versions
- Put nodes, graph groups, and connections together in the canonical \`graph.elements\` array.
- A node needs a unique string \`$id\` when another element references it. Unity may omit \`$id\` on an unreferenced node.
- Nodes use \`\"$version\": \"A\"\`. Visual Scripting 1.9.4 and 1.9.9 normally omit \`$version\` on connection elements; an explicit \`\"A\"\` is also accepted.

### 11. Variables Collection Structure
\`\`\`json
"variables": {
  "Kind": "Flow",
  "collection": {
    "$content": [
      {
        "name": "syncedObject",
        "value": null,
        "typeHandle": {
          "Identification": "BS.BSSyncedObject, BS.SDK",
          "$version": "A"
        },
        "$version": "A"
      }
    ],
    "$version": "A"
  },
  "$version": "A"
}
\`\`\`

## File Structure Template

\`\`\`yaml
%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 0}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: 95e66c6366d904e98bc83428217d4fd7, type: 3}
  m_Name: YourGraphName
  m_EditorClassIdentifier: Unity.VisualScripting.Flow::Unity.VisualScripting.ScriptGraphAsset
  _data:
    _json: '{"graph":{...YOUR JSON HERE...}}'
    _objectReferences: []
\`\`\`

The companion \`.asset.meta\` file is a native asset importer, not a script importer:

\`\`\`yaml
fileFormatVersion: 2
guid: 0123456789abcdef0123456789abcdef
NativeFormatImporter:
  externalObjects: {}
  mainObjectFileID: 11400000
  userData:
  assetBundleName:
  assetBundleVariant:
\`\`\`

## Connection Structure

**Control Connections** (flow):
\`\`\`json
{
  "sourceUnit": {"$ref": "9"},
  "sourceKey": "trigger",
  "destinationUnit": {"$ref": "11"},
  "destinationKey": "enter",
  "guid": "01885a05-e468-4732-baa7-4ad0ecde8b9b",
  "$type": "Unity.VisualScripting.ControlConnection"
}
\`\`\`

**Value Connections** (data):
\`\`\`json
{
  "sourceUnit": {"$ref": "13"},
  "sourceKey": "self",
  "destinationUnit": {"$ref": "11"},
  "destinationKey": "target",
  "guid": "5e489fab-26b2-4041-9a18-5d317a6feb2b",
  "$type": "Unity.VisualScripting.ValueConnection"
}
\`\`\`

## Literal Nodes for Values

\`\`\`json
{
  "type": "System.Boolean",
  "value": {"$content": false, "$type": "System.Boolean"},
  "defaultValues": {},
  "position": {"x": -700.0, "y": 300.0},
  "guid": "4b87ffa4-62d7-4956-b86d-70edb7e0e68a",
  "$version": "A",
  "$type": "Unity.VisualScripting.Literal",
  "$id": "84"
}
\`\`\`

## Common Mistakes to Avoid

❌ Using numbers for $id: \`"$id": 9\`
✅ Use strings: \`"$id": "9"\`

❌ Wrong source-folder namespace: \`Banter.VisualScripting.Events.OnGrab\`
✅ Creator SDK: \`BS.VisualScripting.OnGrab\`
✅ Legacy Banter SDK: \`Banter.VisualScripting.OnGrab\`

❌ Missing \`"coroutine": false\` on event nodes
✅ Always add to Start, OnGrab, OnRelease, OnCollisionEnter

❌ Wrong output keys: \`"collision"\`, \`"greater"\`
✅ Correct: \`"data"\`, \`"comparison"\`

❌ Missing \`"target": null\` in InvokeMember/GetMember defaultValues
✅ Always include in defaultValues

❌ Using \`Unity.VisualScripting.GetComponent\` node
✅ Use \`InvokeMember\` calling GetComponent method

❌ Fake pattern GUIDs like "a1a1a1a1-1a1a-..."
✅ Generate real hex GUIDs

❌ SetVariable without value connection
✅ Always connect a value to the "input" port

❌ GetComponent with \`"%type": null\`
✅ Specify type: \`"%type": {"$content": "TypeName", "$type": "System.RuntimeType"}\`

## Success Criteria

✅ All nodes visible in Unity Visual Scripting editor
✅ No red "missing script" nodes
✅ No yellow warning messages
✅ All connections properly wired
✅ Graph executes without errors
`;
