/**
 * MCP Prompts - Contextual guidance for Banter development
 */

interface Prompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

interface PromptMessage {
  role: "user" | "assistant";
  content: { type: "text"; text: string };
}

/**
 * Register available prompts
 */
export function registerPrompts(): Prompt[] {
  return [
    {
      name: "create_interactive_object",
      description: "Guide for creating an interactive VR object with grab, physics, and visual feedback",
      arguments: [
        { name: "objectType", description: "Type of object (ball, cube, tool, etc.)", required: false },
        { name: "interactions", description: "Desired interactions (grab, throw, trigger, etc.)", required: false },
      ],
    },
    {
      name: "create_vs_graph",
      description: "Step-by-step guide for creating a Visual Scripting graph",
      arguments: [
        { name: "purpose", description: "What the graph should do", required: false },
      ],
    },
    {
      name: "banter_best_practices",
      description: "Best practices for Banter SDK development",
      arguments: [],
    },
    {
      name: "debug_vs_graph",
      description: "Help debug a Visual Scripting graph that isn't working",
      arguments: [
        { name: "symptoms", description: "What's going wrong", required: false },
      ],
    },
    {
      name: "multiplayer_sync",
      description: "Guide for setting up multiplayer synchronization",
      arguments: [
        { name: "whatToSync", description: "What needs to be synchronized", required: false },
      ],
    },
  ];
}

/**
 * Get prompt content
 */
export function handlePromptGet(
  name: string,
  args: Record<string, unknown>
): { messages: PromptMessage[] } {
  switch (name) {
    case "create_interactive_object":
      return createInteractiveObjectPrompt(args);

    case "create_vs_graph":
      return createVSGraphPrompt(args);

    case "banter_best_practices":
      return banterBestPracticesPrompt();

    case "debug_vs_graph":
      return debugVSGraphPrompt(args);

    case "multiplayer_sync":
      return multiplayerSyncPrompt(args);

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

function createInteractiveObjectPrompt(args: Record<string, unknown>): { messages: PromptMessage[] } {
  const objectType = (args.objectType as string) || "object";
  const interactions = (args.interactions as string) || "grab and physics";

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `I want to create an interactive ${objectType} with these interactions: ${interactions}`,
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `# Creating an Interactive ${objectType} in Banter

## Components Needed

For a fully interactive object, you'll need these components:

### 1. Geometry (choose one)
- \`BanterSphere\` - for balls
- \`BanterBox\` - for cubes
- \`BanterGLTF\` - for custom 3D models

### 2. Physics
- \`BanterRigidbody\` - enables physics simulation
- \`BanterSphereCollider\` / \`BanterBoxCollider\` - collision shape

### 3. Interaction
- \`BanterGrababble\` - makes object grabbable in VR
- \`BanterColliderEvents\` - enables collision/trigger events

### 4. Visual
- \`BanterMaterial\` - color, texture, shader

### 5. Multiplayer (optional)
- \`BanterSyncedObject\` - synchronizes across users

## Visual Scripting Setup

For interactive behavior, create a Visual Scripting graph with:

1. **Event nodes**: \`OnGrab\`, \`OnRelease\`, \`OnCollisionEnter\`
2. **Logic nodes**: \`If\`, \`SetVariable\`, \`GetVariable\`
3. **Action nodes**: \`SetMember\`, \`InvokeMember\`

## Common Patterns

### Change Color on Grab
\`\`\`
OnGrab → SetMember (material.color) → new color
OnRelease → SetMember (material.color) → original color
\`\`\`

### Play Sound on Collision
\`\`\`
OnCollisionEnter → InvokeMember (audioSource.Play)
\`\`\`

### Ownership for Multiplayer
\`\`\`
OnGrab → GetComponent (BanterSyncedObject) → InvokeMember (RequestOwnership)
\`\`\`

## Next Steps

1. First, use \`query_project_state\` to see what's already in your scene
2. Then, use \`generate_vs_graph\` to create the interaction logic
3. Use \`validate_vs_graph\` to check for errors
4. Finally, use \`write_vs_graph\` to save it to your project

Would you like me to generate the Visual Scripting graph for you?`,
        },
      },
    ],
  };
}

