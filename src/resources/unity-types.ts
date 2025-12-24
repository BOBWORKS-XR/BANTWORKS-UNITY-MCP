/**
 * Unity Type Reference
 *
 * Core Unity types that Banter builds upon.
 * Understanding these is essential for working with Banter.
 */

export interface UnityType {
  name: string;
  namespace: string;
  description: string;
  properties?: Array<{ name: string; type: string; description: string }>;
  methods?: Array<{ name: string; signature: string; description: string }>;
  notes?: string[];
}

export const UNITY_TYPES: Record<string, UnityType> = {
  // ============================================
  // CORE TYPES
  // ============================================

  GameObject: {
    name: "GameObject",
    namespace: "UnityEngine",
    description: "Base class for all entities in Unity scenes. Container for components.",
    properties: [
      { name: "name", type: "string", description: "Object name" },
      { name: "tag", type: "string", description: "Object tag for grouping" },
      { name: "layer", type: "int", description: "Physics/rendering layer" },
      { name: "activeSelf", type: "bool", description: "Is object locally active" },
      { name: "activeInHierarchy", type: "bool", description: "Is object active considering parents" },
      { name: "transform", type: "Transform", description: "The Transform component" },
    ],
    methods: [
      { name: "GetComponent<T>", signature: "GetComponent<T>() : T", description: "Get component of type T" },
      { name: "AddComponent<T>", signature: "AddComponent<T>() : T", description: "Add component of type T" },
      { name: "SetActive", signature: "SetActive(bool value)", description: "Enable/disable object" },
    ],
    notes: ["In Banter, use BS.GameObject which wraps Unity's GameObject"],
  },

  Transform: {
    name: "Transform",
    namespace: "UnityEngine",
    description: "Position, rotation, and scale of an object. Every GameObject has one.",
    properties: [
      { name: "position", type: "Vector3", description: "World position" },
      { name: "localPosition", type: "Vector3", description: "Position relative to parent" },
      { name: "rotation", type: "Quaternion", description: "World rotation" },
      { name: "localRotation", type: "Quaternion", description: "Rotation relative to parent" },
      { name: "localScale", type: "Vector3", description: "Scale relative to parent" },
      { name: "eulerAngles", type: "Vector3", description: "Rotation as Euler angles (degrees)" },
      { name: "forward", type: "Vector3", description: "Forward direction (blue axis)" },
      { name: "right", type: "Vector3", description: "Right direction (red axis)" },
      { name: "up", type: "Vector3", description: "Up direction (green axis)" },
      { name: "parent", type: "Transform", description: "Parent transform" },
      { name: "childCount", type: "int", description: "Number of children" },
    ],
    methods: [
      { name: "Translate", signature: "Translate(Vector3 translation, Space relativeTo)", description: "Move object" },
      { name: "Rotate", signature: "Rotate(Vector3 eulers, Space relativeTo)", description: "Rotate object" },
      { name: "LookAt", signature: "LookAt(Vector3 target)", description: "Look at a point" },
      { name: "SetParent", signature: "SetParent(Transform parent)", description: "Change parent" },
      { name: "GetChild", signature: "GetChild(int index) : Transform", description: "Get child by index" },
    ],
  },

  Component: {
    name: "Component",
    namespace: "UnityEngine",
    description: "Base class for everything attached to GameObjects.",
    properties: [
      { name: "gameObject", type: "GameObject", description: "The GameObject this is attached to" },
      { name: "transform", type: "Transform", description: "The Transform of the GameObject" },
      { name: "tag", type: "string", description: "Tag of the GameObject" },
    ],
    methods: [
      { name: "GetComponent<T>", signature: "GetComponent<T>() : T", description: "Get sibling component" },
    ],
  },

  // ============================================
  // MATH TYPES
  // ============================================

  Vector3: {
    name: "Vector3",
    namespace: "UnityEngine",
    description: "3D vector for positions, directions, scales. Most common math type.",
    properties: [
      { name: "x", type: "float", description: "X component" },
      { name: "y", type: "float", description: "Y component" },
      { name: "z", type: "float", description: "Z component" },
      { name: "magnitude", type: "float", description: "Length of vector" },
      { name: "normalized", type: "Vector3", description: "Unit vector (length 1)" },
    ],
    methods: [
      { name: "Distance", signature: "static Distance(Vector3 a, Vector3 b) : float", description: "Distance between two points" },
      { name: "Lerp", signature: "static Lerp(Vector3 a, Vector3 b, float t) : Vector3", description: "Linear interpolation" },
      { name: "Dot", signature: "static Dot(Vector3 a, Vector3 b) : float", description: "Dot product" },
      { name: "Cross", signature: "static Cross(Vector3 a, Vector3 b) : Vector3", description: "Cross product" },
    ],
    notes: [
      "Unity uses left-handed Y-up coordinate system",
      "Forward is +Z, Right is +X, Up is +Y",
      "Common statics: Vector3.zero, Vector3.one, Vector3.up, Vector3.forward",
    ],
  },

  Quaternion: {
    name: "Quaternion",
    namespace: "UnityEngine",
    description: "Rotation representation. Avoids gimbal lock unlike Euler angles.",
    properties: [
      { name: "x", type: "float", description: "X component" },
      { name: "y", type: "float", description: "Y component" },
      { name: "z", type: "float", description: "Z component" },
      { name: "w", type: "float", description: "W component" },
      { name: "eulerAngles", type: "Vector3", description: "Rotation as Euler angles" },
    ],
    methods: [
      { name: "Euler", signature: "static Euler(float x, float y, float z) : Quaternion", description: "Create from Euler angles (degrees)" },
      { name: "LookRotation", signature: "static LookRotation(Vector3 forward, Vector3 up) : Quaternion", description: "Create rotation looking at direction" },
      { name: "Lerp", signature: "static Lerp(Quaternion a, Quaternion b, float t) : Quaternion", description: "Linear interpolation" },
      { name: "Slerp", signature: "static Slerp(Quaternion a, Quaternion b, float t) : Quaternion", description: "Spherical interpolation (smoother)" },
    ],
    notes: [
      "Quaternion.identity = no rotation",
      "Combine rotations: q1 * q2",
      "Avoid directly setting x, y, z, w - use Euler() or other factory methods",
    ],
  },

  Vector2: {
    name: "Vector2",
    namespace: "UnityEngine",
    description: "2D vector for UI positions, texture coordinates, etc.",
    properties: [
      { name: "x", type: "float", description: "X component" },
      { name: "y", type: "float", description: "Y component" },
    ],
  },

  Vector4: {
    name: "Vector4",
    namespace: "UnityEngine",
    description: "4D vector, often used for colors (RGBA) or shader parameters.",
    properties: [
      { name: "x", type: "float", description: "X/R component" },
      { name: "y", type: "float", description: "Y/G component" },
      { name: "z", type: "float", description: "Z/B component" },
      { name: "w", type: "float", description: "W/A component" },
    ],
    notes: ["For colors, values are 0-1 range, not 0-255"],
  },

  Color: {
    name: "Color",
    namespace: "UnityEngine",
    description: "RGBA color with values 0-1.",
    properties: [
      { name: "r", type: "float", description: "Red (0-1)" },
      { name: "g", type: "float", description: "Green (0-1)" },
      { name: "b", type: "float", description: "Blue (0-1)" },
      { name: "a", type: "float", description: "Alpha (0-1)" },
    ],
    notes: [
      "Common statics: Color.red, Color.green, Color.blue, Color.white, Color.black",
      "Banter uses Vector4 for colors, same 0-1 range",
    ],
  },

  // ============================================
  // PHYSICS TYPES
  // ============================================

  Rigidbody: {
    name: "Rigidbody",
    namespace: "UnityEngine",
    description: "Enables physics simulation on a GameObject.",
    properties: [
      { name: "mass", type: "float", description: "Mass in kilograms" },
      { name: "drag", type: "float", description: "Air resistance" },
      { name: "angularDrag", type: "float", description: "Rotational air resistance" },
      { name: "useGravity", type: "bool", description: "Affected by gravity" },
      { name: "isKinematic", type: "bool", description: "Not affected by forces (scripted movement)" },
      { name: "velocity", type: "Vector3", description: "Current velocity" },
      { name: "angularVelocity", type: "Vector3", description: "Current angular velocity" },
    ],
    methods: [
      { name: "AddForce", signature: "AddForce(Vector3 force, ForceMode mode)", description: "Apply force" },
      { name: "AddTorque", signature: "AddTorque(Vector3 torque, ForceMode mode)", description: "Apply rotational force" },
      { name: "MovePosition", signature: "MovePosition(Vector3 position)", description: "Move kinematic rigidbody" },
      { name: "MoveRotation", signature: "MoveRotation(Quaternion rotation)", description: "Rotate kinematic rigidbody" },
    ],
    notes: [
      "In Banter, use BanterRigidbody which wraps this",
      "Kinematic objects don't respond to forces but can push dynamic objects",
    ],
  },

  Collider: {
    name: "Collider",
    namespace: "UnityEngine",
    description: "Base class for collision shapes. Required for physics interactions.",
    properties: [
      { name: "isTrigger", type: "bool", description: "If true, detects overlaps but doesn't collide" },
      { name: "bounds", type: "Bounds", description: "Axis-aligned bounding box" },
    ],
    notes: [
      "Concrete types: BoxCollider, SphereCollider, CapsuleCollider, MeshCollider",
      "Triggers fire OnTriggerEnter/Exit instead of OnCollisionEnter/Exit",
      "Objects need a Rigidbody (on self or parent) for collision events",
    ],
  },

  // ============================================
  // VISUAL SCRIPTING TYPES
  // ============================================

  FlowGraph: {
    name: "FlowGraph",
    namespace: "Unity.VisualScripting",
    description: "A visual script graph that can be attached to GameObjects.",
    notes: [
      "Stored as .asset files in Unity",
      "JSON structure inside the asset defines nodes and connections",
      "Banter adds custom nodes in Banter.VisualScripting namespace",
    ],
  },

  ScriptMachine: {
    name: "ScriptMachine",
    namespace: "Unity.VisualScripting",
    description: "Component that runs a visual script graph on a GameObject.",
    properties: [
      { name: "graph", type: "FlowGraph", description: "The graph to execute" },
    ],
    notes: ["Attach this to a GameObject to run a visual script on it"],
  },
};

