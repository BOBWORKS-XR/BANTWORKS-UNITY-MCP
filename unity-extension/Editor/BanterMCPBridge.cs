using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace BantworksMCP
{
    /// <summary>
    /// Unity Editor extension that bridges the BANTWORKS MCP server with Unity.
    /// Exports project state and handles MCP commands.
    /// Full Inspector integration - can see and modify all component properties.
    ///
    /// Installation:
    /// 1. Copy this file to your Unity project: Assets/Editor/BantworksMCPBridge.cs
    /// 2. Unity will compile it automatically
    /// 3. The bridge starts when Unity Editor opens
    /// </summary>
    [InitializeOnLoad]
    public static class BantworksMCPBridge
    {
        private static readonly string ProjectRoot = Directory.GetParent(Application.dataPath)?.FullName ?? Directory.GetCurrentDirectory();
        private static readonly string MCPFolder = Path.Combine(ProjectRoot, ".bantworks-mcp");
        private static readonly string StateFolder = Path.Combine(MCPFolder, "state");
        private static readonly string CommandsFolder = Path.Combine(MCPFolder, "commands");
        private static readonly string FailedCommandsFolder = Path.Combine(CommandsFolder, "failed");
        private static readonly string CommandResultsFolder = Path.Combine(StateFolder, "command-results");
        private static readonly string BoundsResultsFolder = Path.Combine(StateFolder, "bounds-results");
        private static readonly string ScreenshotResultsFolder = Path.Combine(StateFolder, "screenshot-results");
        private static readonly string AssetSearchResultsFolder = Path.Combine(StateFolder, "asset-search-results");
        private static readonly string VisualScriptingValidationResultsFolder = Path.Combine(StateFolder, "vs-validation-results");
        private static readonly string BanterValidationResultsFolder = Path.Combine(StateFolder, "banter-validation-results");
        private static readonly string TestRunResultsFolder = Path.Combine(StateFolder, "test-runs");
        private static readonly string TestDiscoveryResultsFolder = Path.Combine(StateFolder, "test-discovery");
        private static readonly string SceneResultsFolder = Path.Combine(StateFolder, "scene-results");
        private static readonly Dictionary<string, UnityEngine.Object> ActiveTestDiscoveryApis = new Dictionary<string, UnityEngine.Object>();

        private static double lastCommandCheck = 0;
        private static double lastStateExport = 0;
        private static double lastLauncherSettingsCheck = 0;
        private static double lastTestRunCheck = 0;
        private static readonly double CommandCheckInterval = 0.5; // seconds
        private static readonly double StateExportInterval = 2.0; // seconds
        private static readonly double LauncherSettingsCheckInterval = 1.0; // seconds
        private static DateTime lastLauncherSettingsWriteTime = DateTime.MinValue;
        private static string activeTestRunId;
        private static object activeTestRunnerApi;
        private static object activeTestRunnerCallback;

        // Public status for window
        public static bool IsConnected { get; private set; }
        public static string LastActivity { get; private set; }
        public static int CommandsProcessed { get; private set; }

        // Prefab scan progress
        public static bool IsScanningPrefabs { get; private set; }
        public static int ScanProgress { get; private set; }      // Current prefab being scanned
        public static int ScanTotal { get; private set; }         // Total prefabs to scan
        public static string ScanStatus { get; private set; }     // Current status message
        public static float ScanStartTime { get; private set; }   // When scan started (EditorApplication.timeSinceStartup)

        // Project mode toggle - enables custom script support for non-Banter projects
        private static readonly string EnableCustomScriptsKey = "BantworksMCP_EnableCustomScripts";
        public static bool EnableCustomScripts
        {
            get => EditorPrefs.GetBool(EnableCustomScriptsKey, false);
            set => EditorPrefs.SetBool(EnableCustomScriptsKey, value);
        }

        // Console log capture
        private static readonly List<ConsoleLogEntry> capturedLogs = new List<ConsoleLogEntry>();
        private static readonly int MaxLogEntries = 500;
        private static readonly object logLock = new object();

        static BantworksMCPBridge()
        {
            // Initialize folders
            EnsureDirectories();
            LoadLauncherSettingsIfChanged();

            // Subscribe to editor events
            EditorApplication.update += OnEditorUpdate;
            EditorApplication.playModeStateChanged += OnPlayModeChanged;
            EditorSceneManager.sceneOpened += OnSceneOpened;
            EditorSceneManager.sceneSaved += OnSceneSaved;

            // Subscribe to asset import events
            AssetDatabase.importPackageCompleted += OnImportCompleted;
            AssetDatabase.importPackageFailed += OnImportFailed;

            // Subscribe to console log events
            Application.logMessageReceived += OnLogMessageReceived;

            // Initial state export
            ExportProjectState();

            // Scan prefabs on startup (delayed to not block editor)
            EditorApplication.delayCall += () => {
                ScanAndExportPrefabCatalog();
            };
            EditorApplication.delayCall += ResumePendingTestRun;

            IsConnected = true;
            LastActivity = DateTime.Now.ToString("HH:mm:ss") + " - Initialized";
            CommandsProcessed = 0;

            Debug.Log("[BANTWORKS MCP] Bridge initialized. State folder: " + StateFolder);
        }

        private static void EnsureDirectories()
        {
            if (!Directory.Exists(MCPFolder))
                Directory.CreateDirectory(MCPFolder);
            if (!Directory.Exists(StateFolder))
                Directory.CreateDirectory(StateFolder);
            if (!Directory.Exists(CommandsFolder))
                Directory.CreateDirectory(CommandsFolder);
            if (!Directory.Exists(FailedCommandsFolder))
                Directory.CreateDirectory(FailedCommandsFolder);
            if (!Directory.Exists(CommandResultsFolder))
                Directory.CreateDirectory(CommandResultsFolder);
            if (!Directory.Exists(BoundsResultsFolder))
                Directory.CreateDirectory(BoundsResultsFolder);
            if (!Directory.Exists(ScreenshotResultsFolder))
                Directory.CreateDirectory(ScreenshotResultsFolder);
            if (!Directory.Exists(AssetSearchResultsFolder))
                Directory.CreateDirectory(AssetSearchResultsFolder);
            if (!Directory.Exists(VisualScriptingValidationResultsFolder))
                Directory.CreateDirectory(VisualScriptingValidationResultsFolder);
            if (!Directory.Exists(BanterValidationResultsFolder))
                Directory.CreateDirectory(BanterValidationResultsFolder);
            if (!Directory.Exists(TestRunResultsFolder))
                Directory.CreateDirectory(TestRunResultsFolder);
            if (!Directory.Exists(TestDiscoveryResultsFolder))
                Directory.CreateDirectory(TestDiscoveryResultsFolder);
            if (!Directory.Exists(SceneResultsFolder))
                Directory.CreateDirectory(SceneResultsFolder);

            string ignorePath = Path.Combine(MCPFolder, ".gitignore");
            if (!File.Exists(ignorePath))
                File.WriteAllText(ignorePath, "*\n!.gitignore\n");
        }

        private static void OnEditorUpdate()
        {
            double time = EditorApplication.timeSinceStartup;

            // Check for commands periodically
            if (time - lastCommandCheck > CommandCheckInterval)
            {
                lastCommandCheck = time;
                ProcessCommands();
            }

            // Export state periodically
            if (time - lastStateExport > StateExportInterval)
            {
                lastStateExport = time;
                ExportProjectState();
            }

            // Pick up launcher settings changes while Unity is open
            if (time - lastLauncherSettingsCheck > LauncherSettingsCheckInterval)
            {
                lastLauncherSettingsCheck = time;
                LoadLauncherSettingsIfChanged();
            }

            if (time - lastTestRunCheck > 1.0)
            {
                lastTestRunCheck = time;
                CheckActiveTestRunDeadline();
            }
        }

        private static void LoadLauncherSettingsIfChanged()
        {
            string settingsPath = Path.Combine(StateFolder, "launcher-settings.json");
            if (!File.Exists(settingsPath))
                return;

            try
            {
                DateTime writeTime = File.GetLastWriteTimeUtc(settingsPath);
                if (writeTime <= lastLauncherSettingsWriteTime)
                    return;

                string json = File.ReadAllText(settingsPath);
                var settings = JsonUtility.FromJson<LauncherSettings>(json);
                if (settings != null && EnableCustomScripts != settings.enableCustomScripts)
                {
                    EnableCustomScripts = settings.enableCustomScripts;
                    LastActivity = DateTime.Now.ToString("HH:mm:ss") + " - Launcher settings applied";
                    Debug.Log($"[BANTWORKS MCP] Custom scripts {(settings.enableCustomScripts ? "enabled" : "disabled")} from launcher settings");
                }

                lastLauncherSettingsWriteTime = writeTime;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[BANTWORKS MCP] Could not read launcher settings: {e.Message}");
            }
        }

        private static void OnPlayModeChanged(PlayModeStateChange state)
        {
            ExportEditorState();
        }

        private static void OnSceneOpened(UnityEngine.SceneManagement.Scene scene, OpenSceneMode mode)
        {
            ExportSceneHierarchy();
        }

        private static void OnSceneSaved(UnityEngine.SceneManagement.Scene scene)
        {
            ExportSceneHierarchy();
        }

        private static void OnImportCompleted(string packageName)
        {
            ExportImportStatus(true, null);
        }

        private static void OnImportFailed(string packageName, string errorMessage)
        {
            ExportImportStatus(false, errorMessage);
        }

        private static void OnLogMessageReceived(string condition, string stackTrace, LogType type)
        {
            lock (logLock)
            {
                var entry = new ConsoleLogEntry
                {
                    level = type.ToString(),
                    message = condition,
                    stackTrace = stackTrace,
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                capturedLogs.Add(entry);

                // Keep only the last MaxLogEntries
                while (capturedLogs.Count > MaxLogEntries)
                {
                    capturedLogs.RemoveAt(0);
                }
            }
        }

        #region Menu Items

        [MenuItem("BANTWORKS MCP/Show Status Window")]
        private static void ShowStatusWindow()
        {
            BantworksMCPWindow.ShowWindow();
        }

        [MenuItem("BANTWORKS MCP/Refresh State")]
        private static void RefreshState()
        {
            ExportProjectState();
            LastActivity = DateTime.Now.ToString("HH:mm:ss") + " - Manual refresh";
            Debug.Log("[BANTWORKS MCP] State refreshed manually");
        }

        [MenuItem("BANTWORKS MCP/Open MCP Folder")]
        private static void OpenMCPFolder()
        {
            EditorUtility.RevealInFinder(MCPFolder);
        }

        [MenuItem("BANTWORKS MCP/Clear Commands")]
        private static void ClearCommands()
        {
            if (Directory.Exists(CommandsFolder))
            {
                foreach (var file in Directory.GetFiles(CommandsFolder, "*.json"))
                {
                    File.Delete(file);
                }
            }
            Debug.Log("[BANTWORKS MCP] Commands folder cleared");
        }

        [MenuItem("BANTWORKS MCP/Scan Prefabs")]
        private static void ScanPrefabsMenuItem()
        {
            if (IsScanningPrefabs)
            {
                Debug.LogWarning("[BANTWORKS MCP] Prefab scan already in progress");
                return;
            }
            ScanAndExportPrefabCatalog();
        }

        #endregion

        #region Command Processing

        private static void ProcessCommands()
        {
            if (!Directory.Exists(CommandsFolder))
                return;

            string[] commandFiles = Directory.GetFiles(CommandsFolder, "*.json");

            foreach (string file in commandFiles)
            {
                MCPCommand command = null;
                try
                {
                    string json = File.ReadAllText(file);
                    command = JsonUtility.FromJson<MCPCommand>(json);
                    string message = ProcessCommandJson(json, command);
                    WriteCommandResult(command?.id, true, message, null);
                    CommandsProcessed++;
                    LastActivity = DateTime.Now.ToString("HH:mm:ss") + " - Command processed";

                    // Delete processed command
                    File.Delete(file);
                }
                catch (Exception e)
                {
                    Debug.LogError($"[BANTWORKS MCP] Error processing command {file}: {e.Message}");
                    WriteCommandResult(command?.id, false, null, e.Message);
                    ArchiveFailedCommand(file);
                }
            }
        }

        private static string ProcessCommandJson(string json, MCPCommand baseCommand)
        {
            if (baseCommand == null || string.IsNullOrWhiteSpace(baseCommand.type))
                throw new InvalidOperationException("Command is missing a type");

            switch (baseCommand.type)
            {
                case "refresh":
                    AssetDatabase.Refresh();
                    ExportImportStatus(true, null);
                    return "Unity assets refreshed";

                case "export-state":
                    ExportProjectState();
                    return "Project state exported";

                case "control_play_mode":
                    var playModeCmd = JsonUtility.FromJson<PlayModeCommand>(json);
                    ControlPlayMode(playModeCmd);
                    return $"Play Mode action requested: {playModeCmd.action}";

                case "capture_screenshot":
                    var screenshotCmd = JsonUtility.FromJson<ScreenshotCommand>(json);
                    CaptureScreenshot(screenshotCmd);
                    return $"Captured {screenshotCmd.source} screenshot";

                case "search_assets":
                    var assetSearchCmd = JsonUtility.FromJson<AssetSearchCommand>(json);
                    SearchAssets(assetSearchCmd);
                    return $"Searched Unity assets: {assetSearchCmd.query}";

                case "validate_vs_graph_asset":
                    var validateGraphCmd = JsonUtility.FromJson<ValidateVSGraphAssetCommand>(json);
                    ValidateVisualScriptingGraphAsset(validateGraphCmd);
                    return $"Validated Visual Scripting graph asset: {validateGraphCmd.assetPath}";

                case "validate_banter_visual_scripting":
                    var validateBanterCmd = JsonUtility.FromJson<ValidateBanterVisualScriptingCommand>(json);
                    ValidateBanterVisualScripting(validateBanterCmd);
                    return "Ran Banter Visual Scripting validation";

                case "run_tests":
                    var runTestsCmd = JsonUtility.FromJson<RunTestsCommand>(json);
                    RunUnityTests(runTestsCmd);
                    return $"Started Unity {runTestsCmd.mode} tests";

                case "discover_tests":
                    var discoverTestsCmd = JsonUtility.FromJson<DiscoverTestsCommand>(json);
                    DiscoverUnityTests(discoverTestsCmd);
                    return $"Started Unity {discoverTestsCmd.mode} test discovery";

                case "cancel_tests":
                    var cancelTestsCmd = JsonUtility.FromJson<CancelTestsCommand>(json);
                    CancelUnityTests(cancelTestsCmd);
                    return $"Requested cancellation for Unity test run: {cancelTestsCmd.runId}";

                case "get_scenes":
                    var getScenesCmd = JsonUtility.FromJson<GetScenesCommand>(json);
                    ExportSceneManagementResult(getScenesCmd.id, "Read Unity scene state");
                    return "Read Unity scene state";

                case "save_scene":
                    var saveSceneCmd = JsonUtility.FromJson<SaveSceneCommand>(json);
                    SaveUnityScene(saveSceneCmd);
                    return "Saved Unity scene";

                case "open_scene":
                    var openSceneCmd = JsonUtility.FromJson<OpenSceneCommand>(json);
                    OpenUnityScene(openSceneCmd);
                    return $"Opened Unity scene: {openSceneCmd.scenePath}";

                case "set_build_scenes":
                    var setBuildScenesCmd = JsonUtility.FromJson<SetBuildScenesCommand>(json);
                    SetUnityBuildScenes(setBuildScenesCmd);
                    return "Updated Unity build scenes";

                case "create_gameobject":
                    var createCmd = JsonUtility.FromJson<CreateGameObjectCommand>(json);
                    CreateGameObject(createCmd);
                    return $"Created GameObject: {createCmd.name}";

                case "delete_gameobject":
                    var deleteCmd = JsonUtility.FromJson<DeleteGameObjectCommand>(json);
                    DeleteGameObject(deleteCmd);
                    return $"Deleted GameObject: {deleteCmd.objectPath}";

                case "modify_gameobject":
                    var modifyCmd = JsonUtility.FromJson<ModifyGameObjectCommand>(json);
                    ModifyGameObject(modifyCmd);
                    return $"Modified GameObject: {modifyCmd.objectPath}";

                case "add_component":
                    var addCompCmd = JsonUtility.FromJson<AddComponentCommand>(json);
                    AddComponentToObject(addCompCmd);
                    return $"Added component: {addCompCmd.componentType}";

                case "remove_component":
                    var removeCompCmd = JsonUtility.FromJson<RemoveComponentCommand>(json);
                    RemoveComponentFromObject(removeCompCmd);
                    return $"Removed component: {removeCompCmd.componentType}";

                case "set_component_property":
                    var setPropCmd = JsonUtility.FromJson<SetComponentPropertyCommand>(json);
                    SetComponentProperty(setPropCmd);
                    return $"Set component property: {setPropCmd.componentType}.{setPropCmd.propertyName}";

                case "set_object_reference":
                    var setRefCmd = JsonUtility.FromJson<SetObjectReferenceCommand>(json);
                    SetObjectReference(setRefCmd);
                    return $"Set object reference: {setRefCmd.componentType}.{setRefCmd.propertyName}";

                case "batch":
                    var batchCmd = JsonUtility.FromJson<BatchCommand>(json);
                    ProcessBatchCommand(batchCmd);
                    return "Batch command completed";

                case "instantiate_prefab":
                    var prefabCmd = JsonUtility.FromJson<InstantiatePrefabCommand>(json);
                    InstantiatePrefab(prefabCmd);
                    return $"Instantiated prefab: {prefabCmd.prefabPath}";

                case "scan_prefabs":
                    ScanAndExportPrefabCatalog();
                    return "Prefab catalog scan completed";

                case "get_object_bounds":
                    var boundsCmd = JsonUtility.FromJson<GetBoundsCommand>(json);
                    GetObjectBounds(boundsCmd);
                    return $"Read bounds for: {boundsCmd.objectPath}";

                default:
                    throw new InvalidOperationException($"Unknown command type: {baseCommand.type}");
            }
        }

        private static void ArchiveFailedCommand(string sourcePath)
        {
            try
            {
                if (!File.Exists(sourcePath))
                    return;

                string targetPath = Path.Combine(FailedCommandsFolder, Path.GetFileName(sourcePath));
                if (File.Exists(targetPath))
                    targetPath = Path.Combine(FailedCommandsFolder, $"{Path.GetFileNameWithoutExtension(sourcePath)}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}.json");

                File.Move(sourcePath, targetPath);
            }
            catch (Exception e)
            {
                Debug.LogError($"[BANTWORKS MCP] Could not archive failed command {sourcePath}: {e.Message}");
            }
        }

        private static void WriteCommandResult(string commandId, bool success, string message, string error)
        {
            if (string.IsNullOrWhiteSpace(commandId))
                return;

            try
            {
                var result = new CommandResult
                {
                    commandId = commandId,
                    success = success,
                    message = message,
                    error = error,
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                WriteAtomicText(Path.Combine(CommandResultsFolder, $"{commandId}.json"), JsonUtility.ToJson(result, true));
            }
            catch (Exception e)
            {
                System.Console.WriteLine($"[BANTWORKS MCP] Could not write command result: {e.Message}");
            }
        }

        private static void CreateGameObject(CreateGameObjectCommand cmd)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.name))
                throw new InvalidOperationException("Create GameObject command requires a name");

            GameObject parent = ResolveOptionalGameObject(cmd.parentId, cmd.parentPath);
            GameObject obj = null;

            // Create based on primitive type
            if (string.IsNullOrEmpty(cmd.primitiveType))
            {
                obj = new GameObject(cmd.name);
            }
            else
            {
                PrimitiveType primType;
                if (Enum.TryParse(cmd.primitiveType, true, out primType))
                {
                    obj = GameObject.CreatePrimitive(primType);
                    obj.name = cmd.name;
                }
                else
                {
                    throw new InvalidOperationException($"Unknown primitive type: {cmd.primitiveType}");
                }
            }

            // Set transform
            if (cmd.position != null && cmd.position.Length == 3)
            {
                obj.transform.position = new Vector3(cmd.position[0], cmd.position[1], cmd.position[2]);
            }

            if (cmd.rotation != null && cmd.rotation.Length == 3)
            {
                obj.transform.eulerAngles = new Vector3(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);
            }

            if (cmd.scale != null && cmd.scale.Length == 3)
            {
                obj.transform.localScale = new Vector3(cmd.scale[0], cmd.scale[1], cmd.scale[2]);
            }

            // Set parent if specified
            if (parent != null)
            {
                obj.transform.SetParent(parent.transform, true);
            }

            // Mark scene dirty
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());

            // Select the new object
            Selection.activeGameObject = obj;

            Debug.Log($"[BANTWORKS MCP] Created GameObject: {cmd.name}");
            ExportSceneHierarchy();
        }

        private static void DeleteGameObject(DeleteGameObjectCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);
            Undo.DestroyObjectImmediate(obj);
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Deleted GameObject: {DescribeObject(cmd.objectId, cmd.objectPath)}");
            ExportSceneHierarchy();
        }

        private static void ControlPlayMode(PlayModeCommand cmd)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.action))
                throw new InvalidOperationException("Play Mode command requires an action");
            if (EditorApplication.isCompiling)
                throw new InvalidOperationException("Unity is compiling. Wait for compilation to finish before changing Play Mode.");

            switch (cmd.action.Trim().ToLowerInvariant())
            {
                case "play":
                    if (EditorApplication.isPlaying)
                        EditorApplication.isPaused = false;
                    else if (!EditorApplication.isPlayingOrWillChangePlaymode)
                        EditorApplication.isPlaying = true;
                    break;
                case "pause":
                    if (!EditorApplication.isPlaying)
                        throw new InvalidOperationException("Unity must be in Play Mode before it can be paused");
                    EditorApplication.isPaused = true;
                    break;
                case "resume":
                    if (!EditorApplication.isPlaying)
                        throw new InvalidOperationException("Unity must be in Play Mode before it can be resumed");
                    EditorApplication.isPaused = false;
                    break;
                case "stop":
                    if (EditorApplication.isPlayingOrWillChangePlaymode)
                        EditorApplication.isPlaying = false;
                    break;
                default:
                    throw new InvalidOperationException($"Unknown Play Mode action: {cmd.action}");
            }

            ExportEditorState();
        }

        private static void CaptureScreenshot(ScreenshotCommand cmd)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.id))
                throw new InvalidOperationException("Screenshot command requires an ID");

            string source = string.IsNullOrWhiteSpace(cmd.source)
                ? "game"
                : cmd.source.Trim().ToLowerInvariant();
            int width = cmd.width == 0 ? 1280 : cmd.width;
            int height = cmd.height == 0 ? 720 : cmd.height;
            if (width < 64 || width > 4096 || height < 64 || height > 4096)
                throw new InvalidOperationException("Screenshot width and height must be between 64 and 4096 pixels");

            Camera camera;
            switch (source)
            {
                case "game":
                    camera = ResolveScreenshotCamera(cmd.cameraId, cmd.cameraPath);
                    break;
                case "scene":
                    var sceneView = SceneView.lastActiveSceneView ?? SceneView.sceneViews.OfType<SceneView>().FirstOrDefault();
                    camera = sceneView?.camera;
                    if (camera == null)
                        throw new InvalidOperationException("No Scene View camera is available. Open a Scene View and try again.");
                    break;
                default:
                    throw new InvalidOperationException($"Unknown screenshot source: {cmd.source}");
            }

            string outputPath = Path.Combine(ScreenshotResultsFolder, cmd.id + ".png");
            RenderTexture renderTexture = null;
            Texture2D texture = null;
            RenderTexture previousActive = RenderTexture.active;
            RenderTexture previousTarget = camera.targetTexture;

            try
            {
                renderTexture = RenderTexture.GetTemporary(width, height, 24, RenderTextureFormat.ARGB32);
                camera.targetTexture = renderTexture;
                camera.Render();

                RenderTexture.active = renderTexture;
                texture = new Texture2D(width, height, TextureFormat.RGBA32, false);
                texture.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                texture.Apply(false, false);

                byte[] png = texture.EncodeToPNG();
                if (png == null || png.Length == 0)
                    throw new InvalidOperationException("Unity returned an empty screenshot");

                WriteAtomicBytes(outputPath, png);
                DeleteOldFiles(ScreenshotResultsFolder, "*.png", 20);
                Debug.Log($"[BANTWORKS MCP] Captured {source} screenshot {width}x{height} using {camera.name}");
            }
            finally
            {
                camera.targetTexture = previousTarget;
                RenderTexture.active = previousActive;
                if (renderTexture != null)
                    RenderTexture.ReleaseTemporary(renderTexture);
                if (texture != null)
                    UnityEngine.Object.DestroyImmediate(texture);
            }
        }

        private static Camera ResolveScreenshotCamera(string cameraId, string cameraPath)
        {
            if (!string.IsNullOrWhiteSpace(cameraId))
            {
                GlobalObjectId globalObjectId;
                if (!GlobalObjectId.TryParse(cameraId, out globalObjectId))
                    throw new InvalidOperationException($"Invalid camera GlobalObjectId: {cameraId}");

                var cameraById = GlobalObjectId.GlobalObjectIdentifierToObjectSlow(globalObjectId) as Camera;
                var activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                if (cameraById == null || cameraById.gameObject.scene != activeScene)
                    throw new InvalidOperationException($"Camera ID is stale or not in the active scene: {cameraId}");
                return cameraById;
            }

            if (!string.IsNullOrWhiteSpace(cameraPath))
            {
                var owner = ResolveGameObject(null, cameraPath);
                return ResolveComponent(owner, null, "Camera") as Camera;
            }

            if (Camera.main != null)
                return Camera.main;

            var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            var camera = Resources.FindObjectsOfTypeAll<Camera>()
                .FirstOrDefault(candidate => candidate.gameObject.scene == scene && candidate.enabled);
            if (camera == null)
                throw new InvalidOperationException("No enabled Camera exists in the active scene");
            return camera;
        }

        private static void SearchAssets(AssetSearchCommand cmd)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.id))
                throw new InvalidOperationException("Asset search command requires an ID");
            if (string.IsNullOrWhiteSpace(cmd.query))
                throw new InvalidOperationException("Asset search requires a non-empty query");

            int limit = cmd.limit == 0 ? 100 : cmd.limit;
            if (limit < 1 || limit > 500)
                throw new InvalidOperationException("Asset search limit must be between 1 and 500");

            string[] searchFolders = null;
            if (cmd.folders != null && cmd.folders.Length > 0)
            {
                searchFolders = cmd.folders
                    .Select(folder => (folder ?? "").Replace('\\', '/').TrimEnd('/'))
                    .Distinct(StringComparer.Ordinal)
                    .ToArray();

                foreach (string folder in searchFolders)
                {
                    bool allowedRoot = folder == "Assets" || folder.StartsWith("Assets/", StringComparison.Ordinal) ||
                        (cmd.includePackages && (folder == "Packages" || folder.StartsWith("Packages/", StringComparison.Ordinal)));
                    if (!allowedRoot || !AssetDatabase.IsValidFolder(folder))
                        throw new InvalidOperationException($"Invalid or disallowed asset search folder: {folder}");
                }
            }
            else if (!cmd.includePackages)
            {
                searchFolders = new[] { "Assets" };
            }

            string[] guids = searchFolders == null
                ? AssetDatabase.FindAssets(cmd.query)
                : AssetDatabase.FindAssets(cmd.query, searchFolders);

            var paths = guids
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(assetPath => !string.IsNullOrWhiteSpace(assetPath))
                .Where(assetPath => cmd.includePackages || !assetPath.StartsWith("Packages/", StringComparison.Ordinal))
                .Distinct(StringComparer.Ordinal)
                .OrderBy(assetPath => assetPath, StringComparer.Ordinal)
                .ToList();

            var result = new AssetSearchResult
            {
                commandId = cmd.id,
                success = true,
                query = cmd.query,
                totalMatches = paths.Count,
                truncated = paths.Count > limit,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                assets = paths.Take(limit).Select(assetPath => new AssetSearchEntry
                {
                    guid = AssetDatabase.AssetPathToGUID(assetPath),
                    path = assetPath,
                    name = Path.GetFileNameWithoutExtension(assetPath),
                    type = AssetDatabase.GetMainAssetTypeAtPath(assetPath)?.FullName,
                    isFolder = AssetDatabase.IsValidFolder(assetPath)
                }).ToList()
            };

            WriteAtomicText(
                Path.Combine(AssetSearchResultsFolder, cmd.id + ".json"),
                JsonUtility.ToJson(result, true));
            DeleteOldFiles(AssetSearchResultsFolder, "*.json", 50);
        }

        private static void ValidateVisualScriptingGraphAsset(ValidateVSGraphAssetCommand cmd)
        {
            if (cmd == null || !IsSafeCorrelationId(cmd.id))
                throw new InvalidOperationException("Visual Scripting validation requires a safe correlation ID");

            var result = new VSGraphAssetValidationResult
            {
                commandId = cmd.id,
                success = false,
                assetPath = cmd.assetPath,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                elementTypes = new List<string>(),
                warnings = new List<string>()
            };

            try
            {
                if (EditorApplication.isCompiling || EditorApplication.isUpdating)
                    throw new InvalidOperationException("Unity is compiling or importing assets. Wait for the Editor to settle.");

                string assetPath = NormalizeVisualScriptingAssetPath(cmd.assetPath);
                string fullPath = Path.GetFullPath(Path.Combine(ProjectRoot, assetPath));
                if (!File.Exists(fullPath))
                    throw new FileNotFoundException("Visual Scripting graph asset does not exist", assetPath);

                AssetDatabase.ImportAsset(
                    assetPath,
                    ImportAssetOptions.ForceSynchronousImport | ImportAssetOptions.ForceUpdate);

                UnityEngine.Object asset = AssetDatabase.LoadMainAssetAtPath(assetPath);
                if (asset == null)
                    throw new InvalidOperationException("Unity could not load the graph's main asset after import. Check the Console for deserialization errors.");

                Type assetType = asset.GetType();
                result.assetPath = assetPath;
                result.assetGuid = AssetDatabase.AssetPathToGUID(assetPath);
                result.assetType = assetType.FullName;
                result.dependencyHash = AssetDatabase.GetAssetDependencyHash(assetPath).ToString();

                if (!string.Equals(assetType.FullName, "Unity.VisualScripting.ScriptGraphAsset", StringComparison.Ordinal))
                {
                    throw new InvalidOperationException(
                        $"Expected Unity.VisualScripting.ScriptGraphAsset but Unity loaded {assetType.FullName}");
                }

                const BindingFlags flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
                System.Reflection.PropertyInfo graphProperty = assetType.GetProperty("graph", flags);
                FieldInfo graphField = graphProperty == null ? assetType.GetField("graph", flags) : null;
                object graph = graphProperty != null ? graphProperty.GetValue(asset) : graphField?.GetValue(asset);
                if (graph == null)
                    throw new InvalidOperationException("Unity loaded the ScriptGraphAsset but its graph is null");

                Type graphType = graph.GetType();
                result.graphType = graphType.FullName;
                System.Reflection.PropertyInfo elementsProperty = graphType.GetProperty("elements", flags);
                FieldInfo elementsField = elementsProperty == null ? graphType.GetField("elements", flags) : null;
                object elementsValue = elementsProperty != null
                    ? elementsProperty.GetValue(graph)
                    : elementsField?.GetValue(graph);
                var elements = elementsValue as System.Collections.IEnumerable;
                if (elements == null)
                    throw new InvalidOperationException("Unity loaded the graph but did not expose an elements collection");

                var elementTypes = new HashSet<string>(StringComparer.Ordinal);
                foreach (object element in elements)
                {
                    result.elementCount++;
                    if (element == null)
                    {
                        result.missingElementCount++;
                        continue;
                    }

                    string typeName = element.GetType().FullName ?? element.GetType().Name;
                    elementTypes.Add(typeName);
                    if (typeName == "Unity.VisualScripting.ControlConnection")
                        result.controlConnectionCount++;
                    else if (typeName == "Unity.VisualScripting.ValueConnection")
                        result.valueConnectionCount++;
                    else if (typeName == "Unity.VisualScripting.GraphGroup")
                        result.groupCount++;
                    else
                        result.nodeCount++;

                    if (typeName.IndexOf("Missing", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        typeName.IndexOf("Unknown", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        result.missingElementCount++;
                    }
                }

                result.elementTypes = elementTypes.OrderBy(name => name, StringComparer.Ordinal).Take(200).ToList();
                if (result.missingElementCount > 0)
                    result.warnings.Add($"Unity exposed {result.missingElementCount} missing or unknown graph elements");

                result.success = result.missingElementCount == 0;
                if (!result.success)
                    result.error = "The graph imported, but one or more elements could not be resolved";
            }
            catch (Exception exception)
            {
                Exception actual = exception is TargetInvocationException && exception.InnerException != null
                    ? exception.InnerException
                    : exception;
                result.error = actual.Message;
            }

            WriteAtomicText(
                Path.Combine(VisualScriptingValidationResultsFolder, cmd.id + ".json"),
                JsonUtility.ToJson(result, true));
            DeleteOldFiles(VisualScriptingValidationResultsFolder, "*.json", 50);
        }

        private static string NormalizeVisualScriptingAssetPath(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidOperationException("assetPath is required");

            string normalized = value.Replace('\\', '/').Trim();
            if (!normalized.StartsWith("Assets/", StringComparison.Ordinal) ||
                !string.Equals(Path.GetExtension(normalized), ".asset", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("assetPath must be an Assets/... path ending in .asset");
            }
            if (normalized.Split('/').Any(segment => segment.Length == 0 || segment == "." || segment == ".."))
                throw new InvalidOperationException("assetPath contains an invalid path segment");

            string assetsRoot = Path.GetFullPath(Application.dataPath)
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string fullPath = Path.GetFullPath(Path.Combine(ProjectRoot, normalized));
            if (!fullPath.StartsWith(assetsRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("assetPath must stay inside the project's Assets folder");

            return normalized;
        }

        private static void ValidateBanterVisualScripting(ValidateBanterVisualScriptingCommand cmd)
        {
            if (cmd == null || !IsSafeCorrelationId(cmd.id))
                throw new InvalidOperationException("Banter Visual Scripting validation requires a safe correlation ID");

            const int maxDiagnostics = 200;
            const int maxDiagnosticStackTraceLength = 2048;
            var result = new BanterVisualScriptingValidationResult
            {
                commandId = cmd.id,
                success = false,
                validatorAvailable = false,
                validationCompleted = false,
                validationPassed = false,
                diagnostics = new List<ConsoleLogEntry>(),
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
            int observedDiagnosticCount = 0;
            Application.LogCallback diagnosticCapture = null;

            try
            {
                if (EditorApplication.isCompiling || EditorApplication.isUpdating)
                    throw new InvalidOperationException("Unity is compiling or importing assets. Wait for the Editor to settle.");

                const string validatorTypeName = "Banter.SDKEditor.ValidateVisualScripting";
                Type validatorType = Type.GetType(validatorTypeName + ", Banter.SDKEditor", false) ??
                    AppDomain.CurrentDomain.GetAssemblies()
                        .Select(assembly => assembly.GetType(validatorTypeName, false))
                        .FirstOrDefault(candidate => candidate != null);
                if (validatorType == null)
                {
                    throw new InvalidOperationException(
                        "Banter's Visual Scripting validator is unavailable. Install a compatible Banter SDK and Unity Visual Scripting package, then wait for compilation to finish.");
                }

                MethodInfo validatorMethod = validatorType.GetMethod(
                    "CheckVsNodes",
                    BindingFlags.Public | BindingFlags.Static,
                    null,
                    Type.EmptyTypes,
                    null);
                if (validatorMethod == null || validatorMethod.ReturnType != typeof(bool))
                    throw new MissingMethodException(validatorType.FullName, "public static bool CheckVsNodes()");

                result.validatorAvailable = true;
                result.validatorType = validatorType.FullName;
                result.validatorAssembly = validatorType.Assembly.GetName().Name;
                result.validatorMethod = validatorMethod.Name;

                diagnosticCapture = (condition, stackTrace, logType) =>
                {
                    if (string.IsNullOrEmpty(condition) ||
                        !condition.StartsWith("[VisualScripting]", StringComparison.Ordinal))
                    {
                        return;
                    }

                    observedDiagnosticCount++;
                    if (result.diagnostics.Count >= maxDiagnostics)
                        return;

                    result.diagnostics.Add(new ConsoleLogEntry
                    {
                        level = logType.ToString(),
                        message = condition,
                        stackTrace = string.IsNullOrEmpty(stackTrace)
                            ? ""
                            : stackTrace.Substring(0, Math.Min(stackTrace.Length, maxDiagnosticStackTraceLength)),
                        timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    });
                };
                Application.logMessageReceived += diagnosticCapture;

                object validatorReturn = validatorMethod.Invoke(null, null);
                result.validationPassed = validatorReturn is bool && (bool)validatorReturn;
                result.validationCompleted = true;
                result.success = result.validationPassed;
                if (!result.validationPassed)
                    result.error = "Banter's Visual Scripting validator reported one or more errors.";
            }
            catch (Exception exception)
            {
                Exception actual = exception is TargetInvocationException && exception.InnerException != null
                    ? exception.InnerException
                    : exception;
                result.error = actual.Message;
            }
            finally
            {
                if (diagnosticCapture != null)
                    Application.logMessageReceived -= diagnosticCapture;
            }

            result.diagnosticCount = observedDiagnosticCount;
            result.diagnosticsTruncated = observedDiagnosticCount > result.diagnostics.Count;
            WriteAtomicText(
                Path.Combine(BanterValidationResultsFolder, cmd.id + ".json"),
                JsonUtility.ToJson(result, true));
            DeleteOldFiles(BanterValidationResultsFolder, "*.json", 50);
        }

        private static void RunUnityTests(RunTestsCommand cmd)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.id))
                throw new InvalidOperationException("Unity test command requires an ID");
            if (!IsSafeCorrelationId(cmd.id))
                throw new InvalidOperationException("Unity test command ID contains unsupported characters");
            if (EditorApplication.isCompiling || EditorApplication.isUpdating)
                throw new InvalidOperationException("Unity is compiling or importing assets. Wait for the Editor to settle before running tests.");
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Stop Play Mode before starting a Unity Test Runner job.");

            string mode = string.IsNullOrWhiteSpace(cmd.mode)
                ? "edit"
                : cmd.mode.Trim().ToLowerInvariant();
            if (mode != "edit" && mode != "play" && mode != "all")
                throw new InvalidOperationException("Unity test mode must be 'edit', 'play', or 'all'");

            int maxResults = cmd.maxResults == 0 ? 500 : cmd.maxResults;
            if (maxResults < 1 || maxResults > 5000)
                throw new InvalidOperationException("Unity test maxResults must be between 1 and 5000");

            int timeoutMs = cmd.timeoutMs == 0 ? 120000 : cmd.timeoutMs;
            if (timeoutMs < 1000 || timeoutMs > 600000)
                throw new InvalidOperationException("Unity test timeoutMs must be between 1000 and 600000");

            if (FindPendingTestRun() != null || IsUnityTestRunActive())
                throw new InvalidOperationException("A Unity Test Runner job is already active");

            Type apiType = FindTestRunnerType("TestRunnerApi");
            Type callbackType = FindTestRunnerType("ICallbacks");
            Type filterType = FindTestRunnerType("Filter");
            Type executionSettingsType = FindTestRunnerType("ExecutionSettings");
            Type testModeType = FindTestRunnerType("TestMode");
            if (apiType == null || callbackType == null || filterType == null ||
                executionSettingsType == null || testModeType == null)
            {
                throw new InvalidOperationException(
                    "Unity Test Framework is not available. Add com.unity.test-framework to this project first.");
            }

            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var run = new UnityTestRunResult
            {
                commandId = cmd.id,
                success = false,
                testsPassed = false,
                status = "starting",
                mode = mode,
                startedAt = now,
                updatedAt = now,
                deadline = now + Math.Max(timeoutMs + 120000L, 1800000L),
                maxResults = maxResults,
                testNames = CleanFilterValues(cmd.testNames),
                groupNames = CleanFilterValues(cmd.groupNames),
                categoryNames = CleanFilterValues(cmd.categoryNames),
                assemblyNames = CleanFilterValues(cmd.assemblyNames),
                tests = new List<UnityTestCaseResult>()
            };
            SaveTestRunResult(run);

            try
            {
                object filter = Activator.CreateInstance(filterType);
                SetTestRunnerField(filterType, filter, "testMode", ParseTestMode(testModeType, mode));
                SetTestRunnerField(filterType, filter, "testNames", EmptyToNull(run.testNames));
                SetTestRunnerField(filterType, filter, "groupNames", EmptyToNull(run.groupNames));
                SetTestRunnerField(filterType, filter, "categoryNames", EmptyToNull(run.categoryNames));
                SetTestRunnerField(filterType, filter, "assemblyNames", EmptyToNull(run.assemblyNames));

                Array filters = Array.CreateInstance(filterType, 1);
                filters.SetValue(filter, 0);
                ConstructorInfo settingsConstructor = executionSettingsType.GetConstructor(new[] { filters.GetType() });
                if (settingsConstructor == null)
                    throw new MissingMethodException(executionSettingsType.FullName, ".ctor(Filter[])");

                object executionSettings = settingsConstructor.Invoke(new object[] { filters });
                SetTestRunnerField(executionSettingsType, executionSettings, "runSynchronously", false);

                RegisterTestRunnerCallback(cmd.id, apiType, callbackType);
                MethodInfo executeMethod = apiType.GetMethod("Execute", new[] { executionSettingsType });
                if (executeMethod == null)
                    throw new MissingMethodException(apiType.FullName, "Execute");

                object jobId = executeMethod.Invoke(activeTestRunnerApi, new[] { executionSettings });
                run = LoadTestRunResult(cmd.id) ?? run;
                run.jobId = jobId?.ToString();
                run.status = "running";
                run.updatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                SaveTestRunResult(run);
                DeleteOldFiles(TestRunResultsFolder, "*.json", 20);
            }
            catch (Exception exception)
            {
                Exception actual = exception is TargetInvocationException && exception.InnerException != null
                    ? exception.InnerException
                    : exception;
                run = LoadTestRunResult(cmd.id) ?? run;
                run.status = "failed";
                run.error = actual.Message;
                run.finishedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                run.updatedAt = run.finishedAt;
                SaveTestRunResult(run);
                UnregisterActiveTestRunnerCallback();
                throw new InvalidOperationException("Unity Test Framework could not start: " + actual.Message, actual);
            }
        }

        private static void DiscoverUnityTests(DiscoverTestsCommand cmd)
        {
            if (cmd == null || !IsSafeCorrelationId(cmd.id))
                throw new InvalidOperationException("Unity test discovery requires a safe command ID");
            if (EditorApplication.isCompiling || EditorApplication.isUpdating || EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Stop Play Mode and wait for Unity compilation/import to finish before discovering tests.");
            if (ActiveTestDiscoveryApis.Count > 0)
                throw new InvalidOperationException("A Unity test discovery request is already active");

            string mode = string.IsNullOrWhiteSpace(cmd.mode) ? "all" : cmd.mode.Trim().ToLowerInvariant();
            if (mode != "edit" && mode != "play" && mode != "all")
                throw new InvalidOperationException("Unity test discovery mode must be 'edit', 'play', or 'all'");

            int maxResults = cmd.maxResults == 0 ? 1000 : cmd.maxResults;
            if (maxResults < 1 || maxResults > 5000)
                throw new InvalidOperationException("Unity test discovery maxResults must be between 1 and 5000");
            string search = string.IsNullOrWhiteSpace(cmd.search) ? null : cmd.search.Trim();
            if (search != null && search.Length > 512)
                throw new InvalidOperationException("Unity test discovery search must not exceed 512 characters");

            Type apiType = FindTestRunnerType("TestRunnerApi");
            Type adaptorType = FindTestRunnerType("ITestAdaptor");
            Type testModeType = FindTestRunnerType("TestMode");
            if (apiType == null || adaptorType == null || testModeType == null)
            {
                throw new InvalidOperationException(
                    "Unity Test Framework is not available. Add com.unity.test-framework to this project first.");
            }

            UnityEngine.Object api = ScriptableObject.CreateInstance(apiType);
            ActiveTestDiscoveryApis[cmd.id] = api;
            try
            {
                MethodInfo helper = typeof(BantworksMCPBridge).GetMethod(
                    nameof(StartTypedTestDiscovery),
                    BindingFlags.NonPublic | BindingFlags.Static);
                if (helper == null)
                    throw new MissingMethodException(typeof(BantworksMCPBridge).FullName, nameof(StartTypedTestDiscovery));
                helper.MakeGenericMethod(adaptorType).Invoke(
                    null,
                    new object[] { api, ParseTestMode(testModeType, mode), cmd.id, mode, search, maxResults });
            }
            catch
            {
                ReleaseTestDiscoveryApi(cmd.id);
                throw;
            }
        }

        private static void StartTypedTestDiscovery<T>(
            object api,
            object testMode,
            string commandId,
            string mode,
            string search,
            int maxResults)
        {
            Type actionType = typeof(Action<T>);
            MethodInfo retrieve = api.GetType().GetMethod(
                "RetrieveTestList",
                BindingFlags.Public | BindingFlags.Instance,
                null,
                new[] { testMode.GetType(), actionType },
                null);
            if (retrieve == null)
                throw new MissingMethodException(api.GetType().FullName, "RetrieveTestList");

            Action<T> callback = root => CompleteTestDiscovery(commandId, mode, search, maxResults, root);
            retrieve.Invoke(api, new object[] { testMode, callback });
        }

        private static void CompleteTestDiscovery(
            string commandId,
            string mode,
            string search,
            int maxResults,
            object root)
        {
            var result = new TestDiscoveryResult
            {
                commandId = commandId,
                success = false,
                mode = mode,
                search = search,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                tests = new List<DiscoveredTestEntry>()
            };

            try
            {
                int visitedNodes = 0;
                WalkDiscoveredTestTree(root, search, maxResults, result, 0, ref visitedNodes);
                result.success = true;
                result.returned = result.tests.Count;
                result.truncated = result.matchingTests > result.returned;
            }
            catch (Exception exception)
            {
                result.error = exception.Message;
            }
            finally
            {
                WriteAtomicText(
                    Path.Combine(TestDiscoveryResultsFolder, commandId + ".json"),
                    JsonUtility.ToJson(result, true));
                DeleteOldFiles(TestDiscoveryResultsFolder, "*.json", 50);
                ReleaseTestDiscoveryApi(commandId);
            }
        }

        private static void WalkDiscoveredTestTree(
            object node,
            string search,
            int maxResults,
            TestDiscoveryResult result,
            int depth,
            ref int visitedNodes)
        {
            if (node == null)
                return;
            if (depth > 64 || ++visitedNodes > 100000)
                throw new InvalidOperationException("Unity returned an unexpectedly large or deep test tree");

            bool isSuite = ReadReflectedValue(node, "IsSuite", false);
            if (!isSuite)
            {
                result.totalTests++;
                string name = ReadReflectedValue(node, "Name", "");
                string fullName = ReadReflectedValue(node, "FullName", "");
                string assemblyName = FindDiscoveredTestAssembly(node);
                string[] categories = ReadReflectedObject(node, "Categories") as string[] ?? new string[0];
                bool matches = string.IsNullOrWhiteSpace(search) ||
                    name.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0 ||
                    fullName.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0 ||
                    assemblyName.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0 ||
                    categories.Any(category => category.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0);

                if (matches)
                {
                    result.matchingTests++;
                    if (result.tests.Count < maxResults)
                    {
                        result.tests.Add(new DiscoveredTestEntry
                        {
                            id = ReadReflectedValue(node, "Id", ""),
                            name = name,
                            fullName = fullName,
                            uniqueName = ReadReflectedValue(node, "UniqueName", ""),
                            assemblyName = assemblyName,
                            mode = ReadReflectedObject(node, "TestMode")?.ToString(),
                            runState = ReadReflectedObject(node, "RunState")?.ToString(),
                            description = ReadReflectedValue(node, "Description", ""),
                            skipReason = ReadReflectedValue(node, "SkipReason", ""),
                            categories = categories
                        });
                    }
                }
            }

            var children = ReadReflectedObject(node, "Children") as System.Collections.IEnumerable;
            if (children == null)
                return;
            foreach (object child in children)
                WalkDiscoveredTestTree(child, search, maxResults, result, depth + 1, ref visitedNodes);
        }

        private static string FindDiscoveredTestAssembly(object node)
        {
            object current = node;
            for (int depth = 0; current != null && depth < 64; depth++)
            {
                if (ReadReflectedValue(current, "IsTestAssembly", false))
                {
                    string assembly = ReadReflectedValue(current, "Name", "");
                    return assembly.EndsWith(".dll", StringComparison.OrdinalIgnoreCase)
                        ? assembly.Substring(0, assembly.Length - 4)
                        : assembly;
                }
                current = ReadReflectedObject(current, "Parent");
            }
            return "";
        }

        private static void ReleaseTestDiscoveryApi(string commandId)
        {
            if (ActiveTestDiscoveryApis.TryGetValue(commandId, out UnityEngine.Object api))
            {
                ActiveTestDiscoveryApis.Remove(commandId);
                if (api != null)
                    UnityEngine.Object.DestroyImmediate(api);
            }
        }

        private static void CancelUnityTests(CancelTestsCommand cmd)
        {
            if (cmd == null || !IsSafeCorrelationId(cmd.id) || !IsSafeCorrelationId(cmd.runId))
                throw new InvalidOperationException("Unity test cancellation requires safe command and run IDs");

            UnityTestRunResult run = LoadTestRunResult(cmd.runId);
            if (run == null)
                throw new InvalidOperationException("Unity test run was not found: " + cmd.runId);
            if (run.status != "starting" && run.status != "running")
                throw new InvalidOperationException("Unity test run is not active: " + run.status);
            if (string.IsNullOrWhiteSpace(run.jobId))
                throw new InvalidOperationException("Unity test run has not published its Test Framework job ID yet");

            Type apiType = FindTestRunnerType("TestRunnerApi");
            MethodInfo cancel = apiType?.GetMethod(
                "CancelTestRun",
                BindingFlags.Public | BindingFlags.Static,
                null,
                new[] { typeof(string) },
                null);
            if (cancel == null)
            {
                throw new NotSupportedException(
                    "The installed Unity Test Framework does not expose public cancellation. CancelTestRun requires a newer package (available in 1.6+).");
            }

            bool accepted = cancel.Invoke(null, new object[] { run.jobId }) is bool value && value;
            if (!accepted)
                throw new InvalidOperationException("Unity Test Framework did not accept cancellation for job: " + run.jobId);

            run.cancellationRequested = true;
            run.cancellationRequestedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            run.updatedAt = run.cancellationRequestedAt;
            SaveTestRunResult(run);
        }

        private static Type FindTestRunnerType(string typeName)
        {
            string fullName = "UnityEditor.TestTools.TestRunner.Api." + typeName;
            Type type = Type.GetType(fullName + ", UnityEditor.TestRunner", false);
            if (type != null)
                return type;

            return AppDomain.CurrentDomain.GetAssemblies()
                .Select(assembly => assembly.GetType(fullName, false))
                .FirstOrDefault(candidate => candidate != null);
        }

        private static object ParseTestMode(Type testModeType, string mode)
        {
            if (mode == "all")
            {
                int edit = Convert.ToInt32(Enum.Parse(testModeType, "EditMode"), CultureInfo.InvariantCulture);
                int play = Convert.ToInt32(Enum.Parse(testModeType, "PlayMode"), CultureInfo.InvariantCulture);
                return Enum.ToObject(testModeType, edit | play);
            }

            return Enum.Parse(testModeType, mode == "play" ? "PlayMode" : "EditMode");
        }

        private static void SetTestRunnerField(Type ownerType, object owner, string fieldName, object value)
        {
            FieldInfo field = ownerType.GetField(fieldName, BindingFlags.Public | BindingFlags.Instance);
            if (field == null)
                throw new MissingFieldException(ownerType.FullName, fieldName);
            field.SetValue(owner, value);
        }

        private static string[] CleanFilterValues(string[] values)
        {
            string[] cleaned = values == null
                ? new string[0]
                : values.Where(value => !string.IsNullOrWhiteSpace(value))
                    .Select(value => value.Trim())
                    .Distinct(StringComparer.Ordinal)
                    .ToArray();
            if (cleaned.Length > 200 || cleaned.Any(value => value.Length > 512))
                throw new InvalidOperationException("Unity test filters allow at most 200 values of at most 512 characters each");
            return cleaned;
        }

        private static bool IsSafeCorrelationId(string value)
        {
            return !string.IsNullOrWhiteSpace(value) && value.Length <= 128 &&
                value.All(character => char.IsLetterOrDigit(character) || character == '-');
        }

        private static string[] EmptyToNull(string[] values)
        {
            return values != null && values.Length > 0 ? values : null;
        }

        private static void RegisterTestRunnerCallback(string runId, Type apiType = null, Type callbackType = null)
        {
            if (activeTestRunId == runId && activeTestRunnerCallback != null)
                return;

            UnregisterActiveTestRunnerCallback();
            apiType = apiType ?? FindTestRunnerType("TestRunnerApi");
            callbackType = callbackType ?? FindTestRunnerType("ICallbacks");
            if (apiType == null || callbackType == null)
                throw new InvalidOperationException("Unity Test Framework callback API is unavailable");

            MethodInfo createProxy = typeof(DispatchProxy).GetMethods(BindingFlags.Public | BindingFlags.Static)
                .FirstOrDefault(method => method.Name == "Create" && method.IsGenericMethodDefinition &&
                    method.GetGenericArguments().Length == 2 && method.GetParameters().Length == 0);
            if (createProxy == null)
                throw new MissingMethodException(typeof(DispatchProxy).FullName, "Create<T,TProxy>");

            object callback = createProxy
                .MakeGenericMethod(callbackType, typeof(TestRunnerCallbackProxy))
                .Invoke(null, null);
            ((TestRunnerCallbackProxy)callback).RunId = runId;

            object api = ScriptableObject.CreateInstance(apiType);
            MethodInfo register = apiType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                .FirstOrDefault(method => method.Name == "RegisterCallbacks" && method.IsGenericMethodDefinition);
            if (register == null)
                throw new MissingMethodException(apiType.FullName, "RegisterCallbacks");

            register.MakeGenericMethod(callbackType).Invoke(api, new[] { callback, (object)0 });
            activeTestRunId = runId;
            activeTestRunnerApi = api;
            activeTestRunnerCallback = callback;
        }

        private static void UnregisterActiveTestRunnerCallback()
        {
            if (activeTestRunnerApi != null && activeTestRunnerCallback != null)
            {
                try
                {
                    Type apiType = activeTestRunnerApi.GetType();
                    Type callbackType = FindTestRunnerType("ICallbacks");
                    MethodInfo unregister = apiType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                        .FirstOrDefault(method => method.Name == "UnregisterCallbacks" && method.IsGenericMethodDefinition);
                    unregister?.MakeGenericMethod(callbackType).Invoke(
                        activeTestRunnerApi,
                        new[] { activeTestRunnerCallback });
                }
                catch (Exception exception)
                {
                    Debug.LogWarning("[BANTWORKS MCP] Could not unregister Test Runner callback: " + exception.Message);
                }

                if (activeTestRunnerApi is UnityEngine.Object unityObject)
                    UnityEngine.Object.DestroyImmediate(unityObject);
            }

            activeTestRunId = null;
            activeTestRunnerApi = null;
            activeTestRunnerCallback = null;
        }

        private static void ResumePendingTestRun()
        {
            if (!string.IsNullOrWhiteSpace(activeTestRunId))
                return;

            UnityTestRunResult pending = FindPendingTestRun();
            if (pending == null)
                return;

            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (pending.deadline > 0 && now > pending.deadline)
            {
                FailTestRun(pending, "The persisted Unity test run expired before a completion callback was received.");
                return;
            }

            try
            {
                RegisterTestRunnerCallback(pending.commandId);
                Debug.Log("[BANTWORKS MCP] Restored Test Runner callback for " + pending.commandId);
            }
            catch (Exception exception)
            {
                FailTestRun(pending, "Could not restore Unity Test Runner callback: " + exception.Message);
            }
        }

        private static UnityTestRunResult FindPendingTestRun()
        {
            if (!Directory.Exists(TestRunResultsFolder))
                return null;

            foreach (string file in Directory.GetFiles(TestRunResultsFolder, "*.json")
                .OrderByDescending(File.GetLastWriteTimeUtc))
            {
                try
                {
                    var result = JsonUtility.FromJson<UnityTestRunResult>(File.ReadAllText(file));
                    if (result != null && (result.status == "starting" || result.status == "running"))
                        return result;
                }
                catch
                {
                    // Ignore incomplete or unrelated files and continue to the next run.
                }
            }

            return null;
        }

        private static bool IsUnityTestRunActive()
        {
            return TryGetUnityTestRunActive(out bool active) && active;
        }

        private static bool TryGetUnityTestRunActive(out bool active)
        {
            active = false;
            Type apiType = FindTestRunnerType("TestRunnerApi");
            MethodInfo method = apiType?.GetMethod("IsRunActive", BindingFlags.NonPublic | BindingFlags.Static);
            if (method == null)
                return false;

            try
            {
                object result = method.Invoke(null, null);
                if (!(result is bool value))
                    return false;
                active = value;
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static void CheckActiveTestRunDeadline()
        {
            if (string.IsNullOrWhiteSpace(activeTestRunId))
                return;

            UnityTestRunResult run = LoadTestRunResult(activeTestRunId);
            if (run == null || run.status == "completed" || run.status == "failed")
            {
                UnregisterActiveTestRunnerCallback();
                return;
            }

            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (run.cancellationRequested && run.cancellationRequestedAt > 0 &&
                now - run.cancellationRequestedAt >= 2000 &&
                !EditorApplication.isPlayingOrWillChangePlaymode &&
                TryGetUnityTestRunActive(out bool testRunActive) && !testRunActive)
            {
                // Play Mode cancellation can reload scripts after the framework's terminal callback.
                run.status = "completed";
                run.success = true;
                run.testsPassed = false;
                run.completionSource = "cancellation_cleanup_observed";
                run.finishedAt = now;
                run.updatedAt = now;
                SaveTestRunResult(run);
                UnregisterActiveTestRunnerCallback();
                return;
            }

            if (run.deadline > 0 && now > run.deadline)
            {
                FailTestRun(run, "Unity Test Runner did not finish before the safety deadline.");
                UnregisterActiveTestRunnerCallback();
            }
        }

        private static void HandleTestRunnerCallback(string runId, string callbackName, object argument)
        {
            UnityTestRunResult run = LoadTestRunResult(runId);
            if (run == null || run.status == "completed" || run.status == "failed")
                return;

            try
            {
                switch (callbackName)
                {
                    case "RunStarted":
                        run.status = "running";
                        run.loadedTestCount = ReadReflectedValue(argument, "TestCaseCount", run.loadedTestCount);
                        break;

                    case "TestFinished":
                        object test = ReadReflectedObject(argument, "Test");
                        bool isSuite = test != null && ReadReflectedValue(test, "IsSuite", false);
                        if (!isSuite)
                        {
                            if (run.tests == null)
                                run.tests = new List<UnityTestCaseResult>();

                            if (run.tests.Count < run.maxResults)
                            {
                                run.tests.Add(new UnityTestCaseResult
                                {
                                    name = ReadReflectedValue(argument, "Name", ""),
                                    fullName = ReadReflectedValue(argument, "FullName", ""),
                                    resultState = ReadReflectedValue(argument, "ResultState", ""),
                                    status = ReadReflectedObject(argument, "TestStatus")?.ToString(),
                                    duration = ReadReflectedValue(argument, "Duration", 0d),
                                    message = ReadReflectedValue(argument, "Message", ""),
                                    stackTrace = ReadReflectedValue(argument, "StackTrace", ""),
                                    output = ReadReflectedValue(argument, "Output", "")
                                });
                            }
                            else
                            {
                                run.truncated = true;
                            }
                            run.completedCount++;
                        }
                        break;

                    case "RunFinished":
                        run.status = "completed";
                        run.success = true;
                        run.completionSource = "run_finished";
                        run.passed = ReadReflectedValue(argument, "PassCount", 0);
                        run.failed = ReadReflectedValue(argument, "FailCount", 0);
                        run.skipped = ReadReflectedValue(argument, "SkipCount", 0);
                        run.inconclusive = ReadReflectedValue(argument, "InconclusiveCount", 0);
                        run.total = run.passed + run.failed + run.skipped + run.inconclusive;
                        run.completedCount = run.total;
                        run.duration = ReadReflectedValue(argument, "Duration", 0d);
                        run.noTests = run.total == 0;
                        run.testsPassed = !run.cancellationRequested && !run.noTests && run.failed == 0;
                        run.finishedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                        break;
                }

                run.updatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                SaveTestRunResult(run);

                if (callbackName == "RunFinished")
                    UnregisterActiveTestRunnerCallback();
            }
            catch (Exception exception)
            {
                Debug.LogError("[BANTWORKS MCP] Test Runner callback failed: " + exception);
                FailTestRun(run, "Could not serialize Unity Test Runner result: " + exception.Message);
                UnregisterActiveTestRunnerCallback();
            }
        }

        private static object ReadReflectedObject(object source, string propertyName)
        {
            if (source == null)
                return null;
            return source.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance)?.GetValue(source, null);
        }

        private static T ReadReflectedValue<T>(object source, string propertyName, T fallback)
        {
            object value = ReadReflectedObject(source, propertyName);
            if (value == null)
                return fallback;
            if (value is T typed)
                return typed;

            try
            {
                return (T)Convert.ChangeType(value, typeof(T), CultureInfo.InvariantCulture);
            }
            catch
            {
                return fallback;
            }
        }

        private static UnityTestRunResult LoadTestRunResult(string runId)
        {
            if (string.IsNullOrWhiteSpace(runId))
                return null;

            string resultPath = Path.Combine(TestRunResultsFolder, runId + ".json");
            if (!File.Exists(resultPath))
                return null;

            try
            {
                return JsonUtility.FromJson<UnityTestRunResult>(File.ReadAllText(resultPath));
            }
            catch
            {
                return null;
            }
        }

        private static void SaveTestRunResult(UnityTestRunResult run)
        {
            if (run == null || string.IsNullOrWhiteSpace(run.commandId))
                return;
            WriteAtomicText(
                Path.Combine(TestRunResultsFolder, run.commandId + ".json"),
                JsonUtility.ToJson(run, true));
        }

        private static void FailTestRun(UnityTestRunResult run, string error)
        {
            if (run == null)
                return;
            run.status = "failed";
            run.success = false;
            run.testsPassed = false;
            run.error = error;
            run.finishedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            run.updatedAt = run.finishedAt;
            SaveTestRunResult(run);
        }

        public class TestRunnerCallbackProxy : DispatchProxy
        {
            public string RunId { get; set; }

            protected override object Invoke(MethodInfo targetMethod, object[] args)
            {
                if (targetMethod != null)
                    HandleTestRunnerCallback(RunId, targetMethod.Name, args != null && args.Length > 0 ? args[0] : null);
                return null;
            }
        }

        private static void SaveUnityScene(SaveSceneCommand cmd)
        {
            ValidateSceneCommand(cmd?.id);
            EnsureSceneEditingReady();

            UnityEngine.SceneManagement.Scene scene;
            if (string.IsNullOrWhiteSpace(cmd.scenePath))
            {
                scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            }
            else
            {
                string sourcePath = NormalizeSceneAssetPath(cmd.scenePath, "scenePath");
                scene = UnityEngine.SceneManagement.SceneManager.GetSceneByPath(sourcePath);
                if (!scene.IsValid() || !scene.isLoaded)
                    throw new InvalidOperationException("The requested scene is not open: " + sourcePath);
            }

            if (!scene.IsValid() || !scene.isLoaded)
                throw new InvalidOperationException("No loaded scene is available to save");

            string saveAsPath = null;
            if (!string.IsNullOrWhiteSpace(cmd.saveAsPath))
            {
                saveAsPath = NormalizeSceneAssetPath(cmd.saveAsPath, "saveAsPath");
                string parentFolder = Path.GetDirectoryName(saveAsPath)?.Replace('\\', '/');
                if (string.IsNullOrWhiteSpace(parentFolder) || !AssetDatabase.IsValidFolder(parentFolder))
                    throw new InvalidOperationException("The saveAsPath parent must be an existing Unity asset folder: " + parentFolder);

                bool samePath = string.Equals(scene.path, saveAsPath, StringComparison.Ordinal);
                bool destinationExists = File.Exists(Path.Combine(ProjectRoot, saveAsPath)) ||
                    AssetDatabase.LoadAssetAtPath<SceneAsset>(saveAsPath) != null;
                if (destinationExists && !samePath && !cmd.overwrite)
                    throw new InvalidOperationException("A scene already exists at saveAsPath. Set overwrite=true to replace it.");
            }
            else if (string.IsNullOrWhiteSpace(scene.path))
            {
                throw new InvalidOperationException("The active scene has never been saved. Provide saveAsPath under Assets/.");
            }

            bool saved = saveAsPath == null
                ? EditorSceneManager.SaveScene(scene)
                : EditorSceneManager.SaveScene(scene, saveAsPath, false);
            if (!saved)
                throw new InvalidOperationException("Unity did not save the scene");

            ExportProjectState();
            ExportSceneManagementResult(cmd.id, "Saved scene: " + scene.path);
        }

        private static void OpenUnityScene(OpenSceneCommand cmd)
        {
            ValidateSceneCommand(cmd?.id);
            EnsureSceneEditingReady();

            string scenePath = NormalizeSceneAssetPath(cmd.scenePath, "scenePath");
            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(scenePath) == null)
                throw new InvalidOperationException("Scene asset was not found: " + scenePath);

            string requestedMode = string.IsNullOrWhiteSpace(cmd.mode)
                ? "single"
                : cmd.mode.Trim().ToLowerInvariant();
            if (requestedMode != "single" && requestedMode != "additive")
                throw new InvalidOperationException("Scene open mode must be 'single' or 'additive'");

            var openMode = requestedMode == "additive" ? OpenSceneMode.Additive : OpenSceneMode.Single;
            var existing = UnityEngine.SceneManagement.SceneManager.GetSceneByPath(scenePath);
            bool alreadySatisfiesRequest = existing.IsValid() && existing.isLoaded &&
                (openMode == OpenSceneMode.Additive || UnityEngine.SceneManagement.SceneManager.sceneCount == 1);

            UnityEngine.SceneManagement.Scene openedScene;
            if (alreadySatisfiesRequest)
            {
                openedScene = existing;
            }
            else
            {
                if (openMode == OpenSceneMode.Single)
                    SaveDirtyOpenScenesOrThrow(cmd.saveModifiedScenes);
                openedScene = EditorSceneManager.OpenScene(scenePath, openMode);
            }

            if (!openedScene.IsValid() || !openedScene.isLoaded)
                throw new InvalidOperationException("Unity did not load scene: " + scenePath);
            if (cmd.setActive && UnityEngine.SceneManagement.SceneManager.GetActiveScene() != openedScene &&
                !UnityEngine.SceneManagement.SceneManager.SetActiveScene(openedScene))
            {
                throw new InvalidOperationException("Unity loaded the scene but could not make it active: " + scenePath);
            }

            ExportProjectState();
            ExportSceneManagementResult(cmd.id, "Opened scene: " + scenePath);
        }

        private static void SaveDirtyOpenScenesOrThrow(bool saveModifiedScenes)
        {
            var dirtyScenes = new List<UnityEngine.SceneManagement.Scene>();
            for (int index = 0; index < UnityEngine.SceneManagement.SceneManager.sceneCount; index++)
            {
                var scene = UnityEngine.SceneManagement.SceneManager.GetSceneAt(index);
                if (scene.isLoaded && scene.isDirty)
                    dirtyScenes.Add(scene);
            }

            if (dirtyScenes.Count == 0)
                return;
            if (!saveModifiedScenes)
            {
                string names = string.Join(", ", dirtyScenes.Select(scene => string.IsNullOrWhiteSpace(scene.path) ? scene.name + " (unsaved)" : scene.path));
                throw new InvalidOperationException("Opening a scene in Single mode would discard modified scenes: " + names + ". Save them first or set saveModifiedScenes=true.");
            }

            foreach (var scene in dirtyScenes)
            {
                if (string.IsNullOrWhiteSpace(scene.path))
                    throw new InvalidOperationException("Cannot automatically save an untitled scene. Save it with save_unity_scene first.");
                string fullPath = Path.Combine(ProjectRoot, scene.path);
                if (File.Exists(fullPath) && (File.GetAttributes(fullPath) & FileAttributes.ReadOnly) != 0)
                    throw new InvalidOperationException("Cannot automatically save a read-only scene: " + scene.path);
            }

            foreach (var scene in dirtyScenes)
            {
                if (!EditorSceneManager.SaveScene(scene))
                    throw new InvalidOperationException("Unity could not save modified scene: " + scene.path);
            }
        }

        private static void SetUnityBuildScenes(SetBuildScenesCommand cmd)
        {
            ValidateSceneCommand(cmd?.id);
            EnsureSceneEditingReady();
            if (cmd.scenes == null)
                throw new InvalidOperationException("set_build_scenes requires an ordered scenes array");
            if (cmd.scenes.Length > 500)
                throw new InvalidOperationException("Build settings support at most 500 scenes per command");

            var normalized = new List<EditorBuildSettingsScene>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (BuildSceneInput input in cmd.scenes)
            {
                string scenePath = NormalizeSceneAssetPath(input?.path, "scenes[].path");
                if (!seen.Add(scenePath))
                    throw new InvalidOperationException("Build settings contain a duplicate scene path: " + scenePath);
                if (AssetDatabase.LoadAssetAtPath<SceneAsset>(scenePath) == null)
                    throw new InvalidOperationException("Build settings scene asset was not found: " + scenePath);
                normalized.Add(new EditorBuildSettingsScene(scenePath, input.enabled));
            }

            EditorBuildSettingsScene[] previous = EditorBuildSettings.scenes;
            try
            {
                EditorBuildSettings.scenes = normalized.ToArray();
                AssetDatabase.SaveAssets();
            }
            catch
            {
                EditorBuildSettings.scenes = previous;
                throw;
            }

            ExportSceneManagementResult(cmd.id, "Replaced Unity build scene settings");
        }

        private static void EnsureSceneEditingReady()
        {
            if (EditorApplication.isCompiling || EditorApplication.isUpdating)
                throw new InvalidOperationException("Unity is compiling or importing assets. Wait for the Editor to settle.");
            if (EditorApplication.isPlayingOrWillChangePlaymode)
                throw new InvalidOperationException("Stop Play Mode before changing scenes or build settings.");
            if (IsUnityTestRunActive())
                throw new InvalidOperationException("Wait for the active Unity Test Runner job to finish.");
        }

        private static void ValidateSceneCommand(string commandId)
        {
            if (!IsSafeCorrelationId(commandId))
                throw new InvalidOperationException("Scene command requires a safe correlation ID");
        }

        private static string NormalizeSceneAssetPath(string value, string label)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidOperationException(label + " is required");

            string normalized = value.Replace('\\', '/').Trim();
            if (!normalized.StartsWith("Assets/", StringComparison.Ordinal) ||
                !string.Equals(Path.GetExtension(normalized), ".unity", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(label + " must be an Assets/... path ending in .unity");
            }
            if (normalized.Split('/').Any(segment => segment.Length == 0 || segment == "." || segment == ".."))
                throw new InvalidOperationException(label + " contains an invalid path segment");

            string assetsRoot = Path.GetFullPath(Application.dataPath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string fullPath = Path.GetFullPath(Path.Combine(ProjectRoot, normalized));
            if (!fullPath.StartsWith(assetsRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(label + " must stay inside the project's Assets folder");

            return normalized;
        }

        private static void ExportSceneManagementResult(string commandId, string message)
        {
            ValidateSceneCommand(commandId);
            var activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            var result = new SceneManagementResult
            {
                commandId = commandId,
                success = true,
                message = message,
                activeScenePath = activeScene.path,
                activeSceneName = activeScene.name,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                openScenes = new List<OpenSceneEntry>(),
                buildScenes = new List<BuildSceneEntry>()
            };

            for (int index = 0; index < UnityEngine.SceneManagement.SceneManager.sceneCount; index++)
            {
                var scene = UnityEngine.SceneManagement.SceneManager.GetSceneAt(index);
                result.openScenes.Add(new OpenSceneEntry
                {
                    handle = scene.handle,
                    name = scene.name,
                    path = scene.path,
                    guid = string.IsNullOrWhiteSpace(scene.path) ? null : AssetDatabase.AssetPathToGUID(scene.path),
                    isLoaded = scene.isLoaded,
                    isDirty = scene.isDirty,
                    isActive = scene == activeScene,
                    buildIndex = scene.buildIndex,
                    rootCount = scene.isLoaded ? scene.rootCount : 0
                });
            }

            EditorBuildSettingsScene[] buildScenes = EditorBuildSettings.scenes;
            for (int index = 0; index < buildScenes.Length; index++)
            {
                EditorBuildSettingsScene scene = buildScenes[index];
                result.buildScenes.Add(new BuildSceneEntry
                {
                    index = index,
                    path = scene.path,
                    guid = AssetDatabase.AssetPathToGUID(scene.path),
                    enabled = scene.enabled
                });
            }

            WriteAtomicText(Path.Combine(SceneResultsFolder, commandId + ".json"), JsonUtility.ToJson(result, true));
            DeleteOldFiles(SceneResultsFolder, "*.json", 50);
        }

        private static void ModifyGameObject(ModifyGameObjectCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);

            Undo.RecordObject(obj.transform, "MCP Modify Transform");

            if (cmd.position != null && cmd.position.Length == 3)
            {
                obj.transform.position = new Vector3(cmd.position[0], cmd.position[1], cmd.position[2]);
            }

            if (cmd.rotation != null && cmd.rotation.Length == 3)
            {
                obj.transform.eulerAngles = new Vector3(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);
            }

            if (cmd.scale != null && cmd.scale.Length == 3)
            {
                obj.transform.localScale = new Vector3(cmd.scale[0], cmd.scale[1], cmd.scale[2]);
            }

            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Modified GameObject: {DescribeObject(cmd.objectId, cmd.objectPath)}");
            ExportSceneHierarchy();
        }

        private static void AddComponentToObject(AddComponentCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);

            // Try to find the component type
            Type componentType = FindComponentType(cmd.componentType);
            if (componentType == null)
            {
                throw new InvalidOperationException($"Component type not found: {cmd.componentType}");
            }

            Undo.AddComponent(obj, componentType);
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Added component {cmd.componentType} to {cmd.objectPath}");
            ExportSceneHierarchy();
        }

        private static void RemoveComponentFromObject(RemoveComponentCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);
            var component = ResolveComponent(obj, cmd.componentId, cmd.componentType);

            Undo.DestroyObjectImmediate(component);
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Removed component {cmd.componentType} from {cmd.objectPath}");
            ExportSceneHierarchy();
        }

        private static void SetComponentProperty(SetComponentPropertyCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);
            var component = ResolveComponent(obj, cmd.componentId, cmd.componentType);

            var so = new SerializedObject(component);
            var prop = so.FindProperty(cmd.propertyName);
            if (prop == null)
            {
                throw new InvalidOperationException($"Property not found: {cmd.propertyName} on {cmd.componentType}");
            }

            Undo.RecordObject(component, "MCP Set Property");

            SetSerializedPropertyValue(prop, cmd.valueJson, cmd.value);

            so.ApplyModifiedProperties();
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Set {cmd.propertyName} on {cmd.componentType}");
            ExportSceneHierarchy();
        }

        private static void SetObjectReference(SetObjectReferenceCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);
            var component = ResolveComponent(obj, cmd.componentId, cmd.componentType);

            var so = new SerializedObject(component);
            var prop = so.FindProperty(cmd.propertyName);
            if (prop == null)
            {
                throw new InvalidOperationException($"Property not found: {cmd.propertyName} on {cmd.componentType}");
            }

            if (prop.propertyType != SerializedPropertyType.ObjectReference)
            {
                throw new InvalidOperationException($"Property is not an object reference: {cmd.propertyName} on {cmd.componentType}");
            }

            UnityEngine.Object targetObject = null;
            bool clearReference = string.IsNullOrWhiteSpace(cmd.targetId) &&
                                  (string.IsNullOrWhiteSpace(cmd.targetPath) ||
                                   string.Equals(cmd.targetPath, "null", StringComparison.OrdinalIgnoreCase));

            if (!clearReference)
            {
                var targetGameObject = ResolveGameObject(cmd.targetId, cmd.targetPath);

                targetObject = ResolveObjectReferenceTarget(component.GetType(), cmd.propertyName, targetGameObject, cmd.targetComponent);
                if (targetObject == null)
                {
                    throw new InvalidOperationException($"Could not resolve target reference for {cmd.propertyName} from {cmd.targetPath}");
                }
            }

            Undo.RecordObject(component, "MCP Set Object Reference");
            prop.objectReferenceValue = targetObject;
            so.ApplyModifiedProperties();

            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Set reference {cmd.propertyName} on {cmd.componentType}");
            ExportSceneHierarchy();
        }

        private static UnityEngine.Object ResolveObjectReferenceTarget(Type componentType, string propertyName, GameObject targetGameObject, string targetComponent)
        {
            if (!string.IsNullOrEmpty(targetComponent))
            {
                if (string.Equals(targetComponent, "GameObject", StringComparison.OrdinalIgnoreCase))
                    return targetGameObject;

                Type explicitType = FindComponentType(targetComponent);
                if (explicitType == null)
                    return null;

                return targetGameObject.GetComponent(explicitType);
            }

            Type memberType = FindSerializedMemberType(componentType, propertyName);
            if (memberType == null || memberType == typeof(UnityEngine.Object) || memberType == typeof(GameObject))
                return targetGameObject;

            if (typeof(Component).IsAssignableFrom(memberType))
                return targetGameObject.GetComponent(memberType);

            if (typeof(GameObject).IsAssignableFrom(memberType))
                return targetGameObject;

            return null;
        }

        private static Type FindSerializedMemberType(Type componentType, string propertyName)
        {
            const BindingFlags flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;

            Type currentType = componentType;
            while (currentType != null)
            {
                var field = currentType.GetField(propertyName, flags);
                if (field != null)
                    return field.FieldType;

                currentType = currentType.BaseType;
            }

            var property = componentType.GetProperty(propertyName, flags);
            return property?.PropertyType;
        }

        private static Type FindComponentType(string typeName)
        {
            // Try common Unity namespaces first
            string[] namespaces = new string[]
            {
                "UnityEngine.",
                "UnityEngine.UI.",
                "",
                "Banter.",
                "Banter.SDK."
            };

            foreach (var ns in namespaces)
            {
                var type = Type.GetType(ns + typeName + ", UnityEngine");
                if (type != null) return type;

                type = Type.GetType(ns + typeName + ", UnityEngine.CoreModule");
                if (type != null) return type;

                type = Type.GetType(ns + typeName + ", UnityEngine.PhysicsModule");
                if (type != null) return type;

                type = Type.GetType(ns + typeName + ", UnityEngine.UI");
                if (type != null) return type;
            }

            // Search all assemblies
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    // First try exact match by full name (namespace.classname)
                    var type = assembly.GetType(typeName);
                    if (type != null && typeof(Component).IsAssignableFrom(type))
                        return type;

                    // Then try by simple name only (for Banter SDK types)
                    type = assembly.GetTypes().FirstOrDefault(t => t.Name == typeName);
                    if (type != null && typeof(Component).IsAssignableFrom(type))
                    {
                        // Check if it's a Banter type or if custom scripts are enabled
                        string typeNamespace = type.Namespace ?? "";
                        bool isBanterType = typeNamespace.StartsWith("Banter") ||
                                           typeNamespace.StartsWith("UnityEngine");

                        if (isBanterType || EnableCustomScripts)
                            return type;
                    }

                    // Only search user namespaces if custom scripts toggle is ON
                    if (EnableCustomScripts)
                    {
                        string[] userNamespaces = new string[]
                        {
                            "PhysicsCharacterController.",
                            "Player.",
                            "Character.",
                            "VR.",
                            "Game.",
                            "Scripts."
                        };

                        foreach (var userNs in userNamespaces)
                        {
                            type = assembly.GetType(userNs + typeName);
                            if (type != null && typeof(Component).IsAssignableFrom(type))
                                return type;
                        }
                    }
                }
                catch (ReflectionTypeLoadException)
                {
                    // Some assemblies may fail to load types, skip them
                    continue;
                }
            }

            return null;
        }

        private static GameObject ResolveGameObject(string objectId, string objectPath)
        {
            if (string.IsNullOrWhiteSpace(objectId))
                return FindGameObjectByPath(objectPath);

            GlobalObjectId globalObjectId;
            if (!GlobalObjectId.TryParse(objectId, out globalObjectId))
                throw new InvalidOperationException($"Invalid Unity GlobalObjectId: {objectId}");

            var obj = GlobalObjectId.GlobalObjectIdentifierToObjectSlow(globalObjectId) as GameObject;
            if (obj == null)
                throw new InvalidOperationException($"GameObject ID is stale or does not identify a GameObject: {objectId}");

            var activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            if (obj.scene != activeScene)
                throw new InvalidOperationException($"GameObject ID is not in the active scene: {objectId}");

            return obj;
        }

        private static GameObject ResolveOptionalGameObject(string objectId, string objectPath)
        {
            return string.IsNullOrWhiteSpace(objectId) && string.IsNullOrWhiteSpace(objectPath)
                ? null
                : ResolveGameObject(objectId, objectPath);
        }

        private static Component ResolveComponent(GameObject owner, string componentId, string componentType)
        {
            if (!string.IsNullOrWhiteSpace(componentId))
            {
                GlobalObjectId globalObjectId;
                if (!GlobalObjectId.TryParse(componentId, out globalObjectId))
                    throw new InvalidOperationException($"Invalid component GlobalObjectId: {componentId}");

                var component = GlobalObjectId.GlobalObjectIdentifierToObjectSlow(globalObjectId) as Component;
                if (component == null)
                    throw new InvalidOperationException($"Component ID is stale or does not identify a Component: {componentId}");
                if (component.gameObject != owner)
                    throw new InvalidOperationException($"Component ID does not belong to GameObject '{GetGameObjectPath(owner)}': {componentId}");
                if (!string.IsNullOrWhiteSpace(componentType) &&
                    !string.Equals(component.GetType().Name, componentType, StringComparison.Ordinal) &&
                    !string.Equals(component.GetType().FullName, componentType, StringComparison.Ordinal))
                {
                    throw new InvalidOperationException(
                        $"Component ID identifies {component.GetType().FullName}, not requested type {componentType}");
                }

                return component;
            }

            if (string.IsNullOrWhiteSpace(componentType))
                throw new InvalidOperationException("Component type or componentId is required");

            var matches = owner.GetComponents<Component>()
                .Where(component => component != null &&
                    (string.Equals(component.GetType().Name, componentType, StringComparison.Ordinal) ||
                     string.Equals(component.GetType().FullName, componentType, StringComparison.Ordinal)))
                .ToList();

            if (matches.Count == 1)
                return matches[0];
            if (matches.Count == 0)
                throw new InvalidOperationException($"Component not found: {componentType} on {GetGameObjectPath(owner)}");

            throw new InvalidOperationException(
                $"Component type is ambiguous on {GetGameObjectPath(owner)}: {componentType}. Supply componentId from scene-hierarchy.json.");
        }

        private static string GetStableObjectId(UnityEngine.Object obj)
        {
            return obj == null ? null : GlobalObjectId.GetGlobalObjectIdSlow(obj).ToString();
        }

        private static string DescribeObject(string objectId, string objectPath)
        {
            return !string.IsNullOrWhiteSpace(objectPath) ? objectPath : objectId;
        }

        private static GameObject FindGameObjectByPath(string objectPath)
        {
            if (string.IsNullOrWhiteSpace(objectPath))
                throw new InvalidOperationException("GameObject path is required");

            var activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            var matches = Resources.FindObjectsOfTypeAll<GameObject>()
                .Where(candidate => candidate.scene == activeScene && GetGameObjectPath(candidate) == objectPath)
                .ToList();

            if (matches.Count == 1)
                return matches[0];

            if (matches.Count == 0)
                throw new InvalidOperationException($"GameObject not found in active scene: {objectPath}");

            throw new InvalidOperationException(
                $"GameObject path is ambiguous: {objectPath}. Rename duplicate siblings before issuing a mutation command.");
        }

        private static void InstantiatePrefab(InstantiatePrefabCommand cmd)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.prefabPath))
                throw new InvalidOperationException("Instantiate prefab command requires prefabPath");

            GameObject parent = ResolveOptionalGameObject(cmd.parentId, cmd.parentPath);
            // Load prefab from asset path
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(cmd.prefabPath);
            if (prefab == null)
            {
                throw new InvalidOperationException($"Prefab not found: {cmd.prefabPath}");
            }

            // Instantiate prefab
            GameObject obj = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            if (obj == null)
            {
                throw new InvalidOperationException($"Failed to instantiate prefab: {cmd.prefabPath}");
            }

            // Set name if provided
            if (!string.IsNullOrEmpty(cmd.name))
            {
                obj.name = cmd.name;
            }

            // Set transform
            if (cmd.position != null && cmd.position.Length == 3)
            {
                obj.transform.position = new Vector3(cmd.position[0], cmd.position[1], cmd.position[2]);
            }

            if (cmd.rotation != null && cmd.rotation.Length == 3)
            {
                obj.transform.eulerAngles = new Vector3(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);
            }

            if (cmd.scale != null && cmd.scale.Length == 3)
            {
                obj.transform.localScale = new Vector3(cmd.scale[0], cmd.scale[1], cmd.scale[2]);
            }

            // Set parent if specified
            if (parent != null)
            {
                obj.transform.SetParent(parent.transform, true);
            }

            // Register undo
            Undo.RegisterCreatedObjectUndo(obj, "MCP Instantiate Prefab");

            // Mark scene dirty
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());

            Debug.Log($"[BANTWORKS MCP] Instantiated prefab: {cmd.prefabPath}");
            ExportSceneHierarchy();
        }

        private static void InstantiatePrefabSilent(InstantiatePrefabCommand cmd)
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(cmd.prefabPath);
            if (prefab == null) throw new InvalidOperationException($"Prefab not found: {cmd.prefabPath}");

            GameObject obj = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            if (obj == null) throw new InvalidOperationException($"Failed to instantiate prefab: {cmd.prefabPath}");
            Undo.RegisterCreatedObjectUndo(obj, "MCP Batch Instantiate Prefab");

            if (!string.IsNullOrEmpty(cmd.name))
                obj.name = cmd.name;

            if (cmd.position != null && cmd.position.Length == 3)
                obj.transform.position = new Vector3(cmd.position[0], cmd.position[1], cmd.position[2]);

            if (cmd.rotation != null && cmd.rotation.Length == 3)
                obj.transform.eulerAngles = new Vector3(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);

            if (cmd.scale != null && cmd.scale.Length == 3)
                obj.transform.localScale = new Vector3(cmd.scale[0], cmd.scale[1], cmd.scale[2]);

            var parent = ResolveOptionalGameObject(cmd.parentId, cmd.parentPath);
            if (parent != null)
            {
                obj.transform.SetParent(parent.transform, true);
            }
        }

        private static void GetObjectBounds(GetBoundsCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);

            Bounds bounds = CalculateGameObjectBounds(obj);
            ExportBoundsResult(cmd.id, GetStableObjectId(obj), GetGameObjectPath(obj), true, bounds);
            Debug.Log($"[BANTWORKS MCP] Got bounds for {GetGameObjectPath(obj)}: size={bounds.size}, center={bounds.center}");
        }

        private static void ExportBoundsResult(string commandId, string objectId, string objectPath, bool success, Bounds? bounds)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(commandId))
                    throw new InvalidOperationException("Bounds command is missing an ID");

                var sb = new System.Text.StringBuilder();
                sb.AppendLine("{");
                sb.AppendLine($"    \"commandId\": \"{EscapeJsonString(commandId)}\",");
                sb.AppendLine($"    \"success\": {(success ? "true" : "false")},");
                sb.AppendLine($"    \"objectId\": \"{EscapeJsonString(objectId)}\",");
                sb.AppendLine($"    \"objectPath\": \"{EscapeJsonString(objectPath)}\",");
                sb.AppendLine($"    \"timestamp\": {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},");

                if (success && bounds.HasValue)
                {
                    var b = bounds.Value;
                    sb.AppendLine($"    \"bounds\": {{");
                    sb.AppendLine($"        \"center\": [{FormatJsonFloat(b.center.x)}, {FormatJsonFloat(b.center.y)}, {FormatJsonFloat(b.center.z)}],");
                    sb.AppendLine($"        \"size\": [{FormatJsonFloat(b.size.x)}, {FormatJsonFloat(b.size.y)}, {FormatJsonFloat(b.size.z)}],");
                    sb.AppendLine($"        \"min\": [{FormatJsonFloat(b.min.x)}, {FormatJsonFloat(b.min.y)}, {FormatJsonFloat(b.min.z)}],");
                    sb.AppendLine($"        \"max\": [{FormatJsonFloat(b.max.x)}, {FormatJsonFloat(b.max.y)}, {FormatJsonFloat(b.max.z)}]");
                    sb.AppendLine($"    }}");
                }
                else
                {
                    sb.AppendLine($"    \"error\": \"Object not found\"");
                }

                sb.AppendLine("}");

                WriteAtomicText(Path.Combine(BoundsResultsFolder, $"{commandId}.json"), sb.ToString());
            }
            catch (Exception e)
            {
                Debug.LogError($"[BANTWORKS MCP] Error exporting bounds result: {e.Message}");
            }
        }

        private static void ProcessBatchCommand(BatchCommand batchCmd)
        {
            var commandStrings = batchCmd?.commands?
                .Where(command => !string.IsNullOrWhiteSpace(command))
                .ToList() ?? new List<string>();

            if (commandStrings.Count == 0)
                throw new InvalidOperationException("Batch requires at least one command");

            PreflightBatchCommands(commandStrings);

            Undo.IncrementCurrentGroup();
            int undoGroup = Undo.GetCurrentGroup();
            Undo.SetCurrentGroupName("BANTWORKS MCP Batch");

            int appliedCount = 0;
            var errors = new List<string>();

            for (int index = 0; index < commandStrings.Count; index++)
            {
                try
                {
                    ExecuteBatchCommand(commandStrings[index]);
                    appliedCount++;
                }
                catch (Exception e)
                {
                    string error = $"Operation {index + 1} failed: {e.Message}";
                    errors.Add(error);
                    Debug.LogError($"[BANTWORKS MCP] Batch {error}");

                    if (!batchCmd.continueOnError)
                    {
                        Undo.RevertAllDownToGroup(undoGroup);
                        ExportSceneHierarchy();
                        throw new InvalidOperationException($"Batch rolled back. {error}");
                    }
                }
            }

            Undo.CollapseUndoOperations(undoGroup);
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            ExportSceneHierarchy();

            if (errors.Count > 0)
            {
                throw new InvalidOperationException(
                    $"Batch completed with {errors.Count} failed operation(s) and {appliedCount} applied operation(s): {string.Join("; ", errors)}");
            }

            Debug.Log($"[BANTWORKS MCP] Batch completed: {appliedCount} operations");
        }

        private static void ExecuteBatchCommand(string commandJson)
        {
            var baseCmd = JsonUtility.FromJson<MCPCommand>(commandJson);
            if (baseCmd == null || string.IsNullOrWhiteSpace(baseCmd.type))
                throw new InvalidOperationException("Batch operation is missing a command type");

            switch (baseCmd.type)
            {
                case "create_gameobject":
                    CreateGameObjectSilent(JsonUtility.FromJson<CreateGameObjectCommand>(commandJson));
                    break;
                case "delete_gameobject":
                    DeleteGameObjectSilent(JsonUtility.FromJson<DeleteGameObjectCommand>(commandJson));
                    break;
                case "modify_gameobject":
                    ModifyGameObjectSilent(JsonUtility.FromJson<ModifyGameObjectCommand>(commandJson));
                    break;
                case "instantiate_prefab":
                    InstantiatePrefabSilent(JsonUtility.FromJson<InstantiatePrefabCommand>(commandJson));
                    break;
                default:
                    throw new InvalidOperationException($"Unsupported batch command type: {baseCmd.type}");
            }
        }

        private static void PreflightBatchCommands(List<string> commandStrings)
        {
            var plannedObjectPaths = new HashSet<string>(StringComparer.Ordinal);

            for (int index = 0; index < commandStrings.Count; index++)
            {
                try
                {
                    string commandJson = commandStrings[index];
                    var baseCmd = JsonUtility.FromJson<MCPCommand>(commandJson);
                    if (baseCmd == null || string.IsNullOrWhiteSpace(baseCmd.type))
                        throw new InvalidOperationException("Command type is required");

                    switch (baseCmd.type)
                    {
                        case "create_gameobject":
                            PreflightCreateGameObject(
                                JsonUtility.FromJson<CreateGameObjectCommand>(commandJson),
                                plannedObjectPaths);
                            break;
                        case "delete_gameobject":
                            var deleteCmd = JsonUtility.FromJson<DeleteGameObjectCommand>(commandJson);
                            ResolveGameObject(deleteCmd?.objectId, deleteCmd?.objectPath);
                            break;
                        case "modify_gameobject":
                            var modifyCmd = JsonUtility.FromJson<ModifyGameObjectCommand>(commandJson);
                            ResolveGameObject(modifyCmd?.objectId, modifyCmd?.objectPath);
                            ValidateTransformValues(modifyCmd?.position, "position");
                            ValidateTransformValues(modifyCmd?.rotation, "rotation");
                            ValidateTransformValues(modifyCmd?.scale, "scale");
                            break;
                        case "instantiate_prefab":
                            PreflightInstantiatePrefab(
                                JsonUtility.FromJson<InstantiatePrefabCommand>(commandJson),
                                plannedObjectPaths);
                            break;
                        default:
                            throw new InvalidOperationException($"Unsupported batch command type: {baseCmd.type}");
                    }
                }
                catch (Exception e)
                {
                    throw new InvalidOperationException($"Batch preflight failed at operation {index + 1}: {e.Message}");
                }
            }
        }

        private static void PreflightCreateGameObject(
            CreateGameObjectCommand cmd,
            HashSet<string> plannedObjectPaths)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.name))
                throw new InvalidOperationException("Create GameObject command requires a name");
            ValidateObjectName(cmd.name);

            if (!string.IsNullOrWhiteSpace(cmd.primitiveType))
            {
                PrimitiveType primitiveType;
                if (!Enum.TryParse(cmd.primitiveType, true, out primitiveType))
                    throw new InvalidOperationException($"Unknown primitive type: {cmd.primitiveType}");
            }

            ValidateTransformValues(cmd.position, "position");
            ValidateTransformValues(cmd.rotation, "rotation");
            ValidateTransformValues(cmd.scale, "scale");

            string parentPath = ResolveBatchParentPath(cmd.parentId, cmd.parentPath, plannedObjectPaths);
            RegisterPlannedObjectPath(parentPath, cmd.name, plannedObjectPaths);
        }

        private static void PreflightInstantiatePrefab(
            InstantiatePrefabCommand cmd,
            HashSet<string> plannedObjectPaths)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.prefabPath))
                throw new InvalidOperationException("Instantiate prefab command requires prefabPath");

            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(cmd.prefabPath);
            if (prefab == null)
                throw new InvalidOperationException($"Prefab not found: {cmd.prefabPath}");

            string objectName = string.IsNullOrWhiteSpace(cmd.name) ? prefab.name : cmd.name;
            ValidateObjectName(objectName);
            ValidateTransformValues(cmd.position, "position");
            ValidateTransformValues(cmd.rotation, "rotation");
            ValidateTransformValues(cmd.scale, "scale");

            string parentPath = ResolveBatchParentPath(cmd.parentId, cmd.parentPath, plannedObjectPaths);
            RegisterPlannedObjectPath(parentPath, objectName, plannedObjectPaths);
        }

        private static string ResolveBatchParentPath(
            string parentId,
            string parentPath,
            HashSet<string> plannedObjectPaths)
        {
            if (!string.IsNullOrWhiteSpace(parentId))
                return GetGameObjectPath(ResolveGameObject(parentId, parentPath));
            if (string.IsNullOrWhiteSpace(parentPath))
                return null;
            if (plannedObjectPaths.Contains(parentPath))
                return parentPath;

            return GetGameObjectPath(ResolveGameObject(null, parentPath));
        }

        private static void RegisterPlannedObjectPath(
            string parentPath,
            string objectName,
            HashSet<string> plannedObjectPaths)
        {
            string objectPath = string.IsNullOrWhiteSpace(parentPath)
                ? objectName
                : parentPath + "/" + objectName;

            if (!plannedObjectPaths.Add(objectPath))
                throw new InvalidOperationException($"Batch would create duplicate object path: {objectPath}");

            var activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            bool pathAlreadyExists = Resources.FindObjectsOfTypeAll<GameObject>()
                .Any(candidate => candidate.scene == activeScene && GetGameObjectPath(candidate) == objectPath);
            if (pathAlreadyExists)
                throw new InvalidOperationException($"Object path already exists in the active scene: {objectPath}");
        }

        private static void ValidateObjectName(string objectName)
        {
            if (objectName.Contains("/"))
                throw new InvalidOperationException("GameObject names containing '/' are not supported by the bridge path contract");
        }

        private static void ValidateTransformValues(float[] values, string fieldName)
        {
            if (values == null)
                return;
            if (values.Length != 3)
                throw new InvalidOperationException($"{fieldName} must contain exactly three numbers");
            if (values.Any(value => float.IsNaN(value) || float.IsInfinity(value)))
                throw new InvalidOperationException($"{fieldName} must contain finite numbers");
        }

        /// <summary>
        /// Creates a GameObject inside the current batch Undo group.
        /// </summary>
        private static void CreateGameObjectSilent(CreateGameObjectCommand cmd)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.name))
                throw new InvalidOperationException("Create GameObject command requires a name");

            GameObject parent = ResolveOptionalGameObject(cmd.parentId, cmd.parentPath);
            GameObject obj = null;

            if (string.IsNullOrEmpty(cmd.primitiveType))
            {
                obj = new GameObject(cmd.name);
            }
            else
            {
                PrimitiveType primType;
                if (Enum.TryParse(cmd.primitiveType, true, out primType))
                {
                    obj = GameObject.CreatePrimitive(primType);
                    obj.name = cmd.name;
                }
                else
                {
                    throw new InvalidOperationException($"Unknown primitive type: {cmd.primitiveType}");
                }
            }

            Undo.RegisterCreatedObjectUndo(obj, "MCP Batch Create GameObject");

            if (cmd.position != null && cmd.position.Length == 3)
                obj.transform.position = new Vector3(cmd.position[0], cmd.position[1], cmd.position[2]);

            if (cmd.rotation != null && cmd.rotation.Length == 3)
                obj.transform.eulerAngles = new Vector3(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);

            if (cmd.scale != null && cmd.scale.Length == 3)
                obj.transform.localScale = new Vector3(cmd.scale[0], cmd.scale[1], cmd.scale[2]);

            if (parent != null)
            {
                obj.transform.SetParent(parent.transform, true);
            }
        }

        private static void DeleteGameObjectSilent(DeleteGameObjectCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);
            Undo.DestroyObjectImmediate(obj);
        }

        private static void ModifyGameObjectSilent(ModifyGameObjectCommand cmd)
        {
            var obj = ResolveGameObject(cmd?.objectId, cmd?.objectPath);
            Undo.RecordObject(obj.transform, "MCP Batch Modify GameObject");

            if (cmd.position != null && cmd.position.Length == 3)
                obj.transform.position = new Vector3(cmd.position[0], cmd.position[1], cmd.position[2]);

            if (cmd.rotation != null && cmd.rotation.Length == 3)
                obj.transform.eulerAngles = new Vector3(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);

            if (cmd.scale != null && cmd.scale.Length == 3)
                obj.transform.localScale = new Vector3(cmd.scale[0], cmd.scale[1], cmd.scale[2]);
        }

        private static void SetSerializedPropertyValue(SerializedProperty prop, string typedJson, string legacyValue)
        {
            bool hasTypedValue = typedJson != null;
            string scalarValue = GetScalarValue(typedJson, legacyValue, hasTypedValue);

            switch (prop.propertyType)
            {
                case SerializedPropertyType.Boolean:
                    bool boolValue;
                    if (!bool.TryParse(scalarValue, out boolValue))
                        throw new InvalidOperationException($"Expected a boolean for {prop.propertyPath}, got: {scalarValue}");
                    prop.boolValue = boolValue;
                    break;
                case SerializedPropertyType.Integer:
                    prop.intValue = ParseInt(scalarValue, prop.propertyPath);
                    break;
                case SerializedPropertyType.Float:
                    prop.floatValue = ParseFloat(scalarValue, prop.propertyPath);
                    break;
                case SerializedPropertyType.String:
                    prop.stringValue = hasTypedValue && IsJsonString(typedJson)
                        ? ParseJsonString(typedJson)
                        : scalarValue;
                    break;
                case SerializedPropertyType.Vector2:
                    var v2 = ParseFloatArray(GetStructuredValue(typedJson, legacyValue, hasTypedValue), 2, prop.propertyPath);
                    prop.vector2Value = new Vector2(v2[0], v2[1]);
                    break;
                case SerializedPropertyType.Vector3:
                    var v3 = ParseFloatArray(GetStructuredValue(typedJson, legacyValue, hasTypedValue), 3, prop.propertyPath);
                    prop.vector3Value = new Vector3(v3[0], v3[1], v3[2]);
                    break;
                case SerializedPropertyType.Vector4:
                    var v4 = ParseFloatArray(GetStructuredValue(typedJson, legacyValue, hasTypedValue), 4, prop.propertyPath);
                    prop.vector4Value = new Vector4(v4[0], v4[1], v4[2], v4[3]);
                    break;
                case SerializedPropertyType.Vector2Int:
                    var v2Int = ParseIntArray(GetStructuredValue(typedJson, legacyValue, hasTypedValue), 2, prop.propertyPath);
                    prop.vector2IntValue = new Vector2Int(v2Int[0], v2Int[1]);
                    break;
                case SerializedPropertyType.Vector3Int:
                    var v3Int = ParseIntArray(GetStructuredValue(typedJson, legacyValue, hasTypedValue), 3, prop.propertyPath);
                    prop.vector3IntValue = new Vector3Int(v3Int[0], v3Int[1], v3Int[2]);
                    break;
                case SerializedPropertyType.Quaternion:
                    var quaternion = ParseFloatArray(GetStructuredValue(typedJson, legacyValue, hasTypedValue), 4, prop.propertyPath);
                    prop.quaternionValue = new Quaternion(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
                    break;
                case SerializedPropertyType.Color:
                    var color = ParseFloatArray(GetStructuredValue(typedJson, legacyValue, hasTypedValue), 4, prop.propertyPath);
                    prop.colorValue = new Color(color[0], color[1], color[2], color[3]);
                    break;
                case SerializedPropertyType.Enum:
                    prop.enumValueIndex = ParseEnumValue(prop, scalarValue);
                    break;
                case SerializedPropertyType.LayerMask:
                    prop.intValue = ParseInt(scalarValue, prop.propertyPath);
                    break;
                case SerializedPropertyType.Rect:
                    prop.rectValue = ParseRect(GetStructuredValue(typedJson, legacyValue, hasTypedValue), prop.propertyPath);
                    break;
                case SerializedPropertyType.Bounds:
                    prop.boundsValue = ParseBounds(GetStructuredValue(typedJson, legacyValue, hasTypedValue), prop.propertyPath);
                    break;
                default:
                    throw new InvalidOperationException($"Unsupported property type: {prop.propertyType}");
            }
        }

        private static string GetScalarValue(string typedJson, string legacyValue, bool hasTypedValue)
        {
            if (!hasTypedValue)
                return legacyValue;

            return IsJsonString(typedJson) ? ParseJsonString(typedJson) : typedJson;
        }

        private static string GetStructuredValue(string typedJson, string legacyValue, bool hasTypedValue)
        {
            return hasTypedValue && IsJsonString(typedJson)
                ? ParseJsonString(typedJson)
                : (hasTypedValue ? typedJson : legacyValue);
        }

        private static bool IsJsonString(string value)
        {
            return !string.IsNullOrEmpty(value) && value.TrimStart().StartsWith("\"");
        }

        private static string ParseJsonString(string json)
        {
            try
            {
                var wrapper = JsonUtility.FromJson<StringJsonValue>("{\"value\":" + json + "}");
                return wrapper?.value;
            }
            catch (Exception e)
            {
                throw new InvalidOperationException($"Invalid JSON string value: {e.Message}");
            }
        }

        private static int ParseInt(string value, string propertyPath)
        {
            int parsed;
            if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out parsed))
                throw new InvalidOperationException($"Expected an integer for {propertyPath}, got: {value}");
            return parsed;
        }

        private static float ParseFloat(string value, string propertyPath)
        {
            float parsed;
            if (!float.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out parsed) ||
                float.IsNaN(parsed) || float.IsInfinity(parsed))
            {
                throw new InvalidOperationException($"Expected a finite number for {propertyPath}, got: {value}");
            }
            return parsed;
        }

        private static float[] ParseFloatArray(string json, int expectedLength, string propertyPath)
        {
            try
            {
                var wrapper = JsonUtility.FromJson<FloatArrayJsonValue>("{\"values\":" + json + "}");
                if (wrapper?.values == null || wrapper.values.Length != expectedLength)
                    throw new InvalidOperationException($"Expected {expectedLength} numbers for {propertyPath}");
                if (wrapper.values.Any(value => float.IsNaN(value) || float.IsInfinity(value)))
                    throw new InvalidOperationException($"Expected finite numbers for {propertyPath}");
                return wrapper.values;
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception e)
            {
                throw new InvalidOperationException($"Invalid numeric array for {propertyPath}: {e.Message}");
            }
        }

        private static int[] ParseIntArray(string json, int expectedLength, string propertyPath)
        {
            try
            {
                var wrapper = JsonUtility.FromJson<IntArrayJsonValue>("{\"values\":" + json + "}");
                if (wrapper?.values == null || wrapper.values.Length != expectedLength)
                    throw new InvalidOperationException($"Expected {expectedLength} integers for {propertyPath}");
                return wrapper.values;
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception e)
            {
                throw new InvalidOperationException($"Invalid integer array for {propertyPath}: {e.Message}");
            }
        }

        private static int ParseEnumValue(SerializedProperty prop, string value)
        {
            int index;
            if (int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out index))
            {
                if (index < 0 || index >= prop.enumNames.Length)
                    throw new InvalidOperationException($"Enum index out of range for {prop.propertyPath}: {index}");
                return index;
            }

            index = Array.FindIndex(prop.enumNames, name => string.Equals(name, value, StringComparison.OrdinalIgnoreCase));
            if (index < 0)
                index = Array.FindIndex(prop.enumDisplayNames, name => string.Equals(name, value, StringComparison.OrdinalIgnoreCase));
            if (index < 0)
                throw new InvalidOperationException($"Unknown enum value for {prop.propertyPath}: {value}");
            return index;
        }

        private static Rect ParseRect(string json, string propertyPath)
        {
            if (json != null && json.TrimStart().StartsWith("["))
            {
                var values = ParseFloatArray(json, 4, propertyPath);
                return new Rect(values[0], values[1], values[2], values[3]);
            }

            try
            {
                var value = JsonUtility.FromJson<RectJsonValue>(json);
                if (value == null)
                    throw new InvalidOperationException($"Expected a Rect object for {propertyPath}");
                return new Rect(value.x, value.y, value.width, value.height);
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception e)
            {
                throw new InvalidOperationException($"Invalid Rect for {propertyPath}: {e.Message}");
            }
        }

        private static Bounds ParseBounds(string json, string propertyPath)
        {
            try
            {
                var value = JsonUtility.FromJson<BoundsJsonValue>(json);
                if (value?.center == null || value.center.Length != 3 || value.size == null || value.size.Length != 3)
                    throw new InvalidOperationException($"Bounds for {propertyPath} requires center and size arrays of length 3");
                if (value.center.Concat(value.size).Any(item => float.IsNaN(item) || float.IsInfinity(item)))
                    throw new InvalidOperationException($"Bounds for {propertyPath} requires finite numbers");
                return new Bounds(
                    new Vector3(value.center[0], value.center[1], value.center[2]),
                    new Vector3(value.size[0], value.size[1], value.size[2]));
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception e)
            {
                throw new InvalidOperationException($"Invalid Bounds for {propertyPath}: {e.Message}");
            }
        }

        #endregion

        #region State Export

        private static void WriteAtomicText(string destinationPath, string contents)
        {
            string temporaryPath = destinationPath + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                File.WriteAllText(temporaryPath, contents);

                for (int attempt = 0; ; attempt++)
                {
                    try
                    {
                        if (File.Exists(destinationPath))
                            File.Replace(temporaryPath, destinationPath, null);
                        else
                            File.Move(temporaryPath, destinationPath);
                        return;
                    }
                    catch (IOException) when (attempt < 8)
                    {
                        // A polling MCP reader can hold the previous file for a few milliseconds on Windows.
                        System.Threading.Thread.Sleep(25);
                    }
                }
            }
            finally
            {
                if (File.Exists(temporaryPath))
                    File.Delete(temporaryPath);
            }
        }

        private static void WriteAtomicBytes(string destinationPath, byte[] contents)
        {
            string temporaryPath = destinationPath + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                File.WriteAllBytes(temporaryPath, contents);

                for (int attempt = 0; ; attempt++)
                {
                    try
                    {
                        if (File.Exists(destinationPath))
                            File.Replace(temporaryPath, destinationPath, null);
                        else
                            File.Move(temporaryPath, destinationPath);
                        return;
                    }
                    catch (IOException) when (attempt < 8)
                    {
                        System.Threading.Thread.Sleep(25);
                    }
                }
            }
            finally
            {
                if (File.Exists(temporaryPath))
                    File.Delete(temporaryPath);
            }
        }

        private static void DeleteOldFiles(string folder, string searchPattern, int filesToKeep)
        {
            try
            {
                foreach (var file in new DirectoryInfo(folder)
                    .GetFiles(searchPattern)
                    .OrderByDescending(candidate => candidate.LastWriteTimeUtc)
                    .Skip(filesToKeep))
                {
                    file.Delete();
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[BANTWORKS MCP] Could not prune old result files in {folder}: {e.Message}");
            }
        }

        private static string FormatJsonFloat(float value)
        {
            return value.ToString("R", CultureInfo.InvariantCulture);
        }

        private static void ExportProjectState()
        {
            ExportSceneHierarchy();
            ExportEditorState();
            ExportConsoleLogs();
        }

        private static void ExportSceneHierarchy()
        {
            try
            {
                var hierarchy = new SceneHierarchy();
                hierarchy.sceneName = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
                hierarchy.scenePath = UnityEngine.SceneManagement.SceneManager.GetActiveScene().path;
                hierarchy.objects = new List<GameObjectInfo>();

                // Get all root objects
                var rootObjects = UnityEngine.SceneManagement.SceneManager.GetActiveScene().GetRootGameObjects();

                foreach (var obj in rootObjects)
                {
                    AddObjectToHierarchy(obj, hierarchy.objects, 0);
                }

                hierarchy.timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                string json = JsonUtility.ToJson(hierarchy, true);
                WriteAtomicText(Path.Combine(StateFolder, "scene-hierarchy.json"), json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[BANTWORKS MCP] Error exporting hierarchy: {e.Message}");
            }
        }

        private static void AddObjectToHierarchy(GameObject obj, List<GameObjectInfo> list, int depth)
        {
            var info = new GameObjectInfo
            {
                name = obj.name,
                globalObjectId = GetStableObjectId(obj),
                path = GetGameObjectPath(obj),
                active = obj.activeSelf,
                layer = obj.layer,
                tag = obj.tag,
                depth = depth,
                // Transform data
                position = new float[] {
                    obj.transform.position.x,
                    obj.transform.position.y,
                    obj.transform.position.z
                },
                rotation = new float[] {
                    obj.transform.eulerAngles.x,
                    obj.transform.eulerAngles.y,
                    obj.transform.eulerAngles.z
                },
                scale = new float[] {
                    obj.transform.localScale.x,
                    obj.transform.localScale.y,
                    obj.transform.localScale.z
                },
                components = new List<ComponentInfo>()
            };

            // Serialize all components with their properties
            var components = obj.GetComponents<Component>();
            foreach (var comp in components)
            {
                if (comp != null)
                {
                    info.components.Add(SerializeComponent(comp));
                }
            }

            list.Add(info);

            // Recurse into children (limit depth to prevent huge exports)
            if (depth < 10)
            {
                foreach (Transform child in obj.transform)
                {
                    AddObjectToHierarchy(child.gameObject, list, depth + 1);
                }
            }
        }

        private static ComponentInfo SerializeComponent(Component comp)
        {
            var info = new ComponentInfo
            {
                type = comp.GetType().Name,
                fullType = comp.GetType().FullName,
                globalObjectId = GetStableObjectId(comp),
                properties = new List<PropertyInfo>()
            };

            try
            {
                var so = new SerializedObject(comp);
                var prop = so.GetIterator();
                bool enterChildren = true;

                while (prop.NextVisible(enterChildren))
                {
                    enterChildren = false;

                    // Skip some internal properties
                    if (prop.name == "m_Script" || prop.name == "m_ObjectHideFlags")
                        continue;

                    info.properties.Add(new PropertyInfo
                    {
                        name = prop.name,
                        type = prop.propertyType.ToString(),
                        value = GetSerializedPropertyValue(prop)
                    });
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[BANTWORKS MCP] Could not serialize component {comp.GetType().Name}: {e.Message}");
            }

            return info;
        }

        private static string GetSerializedPropertyValue(SerializedProperty prop)
        {
            switch (prop.propertyType)
            {
                case SerializedPropertyType.Boolean:
                    return prop.boolValue.ToString().ToLower();
                case SerializedPropertyType.Integer:
                    return prop.intValue.ToString();
                case SerializedPropertyType.Float:
                    return prop.floatValue.ToString("G");
                case SerializedPropertyType.String:
                    return prop.stringValue ?? "";
                case SerializedPropertyType.Vector2:
                    return $"[{prop.vector2Value.x},{prop.vector2Value.y}]";
                case SerializedPropertyType.Vector3:
                    return $"[{prop.vector3Value.x},{prop.vector3Value.y},{prop.vector3Value.z}]";
                case SerializedPropertyType.Vector4:
                    return $"[{prop.vector4Value.x},{prop.vector4Value.y},{prop.vector4Value.z},{prop.vector4Value.w}]";
                case SerializedPropertyType.Quaternion:
                    return $"[{prop.quaternionValue.x},{prop.quaternionValue.y},{prop.quaternionValue.z},{prop.quaternionValue.w}]";
                case SerializedPropertyType.Color:
                    return $"[{prop.colorValue.r},{prop.colorValue.g},{prop.colorValue.b},{prop.colorValue.a}]";
                case SerializedPropertyType.Enum:
                    return prop.enumDisplayNames.Length > prop.enumValueIndex && prop.enumValueIndex >= 0
                        ? prop.enumDisplayNames[prop.enumValueIndex]
                        : prop.enumValueIndex.ToString();
                case SerializedPropertyType.ObjectReference:
                    return prop.objectReferenceValue != null ? prop.objectReferenceValue.name : "null";
                case SerializedPropertyType.LayerMask:
                    return prop.intValue.ToString();
                case SerializedPropertyType.Bounds:
                    var b = prop.boundsValue;
                    return $"{{center:[{b.center.x},{b.center.y},{b.center.z}],size:[{b.size.x},{b.size.y},{b.size.z}]}}";
                case SerializedPropertyType.Rect:
                    var r = prop.rectValue;
                    return $"{{x:{r.x},y:{r.y},w:{r.width},h:{r.height}}}";
                default:
                    return $"<{prop.propertyType}>";
            }
        }

        private static string GetGameObjectPath(GameObject obj)
        {
            string path = obj.name;
            Transform parent = obj.transform.parent;

            while (parent != null)
            {
                path = parent.name + "/" + path;
                parent = parent.parent;
            }

            return path;
        }

        private static void ExportEditorState()
        {
            try
            {
                var state = new EditorState
                {
                    isPlaying = EditorApplication.isPlaying,
                    isPaused = EditorApplication.isPaused,
                    isCompiling = EditorApplication.isCompiling,
                    isPlayingOrWillChangePlaymode = EditorApplication.isPlayingOrWillChangePlaymode,
                    isUpdating = EditorApplication.isUpdating,
                    activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
                    selectedObjects = Selection.gameObjects?.Select(o => o.name).ToArray() ?? new string[0],
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                string json = JsonUtility.ToJson(state, true);
                WriteAtomicText(Path.Combine(StateFolder, "editor-state.json"), json);
                ExportProjectInstance();
            }
            catch (Exception e)
            {
                Debug.LogError($"[BANTWORKS MCP] Error exporting editor state: {e.Message}");
            }
        }

        private static void ExportProjectInstance()
        {
            using (var process = System.Diagnostics.Process.GetCurrentProcess())
            {
                DateTime processStart = process.StartTime.ToUniversalTime();
                var instance = new ProjectInstanceState
                {
                    editorInstanceId = process.Id + "-" + processStart.Ticks.ToString("x16", CultureInfo.InvariantCulture),
                    projectPath = ProjectRoot,
                    projectName = Path.GetFileName(ProjectRoot.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)),
                    unityVersion = Application.unityVersion,
                    processId = process.Id,
                    processStartedAt = new DateTimeOffset(processStart).ToUnixTimeMilliseconds(),
                    updatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };
                WriteAtomicText(Path.Combine(StateFolder, "project-instance.json"), JsonUtility.ToJson(instance, true));
            }
        }

        private static void ExportConsoleLogs()
        {
            try
            {
                var logs = new ConsoleLogs();
                logs.timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                lock (logLock)
                {
                    logs.logs = new List<ConsoleLogEntry>(capturedLogs);
                }

                // Build JSON manually for better formatting
                var sb = new System.Text.StringBuilder();
                sb.AppendLine("{");
                sb.AppendLine($"    \"timestamp\": {logs.timestamp},");
                sb.AppendLine($"    \"count\": {logs.logs.Count},");
                sb.AppendLine("    \"logs\": [");

                for (int i = 0; i < logs.logs.Count; i++)
                {
                    var log = logs.logs[i];
                    sb.Append("        {");
                    sb.Append($"\"level\": \"{log.level}\", ");
                    sb.Append($"\"message\": \"{EscapeJsonString(log.message)}\", ");
                    sb.Append($"\"timestamp\": {log.timestamp}");
                    if (!string.IsNullOrEmpty(log.stackTrace))
                    {
                        sb.Append($", \"stackTrace\": \"{EscapeJsonString(log.stackTrace)}\"");
                    }
                    sb.Append("}");
                    if (i < logs.logs.Count - 1) sb.AppendLine(",");
                    else sb.AppendLine();
                }

                sb.AppendLine("    ]");
                sb.AppendLine("}");

                WriteAtomicText(Path.Combine(StateFolder, "console-log.json"), sb.ToString());
            }
            catch (Exception e)
            {
                // Avoid recursive logging by using Console.WriteLine
                System.Console.WriteLine($"[BANTWORKS MCP] Error exporting console logs: {e.Message}");
            }
        }

        private static void ExportImportStatus(bool success, string error)
        {
            try
            {
                var status = new ImportStatus
                {
                    completed = true,
                    hasErrors = !success,
                    errorMessage = error,
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                string json = JsonUtility.ToJson(status, true);
                WriteAtomicText(Path.Combine(StateFolder, "import-status.json"), json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[BANTWORKS MCP] Error exporting import status: {e.Message}");
            }
        }

        /// <summary>
        /// Scans all prefabs in the Assets folder and exports a categorized catalog.
        /// This runs on startup and can be triggered via the scan_prefabs command.
        /// </summary>
        private static void ScanAndExportPrefabCatalog()
        {
            try
            {
                Debug.Log("[BANTWORKS MCP] Scanning prefabs...");
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();

                // Find all prefab GUIDs
                string[] prefabGuids = AssetDatabase.FindAssets("t:Prefab", new[] { "Assets" });

                // Initialize progress tracking
                IsScanningPrefabs = true;
                ScanProgress = 0;
                ScanTotal = prefabGuids.Length;
                ScanStartTime = (float)EditorApplication.timeSinceStartup;
                ScanStatus = $"Found {prefabGuids.Length} prefabs to scan...";

                // Build catalog structure
                var categories = new Dictionary<string, PrefabCategory>();
                int totalCount = 0;

                for (int i = 0; i < prefabGuids.Length; i++)
                {
                    string guid = prefabGuids[i];
                    string path = AssetDatabase.GUIDToAssetPath(guid);
                    if (string.IsNullOrEmpty(path)) continue;

                    // Update progress
                    ScanProgress = i + 1;
                    if (i % 100 == 0 || i == prefabGuids.Length - 1)
                    {
                        float elapsed = (float)EditorApplication.timeSinceStartup - ScanStartTime;
                        float rate = (i + 1) / Mathf.Max(elapsed, 0.001f);
                        int remaining = prefabGuids.Length - i - 1;
                        float eta = rate > 0 ? remaining / rate : 0;
                        ScanStatus = $"Scanning: {i + 1}/{prefabGuids.Length} ({(i + 1) * 100 / prefabGuids.Length}%) - ETA: {eta:F0}s";
                    }

                    // Extract category from path (first folder after Assets/)
                    string relativePath = path.Substring("Assets/".Length);
                    string[] pathParts = relativePath.Split('/');

                    string category = pathParts.Length > 1 ? pathParts[0] : "Root";
                    string subcategory = pathParts.Length > 2 ? pathParts[1] : null;
                    string prefabName = Path.GetFileNameWithoutExtension(path);

                    // Get or create category
                    if (!categories.ContainsKey(category))
                    {
                        categories[category] = new PrefabCategory
                        {
                            name = category,
                            count = 0,
                            subcategories = new Dictionary<string, int>(),
                            prefabs = new List<PrefabEntry>()
                        };
                    }

                    var cat = categories[category];
                    cat.count++;
                    totalCount++;

                    // Track subcategory
                    if (!string.IsNullOrEmpty(subcategory))
                    {
                        if (!cat.subcategories.ContainsKey(subcategory))
                            cat.subcategories[subcategory] = 0;
                        cat.subcategories[subcategory]++;
                    }

                    // Calculate prefab bounds
                    float[] boundsSize = null;
                    float[] boundsCenter = null;
                    GameObject prefabAsset = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                    if (prefabAsset != null)
                    {
                        Bounds bounds = CalculatePrefabBounds(prefabAsset);
                        boundsSize = new float[] { bounds.size.x, bounds.size.y, bounds.size.z };
                        boundsCenter = new float[] { bounds.center.x, bounds.center.y, bounds.center.z };
                    }

                    // Add prefab entry
                    cat.prefabs.Add(new PrefabEntry
                    {
                        path = path,
                        name = prefabName,
                        category = category,
                        subcategory = subcategory,
                        boundsSize = boundsSize,
                        boundsCenter = boundsCenter
                    });
                }

                // Build JSON manually for proper structure
                var sb = new System.Text.StringBuilder();
                sb.AppendLine("{");
                sb.AppendLine($"    \"version\": 1,");
                sb.AppendLine($"    \"timestamp\": {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},");
                sb.AppendLine($"    \"totalCount\": {totalCount},");
                sb.AppendLine($"    \"categories\": {{");

                var catList = categories.Values.OrderByDescending(c => c.count).ToList();
                for (int i = 0; i < catList.Count; i++)
                {
                    var cat = catList[i];
                    sb.AppendLine($"        \"{EscapeJsonString(cat.name)}\": {{");
                    sb.AppendLine($"            \"count\": {cat.count},");

                    // Subcategories
                    sb.Append($"            \"subcategories\": {{");
                    var subList = cat.subcategories.OrderByDescending(s => s.Value).Take(20).ToList();
                    for (int j = 0; j < subList.Count; j++)
                    {
                        sb.Append($"\"{EscapeJsonString(subList[j].Key)}\": {subList[j].Value}");
                        if (j < subList.Count - 1) sb.Append(", ");
                    }
                    sb.AppendLine("},");

                    // Prefabs (limit to first 500 per category to keep file size reasonable)
                    sb.AppendLine($"            \"prefabs\": [");
                    var prefabList = cat.prefabs.Take(500).ToList();
                    for (int j = 0; j < prefabList.Count; j++)
                    {
                        var p = prefabList[j];
                        sb.Append($"                {{\"path\": \"{EscapeJsonString(p.path)}\", \"name\": \"{EscapeJsonString(p.name)}\", \"category\": \"{EscapeJsonString(p.category)}\"");
                        if (!string.IsNullOrEmpty(p.subcategory))
                            sb.Append($", \"subcategory\": \"{EscapeJsonString(p.subcategory)}\"");
                        if (p.boundsSize != null)
                            sb.Append($", \"boundsSize\": [{FormatJsonFloat(p.boundsSize[0])}, {FormatJsonFloat(p.boundsSize[1])}, {FormatJsonFloat(p.boundsSize[2])}]");
                        if (p.boundsCenter != null)
                            sb.Append($", \"boundsCenter\": [{FormatJsonFloat(p.boundsCenter[0])}, {FormatJsonFloat(p.boundsCenter[1])}, {FormatJsonFloat(p.boundsCenter[2])}]");
                        sb.Append("}");
                        if (j < prefabList.Count - 1) sb.AppendLine(",");
                        else sb.AppendLine();
                    }
                    sb.AppendLine($"            ]");

                    sb.Append($"        }}");
                    if (i < catList.Count - 1) sb.AppendLine(",");
                    else sb.AppendLine();
                }

                sb.AppendLine("    }");
                sb.AppendLine("}");

                // Write catalog file
                string catalogPath = Path.Combine(StateFolder, "prefab-catalog.json");
                WriteAtomicText(catalogPath, sb.ToString());

                stopwatch.Stop();

                // Mark scan complete
                IsScanningPrefabs = false;
                ScanStatus = $"Complete: {totalCount} prefabs in {categories.Count} categories ({stopwatch.ElapsedMilliseconds}ms)";

                Debug.Log($"[BANTWORKS MCP] Prefab catalog exported: {totalCount} prefabs in {categories.Count} categories ({stopwatch.ElapsedMilliseconds}ms)");
                LastActivity = DateTime.Now.ToString("HH:mm:ss") + $" - Scanned {totalCount} prefabs";
            }
            catch (Exception e)
            {
                IsScanningPrefabs = false;
                ScanStatus = $"Error: {e.Message}";
                Debug.LogError($"[BANTWORKS MCP] Error scanning prefabs: {e.Message}");
            }
        }

        private static string EscapeJsonString(string s)
        {
            if (string.IsNullOrEmpty(s)) return string.Empty;

            var escaped = new System.Text.StringBuilder(s.Length + 16);
            foreach (char character in s)
            {
                switch (character)
                {
                    case '\\': escaped.Append("\\\\"); break;
                    case '"': escaped.Append("\\\""); break;
                    case '\b': escaped.Append("\\b"); break;
                    case '\f': escaped.Append("\\f"); break;
                    case '\n': escaped.Append("\\n"); break;
                    case '\r': escaped.Append("\\r"); break;
                    case '\t': escaped.Append("\\t"); break;
                    default:
                        if (character < 0x20)
                            escaped.Append("\\u").Append(((int)character).ToString("X4", CultureInfo.InvariantCulture));
                        else
                            escaped.Append(character);
                        break;
                }
            }

            return escaped.ToString();
        }

        /// <summary>
        /// Calculates the combined bounds of a prefab including all renderers
        /// </summary>
        private static Bounds CalculatePrefabBounds(GameObject prefab)
        {
            Bounds bounds = new Bounds(Vector3.zero, Vector3.zero);
            bool boundsInitialized = false;

            // Get all renderers in the prefab
            Renderer[] renderers = prefab.GetComponentsInChildren<Renderer>(true);
            foreach (Renderer renderer in renderers)
            {
                if (!boundsInitialized)
                {
                    bounds = renderer.bounds;
                    boundsInitialized = true;
                }
                else
                {
                    bounds.Encapsulate(renderer.bounds);
                }
            }

            // If no renderers, try colliders
            if (!boundsInitialized)
            {
                Collider[] colliders = prefab.GetComponentsInChildren<Collider>(true);
                foreach (Collider collider in colliders)
                {
                    if (!boundsInitialized)
                    {
                        bounds = collider.bounds;
                        boundsInitialized = true;
                    }
                    else
                    {
                        bounds.Encapsulate(collider.bounds);
                    }
                }
            }

            // Default to a 1x1x1 bounds if nothing found
            if (!boundsInitialized)
            {
                bounds = new Bounds(Vector3.zero, Vector3.one);
            }

            return bounds;
        }

        /// <summary>
        /// Calculates the combined bounds of a scene GameObject including all children
        /// </summary>
        private static Bounds CalculateGameObjectBounds(GameObject obj)
        {
            Bounds bounds = new Bounds(obj.transform.position, Vector3.zero);
            bool boundsInitialized = false;

            Renderer[] renderers = obj.GetComponentsInChildren<Renderer>(true);
            foreach (Renderer renderer in renderers)
            {
                if (!boundsInitialized)
                {
                    bounds = renderer.bounds;
                    boundsInitialized = true;
                }
                else
                {
                    bounds.Encapsulate(renderer.bounds);
                }
            }

            if (!boundsInitialized)
            {
                Collider[] colliders = obj.GetComponentsInChildren<Collider>(true);
                foreach (Collider collider in colliders)
                {
                    if (!boundsInitialized)
                    {
                        bounds = collider.bounds;
                        boundsInitialized = true;
                    }
                    else
                    {
                        bounds.Encapsulate(collider.bounds);
                    }
                }
            }

            if (!boundsInitialized)
            {
                bounds = new Bounds(obj.transform.position, Vector3.one);
            }

            return bounds;
        }

        // Helper classes for prefab catalog
        private class PrefabCategory
        {
            public string name;
            public int count;
            public Dictionary<string, int> subcategories;
            public List<PrefabEntry> prefabs;
        }

        private class PrefabEntry
        {
            public string path;
            public string name;
            public string category;
            public string subcategory;
            public float[] boundsSize;    // [width, height, depth]
            public float[] boundsCenter;  // [x, y, z] offset from pivot
        }

        #endregion

        #region Data Classes

        [Serializable]
        private class MCPCommand
        {
            public string id;
            public string type;
            public string path;
            public string stateType;
            public long timestamp;
        }

        [Serializable]
        private class CreateGameObjectCommand
        {
            public string type;
            public string name;
            public string primitiveType;
            public float[] position;
            public float[] rotation;
            public float[] scale;
            public string parentId;
            public string parentPath;
        }

        [Serializable]
        private class DeleteGameObjectCommand
        {
            public string type;
            public string objectId;
            public string objectPath;
        }

        [Serializable]
        private class ModifyGameObjectCommand
        {
            public string type;
            public string objectId;
            public string objectPath;
            public float[] position;
            public float[] rotation;
            public float[] scale;
        }

        [Serializable]
        private class AddComponentCommand
        {
            public string type;
            public string objectId;
            public string objectPath;
            public string componentType;
        }

        [Serializable]
        private class RemoveComponentCommand
        {
            public string type;
            public string objectId;
            public string objectPath;
            public string componentType;
            public string componentId;
        }

        [Serializable]
        private class SetComponentPropertyCommand
        {
            public string type;
            public string objectId;
            public string objectPath;
            public string componentType;
            public string componentId;
            public string propertyName;
            public string value;
            public string valueJson;
        }

        [Serializable]
        private class PlayModeCommand
        {
            public string type;
            public string action;
        }

        [Serializable]
        private class ScreenshotCommand
        {
            public string id;
            public string type;
            public string source;
            public int width;
            public int height;
            public string cameraId;
            public string cameraPath;
        }

        [Serializable]
        private class AssetSearchCommand
        {
            public string id;
            public string type;
            public string query;
            public string[] folders;
            public int limit;
            public bool includePackages;
        }

        [Serializable]
        private class AssetSearchResult
        {
            public string commandId;
            public bool success;
            public string query;
            public int totalMatches;
            public bool truncated;
            public long timestamp;
            public List<AssetSearchEntry> assets;
        }

        [Serializable]
        private class AssetSearchEntry
        {
            public string guid;
            public string path;
            public string name;
            public string type;
            public bool isFolder;
        }

        [Serializable]
        private class ValidateVSGraphAssetCommand
        {
            public string id;
            public string type;
            public string assetPath;
        }

        [Serializable]
        private class VSGraphAssetValidationResult
        {
            public string commandId;
            public bool success;
            public string assetPath;
            public string assetGuid;
            public string assetType;
            public string graphType;
            public string dependencyHash;
            public int elementCount;
            public int nodeCount;
            public int controlConnectionCount;
            public int valueConnectionCount;
            public int groupCount;
            public int missingElementCount;
            public string error;
            public long timestamp;
            public List<string> elementTypes;
            public List<string> warnings;
        }

        [Serializable]
        private class ValidateBanterVisualScriptingCommand
        {
            public string id;
            public string type;
        }

        [Serializable]
        private class BanterVisualScriptingValidationResult
        {
            public string commandId;
            public bool success;
            public bool validatorAvailable;
            public bool validationCompleted;
            public bool validationPassed;
            public string validatorType;
            public string validatorAssembly;
            public string validatorMethod;
            public int diagnosticCount;
            public bool diagnosticsTruncated;
            public List<ConsoleLogEntry> diagnostics;
            public string error;
            public long timestamp;
        }

        [Serializable]
        private class GetScenesCommand
        {
            public string id;
            public string type;
        }

        [Serializable]
        private class SaveSceneCommand
        {
            public string id;
            public string type;
            public string scenePath;
            public string saveAsPath;
            public bool overwrite;
        }

        [Serializable]
        private class OpenSceneCommand
        {
            public string id;
            public string type;
            public string scenePath;
            public string mode;
            public bool saveModifiedScenes;
            public bool setActive;
        }

        [Serializable]
        private class SetBuildScenesCommand
        {
            public string id;
            public string type;
            public BuildSceneInput[] scenes;
        }

        [Serializable]
        private class BuildSceneInput
        {
            public string path;
            public bool enabled;
        }

        [Serializable]
        private class SceneManagementResult
        {
            public string commandId;
            public bool success;
            public string message;
            public string activeScenePath;
            public string activeSceneName;
            public long timestamp;
            public List<OpenSceneEntry> openScenes;
            public List<BuildSceneEntry> buildScenes;
        }

        [Serializable]
        private class OpenSceneEntry
        {
            public int handle;
            public string name;
            public string path;
            public string guid;
            public bool isLoaded;
            public bool isDirty;
            public bool isActive;
            public int buildIndex;
            public int rootCount;
        }

        [Serializable]
        private class BuildSceneEntry
        {
            public int index;
            public string path;
            public string guid;
            public bool enabled;
        }

        [Serializable]
        private class RunTestsCommand
        {
            public string id;
            public string type;
            public string mode;
            public string[] testNames;
            public string[] groupNames;
            public string[] categoryNames;
            public string[] assemblyNames;
            public int timeoutMs;
            public int maxResults;
        }

        [Serializable]
        private class DiscoverTestsCommand
        {
            public string id;
            public string type;
            public string mode;
            public string search;
            public int maxResults;
        }

        [Serializable]
        private class CancelTestsCommand
        {
            public string id;
            public string type;
            public string runId;
        }

        [Serializable]
        private class TestDiscoveryResult
        {
            public string commandId;
            public bool success;
            public string mode;
            public string search;
            public string error;
            public int totalTests;
            public int matchingTests;
            public int returned;
            public bool truncated;
            public long timestamp;
            public List<DiscoveredTestEntry> tests;
        }

        [Serializable]
        private class DiscoveredTestEntry
        {
            public string id;
            public string name;
            public string fullName;
            public string uniqueName;
            public string assemblyName;
            public string mode;
            public string runState;
            public string description;
            public string skipReason;
            public string[] categories;
        }

        [Serializable]
        private class UnityTestRunResult
        {
            public string commandId;
            public string jobId;
            public bool success;
            public bool testsPassed;
            public bool noTests;
            public bool cancellationRequested;
            public long cancellationRequestedAt;
            public string status;
            public string mode;
            public string error;
            public string completionSource;
            public long startedAt;
            public long updatedAt;
            public long finishedAt;
            public long deadline;
            public int maxResults;
            public int loadedTestCount;
            public int completedCount;
            public int total;
            public int passed;
            public int failed;
            public int skipped;
            public int inconclusive;
            public double duration;
            public bool truncated;
            public string[] testNames;
            public string[] groupNames;
            public string[] categoryNames;
            public string[] assemblyNames;
            public List<UnityTestCaseResult> tests;
        }

        [Serializable]
        private class UnityTestCaseResult
        {
            public string name;
            public string fullName;
            public string resultState;
            public string status;
            public double duration;
            public string message;
            public string stackTrace;
            public string output;
        }

        [Serializable]
        private class StringJsonValue
        {
            public string value;
        }

        [Serializable]
        private class FloatArrayJsonValue
        {
            public float[] values;
        }

        [Serializable]
        private class IntArrayJsonValue
        {
            public int[] values;
        }

        [Serializable]
        private class RectJsonValue
        {
            public float x;
            public float y;
            public float width;
            public float height;
        }

        [Serializable]
        private class BoundsJsonValue
        {
            public float[] center;
            public float[] size;
        }

        [Serializable]
        private class SetObjectReferenceCommand
        {
            public string type;
            public string objectId;
            public string objectPath;
            public string componentType;
            public string componentId;
            public string propertyName;
            public string targetId;
            public string targetPath;
            public string targetComponent;
        }

        [Serializable]
        private class BatchCommand
        {
            public string type;
            public string[] commands;  // Array of JSON strings, each representing a command
            public bool continueOnError;
        }

        [Serializable]
        private class InstantiatePrefabCommand
        {
            public string type;
            public string prefabPath;  // Asset path like "Assets/Prefabs/MyPrefab.prefab"
            public string name;        // Optional: rename the instance
            public float[] position;
            public float[] rotation;
            public float[] scale;
            public string parentId;
            public string parentPath;
        }

        [Serializable]
        private class GetBoundsCommand
        {
            public string id;
            public string type;
            public string objectId;
            public string objectPath;
        }

        [Serializable]
        private class SceneHierarchy
        {
            public string sceneName;
            public string scenePath;
            public List<GameObjectInfo> objects;
            public long timestamp;
        }

        [Serializable]
        private class GameObjectInfo
        {
            public string name;
            public string globalObjectId;
            public string path;
            public bool active;
            public int layer;
            public string tag;
            public int depth;
            public float[] position;
            public float[] rotation;
            public float[] scale;
            public List<ComponentInfo> components;
        }

        [Serializable]
        private class ComponentInfo
        {
            public string type;
            public string fullType;
            public string globalObjectId;
            public List<PropertyInfo> properties;
        }

        [Serializable]
        private class PropertyInfo
        {
            public string name;
            public string type;
            public string value;
        }

        [Serializable]
        private class EditorState
        {
            public bool isPlaying;
            public bool isPaused;
            public bool isCompiling;
            public bool isPlayingOrWillChangePlaymode;
            public bool isUpdating;
            public string activeScene;
            public string[] selectedObjects;
            public long timestamp;
        }

        [Serializable]
        private class ConsoleLogs
        {
            public List<ConsoleLogEntry> logs;
            public long timestamp;
        }

        [Serializable]
        private class ConsoleLogEntry
        {
            public string level;
            public string message;
            public string stackTrace;
            public long timestamp;
        }

        [Serializable]
        private class ImportStatus
        {
            public bool completed;
            public bool hasErrors;
            public string errorMessage;
            public long timestamp;
        }

        [Serializable]
        private class ProjectInstanceState
        {
            public string editorInstanceId;
            public string projectPath;
            public string projectName;
            public string unityVersion;
            public int processId;
            public long processStartedAt;
            public long updatedAt;
        }

        [Serializable]
        private class CommandResult
        {
            public string commandId;
            public bool success;
            public string message;
            public string error;
            public long timestamp;
        }

        [Serializable]
        private class LauncherSettings
        {
            public bool enableCustomScripts;
        }

        #endregion
    }

    /// <summary>
    /// Status window for BANTWORKS MCP
    /// </summary>
    public class BantworksMCPWindow : EditorWindow
    {
        private Vector2 scrollPosition;
        private static readonly Color CyanColor = new Color(0f, 0.83f, 1f);   // #00d4ff
        private static readonly Color RedColor = new Color(1f, 0.23f, 0.23f); // #ff3b3b

        public static void ShowWindow()
        {
            var window = GetWindow<BantworksMCPWindow>("BANTWORKS MCP");
            window.minSize = new Vector2(350, 300);
        }

        private void OnGUI()
        {
            scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition);

            // Header with branded colors
            EditorGUILayout.BeginHorizontal();
            GUIStyle headerStyle = new GUIStyle(EditorStyles.boldLabel) { fontSize = 14 };
            GUI.color = CyanColor;
            GUILayout.Label("BANT", headerStyle, GUILayout.ExpandWidth(false));
            GUI.color = RedColor;
            GUILayout.Label("WORKS", headerStyle, GUILayout.ExpandWidth(false));
            GUI.color = Color.white;
            GUILayout.Label(" MCP Status", headerStyle);
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space();

            // Connection status
            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("Status:", GUILayout.Width(100));
            GUI.color = BantworksMCPBridge.IsConnected ? Color.green : Color.red;
            GUILayout.Label(BantworksMCPBridge.IsConnected ? "● Connected" : "○ Disconnected");
            GUI.color = Color.white;
            EditorGUILayout.EndHorizontal();

            // Last activity
            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("Last Activity:", GUILayout.Width(100));
            GUILayout.Label(BantworksMCPBridge.LastActivity ?? "None");
            EditorGUILayout.EndHorizontal();

            // Commands processed
            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("Commands:", GUILayout.Width(100));
            GUILayout.Label(BantworksMCPBridge.CommandsProcessed.ToString());
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.Space();
            DrawSeparator();
            EditorGUILayout.Space();

            // Prefab Scan Section
            GUILayout.Label("Prefab Catalog", EditorStyles.boldLabel);
            EditorGUILayout.Space();

            if (BantworksMCPBridge.IsScanningPrefabs)
            {
                // Show scanning progress
                EditorGUILayout.BeginHorizontal();
                GUILayout.Label("Status:", GUILayout.Width(100));
                GUI.color = new Color(1f, 0.8f, 0.2f); // Yellow/orange
                GUILayout.Label("● Scanning...");
                GUI.color = Color.white;
                EditorGUILayout.EndHorizontal();

                // Progress bar
                float progress = BantworksMCPBridge.ScanTotal > 0
                    ? (float)BantworksMCPBridge.ScanProgress / BantworksMCPBridge.ScanTotal
                    : 0f;

                EditorGUILayout.BeginHorizontal();
                GUILayout.Label("Progress:", GUILayout.Width(100));
                Rect progressRect = EditorGUILayout.GetControlRect(GUILayout.Height(20));
                EditorGUI.ProgressBar(progressRect, progress,
                    $"{BantworksMCPBridge.ScanProgress} / {BantworksMCPBridge.ScanTotal} ({(progress * 100):F0}%)");
                EditorGUILayout.EndHorizontal();

                // Elapsed time
                float elapsed = (float)EditorApplication.timeSinceStartup - BantworksMCPBridge.ScanStartTime;
                EditorGUILayout.BeginHorizontal();
                GUILayout.Label("Elapsed:", GUILayout.Width(100));
                GUILayout.Label(FormatTime(elapsed));
                EditorGUILayout.EndHorizontal();

                // ETA
                if (progress > 0.01f)
                {
                    float eta = (elapsed / progress) * (1f - progress);
                    EditorGUILayout.BeginHorizontal();
                    GUILayout.Label("ETA:", GUILayout.Width(100));
                    GUILayout.Label(FormatTime(eta));
                    EditorGUILayout.EndHorizontal();
                }

                // Status message
                EditorGUILayout.BeginHorizontal();
                GUILayout.Label("Details:", GUILayout.Width(100));
                GUILayout.Label(BantworksMCPBridge.ScanStatus ?? "", EditorStyles.wordWrappedLabel);
                EditorGUILayout.EndHorizontal();
            }
            else
            {
                // Show idle/complete status
                EditorGUILayout.BeginHorizontal();
                GUILayout.Label("Status:", GUILayout.Width(100));
                if (!string.IsNullOrEmpty(BantworksMCPBridge.ScanStatus) && BantworksMCPBridge.ScanStatus.StartsWith("Complete"))
                {
                    GUI.color = Color.green;
                    GUILayout.Label("● Ready");
                }
                else if (!string.IsNullOrEmpty(BantworksMCPBridge.ScanStatus) && BantworksMCPBridge.ScanStatus.StartsWith("Error"))
                {
                    GUI.color = Color.red;
                    GUILayout.Label("● Error");
                }
                else
                {
                    GUI.color = Color.gray;
                    GUILayout.Label("○ Idle");
                }
                GUI.color = Color.white;
                EditorGUILayout.EndHorizontal();

                // Last scan result
                if (!string.IsNullOrEmpty(BantworksMCPBridge.ScanStatus))
                {
                    EditorGUILayout.BeginHorizontal();
                    GUILayout.Label("Last Scan:", GUILayout.Width(100));
                    GUILayout.Label(BantworksMCPBridge.ScanStatus, EditorStyles.wordWrappedLabel);
                    EditorGUILayout.EndHorizontal();
                }

                // Prefab count summary
                if (BantworksMCPBridge.ScanTotal > 0)
                {
                    EditorGUILayout.BeginHorizontal();
                    GUILayout.Label("Total Prefabs:", GUILayout.Width(100));
                    GUILayout.Label(BantworksMCPBridge.ScanTotal.ToString("N0"));
                    EditorGUILayout.EndHorizontal();
                }
            }

            EditorGUILayout.Space();
            DrawSeparator();
            EditorGUILayout.Space();

            // Project Mode Section
            GUILayout.Label("Project Mode", EditorStyles.boldLabel);
            EditorGUILayout.Space();

            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("Custom Scripts:", GUILayout.Width(100));
            bool customScriptsEnabled = BantworksMCPBridge.EnableCustomScripts;
            bool newValue = EditorGUILayout.Toggle(customScriptsEnabled, GUILayout.Width(20));
            if (newValue != customScriptsEnabled)
            {
                BantworksMCPBridge.EnableCustomScripts = newValue;
            }
            GUILayout.Label(newValue ? "Enabled (Non-Banter)" : "Disabled (Banter Only)",
                EditorStyles.miniLabel);
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.BeginHorizontal();
            GUILayout.Label("", GUILayout.Width(100));
            EditorGUILayout.HelpBox(
                newValue
                    ? "MCP can add custom C# scripts from Assembly-CSharp"
                    : "MCP only adds Unity built-in and Banter SDK components",
                MessageType.Info);
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.Space();
            DrawSeparator();
            EditorGUILayout.Space();

            // Actions section
            GUILayout.Label("Actions", EditorStyles.boldLabel);
            EditorGUILayout.Space();

            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Refresh State", GUILayout.Height(28)))
            {
                EditorApplication.ExecuteMenuItem("BANTWORKS MCP/Refresh State");
            }
            if (GUILayout.Button("Rescan Prefabs", GUILayout.Height(28)))
            {
                EditorApplication.ExecuteMenuItem("BANTWORKS MCP/Scan Prefabs");
            }
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Open MCP Folder", GUILayout.Height(28)))
            {
                EditorApplication.ExecuteMenuItem("BANTWORKS MCP/Open MCP Folder");
            }
            if (GUILayout.Button("Clear Commands", GUILayout.Height(28)))
            {
                EditorApplication.ExecuteMenuItem("BANTWORKS MCP/Clear Commands");
            }
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.EndScrollView();
        }

        private void DrawSeparator()
        {
            Rect rect = EditorGUILayout.GetControlRect(GUILayout.Height(1));
            EditorGUI.DrawRect(rect, new Color(0.5f, 0.5f, 0.5f, 0.5f));
        }

        private string FormatTime(float seconds)
        {
            if (seconds < 60)
                return $"{seconds:F0}s";
            else if (seconds < 3600)
                return $"{(int)(seconds / 60)}m {(int)(seconds % 60)}s";
            else
                return $"{(int)(seconds / 3600)}h {(int)((seconds % 3600) / 60)}m";
        }

        private void OnInspectorUpdate()
        {
            // Repaint frequently during scanning for smooth progress updates
            if (BantworksMCPBridge.IsScanningPrefabs)
                Repaint();
        }

        private void Update()
        {
            // Also repaint in Update for more frequent updates during scanning
            if (BantworksMCPBridge.IsScanningPrefabs)
                Repaint();
        }
    }
}
