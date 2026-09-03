/**
 * Banter Visual Scripting Node Definitions
 *
 * All 164 Visual Scripting nodes available in Banter SDK.
 * Organized by category for easy reference.
 */

export interface VSNodePort {
  name: string;
  type: "control" | "value";
  valueType?: string;
  description?: string;
}

export interface VSNode {
  name: string;
  fullType: string; // Full C# type name for .asset files
  category: string;
  description: string;
  inputs: VSNodePort[];
  outputs: VSNodePort[];
  properties?: Record<string, unknown>;
  notes?: string[];
}

export const BANTER_VS_NODES: Record<string, VSNode> = {
  // ============================================
  // EVENT NODES (Banter.VisualScripting.*)
  // ============================================

  OnGrab: {
    name: "OnGrab",
    fullType: "Banter.VisualScripting.OnGrab",
    category: "Events",
    description: "Triggered when object is grabbed in VR.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control", description: "Flow output when grabbed" },
      { name: "side", type: "value", valueType: "BS.HandSide", description: "Which hand grabbed (LEFT/RIGHT)" },
      { name: "point", type: "value", valueType: "Vector3", description: "Grab point in world space" },
      { name: "normal", type: "value", valueType: "Vector3", description: "Surface normal at grab point" },
    ],
    properties: { coroutine: false },
    notes: ["Requires BanterGrababble or BanterGrabHandle component on object"],
  },

  OnRelease: {
    name: "OnRelease",
    fullType: "Banter.VisualScripting.OnRelease",
    category: "Events",
    description: "Triggered when object is released from grab.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control", description: "Flow output when released" },
      { name: "side", type: "value", valueType: "BS.HandSide", description: "Which hand released" },
    ],
    properties: { coroutine: false },
  },

  OnClick: {
    name: "OnClick",
    fullType: "Banter.VisualScripting.OnClick",
    category: "Events",
    description: "Triggered when object is clicked/selected.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "point", type: "value", valueType: "Vector3" },
      { name: "normal", type: "value", valueType: "Vector3" },
    ],
    properties: { coroutine: false },
  },

  OnGunTrigger: {
    name: "OnGunTrigger",
    fullType: "Banter.VisualScripting.OnGunTrigger",
    category: "Events",
    description: "Triggered when trigger is pulled while holding object.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "side", type: "value", valueType: "BS.HandSide" },
      { name: "value", type: "value", valueType: "float", description: "Trigger pressure 0-1" },
    ],
    properties: { coroutine: false },
    notes: ["Requires BanterGrababble with trigger capture enabled"],
  },

  OnControllerButtonPressed: {
    name: "OnControllerButtonPressed",
    fullType: "Banter.VisualScripting.OnControllerButtonPressed",
    category: "Events",
    description: "Controller button pressed while holding object.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "button", type: "value", valueType: "BS.ButtonType" },
      { name: "side", type: "value", valueType: "BS.HandSide" },
    ],
    properties: { coroutine: false },
  },

  OnControllerButtonReleased: {
    name: "OnControllerButtonReleased",
    fullType: "Banter.VisualScripting.OnControllerButtonReleased",
    category: "Events",
    description: "Controller button released while holding object.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "button", type: "value", valueType: "BS.ButtonType" },
      { name: "side", type: "value", valueType: "BS.HandSide" },
    ],
    properties: { coroutine: false },
  },

  OnControllerAxisUpdate: {
    name: "OnControllerAxisUpdate",
    fullType: "Banter.VisualScripting.OnControllerAxisUpdate",
    category: "Events",
    description: "Thumbstick axis values while holding object.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "x", type: "value", valueType: "float", description: "Thumbstick X (-1 to 1)" },
      { name: "y", type: "value", valueType: "float", description: "Thumbstick Y (-1 to 1)" },
      { name: "side", type: "value", valueType: "BS.HandSide" },
    ],
    properties: { coroutine: false },
  },

  OnTriggerAxisUpdate: {
    name: "OnTriggerAxisUpdate",
    fullType: "Banter.VisualScripting.OnTriggerAxisUpdate",
    category: "Events",
    description: "Trigger axis value while holding object.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "value", type: "value", valueType: "float", description: "Trigger value (0-1)" },
      { name: "side", type: "value", valueType: "BS.HandSide" },
    ],
    properties: { coroutine: false },
  },

  OnUserJoined: {
    name: "OnUserJoined",
    fullType: "Banter.VisualScripting.OnUserJoined",
    category: "Events",
    description: "Triggered when a user joins the space.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "user", type: "value", valueType: "BanterUser" },
    ],
    properties: { coroutine: false },
  },

  OnUserLeft: {
    name: "OnUserLeft",
    fullType: "Banter.VisualScripting.OnUserLeft",
    category: "Events",
    description: "Triggered when a user leaves the space.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "user", type: "value", valueType: "BanterUser" },
    ],
    properties: { coroutine: false },
  },

  OnOneShot: {
    name: "OnOneShot",
    fullType: "Banter.VisualScripting.OnOneShot",
    category: "Events",
    description: "Receives broadcast messages from other clients.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "Data", type: "value", valueType: "string" },
    ],
    properties: { coroutine: false },
  },

  OnSpaceStatePropsChanged: {
    name: "OnSpaceStatePropsChanged",
    fullType: "Banter.VisualScripting.OnSpaceStatePropsChanged",
    category: "Events",
    description: "Triggered when shared space state changes.",
    inputs: [
      { name: "Property Name", type: "value", valueType: "string" },
    ],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "New Value", type: "value", valueType: "string" },
      { name: "is Public Property?", type: "value", valueType: "bool" },
    ],
    properties: { coroutine: false },
  },

  OnBanterTriggerEnter: {
    name: "OnBanterTriggerEnter",
    fullType: "Banter.VisualScripting.OnBanterTriggerEnter",
    category: "Events",
    description: "Trigger volume entered (Banter-specific, includes user info).",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "data", type: "value", valueType: "object", description: "Collision data with user info" },
    ],
    properties: { coroutine: false },
  },

  OnSTT: {
    name: "OnSTT",
    fullType: "Banter.VisualScripting.OnSTT",
    category: "Events",
    description: "Speech-to-text transcription result.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "id", type: "value", valueType: "string" },
      { name: "message", type: "value", valueType: "string" },
    ],
    properties: { coroutine: false },
  },

  OnCameraSnap: {
    name: "OnCameraSnap",
    fullType: "Banter.VisualScripting.OnCameraSnap",
    category: "Events",
    description: "Camera snapshot taken.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "data", type: "value", valueType: "string" },
    ],
    properties: { coroutine: false },
  },

  OnAiImage: {
    name: "OnAiImage",
    fullType: "Banter.VisualScripting.OnAiImage",
    category: "Events",
    description: "AI image generation completed.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "url", type: "value", valueType: "string" },
    ],
    properties: { coroutine: false },
  },

  OnAiModel: {
    name: "OnAiModel",
    fullType: "Banter.VisualScripting.OnAiModel",
    category: "Events",
    description: "AI 3D model generation completed.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "url", type: "value", valueType: "string" },
    ],
    properties: { coroutine: false },
  },

  OnReceiveBrowserMessage: {
    name: "OnReceiveBrowserMessage",
    fullType: "Banter.VisualScripting.OnReceiveBrowserMessage",
    category: "Events",
    description: "Message received from embedded browser.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "message", type: "value", valueType: "string" },
    ],
    properties: { coroutine: false },
  },

  OnGlobalEvent: {
    name: "OnGlobalEvent",
    fullType: "Banter.VisualScripting.OnGlobalEvent",
    category: "Events",
    description: "Custom global event triggered from JavaScript.",
    inputs: [],
    outputs: [
      { name: "trigger", type: "control" },
      { name: "eventName", type: "value", valueType: "string" },
      { name: "data", type: "value", valueType: "object" },
    ],
    properties: { coroutine: false },
  },

  GetLocalUserState: {
    name: "GetLocalUserState",
    fullType: "Banter.VisualScripting.GetLocalUserState",
    category: "User",
    description: "Read the local user's tracked head position and rotation. This is a pure value unit with no control-flow ports.",
    inputs: [],
    outputs: [
      { name: "Position", type: "value", valueType: "Vector3", description: "User head position (capitalized!)" },
      { name: "Rotation", type: "value", valueType: "Quaternion", description: "User head rotation (capitalized!)" },
    ],
    notes: [
      "Output port names are capitalized: 'Position' and 'Rotation', not lowercase",
      "Do not connect enter/exit flow: the SDK unit defines only value outputs",
      "Position is the tracked head pose, not a player body/root transform",
      "For a local-user follower, connect Position directly to the destination or target-position calculation; do not invent a Scene variable named 'player' unless that project explicitly publishes one",
      "Before Banter has registered the local user, Position is Vector3.zero and Rotation is Quaternion.identity",
    ],
  },

  // ============================================
  // PLAYER CONTROL NODES
  // ============================================

  SetCanMove: {
    name: "SetCanMove",
    fullType: "Banter.VisualScripting.SetCanMove",
    category: "Player",
    description: "Enable/disable player movement.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "value", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "exit", type: "control" }],
  },

  SetCanRotate: {
    name: "SetCanRotate",
    fullType: "Banter.VisualScripting.SetCanRotate",
    category: "Player",
    description: "Enable/disable player rotation.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "value", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "exit", type: "control" }],
  },

  SetCanJump: {
    name: "SetCanJump",
    fullType: "Banter.VisualScripting.SetCanJump",
    category: "Player",
    description: "Enable/disable player jumping.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "value", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "exit", type: "control" }],
  },

  SetCanCrouch: {
    name: "SetCanCrouch",
    fullType: "Banter.VisualScripting.SetCanCrouch",
    category: "Player",
    description: "Enable/disable player crouching.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "value", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "exit", type: "control" }],
  },

  SetCanGrab: {
    name: "SetCanGrab",
    fullType: "Banter.VisualScripting.SetCanGrab",
    category: "Player",
    description: "Enable/disable player grabbing.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "value", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "exit", type: "control" }],
  },

  SetCanTeleport: {
    name: "SetCanTeleport",
    fullType: "Banter.VisualScripting.SetCanTeleport",
    category: "Player",
    description: "Enable/disable player teleportation.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "value", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "exit", type: "control" }],
  },

  SetCanGrapple: {
    name: "SetCanGrapple",
    fullType: "Banter.VisualScripting.SetCanGrapple",
    category: "Player",
    description: "Enable/disable grappling hook.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "value", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "exit", type: "control" }],
  },

  // ============================================
  // SPACE MANAGEMENT NODES
  // ============================================

  AiImage: {
    name: "AiImage",
    fullType: "Banter.VisualScripting.AiImage",
    category: "Space",
    description: "Generate an AI image from a text prompt.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "prompt", type: "value", valueType: "string" },
    ],
    outputs: [{ name: "exit", type: "control" }],
    notes: ["Result arrives via OnAiImage event"],
  },

  AiModel: {
    name: "AiModel",
    fullType: "Banter.VisualScripting.AiModel",
    category: "Space",
    description: "Generate a 3D model from an image.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "imageUrl", type: "value", valueType: "string" },
    ],
    outputs: [{ name: "exit", type: "control" }],
    notes: ["Result arrives via OnAiModel event"],
  },

  SetScore: {
    name: "SetScore",
    fullType: "Banter.VisualScripting.SetScore",
    category: "Space",
    description: "Set a leaderboard score for current user.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "score", type: "value", valueType: "float" },
      { name: "leaderboardId", type: "value", valueType: "string" },
    ],
    outputs: [{ name: "exit", type: "control" }],
  },

  SendOneShot: {
    name: "SendOneShot",
    fullType: "Banter.VisualScripting.SendOneShot",
    category: "Space",
    description: "Broadcast a message to all users in the space.",
    inputs: [
      { name: "", type: "control" },
      { name: "Data", type: "value", valueType: "string" },
      { name: "All Instances", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "", type: "control" }],
  },

  SetSpaceStateProp: {
    name: "SetSpaceStateProp",
    fullType: "Banter.VisualScripting.SetSpaceStateProp",
    category: "Space",
    description: "Set one protected or public shared space state property.",
    inputs: [
      { name: "", type: "control" },
      { name: "Property Name", type: "value", valueType: "string" },
      { name: "Value", type: "value", valueType: "string" },
      { name: "Is Public Property?", type: "value", valueType: "bool" },
    ],
    outputs: [{ name: "", type: "control" }],
  },

  LoadTextUrl: {
    name: "LoadTextUrl",
    fullType: "Banter.VisualScripting.LoadTextUrl",
    category: "Networking",
    description: "Load text from an HTTP or HTTPS URL on a coroutine flow.",
    inputs: [
      { name: "Load", type: "control" },
      { name: "URL", type: "value", valueType: "string" },
      { name: "Method", type: "value", valueType: "string" },
      { name: "Body", type: "value", valueType: "string" },
      { name: "ContentType", type: "value", valueType: "string" },
    ],
    outputs: [
      { name: "Loaded", type: "control" },
      { name: "Failed", type: "control" },
      { name: "Text", type: "value", valueType: "string" },
    ],
    notes: ["The upstream SDK 3.1.2 implementation sends method POST with UnityWebRequest.Put."],
  },

  LoadGltfUrl: {
    name: "LoadGltfUrl",
    fullType: "Banter.VisualScripting.LoadGltfUrl",
    category: "Networking",
    description: "Set a BanterGLTF component URL.",
    inputs: [
      { name: "", type: "control" },
      { name: "URL", type: "value", valueType: "string" },
      { name: "BanterGltf", type: "value", valueType: "BanterGLTF" },
    ],
    outputs: [{ name: "", type: "control" }],
    notes: ["Obsolete in Banter SDK 3.1.2; prefer setting BanterGLTF.Url when possible."],
  },

  StartSTT: {
    name: "StartSTT",
    fullType: "Banter.VisualScripting.StartSTT",
    category: "Space",
    description: "Start speech-to-text transcription.",
    inputs: [{ name: "enter", type: "control" }],
    outputs: [{ name: "exit", type: "control" }],
  },

  StopSTT: {
    name: "StopSTT",
    fullType: "Banter.VisualScripting.StopSTT",
    category: "Space",
    description: "Stop speech-to-text transcription.",
    inputs: [{ name: "enter", type: "control" }],
    outputs: [{ name: "exit", type: "control" }],
  },

  // ============================================
  // UI ELEMENT CREATION NODES
  // ============================================

  CreateUIButton: {
    name: "CreateUIButton",
    fullType: "Banter.VisualScripting.CreateUIButton",
    category: "UI/Elements",
    description: "Create a UI button.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "text", type: "value", valueType: "string" },
      { name: "parent", type: "value", valueType: "UIElement" },
    ],
    outputs: [
      { name: "exit", type: "control" },
      { name: "element", type: "value", valueType: "UIElement" },
    ],
  },

  CreateUILabel: {
    name: "CreateUILabel",
    fullType: "Banter.VisualScripting.CreateUILabel",
    category: "UI/Elements",
    description: "Create a UI text label.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "text", type: "value", valueType: "string" },
      { name: "parent", type: "value", valueType: "UIElement" },
    ],
    outputs: [
      { name: "exit", type: "control" },
      { name: "element", type: "value", valueType: "UIElement" },
    ],
  },

  CreateUITextField: {
    name: "CreateUITextField",
    fullType: "Banter.VisualScripting.CreateUITextField",
    category: "UI/Elements",
    description: "Create a text input field.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "placeholder", type: "value", valueType: "string" },
      { name: "parent", type: "value", valueType: "UIElement" },
    ],
    outputs: [
      { name: "exit", type: "control" },
      { name: "element", type: "value", valueType: "UIElement" },
    ],
  },

  CreateUISlider: {
    name: "CreateUISlider",
    fullType: "Banter.VisualScripting.CreateUISlider",
    category: "UI/Elements",
    description: "Create a slider control.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "min", type: "value", valueType: "float" },
      { name: "max", type: "value", valueType: "float" },
      { name: "value", type: "value", valueType: "float" },
      { name: "parent", type: "value", valueType: "UIElement" },
    ],
    outputs: [
      { name: "exit", type: "control" },
      { name: "element", type: "value", valueType: "UIElement" },
    ],
  },

  CreateUIToggle: {
    name: "CreateUIToggle",
    fullType: "Banter.VisualScripting.CreateUIToggle",
    category: "UI/Elements",
    description: "Create a toggle/checkbox.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "label", type: "value", valueType: "string" },
      { name: "value", type: "value", valueType: "bool" },
      { name: "parent", type: "value", valueType: "UIElement" },
    ],
    outputs: [
      { name: "exit", type: "control" },
      { name: "element", type: "value", valueType: "UIElement" },
    ],
  },

  CreateUIImage: {
    name: "CreateUIImage",
    fullType: "Banter.VisualScripting.CreateUIImage",
    category: "UI/Elements",
    description: "Create an image element.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "url", type: "value", valueType: "string" },
      { name: "parent", type: "value", valueType: "UIElement" },
    ],
    outputs: [
      { name: "exit", type: "control" },
      { name: "element", type: "value", valueType: "UIElement" },
    ],
  },

  CreateUIScrollView: {
    name: "CreateUIScrollView",
    fullType: "Banter.VisualScripting.CreateUIScrollView",
    category: "UI/Elements",
    description: "Create a scrollable container.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "parent", type: "value", valueType: "UIElement" },
    ],
    outputs: [
      { name: "exit", type: "control" },
      { name: "element", type: "value", valueType: "UIElement" },
    ],
  },

  CreateUIDropdown: {
    name: "CreateUIDropdown",
    fullType: "Banter.VisualScripting.CreateUIDropdown",
    category: "UI/Elements",
    description: "Create a dropdown selection.",
    inputs: [
      { name: "enter", type: "control" },
      { name: "options", type: "value", valueType: "string[]" },
      { name: "parent", type: "value", valueType: "UIElement" },
    ],
    outputs: [
      { name: "exit", type: "control" },
      { name: "element", type: "value", valueType: "UIElement" },
    ],
  },
};

