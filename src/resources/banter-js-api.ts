/**
 * Banter JavaScript API Reference
 *
 * Complete BS.* namespace documentation for runtime scripting.
 * This runs in WebRoot and in Banter JS Visual Scripting nodes.
 */

export interface JSClass {
  name: string;
  description: string;
  constructorParams?: Array<{ name: string; type: string; description: string }>;
  properties: Array<{ name: string; type: string; description: string; readonly?: boolean }>;
  methods: Array<{
    name: string;
    parameters: Array<{ name: string; type: string }>;
    returnType: string;
    description: string;
    async?: boolean;
  }>;
  events?: Array<{ name: string; detail: string; description: string }>;
  staticMethods?: Array<{
    name: string;
    parameters: Array<{ name: string; type: string }>;
    returnType: string;
    description: string;
  }>;
  example?: string;
}

export const BANTER_JS_API: Record<string, JSClass> = {
  // ============================================
  // CORE CLASSES
  // ============================================

  BanterScene: {
    name: "BanterScene",
    description: "Main scene singleton. Entry point for all Banter functionality.",
    properties: [
      { name: "objects", type: "GameObject[]", description: "All GameObjects in scene", readonly: true },
      { name: "components", type: "Component[]", description: "All components in scene", readonly: true },
      { name: "users", type: "User[]", description: "All users in space", readonly: true },
      { name: "localUser", type: "User", description: "The local user", readonly: true },
      { name: "unityLoaded", type: "boolean", description: "Whether Unity is fully loaded", readonly: true },
      { name: "spaceState", type: "object", description: "Shared space state properties", readonly: true },
    ],
    methods: [
      { name: "Find", parameters: [{ name: "id", type: "string" }], returnType: "GameObject", description: "Find object by ID" },
      { name: "FindByPath", parameters: [{ name: "path", type: "string" }], returnType: "GameObject", description: "Find object by hierarchy path" },
      { name: "Instantiate", parameters: [{ name: "prefabName", type: "string" }], returnType: "GameObject", description: "Instantiate a prefab", async: true },
      { name: "SetSettings", parameters: [{ name: "settings", type: "SceneSettings" }], returnType: "void", description: "Apply scene settings" },
      { name: "Raycast", parameters: [{ name: "origin", type: "Vector3" }, { name: "direction", type: "Vector3" }], returnType: "RaycastHit", description: "Cast a ray" },
      { name: "TeleportTo", parameters: [{ name: "position", type: "Vector3" }, { name: "rotation", type: "Quaternion" }], returnType: "void", description: "Teleport local user" },
      { name: "SetPublicSpaceProps", parameters: [{ name: "props", type: "object" }], returnType: "void", description: "Set public shared state" },
      { name: "SetProtectedSpaceProps", parameters: [{ name: "props", type: "object" }], returnType: "void", description: "Set admin-only state" },
      { name: "SetUserProps", parameters: [{ name: "props", type: "object" }], returnType: "void", description: "Set user-specific properties" },
      { name: "OneShot", parameters: [{ name: "data", type: "string" }], returnType: "void", description: "Broadcast message to all users" },
      { name: "On", parameters: [{ name: "event", type: "string" }, { name: "callback", type: "function" }], returnType: "void", description: "Subscribe to scene event" },
      { name: "Off", parameters: [{ name: "event", type: "string" }, { name: "callback", type: "function" }], returnType: "void", description: "Unsubscribe from event" },
    ],
    staticMethods: [
      { name: "GetInstance", parameters: [], returnType: "BanterScene", description: "Get the scene singleton" },
    ],
    events: [
      { name: "loaded", detail: "none", description: "Scene settled, objects enumerated" },
      { name: "unity-loaded", detail: "none", description: "Unity fully loaded, ready for interaction" },
      { name: "user-joined", detail: "User", description: "User connected to space" },
      { name: "user-left", detail: "User", description: "User disconnected from space" },
      { name: "space-state-changed", detail: "{ changes: object }", description: "Shared state changed" },
      { name: "one-shot", detail: "{ fromId, fromAdmin, data }", description: "Broadcast message received" },
      { name: "button-pressed", detail: "{ button, side }", description: "Controller button pressed (when blocked)" },
      { name: "button-released", detail: "{ button, side }", description: "Controller button released" },
      { name: "transcription", detail: "{ id, message }", description: "Speech-to-text result" },
    ],
    example: `const scene = BS.BanterScene.GetInstance();
scene.On("loaded", () => {
  console.log("Scene loaded with", scene.objects.length, "objects");
});`,
  },

  GameObject: {
    name: "GameObject",
    description: "Basic building block of a scene. Container for components.",
    constructorParams: [
      { name: "options", type: "object", description: "{ name?: string, position?: Vector3, rotation?: Quaternion, scale?: Vector3 }" },
    ],
    properties: [
      { name: "id", type: "string", description: "Unique identifier", readonly: true },
      { name: "name", type: "string", description: "Object name" },
      { name: "active", type: "boolean", description: "Is object active" },
      { name: "position", type: "Vector3", description: "World position" },
      { name: "localPosition", type: "Vector3", description: "Local position relative to parent" },
      { name: "rotation", type: "Quaternion", description: "World rotation" },
      { name: "localRotation", type: "Quaternion", description: "Local rotation" },
      { name: "scale", type: "Vector3", description: "Local scale" },
      { name: "parent", type: "GameObject", description: "Parent object" },
      { name: "children", type: "GameObject[]", description: "Child objects", readonly: true },
      { name: "components", type: "Component[]", description: "Attached components", readonly: true },
    ],
    methods: [
      { name: "AddComponent", parameters: [{ name: "component", type: "Component" }], returnType: "Component", description: "Add a component" },
      { name: "GetComponent", parameters: [{ name: "type", type: "ComponentType" }], returnType: "Component", description: "Get component by type" },
      { name: "RemoveComponent", parameters: [{ name: "component", type: "Component" }], returnType: "void", description: "Remove a component" },
      { name: "SetPosition", parameters: [{ name: "position", type: "Vector3" }], returnType: "void", description: "Set world position" },
      { name: "SetRotation", parameters: [{ name: "rotation", type: "Quaternion" }], returnType: "void", description: "Set world rotation" },
      { name: "SetScale", parameters: [{ name: "scale", type: "Vector3" }], returnType: "void", description: "Set local scale" },
      { name: "SetParent", parameters: [{ name: "parent", type: "GameObject" }], returnType: "void", description: "Set parent object" },
      { name: "SetActive", parameters: [{ name: "active", type: "boolean" }], returnType: "void", description: "Enable/disable object" },
      { name: "Destroy", parameters: [], returnType: "void", description: "Destroy this object" },
      { name: "LookAt", parameters: [{ name: "target", type: "Vector3" }], returnType: "void", description: "Rotate to look at target" },
      { name: "Async", parameters: [], returnType: "Promise<GameObject>", description: "Wait for Unity creation", async: true },
      { name: "On", parameters: [{ name: "event", type: "string" }, { name: "callback", type: "function" }], returnType: "void", description: "Subscribe to object event" },
    ],
    events: [
      { name: "click", detail: "{ point, normal }", description: "Object clicked" },
      { name: "grab", detail: "{ point, normal, side }", description: "Object grabbed" },
      { name: "drop", detail: "{ side }", description: "Object released" },
      { name: "collision-enter", detail: "{ name, tag, collider, point, normal, user }", description: "Collision started" },
      { name: "collision-exit", detail: "{ name, tag, collider, object }", description: "Collision ended" },
      { name: "trigger-enter", detail: "{ name, tag, collider, object }", description: "Entered trigger" },
      { name: "trigger-exit", detail: "{ name, tag, collider, object }", description: "Exited trigger" },
      { name: "browser-message", detail: "string", description: "Message from embedded browser" },
    ],
    example: `const obj = new BS.GameObject({ name: "MyCube" });
obj.AddComponent(new BS.BanterBox({ width: 1, height: 1, depth: 1 }));
obj.AddComponent(new BS.BanterMaterial({ color: new BS.Vector4(1, 0, 0, 1) }));
obj.SetPosition(new BS.Vector3(0, 1, 0));`,
  },

  // ============================================
  // MATH TYPES
  // ============================================

  Vector2: {
    name: "Vector2",
    description: "2D vector for positions, sizes, UV coordinates.",
    constructorParams: [
      { name: "x", type: "number", description: "X component" },
      { name: "y", type: "number", description: "Y component" },
    ],
    properties: [
      { name: "x", type: "number", description: "X component" },
      { name: "y", type: "number", description: "Y component" },
    ],
    methods: [
      { name: "Add", parameters: [{ name: "v", type: "Vector2" }], returnType: "Vector2", description: "Add vectors" },
      { name: "Sub", parameters: [{ name: "v", type: "Vector2" }], returnType: "Vector2", description: "Subtract vectors" },
      { name: "Mul", parameters: [{ name: "scalar", type: "number" }], returnType: "Vector2", description: "Multiply by scalar" },
      { name: "Magnitude", parameters: [], returnType: "number", description: "Get length" },
      { name: "Normalized", parameters: [], returnType: "Vector2", description: "Get unit vector" },
    ],
    example: `const size = new BS.Vector2(1920, 1080);`,
  },

  Vector3: {
    name: "Vector3",
    description: "3D vector for positions, directions, scales.",
    constructorParams: [
      { name: "x", type: "number", description: "X component" },
      { name: "y", type: "number", description: "Y component" },
      { name: "z", type: "number", description: "Z component" },
    ],
    properties: [
      { name: "x", type: "number", description: "X component" },
      { name: "y", type: "number", description: "Y component" },
      { name: "z", type: "number", description: "Z component" },
    ],
    methods: [
      { name: "Add", parameters: [{ name: "v", type: "Vector3" }], returnType: "Vector3", description: "Add vectors" },
      { name: "Sub", parameters: [{ name: "v", type: "Vector3" }], returnType: "Vector3", description: "Subtract vectors" },
      { name: "Mul", parameters: [{ name: "scalar", type: "number" }], returnType: "Vector3", description: "Multiply by scalar" },
      { name: "Cross", parameters: [{ name: "v", type: "Vector3" }], returnType: "Vector3", description: "Cross product" },
      { name: "Dot", parameters: [{ name: "v", type: "Vector3" }], returnType: "number", description: "Dot product" },
      { name: "Magnitude", parameters: [], returnType: "number", description: "Get length" },
      { name: "Normalized", parameters: [], returnType: "Vector3", description: "Get unit vector" },
      { name: "Distance", parameters: [{ name: "v", type: "Vector3" }], returnType: "number", description: "Distance to another vector" },
    ],
    staticMethods: [
      { name: "Zero", parameters: [], returnType: "Vector3", description: "(0, 0, 0)" },
      { name: "One", parameters: [], returnType: "Vector3", description: "(1, 1, 1)" },
      { name: "Up", parameters: [], returnType: "Vector3", description: "(0, 1, 0)" },
      { name: "Down", parameters: [], returnType: "Vector3", description: "(0, -1, 0)" },
      { name: "Forward", parameters: [], returnType: "Vector3", description: "(0, 0, 1)" },
      { name: "Back", parameters: [], returnType: "Vector3", description: "(0, 0, -1)" },
      { name: "Left", parameters: [], returnType: "Vector3", description: "(-1, 0, 0)" },
      { name: "Right", parameters: [], returnType: "Vector3", description: "(1, 0, 0)" },
    ],
    example: `const pos = new BS.Vector3(0, 1.5, -2);
const forward = BS.Vector3.Forward();`,
  },

  Vector4: {
    name: "Vector4",
    description: "4D vector for colors (RGBA) and quaternions.",
    constructorParams: [
      { name: "x", type: "number", description: "X/R component" },
      { name: "y", type: "number", description: "Y/G component" },
      { name: "z", type: "number", description: "Z/B component" },
      { name: "w", type: "number", description: "W/A component" },
    ],
    properties: [
      { name: "x", type: "number", description: "X/R component" },
      { name: "y", type: "number", description: "Y/G component" },
      { name: "z", type: "number", description: "Z/B component" },
      { name: "w", type: "number", description: "W/A component" },
    ],
    methods: [],
    example: `const red = new BS.Vector4(1, 0, 0, 1);  // RGBA`,
  },

  Quaternion: {
    name: "Quaternion",
    description: "Rotation without gimbal lock. Preferred over Euler angles.",
    constructorParams: [
      { name: "x", type: "number", description: "X component" },
      { name: "y", type: "number", description: "Y component" },
      { name: "z", type: "number", description: "Z component" },
      { name: "w", type: "number", description: "W component" },
    ],
    properties: [
      { name: "x", type: "number", description: "X component" },
      { name: "y", type: "number", description: "Y component" },
      { name: "z", type: "number", description: "Z component" },
      { name: "w", type: "number", description: "W component" },
    ],
    methods: [
      { name: "Mul", parameters: [{ name: "q", type: "Quaternion" }], returnType: "Quaternion", description: "Combine rotations" },
    ],
    staticMethods: [
      { name: "Identity", parameters: [], returnType: "Quaternion", description: "No rotation" },
      { name: "Euler", parameters: [{ name: "x", type: "number" }, { name: "y", type: "number" }, { name: "z", type: "number" }], returnType: "Quaternion", description: "Create from Euler angles (degrees)" },
      { name: "FromToRotation", parameters: [{ name: "from", type: "Vector3" }, { name: "to", type: "Vector3" }], returnType: "Quaternion", description: "Rotation from one direction to another" },
      { name: "LookRotation", parameters: [{ name: "forward", type: "Vector3" }, { name: "up", type: "Vector3" }], returnType: "Quaternion", description: "Create rotation looking at direction" },
    ],
    example: `const rot = BS.Quaternion.Euler(0, 45, 0);  // 45 degrees around Y`,
  },

  // ============================================
  // SCENE SETTINGS
  // ============================================

  SceneSettings: {
    name: "SceneSettings",
    description: "Configure space behavior and physics.",
    properties: [
      { name: "EnableDevTools", type: "boolean", description: "Enable developer tools" },
      { name: "EnableTeleport", type: "boolean", description: "Allow teleportation" },
      { name: "EnableForceGrab", type: "boolean", description: "Allow force grab (grab from distance)" },
      { name: "EnableSpiderMan", type: "boolean", description: "Enable grappling hook" },
      { name: "EnablePortals", type: "boolean", description: "Allow portals" },
      { name: "EnableGuests", type: "boolean", description: "Allow guest users" },
      { name: "EnableAvatars", type: "boolean", description: "Show user avatars" },
      { name: "EnableQuaternionPose", type: "boolean", description: "Use quaternion for avatar pose" },
      { name: "EnableControllerExtras", type: "boolean", description: "Extra controller features" },
      { name: "EnableFriendPositionJoin", type: "boolean", description: "Spawn at friend location" },
      { name: "EnableDefaultTextures", type: "boolean", description: "Use default textures" },
      { name: "MaxOccupancy", type: "number", description: "Max users in space" },
      { name: "RefreshRate", type: "number", description: "Target refresh rate (72, 90, 120)" },
      { name: "ClippingPlane", type: "Vector2", description: "Near/far clip planes" },
      { name: "SpawnPoint", type: "Vector3", description: "Default spawn position" },
      { name: "SpawnRotation", type: "Quaternion", description: "Default spawn rotation" },
      { name: "Gravity", type: "Vector3", description: "Gravity vector (default: 0, -9.81, 0)" },
      { name: "PhysicsMoveSpeed", type: "number", description: "Player move speed" },
      { name: "PhysicsJumpStrength", type: "number", description: "Player jump force" },
    ],
    methods: [],
    example: `const settings = new BS.SceneSettings();
settings.EnableTeleport = true;
settings.MaxOccupancy = 20;
settings.Gravity = new BS.Vector3(0, -4.9, 0);  // Half gravity
scene.SetSettings(settings);`,
  },
};

