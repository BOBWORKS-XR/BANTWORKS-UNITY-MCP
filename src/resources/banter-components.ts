/**
 * Complete Banter SDK Component Definitions
 *
 * All 68 components with their properties, methods, and usage patterns.
 * This is the authoritative reference for Claude when working with Banter.
 */

export interface BanterProperty {
  name: string;
  type: string;
  description: string;
  default?: unknown;
}

export interface BanterMethod {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  returnType: string;
  description: string;
}

export interface BanterComponent {
  name: string;
  category: "main" | "collider" | "geometry" | "joint" | "ui";
  description: string;
  properties: BanterProperty[];
  methods?: BanterMethod[];
  events?: string[];
  notes?: string[];
  jsExample?: string;
}

export const BANTER_COMPONENTS: Record<string, BanterComponent> = {
  // ============================================
  // MAIN COMPONENTS
  // ============================================

  BanterRigidbody: {
    name: "BanterRigidbody",
    category: "main",
    description: "Adds physics simulation to a GameObject. Controls mass, drag, gravity, and movement constraints.",
    properties: [
      { name: "mass", type: "float", description: "Weight affecting inertia and collision response", default: 1.0 },
      { name: "drag", type: "float", description: "Linear velocity reduction (air resistance)", default: 0 },
      { name: "angularDrag", type: "float", description: "Rotational velocity reduction", default: 0.05 },
      { name: "useGravity", type: "bool", description: "Whether gravity affects this object", default: true },
      { name: "isKinematic", type: "bool", description: "If true, physics forces don't affect this object", default: false },
      { name: "centerOfMass", type: "Vector3", description: "Center of mass offset", default: { x: 0, y: 0, z: 0 } },
      { name: "velocity", type: "Vector3", description: "Current linear velocity" },
      { name: "angularVelocity", type: "Vector3", description: "Current rotational velocity" },
      { name: "freezePositionX", type: "bool", description: "Lock X position", default: false },
      { name: "freezePositionY", type: "bool", description: "Lock Y position", default: false },
      { name: "freezePositionZ", type: "bool", description: "Lock Z position", default: false },
      { name: "freezeRotationX", type: "bool", description: "Lock X rotation", default: false },
      { name: "freezeRotationY", type: "bool", description: "Lock Y rotation", default: false },
      { name: "freezeRotationZ", type: "bool", description: "Lock Z rotation", default: false },
      { name: "collisionDetectionMode", type: "CollisionDetectionMode", description: "Discrete, Continuous, ContinuousDynamic, or ContinuousSpeculative", default: "Discrete" },
    ],
    methods: [
      { name: "AddForce", parameters: [{ name: "force", type: "Vector3" }, { name: "mode", type: "ForceMode" }], returnType: "void", description: "Apply force to the rigidbody" },
      { name: "AddTorque", parameters: [{ name: "torque", type: "Vector3" }, { name: "mode", type: "ForceMode" }], returnType: "void", description: "Apply rotational force" },
    ],
    jsExample: `const rb = new BS.BanterRigidbody({ mass: 2, useGravity: true });
obj.AddComponent(rb);
rb.AddForce(new BS.Vector3(0, 10, 0), BS.ForceMode.Impulse);`,
  },

  BanterGrababble: {
    name: "BanterGrababble",
    category: "main",
    description: "Makes an object grabbable in VR. Provides full input control while held.",
    properties: [
      { name: "grabType", type: "BanterGrabType", description: "Default, Point, Cylinder, Ball, or Soft", default: "Default" },
      { name: "grabRadius", type: "float", description: "Grab detection radius", default: 0.1 },
      { name: "gunTriggerSensitivity", type: "float", description: "Trigger input sensitivity", default: 0.5 },
      { name: "gunTriggerFireRate", type: "float", description: "How often gun trigger events fire", default: 0.1 },
      { name: "gunTriggerAutoFire", type: "bool", description: "Continuously fire while trigger held", default: false },
      { name: "blockLeftPrimary", type: "bool", description: "Block left primary button input", default: false },
      { name: "blockLeftSecondary", type: "bool", description: "Block left secondary button input", default: false },
      { name: "blockLeftThumbstick", type: "bool", description: "Block left thumbstick input", default: false },
      { name: "blockLeftThumbstickClick", type: "bool", description: "Block left thumbstick click", default: false },
      { name: "blockLeftTrigger", type: "bool", description: "Block left trigger input", default: false },
      { name: "blockRightPrimary", type: "bool", description: "Block right primary button input", default: false },
      { name: "blockRightSecondary", type: "bool", description: "Block right secondary button input", default: false },
      { name: "blockRightThumbstick", type: "bool", description: "Block right thumbstick input", default: false },
      { name: "blockRightThumbstickClick", type: "bool", description: "Block right thumbstick click", default: false },
      { name: "blockRightTrigger", type: "bool", description: "Block right trigger input", default: false },
    ],
    events: ["grab", "drop", "gun-trigger"],
    jsExample: `const grabbable = new BS.BanterGrababble({
  grabType: BS.BanterGrabType.Point,
  blockRightTrigger: true  // Capture trigger for custom action
});
obj.AddComponent(grabbable);
obj.On("grab", e => console.log("Grabbed with", e.detail.side));`,
  },

  BanterGrabHandle: {
    name: "BanterGrabHandle",
    category: "main",
    description: "Defines a specific grab point on an object. Simpler than BanterGrababble.",
    properties: [
      { name: "radius", type: "float", description: "Handle grab radius", default: 0.1 },
    ],
    jsExample: `obj.AddComponent(new BS.BanterGrabHandle({ radius: 0.15 }));`,
  },

  BanterHeldEvents: {
    name: "BanterHeldEvents",
    category: "main",
    description: "Receives input events while an object is being held. Works with BanterGrababble.",
    properties: [],
    events: ["button-pressed", "button-released", "controller-axis-update", "trigger-axis-update"],
    notes: ["Requires BanterGrababble on the same object", "Use input blocking on BanterGrababble to capture inputs"],
  },

  BanterGLTF: {
    name: "BanterGLTF",
    category: "main",
    description: "Loads 3D models from glTF/GLB files at runtime.",
    properties: [
      { name: "url", type: "string", description: "URL to the .gltf or .glb file" },
      { name: "generateMipMaps", type: "bool", description: "Generate texture mipmaps", default: true },
      { name: "addColliders", type: "bool", description: "Automatically add mesh colliders", default: false },
      { name: "nonConvexColliders", type: "bool", description: "Use non-convex colliders (for static objects)", default: false },
      { name: "slippery", type: "bool", description: "Zero friction on colliders", default: false },
      { name: "climbable", type: "bool", description: "Mark as VR climbing surface", default: false },
      { name: "legacyRotate", type: "bool", description: "Use legacy rotation mode", default: false },
      { name: "childrenLayer", type: "int", description: "Layer to assign to child objects", default: 0 },
    ],
    events: ["loaded", "progress"],
    jsExample: `const gltf = new BS.BanterGLTF({
  url: "https://example.com/model.glb",
  addColliders: true
});
obj.AddComponent(gltf);
gltf.On("loaded", () => console.log("Model loaded!"));`,
  },

  BanterText: {
    name: "BanterText",
    category: "main",
    description: "3D text rendering with TextMeshPro-style features.",
    properties: [
      { name: "text", type: "string", description: "Text content to display" },
      { name: "color", type: "Vector4", description: "RGBA color (0-1 range)", default: { x: 1, y: 1, z: 1, w: 1 } },
      { name: "fontSize", type: "float", description: "Text size", default: 1 },
      { name: "horizontalAlignment", type: "HorizontalAlignment", description: "Left, Center, Right, Justified", default: "Center" },
      { name: "verticalAlignment", type: "VerticalAlignment", description: "Top, Middle, Bottom", default: "Middle" },
      { name: "richText", type: "bool", description: "Enable rich text formatting tags", default: true },
      { name: "enableWordWrapping", type: "bool", description: "Wrap text to fit width", default: true },
      { name: "rectTransformSizeDelta", type: "Vector2", description: "Text box size", default: { x: 10, y: 5 } },
    ],
    jsExample: `obj.AddComponent(new BS.BanterText({
  text: "Hello VR World!",
  fontSize: 2,
  color: new BS.Vector4(1, 0.5, 0, 1)  // Orange
}));`,
  },

  BanterMaterial: {
    name: "BanterMaterial",
    category: "main",
    description: "Applies materials and shaders to geometry.",
    properties: [
      { name: "shaderName", type: "string", description: "Shader to use (e.g., 'Standard', 'Unlit/Color')" },
      { name: "color", type: "Vector4", description: "Main color RGBA", default: { x: 1, y: 1, z: 1, w: 1 } },
      { name: "textureUrl", type: "string", description: "URL to texture image" },
      { name: "side", type: "MaterialSide", description: "Front, Back, or Double", default: "Front" },
      { name: "metallic", type: "float", description: "Metallic value (0-1)", default: 0 },
      { name: "smoothness", type: "float", description: "Smoothness value (0-1)", default: 0.5 },
    ],
    jsExample: `obj.AddComponent(new BS.BanterMaterial({
  color: new BS.Vector4(0.2, 0.6, 1, 1),  // Blue
  metallic: 0.8,
  smoothness: 0.9
}));`,
  },

  BanterAudioSource: {
    name: "BanterAudioSource",
    category: "main",
    description: "3D spatial audio playback.",
    properties: [
      { name: "url", type: "string", description: "URL to audio file" },
      { name: "volume", type: "float", description: "Playback volume (0-1)", default: 1 },
      { name: "pitch", type: "float", description: "Playback pitch", default: 1 },
      { name: "loop", type: "bool", description: "Loop playback", default: false },
      { name: "playOnAwake", type: "bool", description: "Auto-play when loaded", default: true },
      { name: "spatialBlend", type: "float", description: "0 = 2D, 1 = 3D spatial", default: 1 },
      { name: "mute", type: "bool", description: "Mute audio", default: false },
      { name: "minDistance", type: "float", description: "Min distance for 3D falloff", default: 1 },
      { name: "maxDistance", type: "float", description: "Max distance for 3D falloff", default: 500 },
    ],
    methods: [
      { name: "Play", parameters: [], returnType: "void", description: "Start playback" },
      { name: "Stop", parameters: [], returnType: "void", description: "Stop playback" },
      { name: "Pause", parameters: [], returnType: "void", description: "Pause playback" },
    ],
    jsExample: `const audio = new BS.BanterAudioSource({
  url: "https://example.com/sound.mp3",
  loop: true,
  spatialBlend: 1
});
obj.AddComponent(audio);`,
  },

  BanterVideoPlayer: {
    name: "BanterVideoPlayer",
    category: "main",
    description: "Video playback on surfaces.",
    properties: [
      { name: "url", type: "string", description: "URL to video file" },
      { name: "loop", type: "bool", description: "Loop video", default: false },
      { name: "playOnAwake", type: "bool", description: "Auto-play when loaded", default: true },
      { name: "volume", type: "float", description: "Audio volume (0-1)", default: 1 },
    ],
    methods: [
      { name: "Play", parameters: [], returnType: "void", description: "Start playback" },
      { name: "Stop", parameters: [], returnType: "void", description: "Stop playback" },
      { name: "Pause", parameters: [], returnType: "void", description: "Pause playback" },
    ],
  },

  BanterBrowser: {
    name: "BanterBrowser",
    category: "main",
    description: "Embed web browsers on surfaces. Can communicate with scene via messages.",
    properties: [
      { name: "url", type: "string", description: "Initial URL to load" },
      { name: "pageWidth", type: "int", description: "Browser width in pixels", default: 1920 },
      { name: "pageHeight", type: "int", description: "Browser height in pixels", default: 1080 },
      { name: "pixelsPerUnit", type: "float", description: "Pixels per Unity unit", default: 1000 },
      { name: "mipMaps", type: "bool", description: "Generate mipmaps for texture", default: true },
      { name: "actions", type: "string", description: "Browser action commands" },
    ],
    events: ["browser-message"],
    methods: [
      { name: "SendMessage", parameters: [{ name: "message", type: "string" }], returnType: "void", description: "Send message to browser page" },
    ],
    jsExample: `const browser = new BS.BanterBrowser({
  url: "https://example.com",
  pageWidth: 1280,
  pageHeight: 720
});
obj.AddComponent(browser);
browser.On("browser-message", e => console.log(e.detail));`,
  },

  BanterLight: {
    name: "BanterLight",
    category: "main",
    description: "Dynamic lighting (Point, Directional, or Spot).",
    properties: [
      { name: "type", type: "LightType", description: "Point, Directional, or Spot", default: "Point" },
      { name: "color", type: "Vector4", description: "Light color RGBA", default: { x: 1, y: 1, z: 1, w: 1 } },
      { name: "intensity", type: "float", description: "Brightness multiplier", default: 1 },
      { name: "range", type: "float", description: "Light distance (Point/Spot)", default: 10 },
      { name: "spotAngle", type: "float", description: "Cone angle for spotlights", default: 30 },
      { name: "innerSpotAngle", type: "float", description: "Inner cone angle", default: 21 },
      { name: "shadows", type: "LightShadows", description: "None, Hard, or Soft", default: "None" },
    ],
    jsExample: `obj.AddComponent(new BS.BanterLight({
  type: BS.LightType.Spot,
  color: new BS.Vector4(1, 0.9, 0.8, 1),
  intensity: 2,
  spotAngle: 45
}));`,
  },

  BanterPortal: {
    name: "BanterPortal",
    category: "main",
    description: "Portal links to other Banter spaces.",
    properties: [
      { name: "spaceId", type: "string", description: "Target space ID" },
      { name: "spaceUrl", type: "string", description: "Target space URL" },
    ],
  },

  BanterMirror: {
    name: "BanterMirror",
    category: "main",
    description: "Reflective mirror surface.",
    properties: [
      { name: "resolution", type: "int", description: "Mirror texture resolution", default: 1024 },
    ],
  },

  BanterBillboard: {
    name: "BanterBillboard",
    category: "main",
    description: "Makes object always face the camera.",
    properties: [
      { name: "smoothing", type: "float", description: "Rotation smoothing (0 = instant)", default: 0 },
      { name: "enableXAxis", type: "bool", description: "Rotate on X axis", default: false },
      { name: "enableYAxis", type: "bool", description: "Rotate on Y axis", default: true },
      { name: "enableZAxis", type: "bool", description: "Rotate on Z axis", default: false },
    ],
  },

  BanterSyncedObject: {
    name: "BanterSyncedObject",
    category: "main",
    description: "Network synchronization for multiplayer. Syncs transform and physics.",
    properties: [
      { name: "syncPosition", type: "bool", description: "Sync position", default: true },
      { name: "syncRotation", type: "bool", description: "Sync rotation", default: true },
      { name: "syncScale", type: "bool", description: "Sync scale", default: false },
      { name: "syncVelocity", type: "bool", description: "Sync rigidbody velocity", default: true },
    ],
    methods: [
      { name: "RequestOwnership", parameters: [], returnType: "void", description: "Request ownership of this object" },
      { name: "ReleaseOwnership", parameters: [], returnType: "void", description: "Release ownership" },
    ],
    notes: ["Only the owner can modify synced properties", "Use RequestOwnership before making changes"],
  },

  BanterObjectId: {
    name: "BanterObjectId",
    category: "main",
    description: "Unique identifier for JavaScript access. Required for JS to reference this object.",
    properties: [
      { name: "id", type: "string", description: "Unique object ID" },
    ],
    notes: ["Automatically added when using Banter components", "Required for scene.Find() to work"],
  },

  BanterColliderEvents: {
    name: "BanterColliderEvents",
    category: "main",
    description: "Enables collision and trigger events on colliders.",
    properties: [],
    events: ["collision-enter", "collision-exit", "trigger-enter", "trigger-exit"],
    notes: ["Add to objects with colliders to receive physics events"],
    jsExample: `obj.AddComponent(new BS.BanterColliderEvents());
obj.On("collision-enter", e => {
  console.log("Hit:", e.detail.name, "at", e.detail.point);
});`,
  },

  BanterAssetBundle: {
    name: "BanterAssetBundle",
    category: "main",
    description: "Load Unity asset bundles at runtime.",
    properties: [
      { name: "windowsUrl", type: "string", description: "Windows bundle URL" },
      { name: "androidUrl", type: "string", description: "Android bundle URL" },
      { name: "osxUrl", type: "string", description: "macOS bundle URL" },
      { name: "iosUrl", type: "string", description: "iOS bundle URL" },
      { name: "isScene", type: "bool", description: "Bundle contains a scene", default: false },
    ],
    events: ["loaded"],
  },

  BanterKitItem: {
    name: "BanterKitItem",
    category: "main",
    description: "Instantiate prefabs from asset bundles.",
    properties: [
      { name: "kitName", type: "string", description: "Name of the kit/bundle" },
      { name: "itemName", type: "string", description: "Name of the prefab to instantiate" },
    ],
  },

  BanterAttachedObject: {
    name: "BanterAttachedObject",
    category: "main",
    description: "Attach objects to player body parts.",
    properties: [
      { name: "attachmentType", type: "AttachmentType", description: "Head, LeftHand, RightHand, LeftFoot, RightFoot, Chest, Back" },
      { name: "positionOffset", type: "Vector3", description: "Position offset from attachment point" },
      { name: "rotationOffset", type: "Vector3", description: "Rotation offset (Euler angles)" },
    ],
  },

  BanterPhysicMaterial: {
    name: "BanterPhysicMaterial",
    category: "main",
    description: "Physics material for friction and bounciness.",
    properties: [
      { name: "staticFriction", type: "float", description: "Friction when stationary", default: 0.6 },
      { name: "dynamicFriction", type: "float", description: "Friction when moving", default: 0.6 },
      { name: "bounciness", type: "float", description: "Bounce factor (0-1)", default: 0 },
    ],
  },

  BanterWorldObject: {
    name: "BanterWorldObject",
    category: "main",
    description: "Marks object as static world geometry. Optimizes rendering.",
    properties: [],
    notes: ["Use for floors, walls, static scenery"],
  },

  BanterInvertedMesh: {
    name: "BanterInvertedMesh",
    category: "main",
    description: "Inverts mesh normals for inside-out rendering (skyboxes, rooms).",
    properties: [],
  },

  BanterStreetView: {
    name: "BanterStreetView",
    category: "main",
    description: "Google Street View panorama viewer.",
    properties: [
      { name: "panoId", type: "string", description: "Street View panorama ID" },
      { name: "latitude", type: "float", description: "Latitude coordinate" },
      { name: "longitude", type: "float", description: "Longitude coordinate" },
    ],
  },

  BanterAvatarPedestal: {
    name: "BanterAvatarPedestal",
    category: "main",
    description: "Display avatars on pedestals for users to select.",
    properties: [
      { name: "avatarUrl", type: "string", description: "URL to avatar model" },
    ],
  },

  BanterSkinnedMeshRenderer: {
    name: "BanterSkinnedMeshRenderer",
    category: "main",
    description: "Skinned mesh for animated models.",
    properties: [
      { name: "blendShapeWeights", type: "float[]", description: "Blend shape weights" },
    ],
  },

  BanterUIPanel: {
    name: "BanterUIPanel",
    category: "ui",
    description: "VR UI container with haptic and sound feedback.",
    properties: [
      { name: "width", type: "float", description: "Panel width", default: 1 },
      { name: "height", type: "float", description: "Panel height", default: 1 },
      { name: "enableHaptics", type: "bool", description: "Enable haptic feedback", default: true },
      { name: "enableSounds", type: "bool", description: "Enable UI sounds", default: true },
    ],
  },

  // ============================================
  // COLLIDER COMPONENTS
  // ============================================

  BanterBoxCollider: {
    name: "BanterBoxCollider",
    category: "collider",
    description: "Box-shaped collision volume.",
    properties: [
      { name: "center", type: "Vector3", description: "Center offset", default: { x: 0, y: 0, z: 0 } },
      { name: "size", type: "Vector3", description: "Box dimensions", default: { x: 1, y: 1, z: 1 } },
      { name: "isTrigger", type: "bool", description: "Is trigger (no physics)", default: false },
    ],
  },

  BanterSphereCollider: {
    name: "BanterSphereCollider",
    category: "collider",
    description: "Sphere-shaped collision volume.",
    properties: [
      { name: "center", type: "Vector3", description: "Center offset", default: { x: 0, y: 0, z: 0 } },
      { name: "radius", type: "float", description: "Sphere radius", default: 0.5 },
      { name: "isTrigger", type: "bool", description: "Is trigger (no physics)", default: false },
    ],
  },

  BanterCapsuleCollider: {
    name: "BanterCapsuleCollider",
    category: "collider",
    description: "Capsule-shaped collision volume.",
    properties: [
      { name: "center", type: "Vector3", description: "Center offset", default: { x: 0, y: 0, z: 0 } },
      { name: "radius", type: "float", description: "Capsule radius", default: 0.5 },
      { name: "height", type: "float", description: "Capsule height", default: 2 },
      { name: "direction", type: "int", description: "Axis (0=X, 1=Y, 2=Z)", default: 1 },
      { name: "isTrigger", type: "bool", description: "Is trigger (no physics)", default: false },
    ],
  },

  BanterMeshCollider: {
    name: "BanterMeshCollider",
    category: "collider",
    description: "Mesh-based collision (uses object's mesh).",
    properties: [
      { name: "convex", type: "bool", description: "Use convex hull (required for rigidbodies)", default: false },
      { name: "isTrigger", type: "bool", description: "Is trigger (no physics)", default: false },
    ],
    notes: ["Non-convex colliders can only be used with static objects", "Set convex=true if object has a Rigidbody"],
  },

  // ============================================
  // JOINT COMPONENTS
  // ============================================

  BanterFixedJoint: {
    name: "BanterFixedJoint",
    category: "joint",
    description: "Locks two objects together rigidly.",
    properties: [
      { name: "connectedBody", type: "Rigidbody", description: "The other rigidbody to connect to" },
      { name: "breakForce", type: "float", description: "Force required to break joint", default: Infinity },
      { name: "breakTorque", type: "float", description: "Torque required to break joint", default: Infinity },
    ],
  },

  BanterHingeJoint: {
    name: "BanterHingeJoint",
    category: "joint",
    description: "Rotational joint like a door hinge.",
    properties: [
      { name: "connectedBody", type: "Rigidbody", description: "Connected rigidbody" },
      { name: "anchor", type: "Vector3", description: "Hinge anchor point" },
      { name: "axis", type: "Vector3", description: "Rotation axis", default: { x: 0, y: 0, z: 1 } },
      { name: "useLimits", type: "bool", description: "Use angle limits", default: false },
      { name: "limits", type: "JointLimits", description: "Min/max angle limits" },
      { name: "useMotor", type: "bool", description: "Use motor", default: false },
      { name: "motor", type: "JointMotor", description: "Motor settings" },
    ],
  },

  BanterSpringJoint: {
    name: "BanterSpringJoint",
    category: "joint",
    description: "Elastic connection between objects.",
    properties: [
      { name: "connectedBody", type: "Rigidbody", description: "Connected rigidbody" },
      { name: "anchor", type: "Vector3", description: "Local anchor point" },
      { name: "connectedAnchor", type: "Vector3", description: "Anchor on connected body" },
      { name: "spring", type: "float", description: "Spring strength", default: 10 },
      { name: "damper", type: "float", description: "Damping force", default: 0.2 },
      { name: "minDistance", type: "float", description: "Minimum distance", default: 0 },
      { name: "maxDistance", type: "float", description: "Maximum distance", default: 0 },
    ],
  },

  BanterCharacterJoint: {
    name: "BanterCharacterJoint",
    category: "joint",
    description: "Human-like joint with swing and twist limits (for ragdolls).",
    properties: [
      { name: "connectedBody", type: "Rigidbody", description: "Connected rigidbody" },
      { name: "anchor", type: "Vector3", description: "Local anchor" },
      { name: "axis", type: "Vector3", description: "Primary axis" },
      { name: "swingAxis", type: "Vector3", description: "Swing axis" },
      { name: "lowTwistLimit", type: "float", description: "Low twist angle limit" },
      { name: "highTwistLimit", type: "float", description: "High twist angle limit" },
      { name: "swing1Limit", type: "float", description: "Swing limit on axis 1" },
      { name: "swing2Limit", type: "float", description: "Swing limit on axis 2" },
    ],
  },

  BanterConfigurableJoint: {
    name: "BanterConfigurableJoint",
    category: "joint",
    description: "Fully customizable joint with per-axis control.",
    properties: [
      { name: "connectedBody", type: "Rigidbody", description: "Connected rigidbody" },
      { name: "anchor", type: "Vector3", description: "Local anchor" },
      { name: "axis", type: "Vector3", description: "Primary axis" },
      { name: "secondaryAxis", type: "Vector3", description: "Secondary axis" },
      { name: "xMotion", type: "ConfigurableJointMotion", description: "X axis motion (Locked, Limited, Free)" },
      { name: "yMotion", type: "ConfigurableJointMotion", description: "Y axis motion" },
      { name: "zMotion", type: "ConfigurableJointMotion", description: "Z axis motion" },
      { name: "angularXMotion", type: "ConfigurableJointMotion", description: "Angular X motion" },
      { name: "angularYMotion", type: "ConfigurableJointMotion", description: "Angular Y motion" },
      { name: "angularZMotion", type: "ConfigurableJointMotion", description: "Angular Z motion" },
    ],
  },

  // ============================================
  // GEOMETRY COMPONENTS (Primitives)
  // ============================================

  BanterBox: {
    name: "BanterBox",
    category: "geometry",
    description: "Box/cube geometry.",
    properties: [
      { name: "width", type: "float", description: "Width (X)", default: 1 },
      { name: "height", type: "float", description: "Height (Y)", default: 1 },
      { name: "depth", type: "float", description: "Depth (Z)", default: 1 },
      { name: "widthSegments", type: "int", description: "Width subdivisions", default: 1 },
      { name: "heightSegments", type: "int", description: "Height subdivisions", default: 1 },
      { name: "depthSegments", type: "int", description: "Depth subdivisions", default: 1 },
    ],
    jsExample: `obj.AddComponent(new BS.BanterBox({ width: 2, height: 1, depth: 0.5 }));`,
  },

  BanterSphere: {
    name: "BanterSphere",
    category: "geometry",
    description: "Sphere geometry.",
    properties: [
      { name: "radius", type: "float", description: "Sphere radius", default: 0.5 },
      { name: "widthSegments", type: "int", description: "Horizontal segments", default: 32 },
      { name: "heightSegments", type: "int", description: "Vertical segments", default: 16 },
      { name: "phiStart", type: "float", description: "Horizontal start angle", default: 0 },
      { name: "phiLength", type: "float", description: "Horizontal sweep angle", default: 6.283185 },
      { name: "thetaStart", type: "float", description: "Vertical start angle", default: 0 },
      { name: "thetaLength", type: "float", description: "Vertical sweep angle", default: 3.141593 },
    ],
    jsExample: `obj.AddComponent(new BS.BanterSphere({ radius: 1 }));`,
  },

  BanterPlane: {
    name: "BanterPlane",
    category: "geometry",
    description: "Flat plane geometry (faces -Z direction).",
    properties: [
      { name: "width", type: "float", description: "Width", default: 1 },
      { name: "height", type: "float", description: "Height", default: 1 },
      { name: "widthSegments", type: "int", description: "Width subdivisions", default: 1 },
      { name: "heightSegments", type: "int", description: "Height subdivisions", default: 1 },
    ],
  },

  BanterCylinder: {
    name: "BanterCylinder",
    category: "geometry",
    description: "Cylinder geometry.",
    properties: [
      { name: "radiusTop", type: "float", description: "Top radius", default: 0.5 },
      { name: "radiusBottom", type: "float", description: "Bottom radius", default: 0.5 },
      { name: "height", type: "float", description: "Cylinder height", default: 1 },
      { name: "radialSegments", type: "int", description: "Radial subdivisions", default: 32 },
      { name: "heightSegments", type: "int", description: "Height subdivisions", default: 1 },
      { name: "openEnded", type: "bool", description: "No top/bottom caps", default: false },
    ],
  },

  BanterCone: {
    name: "BanterCone",
    category: "geometry",
    description: "Cone geometry.",
    properties: [
      { name: "radius", type: "float", description: "Base radius", default: 0.5 },
      { name: "height", type: "float", description: "Cone height", default: 1 },
      { name: "radialSegments", type: "int", description: "Radial subdivisions", default: 32 },
      { name: "heightSegments", type: "int", description: "Height subdivisions", default: 1 },
      { name: "openEnded", type: "bool", description: "No bottom cap", default: false },
    ],
  },

  BanterCircle: {
    name: "BanterCircle",
    category: "geometry",
    description: "2D circle geometry.",
    properties: [
      { name: "radius", type: "float", description: "Circle radius", default: 0.5 },
      { name: "segments", type: "int", description: "Number of segments", default: 32 },
      { name: "thetaStart", type: "float", description: "Start angle", default: 0 },
      { name: "thetaLength", type: "float", description: "Sweep angle", default: 6.283185 },
    ],
  },

  BanterTorus: {
    name: "BanterTorus",
    category: "geometry",
    description: "Torus/donut geometry.",
    properties: [
      { name: "radius", type: "float", description: "Main radius", default: 0.5 },
      { name: "tube", type: "float", description: "Tube radius", default: 0.2 },
      { name: "radialSegments", type: "int", description: "Radial segments", default: 16 },
      { name: "tubularSegments", type: "int", description: "Tubular segments", default: 48 },
      { name: "arc", type: "float", description: "Sweep angle", default: 6.283185 },
    ],
  },

  BanterTorusKnot: {
    name: "BanterTorusKnot",
    category: "geometry",
    description: "Torus knot mathematical surface.",
    properties: [
      { name: "radius", type: "float", description: "Main radius", default: 0.5 },
      { name: "tube", type: "float", description: "Tube radius", default: 0.2 },
      { name: "tubularSegments", type: "int", description: "Tubular segments", default: 64 },
      { name: "radialSegments", type: "int", description: "Radial segments", default: 8 },
      { name: "p", type: "int", description: "P parameter (winds around axis)", default: 2 },
      { name: "q", type: "int", description: "Q parameter (winds inside torus)", default: 3 },
    ],
  },

  BanterRing: {
    name: "BanterRing",
    category: "geometry",
    description: "Ring/annulus geometry.",
    properties: [
      { name: "innerRadius", type: "float", description: "Inner radius", default: 0.3 },
      { name: "outerRadius", type: "float", description: "Outer radius", default: 0.5 },
      { name: "thetaSegments", type: "int", description: "Radial segments", default: 32 },
      { name: "phiSegments", type: "int", description: "Concentric segments", default: 1 },
    ],
  },

  // Parametric surfaces
  BanterApple: { name: "BanterApple", category: "geometry", description: "Apple-shaped parametric surface.", properties: [] },
  BanterKlein: { name: "BanterKlein", category: "geometry", description: "Klein bottle surface.", properties: [] },
  BanterMobius: { name: "BanterMobius", category: "geometry", description: "Möbius strip.", properties: [] },
  BanterMobius3d: { name: "BanterMobius3d", category: "geometry", description: "3D Möbius variant.", properties: [] },
  BanterCatenoid: { name: "BanterCatenoid", category: "geometry", description: "Catenoid minimal surface.", properties: [] },
  BanterHelicoid: { name: "BanterHelicoid", category: "geometry", description: "Helicoid spiral surface.", properties: [] },
  BanterFermet: { name: "BanterFermet", category: "geometry", description: "Fermat spiral surface.", properties: [] },
  BanterNatica: { name: "BanterNatica", category: "geometry", description: "Natica shell surface.", properties: [] },
  BanterScherk: { name: "BanterScherk", category: "geometry", description: "Scherk minimal surface.", properties: [] },
  BanterSnail: { name: "BanterSnail", category: "geometry", description: "Snail shell surface.", properties: [] },
  BanterSpiral: { name: "BanterSpiral", category: "geometry", description: "Spiral surface.", properties: [] },
  BanterSpring: { name: "BanterSpring", category: "geometry", description: "Spring/coil geometry.", properties: [] },
  BanterPillow: { name: "BanterPillow", category: "geometry", description: "Pillow surface.", properties: [] },
  BanterHorn: { name: "BanterHorn", category: "geometry", description: "Horn surface.", properties: [] },
};

// Export component list by category
export const COMPONENT_CATEGORIES = {
  main: Object.values(BANTER_COMPONENTS).filter((c) => c.category === "main").map((c) => c.name),
  collider: Object.values(BANTER_COMPONENTS).filter((c) => c.category === "collider").map((c) => c.name),
  geometry: Object.values(BANTER_COMPONENTS).filter((c) => c.category === "geometry").map((c) => c.name),
  joint: Object.values(BANTER_COMPONENTS).filter((c) => c.category === "joint").map((c) => c.name),
  ui: Object.values(BANTER_COMPONENTS).filter((c) => c.category === "ui").map((c) => c.name),
};