// Node categories for quick reference
export const VS_NODE_CATEGORIES = {
  Events: [
    "OnGrab", "OnRelease", "OnClick", "OnGunTrigger",
    "OnControllerButtonPressed", "OnControllerButtonReleased",
    "OnControllerAxisUpdate", "OnTriggerAxisUpdate",
    "OnUserJoined", "OnUserLeft", "OnOneShot",
    "OnSpaceStatePropsChanged", "OnBanterTriggerEnter",
    "OnSTT", "OnCameraSnap", "OnAiImage", "OnAiModel",
    "OnReceiveBrowserMessage", "OnGlobalEvent",
  ],
  Player: [
    "SetCanMove", "SetCanRotate", "SetCanJump", "SetCanCrouch",
    "SetCanGrab", "SetCanTeleport", "SetCanGrapple",
  ],
  Space: [
    "AiImage", "AiModel", "SetScore", "SendOneShot",
    "SetSpaceStateProp", "StartSTT", "StopSTT",
  ],
  Networking: ["LoadTextUrl", "LoadGltfUrl"],
  User: ["GetLocalUserState"],
  UI: [
    "CreateUIButton", "CreateUILabel", "CreateUITextField",
    "CreateUISlider", "CreateUIToggle", "CreateUIImage",
    "CreateUIScrollView", "CreateUIDropdown",
  ],
};

// Critical notes for VS graph generation
export const VS_CRITICAL_NOTES = {
  namespace: "Banter.VisualScripting (NOT Banter.VisualScripting.Events or similar)",
  eventNodes: "Event nodes require a boolean 'coroutine' flag; use true when a reachable flow enters a wait or coroutine URL loader",
  emptyControlPorts: "Many Banter action nodes use the empty string as both control input and output port",
  outputPorts: {
    OnCollisionEnter: "'data' (not 'collision')",
    Greater: "'comparison' (not 'greater')",
    GetLocalUserState: "'Position' and 'Rotation' (capitalized!)",
  },
  getComponent: "Use InvokeMember with GetComponent method, not Unity.VisualScripting.GetComponent node",
  guids: "Generate real hex GUIDs - never use patterns like 'a1a1a1a1-...'",
};
