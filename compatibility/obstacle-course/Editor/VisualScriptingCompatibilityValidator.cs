using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Unity.VisualScripting;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Bantworks.Compatibility.Editor
{
    public static class VisualScriptingCompatibilityValidator
    {
        private const string GraphPath =
            "Assets/BANTWORKSCompatibility/Generated/VisualScripting/BantworksVisualScriptingProbe.asset";
        private const string BaseScenePath =
            "Assets/BANTWORKSCompatibility/Generated/CompatibilityCourse.unity";
        private const string BanterScenePath =
            "Assets/BANTWORKSCompatibility/Generated/CompatibilityCourse_Banter.unity";
        private const string ProbeName = "BANTWORKS_VisualScriptingProbe";
        private const string ReportFileName = "bantworks-obstacle-visual-scripting.json";

        [Serializable]
        private sealed class BridgeCommand
        {
            public string id;
            public string type;
            public string objectPath;
            public string componentType;
            public string propertyName;
            public string assetPath;
            public string expectedAssetType;
            public long timestamp;
        }

        [Serializable]
        private sealed class CommandResult
        {
            public bool success;
            public string error;
        }

        [Serializable]
        private sealed class GraphValidationResult
        {
            public bool success;
            public string assetType;
            public int nodeCount;
            public int missingElementCount;
            public string error;
            public string[] elementTypes;
        }

        [Serializable]
        private sealed class BanterValidationResult
        {
            public bool success;
            public bool validatorAvailable;
            public bool validationCompleted;
            public bool validationPassed;
            public string validatorAssembly;
            public string error;
        }

        [Serializable]
        private sealed class ValidationReport
        {
            public bool success;
            public string unityVersion;
            public string visualScriptingVersion;
            public string banterVersion;
            public bool banterRequested;
            public string scenePath;
            public string graphPath;
            public string expectedNodeType;
            public int graphNodeCount;
            public int missingElementCount;
            public bool graphImported;
            public bool bridgeRoundTripPassed;
            public bool attachmentPersisted;
            public bool banterValidatorAvailable;
            public bool banterValidationPassed;
            public string error;
        }

        public static void RunFromCommandLine()
        {
            bool banterRequested = ReadBoolArgument("-bantworksBanterVisualScripting", false);
            Run(banterRequested);
        }

        public static void Run(bool banterRequested)
        {
            string projectRoot = Directory.GetParent(Application.dataPath).FullName;
            string reportPath = Path.Combine(projectRoot, ReportFileName);
            string scenePath = banterRequested ? BanterScenePath : BaseScenePath;
            string expectedNodeType = banterRequested
                ? "Banter.VisualScripting.OnGrab"
                : "Unity.VisualScripting.Start";
            ValidationReport report = new ValidationReport
            {
                success = false,
                unityVersion = Application.unityVersion,
                visualScriptingVersion = GetPackageVersion("com.unity.visualscripting"),
                banterVersion = GetPackageVersion("com.sidequest.banter"),
                banterRequested = banterRequested,
                scenePath = scenePath,
                graphPath = GraphPath,
                expectedNodeType = expectedNodeType
            };

            try
            {
                AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
                ScriptGraphAsset graph = AssetDatabase.LoadAssetAtPath<ScriptGraphAsset>(GraphPath);
                Assert(graph != null, "The BANTWORKS-generated ScriptGraphAsset did not import.");

                string graphValidationId = ExecuteCommand(new BridgeCommand
                {
                    type = "validate_vs_graph_asset",
                    assetPath = GraphPath
                });
                GraphValidationResult graphValidation = ReadResult<GraphValidationResult>(
                    "vs-validation-results",
                    graphValidationId);
                Assert(graphValidation.success, "Graph import validation failed: " + graphValidation.error);
                Assert(
                    graphValidation.assetType == typeof(ScriptGraphAsset).FullName,
                    "The generated graph imported as an unexpected asset type.");
                Assert(
                    graphValidation.nodeCount == 1 && graphValidation.missingElementCount == 0,
                    "The generated graph did not resolve exactly one node with no missing elements.");
                Assert(
                    graphValidation.elementTypes != null &&
                    graphValidation.elementTypes.Contains(expectedNodeType),
                    "The generated graph did not resolve the expected node: " + expectedNodeType);

                Assert(File.Exists(Path.Combine(projectRoot, scenePath)), "Fixture scene is missing: " + scenePath);
                EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                GameObject existingProbe = GameObject.Find(ProbeName);
                if (existingProbe != null)
                    UnityEngine.Object.DestroyImmediate(existingProbe);

                GameObject probe = new GameObject(ProbeName);
                ScriptMachine machine = probe.AddComponent<ScriptMachine>();
                ExecuteCommand(new BridgeCommand
                {
                    type = "set_asset_reference",
                    objectPath = ProbeName,
                    componentType = typeof(ScriptMachine).FullName,
                    propertyName = "nest.macro",
                    assetPath = GraphPath,
                    expectedAssetType = typeof(ScriptGraphAsset).FullName
                });
                Assert(machine.nest.macro == graph, "The bridge did not attach the generated graph.");

                EditorSceneManager.MarkSceneDirty(SceneManager.GetActiveScene());
                Assert(
                    EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), scenePath),
                    "Unity did not save the Visual Scripting probe scene.");
                EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

                GameObject persistedProbe = GameObject.Find(ProbeName);
                Assert(persistedProbe != null, "The Visual Scripting probe did not survive scene reload.");
                ScriptMachine persistedMachine = persistedProbe.GetComponent<ScriptMachine>();
                Assert(persistedMachine != null, "The ScriptMachine did not survive scene reload.");
                Assert(
                    persistedMachine.nest.macro == graph,
                    "The ScriptMachine graph reference did not survive scene reload.");

                report.graphNodeCount = graphValidation.nodeCount;
                report.missingElementCount = graphValidation.missingElementCount;
                report.graphImported = true;
                report.bridgeRoundTripPassed = true;
                report.attachmentPersisted = true;

                if (banterRequested)
                {
                    string banterValidationId = ExecuteCommand(new BridgeCommand
                    {
                        type = "validate_banter_visual_scripting"
                    });
                    BanterValidationResult banterValidation = ReadResult<BanterValidationResult>(
                        "banter-validation-results",
                        banterValidationId);
                    Assert(
                        banterValidation.validatorAvailable,
                        "The Banter Visual Scripting validator is unavailable: " + banterValidation.error);
                    Assert(
                        banterValidation.validationCompleted,
                        "The Banter Visual Scripting validator did not complete: " + banterValidation.error);
                    Assert(
                        banterValidation.validatorAssembly == "Banter.SDKEditor",
                        "The fixture resolved an unexpected Banter validator assembly.");
                    Assert(
                        banterValidation.success && banterValidation.validationPassed,
                        "Banter rejected the generated graph: " + banterValidation.error);
                    report.banterValidatorAvailable = true;
                    report.banterValidationPassed = true;
                }

                report.success = true;
                WriteReport(reportPath, report);
                Debug.Log("[BANTWORKS COMPATIBILITY] Visual Scripting bridge validation passed");
            }
            catch (Exception exception)
            {
                report.error = exception.ToString();
                WriteReport(reportPath, report);
                Debug.LogException(exception);
                throw;
            }
        }

        private static string ExecuteCommand(BridgeCommand command)
        {
            command.id = Guid.NewGuid().ToString("N");
            command.timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            string projectRoot = Directory.GetParent(Application.dataPath).FullName;
            string commandFolder = Path.Combine(projectRoot, ".bantworks-mcp", "commands");
            string resultPath = Path.Combine(
                projectRoot,
                ".bantworks-mcp",
                "state",
                "command-results",
                command.id + ".json");
            Directory.CreateDirectory(commandFolder);
            File.WriteAllText(
                Path.Combine(commandFolder, command.id + ".json"),
                JsonUtility.ToJson(command, true));

            Type bridgeType = AppDomain.CurrentDomain.GetAssemblies()
                .Select(assembly => assembly.GetType("BantworksMCP.BantworksMCPBridge", false))
                .FirstOrDefault(candidate => candidate != null);
            Assert(bridgeType != null, "The BANTWORKS Unity bridge is not compiled in this project.");
            MethodInfo process = bridgeType.GetMethod(
                "ProcessCommands",
                BindingFlags.Static | BindingFlags.NonPublic);
            Assert(process != null, "Could not resolve the BANTWORKS bridge command processor.");

            try
            {
                process.Invoke(null, null);
            }
            catch (TargetInvocationException exception)
            {
                throw exception.InnerException ?? exception;
            }

            Assert(File.Exists(resultPath), "The bridge did not publish a correlated command result.");
            CommandResult result = JsonUtility.FromJson<CommandResult>(File.ReadAllText(resultPath));
            Assert(result != null && result.success, "Bridge command failed: " + result?.error);
            return command.id;
        }

        private static T ReadResult<T>(string folder, string commandId)
        {
            string path = Path.Combine(
                Directory.GetParent(Application.dataPath).FullName,
                ".bantworks-mcp",
                "state",
                folder,
                commandId + ".json");
            Assert(File.Exists(path), "The bridge did not publish its specialized result: " + path);
            T result = JsonUtility.FromJson<T>(File.ReadAllText(path));
            Assert(result != null, "The bridge result could not be deserialized: " + path);
            return result;
        }

        private static string GetPackageVersion(string packageName)
        {
            UnityEditor.PackageManager.PackageInfo package =
                UnityEditor.PackageManager.PackageInfo.GetAllRegisteredPackages()
                    .FirstOrDefault(candidate => candidate.name == packageName);
            return package == null ? string.Empty : package.version;
        }

        private static bool ReadBoolArgument(string name, bool fallback)
        {
            string[] arguments = Environment.GetCommandLineArgs();
            for (int index = 0; index < arguments.Length - 1; index++)
            {
                if (string.Equals(arguments[index], name, StringComparison.OrdinalIgnoreCase) &&
                    bool.TryParse(arguments[index + 1], out bool value))
                {
                    return value;
                }
            }
            return fallback;
        }

        private static void WriteReport(string path, ValidationReport report)
        {
            File.WriteAllText(path, JsonUtility.ToJson(report, true));
        }

        private static void Assert(bool condition, string message)
        {
            if (!condition)
                throw new InvalidOperationException(message);
        }
    }
}