// ============================================
// ENUMS AND CONSTANTS
// ============================================

export const BANTER_ENUMS = {
  ComponentType: {
    description: "Component type identifiers for GetComponent()",
    values: [
      "Transform", "BanterRigidbody", "BanterGrababble", "BanterGrabHandle",
      "BanterGLTF", "BanterText", "BanterMaterial", "BanterAudioSource",
      "BanterVideoPlayer", "BanterBrowser", "BanterLight", "BanterPortal",
      "BanterMirror", "BanterBillboard", "BanterSyncedObject", "BanterColliderEvents",
      "BanterAssetBundle", "BanterKitItem", "BanterUIPanel",
      "BoxCollider", "SphereCollider", "CapsuleCollider", "MeshCollider",
      "BanterBox", "BanterSphere", "BanterPlane", "BanterCylinder",
    ],
    shorthand: "BS.CT",
  },

  PropertyName: {
    description: "Property name identifiers for component properties",
    values: [
      "position", "localPosition", "rotation", "localRotation", "scale",
      "velocity", "angularVelocity", "mass", "drag", "useGravity",
      "text", "fontSize", "color", "url", "volume", "loop",
    ],
    shorthand: "BS.PN",
  },

  HandSide: {
    description: "Which VR controller hand",
    values: ["LEFT", "RIGHT"],
    shorthand: "BS.HandSide",
  },

  ButtonType: {
    description: "VR controller button types",
    values: ["TRIGGER", "GRIP", "PRIMARY", "SECONDARY", "THUMBSTICK"],
    shorthand: "BS.ButtonType",
  },

  ForceMode: {
    description: "How to apply physics forces",
    values: ["Force", "Impulse", "VelocityChange", "Acceleration"],
    shorthand: "BS.ForceMode",
  },

  LightType: {
    description: "Types of lights",
    values: ["Point", "Directional", "Spot"],
    shorthand: "BS.LightType",
  },

  LightShadows: {
    description: "Shadow modes for lights",
    values: ["None", "Hard", "Soft"],
    shorthand: "BS.LightShadows",
  },

  MaterialSide: {
    description: "Which side of geometry to render",
    values: ["Front", "Back", "Double"],
    shorthand: "BS.MaterialSide",
  },

  BanterGrabType: {
    description: "How objects are grabbed",
    values: ["Default", "Point", "Cylinder", "Ball", "Soft"],
    shorthand: "BS.BanterGrabType",
  },

  AttachmentType: {
    description: "Body parts for attached objects",
    values: ["Head", "LeftHand", "RightHand", "LeftFoot", "RightFoot", "Chest", "Back"],
    shorthand: "BS.AttachmentType",
  },

  BanterLayers: {
    description: "Physics/rendering layers",
    values: {
      Default: 0,
      UserLayer1: 6,
      UserLayer2: 7,
      NetworkPlayer: 17,
      Grabbable: 20,
      HandColliders: 21,
      PhysicsPlayer: 23,
    },
    shorthand: "BS.L",
  },
};

