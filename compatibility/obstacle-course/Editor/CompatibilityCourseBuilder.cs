using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Bantworks.Compatibility.Editor
{
    public static class CompatibilityCourseBuilder
    {
        private const string RootFolder = "Assets/BANTWORKSCompatibility";
        private const string GeneratedFolder = RootFolder + "/Generated";
        private const string ScenePath = GeneratedFolder + "/CompatibilityCourse.unity";
        private const string BanterScenePath = GeneratedFolder + "/CompatibilityCourse_Banter.unity";
        private const string ReportFileName = "bantworks-obstacle-course.json";

        private static readonly string[] DressingKeywords =
        {
            "barrel", "bridge", "building", "castle", "crate", "fence",
            "gate", "ladder", "rock", "shed", "tower", "tree", "well"
        };

        [Serializable]
        private sealed class BuildReport
        {
            public bool success;
            public string unityVersion;
            public string scenePath;
            public string banterScenePath;
            public int seed;
            public int lockedDoorIndex;
            public int importedDressingCount;
            public int banterSyncedObjectCount;
            public string[] importedDressingPaths;
            public string error;
        }

        [MenuItem("Creator Works MCP/Compatibility/Build Obstacle Course")]
        public static void BuildFromMenu()
        {
            Build(314159);
        }

        public static void BuildFromCommandLine()
        {
            int seed = ReadIntArgument("-bantworksCourseSeed", 314159);
            Build(seed);
        }

        public static void Build(int seed)
        {
            string reportPath = Path.Combine(
                Directory.GetParent(Application.dataPath).FullName,
                ReportFileName);
            BuildReport report = new BuildReport
            {
                success = false,
                unityVersion = Application.unityVersion,
                scenePath = ScenePath,
                banterScenePath = string.Empty,
                seed = seed,
                importedDressingPaths = Array.Empty<string>()
            };

            try
            {
                EnsureFolder(RootFolder);
                if (AssetDatabase.IsValidFolder(GeneratedFolder))
                {
                    AssetDatabase.DeleteAsset(GeneratedFolder);
                }
                EnsureFolder(GeneratedFolder);
                EnsureFolder(GeneratedFolder + "/Materials");

                Material stone = CreateMaterial("Stone", new Color(0.34f, 0.38f, 0.42f));
                Material metal = CreateMaterial("Metal", new Color(0.22f, 0.25f, 0.28f));
                Material hazard = CreateMaterial("Hazard", new Color(0.82f, 0.20f, 0.12f));
                Material wood = CreateMaterial("Wood", new Color(0.38f, 0.22f, 0.10f));
                Material accent = CreateMaterial("Accent", new Color(0.16f, 0.55f, 0.72f));
                Material finish = CreateMaterial("Finish", new Color(0.26f, 0.68f, 0.30f));

                Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                GameObject course = new GameObject("BANTWORKS_CompatibilityCourse");
                CourseMetadata metadata = course.AddComponent<CourseMetadata>();

                CreateEnvironment(course.transform);
                CreateKillVolume(course.transform);
                CreateStartAndSteps(course.transform, stone, accent);
                CreateMovingPlatforms(course.transform, stone, metal);
                CreateRotatingObstacles(course.transform, stone, hazard);

                int lockedDoorIndex = PositiveModulo(seed, 3);
                CreateDoorSection(course.transform, stone, wood, hazard, lockedDoorIndex);

                CreateBallHazards(course.transform, stone, metal, hazard);
                CreateFinish(course.transform, stone, finish);

                List<string> dressingPaths = AddImportedDressing(course.transform);
                metadata.Configure(seed, lockedDoorIndex, dressingPaths.Count, 0);

                EditorSceneManager.MarkSceneDirty(scene);
                if (!EditorSceneManager.SaveScene(scene, ScenePath))
                {
                    throw new InvalidOperationException("Unity did not save the compatibility scene.");
                }

                int syncedCount = CreateBanterIntegrationScene();
                Scene baseScene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
                CourseMetadata baseMetadata = UnityEngine.Object.FindObjectOfType<CourseMetadata>();
                if (baseMetadata == null)
                {
                    throw new InvalidOperationException("The saved base scene lost its CourseMetadata component.");
                }
                baseMetadata.Configure(seed, lockedDoorIndex, dressingPaths.Count, syncedCount);
                EditorSceneManager.MarkSceneDirty(baseScene);
                if (!EditorSceneManager.SaveScene(baseScene))
                {
                    throw new InvalidOperationException("Unity did not update the base-scene integration metadata.");
                }

                EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);

                report.success = true;
                report.lockedDoorIndex = lockedDoorIndex;
                report.importedDressingCount = dressingPaths.Count;
                report.banterSyncedObjectCount = syncedCount;
                report.banterScenePath = syncedCount > 0 ? BanterScenePath : string.Empty;
                report.importedDressingPaths = dressingPaths.ToArray();
                File.WriteAllText(reportPath, JsonUtility.ToJson(report, true));
                Debug.Log("[BANTWORKS COMPATIBILITY] Built " + ScenePath);
            }
            catch (Exception exception)
            {
                report.error = exception.ToString();
                File.WriteAllText(reportPath, JsonUtility.ToJson(report, true));
                Debug.LogException(exception);
                throw;
            }
        }

        private static void CreateEnvironment(Transform parent)
        {
            GameObject lightObject = new GameObject("Directional Light");
            lightObject.transform.SetParent(parent, false);
            lightObject.transform.rotation = Quaternion.Euler(48f, -28f, 0f);
            Light light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            light.shadows = LightShadows.Soft;

            GameObject cameraObject = new GameObject("Course Camera");
            cameraObject.transform.SetParent(parent, false);
            cameraObject.transform.position = new Vector3(25f, 24f, -18f);
            cameraObject.transform.rotation = Quaternion.Euler(28f, -35f, 0f);
            Camera camera = cameraObject.AddComponent<Camera>();
            camera.fieldOfView = 58f;
            camera.farClipPlane = 250f;
            cameraObject.AddComponent<AudioListener>();
        }

        private static void CreateKillVolume(Transform parent)
        {
            GameObject trigger = GameObject.CreatePrimitive(PrimitiveType.Cube);
            trigger.name = "Global Respawn Trigger";
            trigger.transform.SetParent(parent, false);
            trigger.transform.position = new Vector3(0f, -7f, 48f);
            trigger.transform.localScale = new Vector3(44f, 1f, 118f);
            UnityEngine.Object.DestroyImmediate(trigger.GetComponent<MeshRenderer>());
            BoxCollider collider = trigger.GetComponent<BoxCollider>();
            collider.isTrigger = true;
            trigger.AddComponent<RespawnTrigger>();
        }

        private static void CreateStartAndSteps(Transform parent, Material stone, Material accent)
        {
            CreateBlock("Start Platform", new Vector3(0f, 0f, 0f), new Vector3(9f, 1f, 8f),
                Quaternion.identity, stone, parent);

            for (int index = 0; index < 8; index++)
            {
                float x = (index % 3 - 1) * 2.7f;
                float y = 0.3f + (index % 2) * 0.35f;
                CreateBlock(
                    "Step_" + index,
                    new Vector3(x, y, 7f + index * 2.35f),
                    new Vector3(2.2f, 0.6f, 1.7f),
                    Quaternion.Euler(0f, index % 2 == 0 ? -9f : 9f, 0f),
                    index % 2 == 0 ? accent : stone,
                    parent);
            }
        }

        private static void CreateMovingPlatforms(Transform parent, Material stone, Material metal)
        {
            CreateBlock("Moving Section Base", new Vector3(0f, -0.2f, 28f), new Vector3(14f, 0.5f, 8f),
                Quaternion.identity, stone, parent);

            for (int index = 0; index < 3; index++)
            {
                GameObject platform = CreateBlock(
                    "MovingPlatform_" + index,
                    new Vector3((index - 1) * 4f, 1.2f, 27f + index),
                    new Vector3(3.2f, 0.45f, 3f),
                    Quaternion.identity,
                    metal,
                    parent);
                Rigidbody body = platform.AddComponent<Rigidbody>();
                body.isKinematic = true;
                body.interpolation = RigidbodyInterpolation.Interpolate;
                KinematicMover mover = platform.AddComponent<KinematicMover>();
                mover.Configure(index == 1 ? new Vector3(0f, 2.2f, 0f) : new Vector3(2.2f, 0f, 0f), 3f + index);
            }
        }

        private static void CreateRotatingObstacles(Transform parent, Material stone, Material hazard)
        {
            CreateBlock("Rotator Section Base", new Vector3(0f, 0f, 39f), new Vector3(15f, 1f, 9f),
                Quaternion.identity, stone, parent);

            for (int index = 0; index < 2; index++)
            {
                float z = 37f + index * 4f;
                CreateBlock("RotatorPost_" + index, new Vector3(0f, 1.25f, z), new Vector3(0.8f, 2.5f, 0.8f),
                    Quaternion.identity, stone, parent);
                GameObject bar = CreateBlock(
                    "RotatingBar_" + index,
                    new Vector3(0f, 2.65f, z),
                    new Vector3(10f, 0.55f, 0.55f),
                    Quaternion.identity,
                    hazard,
                    parent);
                Rigidbody body = bar.AddComponent<Rigidbody>();
                body.isKinematic = true;
                body.interpolation = RigidbodyInterpolation.Interpolate;
                KinematicRotator rotator = bar.AddComponent<KinematicRotator>();
                rotator.Configure(Vector3.up, index == 0 ? 68f : -82f);
            }
        }

        private static void CreateDoorSection(
            Transform parent,
            Material stone,
            Material wood,
            Material hazard,
            int lockedDoorIndex)
        {
            CreateBlock("Door Section Base", new Vector3(0f, 0f, 50f), new Vector3(18f, 1f, 8f),
                Quaternion.identity, stone, parent);

            for (int index = 0; index < 3; index++)
            {
                float laneX = (index - 1) * 5f;
                GameObject pivot = new GameObject("DoorPivot_" + index);
                pivot.transform.SetParent(parent, false);
                pivot.transform.position = new Vector3(laneX - 1.55f, 2.3f, 50f);

                GameObject leaf = CreateBlock(
                    "DoorLeaf_" + index,
                    pivot.transform.position,
                    new Vector3(3.1f, 3.8f, 0.35f),
                    Quaternion.identity,
                    index == lockedDoorIndex ? hazard : wood,
                    pivot.transform);
                leaf.transform.localPosition = new Vector3(1.55f, 0f, 0f);
                leaf.transform.localRotation = Quaternion.identity;

                Rigidbody body = pivot.AddComponent<Rigidbody>();
                body.mass = 18f;
                body.interpolation = RigidbodyInterpolation.Interpolate;
                HingeJoint hinge = pivot.AddComponent<HingeJoint>();
                hinge.enableCollision = true;
                DeterministicDoor door = pivot.AddComponent<DeterministicDoor>();
                door.Configure(index, index == lockedDoorIndex);

                CreateBlock("DoorFrameLeft_" + index, new Vector3(laneX - 2f, 2.3f, 50f),
                    new Vector3(0.35f, 4.6f, 0.8f), Quaternion.identity, stone, parent);
                CreateBlock("DoorFrameRight_" + index, new Vector3(laneX + 2f, 2.3f, 50f),
                    new Vector3(0.35f, 4.6f, 0.8f), Quaternion.identity, stone, parent);
                CreateBlock("DoorFrameTop_" + index, new Vector3(laneX, 4.4f, 50f),
                    new Vector3(4.35f, 0.35f, 0.8f), Quaternion.identity, stone, parent);
            }
        }

        private static void CreateBallHazards(
            Transform parent,
            Material stone,
            Material metal,
            Material hazard)
        {
            CreateBlock("Hazard Approach", new Vector3(0f, 0f, 59f), new Vector3(10f, 1f, 6f),
                Quaternion.identity, stone, parent);

            CreateRampAndBall("Left", -1, 64f, parent, metal, hazard);
            CreateRampAndBall("Right", 1, 70f, parent, metal, hazard);

            CreateBlock("Hazard Exit", new Vector3(0f, 0f, 75f), new Vector3(10f, 1f, 6f),
                Quaternion.identity, stone, parent);
        }

        private static void CreateRampAndBall(
            string label,
            int side,
            float z,
            Transform parent,
            Material rampMaterial,
            Material ballMaterial)
        {
            float rampX = side * 5.2f;
            float angle = side * 35f;
            GameObject ramp = CreateBlock(
                "Ramp_" + label,
                new Vector3(rampX, 3.15f, z),
                new Vector3(8f, 0.5f, 3.5f),
                Quaternion.Euler(0f, 0f, angle),
                rampMaterial,
                parent);

            Vector3 localSpawn = new Vector3(side * 3.15f, 0.8f, 0f);
            Vector3 spawn = ramp.transform.TransformPoint(localSpawn);
            GameObject ball = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            ball.name = "Ball_" + label;
            ball.transform.SetParent(parent, false);
            ball.transform.position = spawn;
            ball.transform.localScale = Vector3.one * 1.25f;
            ball.GetComponent<Renderer>().sharedMaterial = ballMaterial;

            Rigidbody body = ball.AddComponent<Rigidbody>();
            body.mass = 4f;
            body.drag = 0.04f;
            body.angularDrag = 0.05f;
            body.interpolation = RigidbodyInterpolation.Interpolate;
            body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
            body.solverIterations = 12;
            body.solverVelocityIterations = 6;
            body.maxAngularVelocity = 25f;

            RespawnableBody respawnable = ball.AddComponent<RespawnableBody>();
            respawnable.ConfigureSpawnPose(spawn, ball.transform.rotation);
        }

        private static void CreateFinish(Transform parent, Material stone, Material finish)
        {
            for (int index = 0; index < 10; index++)
            {
                CreateBlock(
                    "FinishStep_" + index,
                    new Vector3((index % 2 == 0 ? -1f : 1f), 0.3f + index * 0.38f, 79f + index * 1.6f),
                    new Vector3(4.8f, 0.6f, 1.5f),
                    Quaternion.identity,
                    index % 2 == 0 ? stone : finish,
                    parent);
            }

            CreateBlock("Finish Platform", new Vector3(0f, 4.15f, 96f), new Vector3(10f, 1f, 8f),
                Quaternion.identity, finish, parent);
            CreateBlock("Finish Arch Left", new Vector3(-3.7f, 7f, 96f), new Vector3(0.8f, 5.5f, 0.8f),
                Quaternion.identity, stone, parent);
            CreateBlock("Finish Arch Right", new Vector3(3.7f, 7f, 96f), new Vector3(0.8f, 5.5f, 0.8f),
                Quaternion.identity, stone, parent);
            CreateBlock("Finish Arch Top", new Vector3(0f, 9.5f, 96f), new Vector3(8.2f, 0.7f, 0.8f),
                Quaternion.identity, finish, parent);
        }

        private static List<string> AddImportedDressing(Transform parent)
        {
            List<string> candidatePaths = AssetDatabase.FindAssets("t:Prefab")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(path => path.StartsWith("Assets/", StringComparison.OrdinalIgnoreCase))
                .Where(path => !path.StartsWith(RootFolder + "/", StringComparison.OrdinalIgnoreCase))
                .Where(path => DressingKeywords.Any(keyword =>
                    Path.GetFileNameWithoutExtension(path).IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
                .ToList();

            GameObject dressingRoot = new GameObject("Imported Asset Dressing");
            dressingRoot.transform.SetParent(parent, false);
            List<string> importedPaths = new List<string>();

            for (int index = 0; index < candidatePaths.Count && importedPaths.Count < 10; index++)
            {
                string path = candidatePaths[index];
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (prefab == null)
                {
                    continue;
                }

                try
                {
                    GameObject instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
                    if (instance == null)
                    {
                        continue;
                    }

                    instance.name = "Dressing_" + importedPaths.Count + "_" + prefab.name;
                    instance.transform.SetParent(dressingRoot.transform, true);
                    float side = importedPaths.Count % 2 == 0 ? -1f : 1f;
                    float z = 10f + (importedPaths.Count / 2) * 18f;
                    instance.transform.position = new Vector3(side * 17f, 0f, z);

                    foreach (Collider collider in instance.GetComponentsInChildren<Collider>(true))
                    {
                        collider.enabled = false;
                    }
                    foreach (Rigidbody body in instance.GetComponentsInChildren<Rigidbody>(true))
                    {
                        body.isKinematic = true;
                        body.detectCollisions = false;
                    }
                    foreach (MonoBehaviour behaviour in instance.GetComponentsInChildren<MonoBehaviour>(true))
                    {
                        behaviour.enabled = false;
                    }

                    Renderer[] renderers = instance.GetComponentsInChildren<Renderer>(true);
                    if (renderers.Length == 0)
                    {
                        UnityEngine.Object.DestroyImmediate(instance);
                        continue;
                    }

                    Bounds bounds = renderers[0].bounds;
                    for (int rendererIndex = 1; rendererIndex < renderers.Length; rendererIndex++)
                    {
                        bounds.Encapsulate(renderers[rendererIndex].bounds);
                    }

                    float maximumDimension = Mathf.Max(bounds.size.x, bounds.size.y, bounds.size.z);
                    if (maximumDimension > 0.001f)
                    {
                        float targetDimension = Mathf.Clamp(maximumDimension, 2.5f, 8f);
                        instance.transform.localScale *= targetDimension / maximumDimension;
                    }

                    renderers = instance.GetComponentsInChildren<Renderer>(true);
                    bounds = renderers[0].bounds;
                    for (int rendererIndex = 1; rendererIndex < renderers.Length; rendererIndex++)
                    {
                        bounds.Encapsulate(renderers[rendererIndex].bounds);
                    }
                    instance.transform.position += Vector3.up * -bounds.min.y;
                    importedPaths.Add(path);
                }
                catch (Exception exception)
                {
                    Debug.LogWarning("[BANTWORKS COMPATIBILITY] Could not use dressing prefab " + path + ": " + exception.Message);
                }
            }

            return importedPaths;
        }

        private static int CreateBanterIntegrationScene()
        {
            Type syncedType = FindType("Banter.SDK.BanterSyncedObject");
            if (syncedType == null || !typeof(Component).IsAssignableFrom(syncedType))
            {
                return 0;
            }

            Scene baseScene = SceneManager.GetActiveScene();
            if (!EditorSceneManager.SaveScene(baseScene, BanterScenePath, true))
            {
                throw new InvalidOperationException("Unity did not create the Banter integration scene copy.");
            }

            Scene banterScene = EditorSceneManager.OpenScene(BanterScenePath, OpenSceneMode.Single);
            GameObject[] targets = { GameObject.Find("Ball_Left"), GameObject.Find("Ball_Right") };
            if (targets.Any(target => target == null))
            {
                throw new InvalidOperationException("The Banter integration scene is missing a hazard ball.");
            }

            int count = 0;
            foreach (GameObject target in targets)
            {
                try
                {
                    if (target.GetComponent(syncedType) == null)
                    {
                        target.AddComponent(syncedType);
                    }
                    count++;
                }
                catch (Exception exception)
                {
                    Debug.LogWarning("[BANTWORKS COMPATIBILITY] Banter sync was not added to " + target.name + ": " + exception.Message);
                }
            }

            EditorSceneManager.MarkSceneDirty(banterScene);
            if (!EditorSceneManager.SaveScene(banterScene))
            {
                throw new InvalidOperationException("Unity did not save the Banter integration scene.");
            }

            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            EditorSceneManager.OpenScene(BanterScenePath, OpenSceneMode.Single);
            int persistedCount = new[] { GameObject.Find("Ball_Left"), GameObject.Find("Ball_Right") }
                .Count(target => target != null && target.GetComponent(syncedType) != null);
            if (persistedCount != count)
            {
                throw new InvalidOperationException(
                    "Banter sync component count changed after scene reload: " + count + " -> " + persistedCount);
            }
            return persistedCount;
        }

        private static Type FindType(string fullName)
        {
            return AppDomain.CurrentDomain.GetAssemblies()
                .Select(assembly =>
                {
                    try { return assembly.GetType(fullName, false); }
                    catch { return null; }
                })
                .FirstOrDefault(type => type != null);
        }

        private static GameObject CreateBlock(
            string name,
            Vector3 position,
            Vector3 scale,
            Quaternion rotation,
            Material material,
            Transform parent)
        {
            GameObject block = GameObject.CreatePrimitive(PrimitiveType.Cube);
            block.name = name;
            block.transform.SetParent(parent, true);
            block.transform.position = position;
            block.transform.rotation = rotation;
            block.transform.localScale = scale;
            block.GetComponent<Renderer>().sharedMaterial = material;
            return block;
        }

        private static Material CreateMaterial(string name, Color color)
        {
            string path = GeneratedFolder + "/Materials/" + name + ".mat";
            Shader shader = Shader.Find("Universal Render Pipeline/Lit") ??
                Shader.Find("Standard") ??
                Shader.Find("Unlit/Color");
            if (shader == null)
            {
                throw new InvalidOperationException("No supported material shader was found.");
            }

            Material material = new Material(shader) { name = name };
            if (material.HasProperty("_BaseColor"))
            {
                material.SetColor("_BaseColor", color);
            }
            if (material.HasProperty("_Color"))
            {
                material.SetColor("_Color", color);
            }
            AssetDatabase.CreateAsset(material, path);
            return material;
        }

        private static void EnsureFolder(string path)
        {
            string[] segments = path.Split('/');
            string current = segments[0];
            for (int index = 1; index < segments.Length; index++)
            {
                string next = current + "/" + segments[index];
                if (!AssetDatabase.IsValidFolder(next))
                {
                    AssetDatabase.CreateFolder(current, segments[index]);
                }
                current = next;
            }
        }

        private static int ReadIntArgument(string name, int fallback)
        {
            string[] arguments = Environment.GetCommandLineArgs();
            for (int index = 0; index < arguments.Length - 1; index++)
            {
                if (string.Equals(arguments[index], name, StringComparison.OrdinalIgnoreCase) &&
                    int.TryParse(arguments[index + 1], out int value))
                {
                    return value;
                }
            }
            return fallback;
        }

        private static int PositiveModulo(int value, int divisor)
        {
            int result = value % divisor;
            return result < 0 ? result + divisor : result;
        }
    }
}