// Unity coordinate system notes
export const UNITY_COORDINATE_SYSTEM = {
  handedness: "Left-handed",
  up: "+Y",
  forward: "+Z",
  right: "+X",
  rotationOrder: "ZXY (Unity default)",
  notes: [
    "Positive X is right",
    "Positive Y is up",
    "Positive Z is forward (into the screen)",
    "Rotations are measured in degrees (not radians)",
    "Quaternions avoid gimbal lock - prefer them over Euler angles",
  ],
};

// Common Unity patterns in Banter
export const UNITY_PATTERNS = {
  getComponent: `
// Unity C# pattern:
var rb = GetComponent<Rigidbody>();

// Banter JS equivalent:
const rb = obj.GetComponent(BS.CT.BanterRigidbody);

// Banter Visual Scripting:
// Use InvokeMember node calling GetComponent method on UnityEngine.Component
`,

  instantiate: `
// Unity C# pattern:
var instance = Instantiate(prefab, position, rotation);

// Banter JS equivalent:
const obj = await scene.Instantiate("PrefabName");
obj.SetPosition(position);
`,

  physics: `
// Unity C# pattern:
rb.AddForce(Vector3.up * 10, ForceMode.Impulse);

// Banter JS equivalent:
rb.AddForce(new BS.Vector3(0, 10, 0), BS.ForceMode.Impulse);
`,
};