function createVSGraphPrompt(args: Record<string, unknown>): { messages: PromptMessage[] } {
  const purpose = (args.purpose as string) || "interactive behavior";

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to create a Visual Scripting graph for: ${purpose}`,
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `# Creating a Visual Scripting Graph for: ${purpose}

## Graph Creation Workflow

### Step 1: Plan the Logic
Before creating nodes, outline:
- What events trigger the behavior?
- What conditions need to be checked?
- What actions should happen?

### Step 2: Identify Required Nodes

**Event Nodes (triggers)**
- \`OnGrab\` / \`OnRelease\` - VR interaction
- \`OnClick\` - selection
- \`OnCollisionEnter\` - physics
- \`Start\` - initialization
- \`Update\` - continuous (use sparingly!)

**Logic Nodes**
- \`If\` / \`Branch\` - conditional
- \`SetVariable\` / \`GetVariable\` - state
- \`Greater\` / \`Less\` / \`Equal\` - comparison

**Action Nodes**
- \`InvokeMember\` - call methods
- \`SetMember\` - set properties
- \`GetMember\` - read properties

### Step 3: Define Variables
Graph variables store state between events:
- \`bool\` - flags (isGrabbed, isActive)
- \`float\` - numbers (score, timer)
- \`GameObject\` - references

### Step 4: Use MCP Tools

1. **Generate the graph:**
\`\`\`json
{
  "graphName": "MyBehavior",
  "nodes": [...],
  "connections": [...],
  "variables": [...]
}
\`\`\`

2. **Validate before writing:**
Use \`validate_vs_graph\` to catch errors

3. **Write to project:**
Use \`write_vs_graph\` to create the .asset file

4. **Verify import:**
Use \`check_import_status\` to confirm Unity imported it

## Critical Reminders

- Banter nodes use \`Banter.VisualScripting.X\` (no sub-namespaces!)
- Event nodes need \`coroutine: false\`
- Use \`InvokeMember\` for GetComponent, not a GetComponent node
- Generate real GUIDs, never use patterns

Would you like me to generate this graph now?`,
        },
      },
    ],
  };
}

function banterBestPracticesPrompt(): { messages: PromptMessage[] } {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "What are the best practices for Banter SDK development?",
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `# Banter SDK Best Practices

## 1. Component Architecture

### DO:
- Use Banter components instead of raw Unity components
- Add \`BanterObjectId\` to objects you need to reference from JS
- Use \`BanterSyncedObject\` for multiplayer objects
- Add \`BanterColliderEvents\` to receive physics events

### DON'T:
- Create deep component hierarchies
- Use Update in Visual Scripting (expensive!)
- Forget collision layers for physics

## 2. Visual Scripting

### DO:
- Use event-driven logic (OnGrab, OnCollision)
- Store state in Graph variables
- Validate graphs before importing
- Test in VR mode

### DON'T:
- Use sub-namespaces for Banter nodes
- Forget \`coroutine: false\` on events
- Use fake/pattern GUIDs
- Create circular references

## 3. JavaScript (WebRoot)

### DO:
- Use \`BS.BanterScene.GetInstance()\` as entry point
- Use \`scene.On("unity-loaded", ...)\` before interacting
- Clean up event listeners
- Use async/await for loading

### DON'T:
- Block the main thread
- Use DOM APIs unnecessarily
- Forget error handling

## 4. Multiplayer

### DO:
- Request ownership before modifying synced objects
- Use \`OneShot\` for broadcast events
- Use space state for persistent shared data
- Test with multiple users

### DON'T:
- Sync everything (only what's needed)
- Assume ownership without checking
- Modify objects you don't own

## 5. Performance

### DO:
- Use static batching for world objects
- Limit physics objects
- Use appropriate collider types
- Compress textures

### DON'T:
- Use MeshCollider on moving objects
- Create objects every frame
- Use high-poly models without LODs

## 6. VR Considerations

### DO:
- Test all interactions in VR
- Use appropriate grab types
- Provide haptic feedback
- Consider comfort (teleport, snap turning)

### DON'T:
- Force smooth locomotion
- Place UI too close or far
- Ignore hand tracking

## Quick Reference

| Task | Use |
|------|-----|
| Interactive object | BanterGrababble + BanterRigidbody |
| Custom 3D model | BanterGLTF with addColliders |
| UI in VR | BanterUIPanel + UI elements |
| Multiplayer sync | BanterSyncedObject |
| Trigger zones | Collider + isTrigger + BanterColliderEvents |
| Audio | BanterAudioSource with spatialBlend=1 |`,
        },
      },
    ],
  };
}

