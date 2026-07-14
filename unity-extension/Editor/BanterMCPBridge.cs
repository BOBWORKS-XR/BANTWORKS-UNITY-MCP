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

        private static double lastCommandCheck = 0;
        private static double lastStateExport = 0;
        private static double lastLauncherSettingsCheck = 0;
        private static readonly double CommandCheckInterval = 0.5; // seconds
        private static readonly double StateExportInterval = 2.0; // seconds
        private static readonly double LauncherSettingsCheckInterval = 1.0; // seconds
        private static DateTime lastLauncherSettingsWriteTime = DateTime.MinValue;

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
                    ProcessBatchCommand(batchCmd, json);
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

            GameObject parent = string.IsNullOrEmpty(cmd.parentPath)
                ? null
                : FindGameObjectByPath(cmd.parentPath);
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
            var obj = FindGameObjectByPath(cmd?.objectPath);
            Undo.DestroyObjectImmediate(obj);
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Deleted GameObject: {cmd.objectPath}");
            ExportSceneHierarchy();
        }

        private static void ModifyGameObject(ModifyGameObjectCommand cmd)
        {
            var obj = FindGameObjectByPath(cmd?.objectPath);

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
            Debug.Log($"[BANTWORKS MCP] Modified GameObject: {cmd.objectPath}");
            ExportSceneHierarchy();
        }

        private static void AddComponentToObject(AddComponentCommand cmd)
        {
            var obj = FindGameObjectByPath(cmd?.objectPath);

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
            var obj = FindGameObjectByPath(cmd?.objectPath);

            var component = obj.GetComponent(cmd.componentType);
            if (component == null)
            {
                throw new InvalidOperationException($"Component not found: {cmd.componentType} on {cmd.objectPath}");
            }

            Undo.DestroyObjectImmediate(component);
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Removed component {cmd.componentType} from {cmd.objectPath}");
            ExportSceneHierarchy();
        }

        private static void SetComponentProperty(SetComponentPropertyCommand cmd)
        {
            var obj = FindGameObjectByPath(cmd?.objectPath);

            var component = obj.GetComponent(cmd.componentType);
            if (component == null)
            {
                throw new InvalidOperationException($"Component not found: {cmd.componentType} on {cmd.objectPath}");
            }

            var so = new SerializedObject(component);
            var prop = so.FindProperty(cmd.propertyName);
            if (prop == null)
            {
                throw new InvalidOperationException($"Property not found: {cmd.propertyName} on {cmd.componentType}");
            }

            Undo.RecordObject(component, "MCP Set Property");

            // Set property value based on type
            SetSerializedPropertyValue(prop, cmd.value);

            so.ApplyModifiedProperties();
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Set {cmd.propertyName} on {cmd.componentType}");
            ExportSceneHierarchy();
        }

        private static void SetObjectReference(SetObjectReferenceCommand cmd)
        {
            var obj = FindGameObjectByPath(cmd?.objectPath);

            var component = obj.GetComponent(cmd.componentType);
            if (component == null)
            {
                throw new InvalidOperationException($"Component not found: {cmd.componentType} on {cmd.objectPath}");
            }

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
            bool clearReference = string.IsNullOrWhiteSpace(cmd.targetPath) ||
                                  string.Equals(cmd.targetPath, "null", StringComparison.OrdinalIgnoreCase);

            if (!clearReference)
            {
                var targetGameObject = FindGameObjectByPath(cmd.targetPath);

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

            GameObject parent = string.IsNullOrEmpty(cmd.parentPath)
                ? null
                : FindGameObjectByPath(cmd.parentPath);
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

            if (!string.IsNullOrEmpty(cmd.name))
                obj.name = cmd.name;

            if (cmd.position != null && cmd.position.Length == 3)
                obj.transform.position = new Vector3(cmd.position[0], cmd.position[1], cmd.position[2]);

            if (cmd.rotation != null && cmd.rotation.Length == 3)
                obj.transform.eulerAngles = new Vector3(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);

            if (cmd.scale != null && cmd.scale.Length == 3)
                obj.transform.localScale = new Vector3(cmd.scale[0], cmd.scale[1], cmd.scale[2]);

            if (!string.IsNullOrEmpty(cmd.parentPath))
            {
                var parent = FindGameObjectByPath(cmd.parentPath);
                obj.transform.SetParent(parent.transform, true);
            }
        }

        private static void GetObjectBounds(GetBoundsCommand cmd)
        {
            var obj = FindGameObjectByPath(cmd?.objectPath);

            Bounds bounds = CalculateGameObjectBounds(obj);
            ExportBoundsResult(cmd.objectPath, true, bounds);
            Debug.Log($"[BANTWORKS MCP] Got bounds for {cmd.objectPath}: size={bounds.size}, center={bounds.center}");
        }

        private static void ExportBoundsResult(string objectPath, bool success, Bounds? bounds)
        {
            try
            {
                var sb = new System.Text.StringBuilder();
                sb.AppendLine("{");
                sb.AppendLine($"    \"success\": {(success ? "true" : "false")},");
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

                WriteAtomicText(Path.Combine(StateFolder, "bounds-result.json"), sb.ToString());
            }
            catch (Exception e)
            {
                Debug.LogError($"[BANTWORKS MCP] Error exporting bounds result: {e.Message}");
            }
        }

        private static void ProcessBatchCommand(BatchCommand batchCmd, string fullJson)
        {
            // JsonUtility can't parse string arrays with escaped JSON properly
            // So we manually extract the commands from the raw JSON
            int createdCount = 0;
            int errorCount = 0;

            // Extract commands array manually
            var commandStrings = ExtractCommandsFromJson(fullJson);

            Debug.Log($"[BANTWORKS MCP] Batch: found {commandStrings.Count} commands to process");

            foreach (var cmdJson in commandStrings)
            {
                try
                {
                    var baseCmd = JsonUtility.FromJson<MCPCommand>(cmdJson);
                    switch (baseCmd.type)
                    {
                        case "create_gameobject":
                            var createCmd = JsonUtility.FromJson<CreateGameObjectCommand>(cmdJson);
                            CreateGameObjectSilent(createCmd);
                            createdCount++;
                            break;
                        case "delete_gameobject":
                            var deleteCmd = JsonUtility.FromJson<DeleteGameObjectCommand>(cmdJson);
                            DeleteGameObjectSilent(deleteCmd);
                            createdCount++;
                            break;
                        case "modify_gameobject":
                            var modifyCmd = JsonUtility.FromJson<ModifyGameObjectCommand>(cmdJson);
                            ModifyGameObjectSilent(modifyCmd);
                            createdCount++;
                            break;
                        case "instantiate_prefab":
                            var prefabCmd = JsonUtility.FromJson<InstantiatePrefabCommand>(cmdJson);
                            InstantiatePrefabSilent(prefabCmd);
                            createdCount++;
                            break;
                        default:
                            Debug.LogWarning($"[BANTWORKS MCP] Batch: unsupported command type: {baseCmd.type}");
                            errorCount++;
                            break;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[BANTWORKS MCP] Batch command error: {e.Message}\nJSON: {cmdJson}");
                    errorCount++;
                }
            }

            // Mark scene dirty once at the end
            EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
            Debug.Log($"[BANTWORKS MCP] Batch completed: {createdCount} operations, {errorCount} errors");
            ExportSceneHierarchy();

            if (errorCount > 0)
                throw new InvalidOperationException($"Batch completed with {errorCount} failed operation(s). {createdCount} operation(s) were applied.");
        }

        /// <summary>
        /// Manually extracts command strings from a batch JSON since JsonUtility
        /// can't properly deserialize arrays of JSON strings
        /// </summary>
        private static List<string> ExtractCommandsFromJson(string json)
        {
            var results = new List<string>();

            // Find the "commands" array in the JSON
            int commandsStart = json.IndexOf("\"commands\"");
            if (commandsStart < 0)
            {
                Debug.LogError("[BANTWORKS MCP] Batch: 'commands' array not found in JSON");
                return results;
            }

            // Find the opening bracket of the array
            int arrayStart = json.IndexOf('[', commandsStart);
            if (arrayStart < 0)
            {
                Debug.LogError("[BANTWORKS MCP] Batch: Could not find commands array start");
                return results;
            }

            // Find matching closing bracket
            int depth = 0;
            int arrayEnd = -1;
            for (int i = arrayStart; i < json.Length; i++)
            {
                if (json[i] == '[') depth++;
                else if (json[i] == ']') depth--;
                if (depth == 0)
                {
                    arrayEnd = i;
                    break;
                }
            }

            if (arrayEnd < 0)
            {
                Debug.LogError("[BANTWORKS MCP] Batch: Could not find commands array end");
                return results;
            }

            // Extract the array content (between [ and ])
            string arrayContent = json.Substring(arrayStart + 1, arrayEnd - arrayStart - 1).Trim();

            // Parse each JSON string in the array
            // Format: "escaped json", "escaped json", ...
            int pos = 0;
            while (pos < arrayContent.Length)
            {
                // Skip whitespace and commas
                while (pos < arrayContent.Length && (char.IsWhiteSpace(arrayContent[pos]) || arrayContent[pos] == ','))
                    pos++;

                if (pos >= arrayContent.Length) break;

                // Expect opening quote
                if (arrayContent[pos] != '"')
                {
                    Debug.LogError($"[BANTWORKS MCP] Batch: Expected quote at position {pos}");
                    break;
                }

                // Find the end of this JSON string (handling escapes)
                pos++; // skip opening quote
                int stringStart = pos;
                while (pos < arrayContent.Length)
                {
                    if (arrayContent[pos] == '\\')
                    {
                        pos += 2; // skip escape sequence
                    }
                    else if (arrayContent[pos] == '"')
                    {
                        break; // found closing quote
                    }
                    else
                    {
                        pos++;
                    }
                }

                if (pos >= arrayContent.Length)
                {
                    Debug.LogError("[BANTWORKS MCP] Batch: Unterminated string");
                    break;
                }

                // Extract the string content (without quotes) and unescape it
                string escapedJson = arrayContent.Substring(stringStart, pos - stringStart);
                string unescapedJson = UnescapeJsonString(escapedJson);
                results.Add(unescapedJson);

                pos++; // skip closing quote
            }

            return results;
        }

        /// <summary>
        /// Unescapes a JSON string value (handles \", \, \n, etc.)
        /// </summary>
        private static string UnescapeJsonString(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;

            var result = new System.Text.StringBuilder(s.Length);
            for (int i = 0; i < s.Length; i++)
            {
                if (s[i] == '\\' && i + 1 < s.Length)
                {
                    char next = s[i + 1];
                    switch (next)
                    {
                        case '"': result.Append('"'); i++; break;
                        case '\\': result.Append('\\'); i++; break;
                        case 'n': result.Append('\n'); i++; break;
                        case 'r': result.Append('\r'); i++; break;
                        case 't': result.Append('\t'); i++; break;
                        case '/': result.Append('/'); i++; break;
                        default: result.Append(s[i]); break;
                    }
                }
                else
                {
                    result.Append(s[i]);
                }
            }
            return result.ToString();
        }

        private static void CreateGameObjectSilent(CreateGameObjectCommand cmd)
        {
            if (cmd == null || string.IsNullOrWhiteSpace(cmd.name))
                throw new InvalidOperationException("Create GameObject command requires a name");

            GameObject parent = string.IsNullOrEmpty(cmd.parentPath)
                ? null
                : FindGameObjectByPath(cmd.parentPath);
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
            var obj = FindGameObjectByPath(cmd?.objectPath);
            UnityEngine.Object.DestroyImmediate(obj);
        }

        private static void ModifyGameObjectSilent(ModifyGameObjectCommand cmd)
        {
            var obj = FindGameObjectByPath(cmd?.objectPath);

            if (cmd.position != null && cmd.position.Length == 3)
                obj.transform.position = new Vector3(cmd.position[0], cmd.position[1], cmd.position[2]);

            if (cmd.rotation != null && cmd.rotation.Length == 3)
                obj.transform.eulerAngles = new Vector3(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);

            if (cmd.scale != null && cmd.scale.Length == 3)
                obj.transform.localScale = new Vector3(cmd.scale[0], cmd.scale[1], cmd.scale[2]);
        }

        private static void SetSerializedPropertyValue(SerializedProperty prop, string valueJson)
        {
            switch (prop.propertyType)
            {
                case SerializedPropertyType.Boolean:
                    prop.boolValue = bool.Parse(valueJson);
                    break;
                case SerializedPropertyType.Integer:
                    prop.intValue = int.Parse(valueJson, CultureInfo.InvariantCulture);
                    break;
                case SerializedPropertyType.Float:
                    prop.floatValue = float.Parse(valueJson, CultureInfo.InvariantCulture);
                    break;
                case SerializedPropertyType.String:
                    prop.stringValue = valueJson;
                    break;
                case SerializedPropertyType.Vector2:
                    var v2 = JsonUtility.FromJson<Vector2>(valueJson);
                    prop.vector2Value = v2;
                    break;
                case SerializedPropertyType.Vector3:
                    var v3 = JsonUtility.FromJson<Vector3>(valueJson);
                    prop.vector3Value = v3;
                    break;
                case SerializedPropertyType.Color:
                    var color = JsonUtility.FromJson<Color>(valueJson);
                    prop.colorValue = color;
                    break;
                case SerializedPropertyType.Enum:
                    prop.enumValueIndex = int.Parse(valueJson, CultureInfo.InvariantCulture);
                    break;
                default:
                    throw new InvalidOperationException($"Unsupported property type: {prop.propertyType}");
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
                    activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
                    selectedObjects = Selection.gameObjects?.Select(o => o.name).ToArray() ?? new string[0],
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                string json = JsonUtility.ToJson(state, true);
                WriteAtomicText(Path.Combine(StateFolder, "editor-state.json"), json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[BANTWORKS MCP] Error exporting editor state: {e.Message}");
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
            public string parentPath;
        }

        [Serializable]
        private class DeleteGameObjectCommand
        {
            public string type;
            public string objectPath;
        }

        [Serializable]
        private class ModifyGameObjectCommand
        {
            public string type;
            public string objectPath;
            public float[] position;
            public float[] rotation;
            public float[] scale;
        }

        [Serializable]
        private class AddComponentCommand
        {
            public string type;
            public string objectPath;
            public string componentType;
        }

        [Serializable]
        private class RemoveComponentCommand
        {
            public string type;
            public string objectPath;
            public string componentType;
        }

        [Serializable]
        private class SetComponentPropertyCommand
        {
            public string type;
            public string objectPath;
            public string componentType;
            public string propertyName;
            public string value;
        }

        [Serializable]
        private class SetObjectReferenceCommand
        {
            public string type;
            public string objectPath;
            public string componentType;
            public string propertyName;
            public string targetPath;
            public string targetComponent;
        }

        [Serializable]
        private class BatchCommand
        {
            public string type;
            public string[] commands;  // Array of JSON strings, each representing a command
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
            public string parentPath;
        }

        [Serializable]
        private class GetBoundsCommand
        {
            public string type;
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