// Complete code example
export const FULL_EXAMPLE = `
// Complete Banter scene example
const scene = BS.BanterScene.GetInstance();

// Wait for Unity to be ready
scene.On("unity-loaded", async () => {
  // Create a grabbable ball
  const ball = new BS.GameObject({ name: "GrabbableBall" });

  // Add geometry
  ball.AddComponent(new BS.BanterSphere({ radius: 0.15 }));

  // Add physics
  ball.AddComponent(new BS.BanterRigidbody({
    mass: 0.5,
    useGravity: true
  }));

  // Add collider
  ball.AddComponent(new BS.BanterSphereCollider({ radius: 0.15 }));

  // Add material
  ball.AddComponent(new BS.BanterMaterial({
    color: new BS.Vector4(0.2, 0.6, 1, 1)  // Blue
  }));

  // Make it grabbable
  ball.AddComponent(new BS.BanterGrababble({
    grabType: BS.BanterGrabType.Ball
  }));

  // Position it
  ball.SetPosition(new BS.Vector3(0, 1.5, -1));

  // Handle grab event
  ball.On("grab", e => {
    console.log("Grabbed with", e.detail.side);
  });

  // Handle collision
  ball.AddComponent(new BS.BanterColliderEvents());
  ball.On("collision-enter", e => {
    console.log("Hit", e.detail.name);
  });
});
`;