function debugVSGraphPrompt(args: Record<string, unknown>): { messages: PromptMessage[] } {
  const symptoms = (args.symptoms as string) || "not working as expected";

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `My Visual Scripting graph is ${symptoms}. How do I debug it?`,
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `# Debugging Visual Scripting Graph

## Common Issues and Solutions

### 1. Graph Not Showing Nodes
**Symptoms:** Graph opens but nodes are missing or red
**Causes:**
- Invalid GUIDs (fake patterns)
- Wrong node type names
- Missing required properties

**Solution:** Use \`validate_vs_graph\` to check for errors

### 2. Events Not Firing
**Symptoms:** OnGrab, OnClick, etc. don't trigger
**Causes:**
- Missing required components (BanterGrababble, BanterColliderEvents)
- Wrong object (graph on wrong GameObject)
- Missing \`coroutine: false\`

**Solution:** Check component requirements for each event

### 3. "Node script is missing"
**Symptoms:** Red node with error
**Causes:**
- Wrong namespace (Banter.VisualScripting.Events.OnGrab instead of Banter.VisualScripting.OnGrab)
- Node type doesn't exist

**Solution:** Check exact node type names in documentation

### 4. "Port not found" Errors
**Symptoms:** Connections fail
**Causes:**
- Wrong port names (e.g., "collision" vs "data")
- Case sensitivity (e.g., "Position" vs "position")

**Solution:** Check exact port names in node documentation

### 5. Variables Not Working
**Symptoms:** SetVariable/GetVariable have errors
**Causes:**
- Missing variable name in defaultValues
- Missing value connection to SetVariable
- Wrong variable kind (Graph vs Object)

**Solution:** Ensure proper structure and connections

## Debugging Steps

1. **Check Console:**
   Use \`get_console_logs\` to see Unity errors

2. **Validate Graph:**
   Use \`validate_vs_graph\` before/after changes

3. **Check Import:**
   Use \`check_import_status\` after writing

4. **Verify Components:**
   Use \`query_project_state\` to check what's on objects

5. **Test Incrementally:**
   Start with minimal graph, add complexity gradually

## Quick Fixes

| Error | Fix |
|-------|-----|
| Missing coroutine | Add \`"coroutine": false\` to event nodes |
| Wrong namespace | Use \`Banter.VisualScripting.X\` (flat) |
| Invalid GUID | Generate real random GUIDs |
| Missing target | Add \`"target": null\` to defaultValues |

Would you like me to validate your graph and identify specific issues?`,
        },
      },
    ],
  };
}

function multiplayerSyncPrompt(args: Record<string, unknown>): { messages: PromptMessage[] } {
  const whatToSync = (args.whatToSync as string) || "objects";

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `How do I set up multiplayer synchronization for ${whatToSync}?`,
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `# Multiplayer Synchronization in Banter

## Overview

Banter handles multiplayer through:
1. **BanterSyncedObject** - Transform/physics sync
2. **Space State** - Shared key-value data
3. **OneShot** - Broadcast messages

## Syncing ${whatToSync}

### For Physical Objects (Transform + Physics)

Add \`BanterSyncedObject\` component:
\`\`\`javascript
obj.AddComponent(new BS.BanterSyncedObject({
  syncPosition: true,
  syncRotation: true,
  syncVelocity: true
}));
\`\`\`

### Ownership System

Only the owner can modify synced objects:

\`\`\`javascript
// Request ownership before modifying
const synced = obj.GetComponent(BS.CT.BanterSyncedObject);
synced.RequestOwnership();

// Now you can move/change the object
obj.SetPosition(newPosition);

// Release when done (optional)
synced.ReleaseOwnership();
\`\`\`

### In Visual Scripting
\`\`\`
OnGrab → GetComponent(BanterSyncedObject) → InvokeMember(RequestOwnership)
[then other logic]
OnRelease → InvokeMember(ReleaseOwnership)
\`\`\`

## For Game State (Scores, Settings)

Use Space State:

\`\`\`javascript
// Set shared state (admin or owner)
scene.SetPublicSpaceProps({
  score: 100,
  gamePhase: "playing"
});

// Listen for changes
scene.On("space-state-changed", e => {
  console.log("Changed:", e.detail.changes);
});
\`\`\`

## For Events (Instant Messages)

Use OneShot for broadcast:

\`\`\`javascript
// Send to everyone
scene.OneShot(JSON.stringify({
  type: "explosion",
  position: { x: 0, y: 1, z: 0 }
}));

// Receive
scene.On("one-shot", e => {
  const data = JSON.parse(e.detail.data);
  if (data.type === "explosion") {
    // Play effect at position
  }
});
\`\`\`

## Best Practices

| What to Sync | Method |
|--------------|--------|
| Grabbable objects | BanterSyncedObject |
| Score/state | Space State |
| Effects/sounds | OneShot |
| Player positions | Automatic (built-in) |

## Common Pitfalls

1. **Modifying without ownership** - Request first!
2. **Syncing too much** - Only sync what's necessary
3. **Large OneShot payloads** - Keep messages small
4. **Race conditions** - Use timestamps if order matters

Would you like me to create a VS graph for synchronized ${whatToSync}?`,
        },
      },
    ],
  };
}
