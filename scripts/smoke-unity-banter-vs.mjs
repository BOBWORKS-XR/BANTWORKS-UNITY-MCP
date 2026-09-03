#!/usr/bin/env node

// Cross-platform equivalent of scripts/smoke-unity-banter-vs.ps1.
//
// Creates a disposable Unity project, attaches dependencies (com.unity.visualscripting,
// com.unity.test-framework, and com.sidequest.banter pinned commit), generates a
// test ScriptGraphAsset, attaches the BanterMCPBridge and test runner, runs batchmode
// smoke assertions inside Unity, and verifies the resulting markers and package lock.
//
// Usage:
//   node scripts/smoke-unity-banter-vs.mjs [options]
//   ./scripts/smoke-unity-banter-vs.sh [options]

import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

export const DEFAULT_BANTER_PACKAGE_REFERENCE =
  "https://github.com/SideQuestVR/BanterSDK.git#8cff56ed80a7f694d0de204a4fa7bfc660f6d503";
export const DEFAULT_EXPECTED_BANTER_VERSION = "3.2.2";
export const DEFAULT_EXPECTED_UNITY_VERSION = "6000.3.2f1";
export const DEFAULT_VISUAL_SCRIPTING_VERSION = "1.9.9";
export const DEFAULT_TEST_FRAMEWORK_VERSION = "1.6.0";

export function getDefaultUnityEditorPath() {
  if (process.platform === "win32") {
    return "C:\\Program Files\\Unity\\Hub\\Editor\\6000.3.2f1\\Editor\\Unity.exe";
  }
  if (process.platform === "darwin") {
    return "/Applications/Unity/Hub/Editor/6000.3.2f1/Unity.app/Contents/MacOS/Unity";
  }
  return path.join(os.homedir(), "Unity", "Hub", "Editor", "6000.3.2f1", "Editor", "Unity");
}

export function autoDetectUnityEditorPath(preferredVersion = null) {
  if (process.platform === "win32") {
    const hubDir = "C:\\Program Files\\Unity\\Hub\\Editor";
    if (existsSync(hubDir)) {
      if (preferredVersion) {
        const candidate = path.join(hubDir, preferredVersion, "Editor", "Unity.exe");
        if (existsSync(candidate)) return candidate;
      }
      try {
        const entries = readdirSync(hubDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
        for (const entry of entries) {
          const candidate = path.join(hubDir, entry, "Editor", "Unity.exe");
          if (existsSync(candidate)) return candidate;
        }
      } catch {
        // ignore
      }
    }
    return null;
  }

  if (process.platform === "darwin") {
    const hubDir = "/Applications/Unity/Hub/Editor";
    if (existsSync(hubDir)) {
      if (preferredVersion) {
        const candidate = path.join(hubDir, preferredVersion, "Unity.app", "Contents", "MacOS", "Unity");
        if (existsSync(candidate)) return candidate;
      }
      try {
        const entries = readdirSync(hubDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
        for (const entry of entries) {
          const candidate = path.join(hubDir, entry, "Unity.app", "Contents", "MacOS", "Unity");
          if (existsSync(candidate)) return candidate;
        }
      } catch {
        // ignore
      }
    }
    return null;
  }

  // Linux
  const hubDir = path.join(os.homedir(), "Unity", "Hub", "Editor");
  if (existsSync(hubDir)) {
    if (preferredVersion) {
      const candidate = path.join(hubDir, preferredVersion, "Editor", "Unity");
      if (existsSync(candidate)) return candidate;
    }
    try {
      const entries = readdirSync(hubDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      for (const entry of entries) {
        const candidate = path.join(hubDir, entry, "Editor", "Unity");
        if (existsSync(candidate)) return candidate;
      }
    } catch {
      // ignore
    }
  }

  const optCandidate = "/opt/unity/Editor/Unity";
  if (existsSync(optCandidate)) return optCandidate;

  return null;
}

export function resolveUnityEditorPath(explicitPath = null, autoDetect = false, preferredVersion = null) {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  if (process.env.UNITY_EDITOR_PATH) {
    return path.resolve(process.env.UNITY_EDITOR_PATH);
  }
  if (autoDetect) {
    const detected = autoDetectUnityEditorPath(preferredVersion);
    if (detected) return detected;
  }
  return getDefaultUnityEditorPath();
}

function writeJsonAtomically(filePath, value) {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  if (dir) {
    mkdirSync(dir, { recursive: true });
  }
  const temporaryPath = `${resolved}.tmp-${crypto.randomUUID().replace(/-/g, "")}`;
  writeFileSync(temporaryPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(temporaryPath, resolved);
}

function invokeUnity(unityEditorPath, args, logPath) {
  const result = spawnSync(unityEditorPath, args, {
    stdio: "ignore",
    encoding: "utf8",
  });
  if (result.status !== 0) {
    let tail = "Unity did not create a log file.";
    if (existsSync(logPath)) {
      try {
        const logContent = readFileSync(logPath, "utf8");
        const lines = logContent.split(/\r?\n/);
        tail = lines.slice(-160).join("\n");
      } catch {
        // ignore
      }
    }
    throw new Error(`Unity exited with code ${result.status}.\n${tail}`);
  }
}

function assertUnityLogCompiled(logPath) {
  if (!existsSync(logPath)) {
    return;
  }
  const content = readFileSync(logPath, "utf8");
  const lines = content.split(/\r?\n/);
  const errorLines = lines.filter((line) =>
    /error CS\d+|Scripts have compiler errors|Compilation failed/.test(line)
  );
  if (errorLines.length > 0) {
    throw new Error(`Unity reported compiler errors:\n${errorLines.join("\n")}`);
  }
}

const SMOKE_SOURCE = `using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Unity.VisualScripting;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace BantworksMCPFixture
{
    [Serializable]
    public sealed class ForbiddenFixtureUnit : Unit
    {
        protected override void Definition() { }
    }

    public static class BanterVisualScriptingSmoke
    {
        private const string GraphPath = "Assets/BantworksFixtures/BantworksOnGrabFixture.asset";

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
            public Diagnostic[] diagnostics;
        }

        [Serializable]
        private sealed class Diagnostic
        {
            public string message;
        }

        [Serializable]
        private sealed class SmokeMarker
        {
            public bool success;
            public bool graphImported;
            public bool attachmentPersisted;
            public bool positiveValidationPassed;
            public bool negativeValidationRejected;
            public bool recoveryValidationPassed;
            public string unityVersion;
            public string banterVersion;
            public string banterSource;
        }

        public static void Run()
        {
            try
            {
                SmokeMarker marker = RunAssertions();
                marker.success = true;
                File.WriteAllText(
                    Path.Combine(Directory.GetParent(Application.dataPath).FullName, "banter-vs-smoke.json"),
                    JsonUtility.ToJson(marker, true));
                Debug.Log("[BANTWORKS FIXTURE] Banter Visual Scripting smoke passed");
            }
            catch (Exception error)
            {
                Debug.LogException(error);
                throw;
            }
        }

        private static SmokeMarker RunAssertions()
        {
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            var graph = AssetDatabase.LoadAssetAtPath<ScriptGraphAsset>(GraphPath);
            Assert(graph != null, "BANTWORKS-generated ScriptGraphAsset did not import");

            string graphValidationId = ExecuteCommand(new BridgeCommand {
                type = "validate_vs_graph_asset",
                assetPath = GraphPath
            });
            GraphValidationResult graphValidation = ReadResult<GraphValidationResult>(
                "vs-validation-results", graphValidationId);
            Assert(graphValidation.success, "Graph import validation failed: " + graphValidation.error);
            Assert(graphValidation.assetType == typeof(ScriptGraphAsset).FullName,
                "Graph imported as an unexpected asset type");
            Assert(graphValidation.nodeCount == 1 && graphValidation.missingElementCount == 0,
                "Generated graph did not resolve exactly one node");
            Assert(graphValidation.elementTypes.Contains("Banter.VisualScripting.OnGrab"),
                "Generated graph did not resolve Banter.VisualScripting.OnGrab");

            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var target = new GameObject("BanterFixtureTarget");
            var machine = target.AddComponent<ScriptMachine>();
            ExecuteCommand(new BridgeCommand {
                type = "set_asset_reference",
                objectPath = target.name,
                componentType = typeof(ScriptMachine).FullName,
                propertyName = "nest.macro",
                assetPath = GraphPath,
                expectedAssetType = typeof(ScriptGraphAsset).FullName
            });
            Assert(machine.nest.macro == graph, "ScriptMachine did not retain the generated graph");

            const string scenePath = "Assets/BantworksFixtures/BanterFixture.unity";
            Assert(EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), scenePath),
                "Could not save the Banter fixture scene");
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
            machine = GameObject.Find("BanterFixtureTarget").GetComponent<ScriptMachine>();
            Assert(machine.nest.macro == graph, "ScriptMachine attachment did not survive scene reload");

            BanterValidationResult positive = RunBanterValidation();
            AssertBanterValidatorReady(positive);
            Assert(positive.success && positive.validationPassed,
                "Banter rejected the generated OnGrab graph: " + positive.error);

            const string forbiddenPath = "Assets/BantworksFixtures/ForbiddenFixture.asset";
            var forbiddenGraph = ScriptableObject.CreateInstance<ScriptGraphAsset>();
            forbiddenGraph.graph.units.Add(new ForbiddenFixtureUnit());
            AssetDatabase.CreateAsset(forbiddenGraph, forbiddenPath);
            AssetDatabase.SaveAssets();
            AssetDatabase.ImportAsset(forbiddenPath, ImportAssetOptions.ForceSynchronousImport);

            BanterValidationResult negative = RunBanterValidation();
            AssertBanterValidatorReady(negative);
            Assert(!negative.success && !negative.validationPassed,
                "Banter unexpectedly accepted the forbidden fixture Unit");
            Assert(negative.diagnostics != null && negative.diagnostics.Any(entry =>
                    entry != null && !string.IsNullOrEmpty(entry.message) &&
                    entry.message.IndexOf(typeof(ForbiddenFixtureUnit).FullName, StringComparison.Ordinal) >= 0),
                "Banter rejection did not identify the forbidden fixture Unit");

            Assert(AssetDatabase.DeleteAsset(forbiddenPath), "Could not remove the forbidden fixture graph");
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            BanterValidationResult recovery = RunBanterValidation();
            AssertBanterValidatorReady(recovery);
            Assert(recovery.success && recovery.validationPassed,
                "Banter validation did not recover after deleting the forbidden graph: " + recovery.error);

            var package = UnityEditor.PackageManager.PackageInfo.GetAllRegisteredPackages()
                .FirstOrDefault(item => item.name == "com.sidequest.banter");
            Assert(package != null, "Unity Package Manager did not register com.sidequest.banter");
            return new SmokeMarker {
                graphImported = true,
                attachmentPersisted = true,
                positiveValidationPassed = true,
                negativeValidationRejected = true,
                recoveryValidationPassed = true,
                unityVersion = Application.unityVersion,
                banterVersion = package.version,
                banterSource = package.source.ToString()
            };
        }

        private static BanterValidationResult RunBanterValidation()
        {
            string id = ExecuteCommand(new BridgeCommand { type = "validate_banter_visual_scripting" });
            return ReadResult<BanterValidationResult>("banter-validation-results", id);
        }

        private static void AssertBanterValidatorReady(BanterValidationResult result)
        {
            Assert(result.validatorAvailable, "Banter validator was unavailable: " + result.error);
            Assert(result.validationCompleted, "Banter validator did not complete: " + result.error);
            Assert(result.validatorAssembly == "Banter.SDKEditor", "Unexpected Banter validator assembly");
        }

        private static string ExecuteCommand(BridgeCommand command)
        {
            command.id = Guid.NewGuid().ToString();
            command.timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            string projectRoot = Directory.GetParent(Application.dataPath).FullName;
            string commandFolder = Path.Combine(projectRoot, ".bantworks-mcp", "commands");
            string resultPath = Path.Combine(
                projectRoot, ".bantworks-mcp", "state", "command-results", command.id + ".json");
            Directory.CreateDirectory(commandFolder);
            File.WriteAllText(
                Path.Combine(commandFolder, command.id + ".json"),
                JsonUtility.ToJson(command, true));

            MethodInfo process = typeof(BantworksMCP.BantworksMCPBridge).GetMethod(
                "ProcessCommands", BindingFlags.Static | BindingFlags.NonPublic);
            Assert(process != null, "Could not reflect the bridge command processor");
            process.Invoke(null, null);
            Assert(File.Exists(resultPath), "Bridge did not publish a correlated command result");
            CommandResult result = JsonUtility.FromJson<CommandResult>(File.ReadAllText(resultPath));
            Assert(result.success, "Bridge command failed: " + result.error);
            return command.id;
        }

        private static T ReadResult<T>(string folder, string commandId)
        {
            string path = Path.Combine(
                Directory.GetParent(Application.dataPath).FullName,
                ".bantworks-mcp", "state", folder, commandId + ".json");
            Assert(File.Exists(path), "Bridge did not publish specialized result: " + path);
            return JsonUtility.FromJson<T>(File.ReadAllText(path));
        }

        private static void Assert(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }
    }
}
`;

export async function runBanterVsSmoke(options = {}) {
  const unityEditorPath = resolveUnityEditorPath(
    options.unityEditorPath,
    options.autoDetectUnity ?? false,
    options.expectedUnityVersion ?? DEFAULT_EXPECTED_UNITY_VERSION
  );

  const banterPackageReference =
    options.banterPackageReference ?? DEFAULT_BANTER_PACKAGE_REFERENCE;
  const expectedBanterVersion = options.expectedBanterVersion ?? DEFAULT_EXPECTED_BANTER_VERSION;
  const expectedUnityVersion = options.expectedUnityVersion ?? DEFAULT_EXPECTED_UNITY_VERSION;
  const visualScriptingVersion =
    options.visualScriptingVersion ?? DEFAULT_VISUAL_SCRIPTING_VERSION;
  const testFrameworkVersion =
    options.testFrameworkVersion ?? DEFAULT_TEST_FRAMEWORK_VERSION;
  const resultPath = options.resultPath ? path.resolve(options.resultPath) : null;
  const keepFixture = Boolean(options.keepFixture);
  const allowUnityVersionMismatch = Boolean(options.allowUnityVersionMismatch);

  if (!existsSync(unityEditorPath)) {
    throw new Error(`Unity Editor was not found: ${unityEditorPath}`);
  }
  if (
    !/^https:\/\/github\.com\/SideQuestVR\/BanterSDK\.git#[0-9a-fA-F]{40}$/.test(
      banterPackageReference
    )
  ) {
    throw new Error(
      "BanterPackageReference must pin a 40-character commit from the public SideQuestVR/BanterSDK Git package."
    );
  }
  if (
    expectedBanterVersion &&
    !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(expectedBanterVersion)
  ) {
    throw new Error("ExpectedBanterVersion must be an exact semantic version.");
  }
  if (
    expectedUnityVersion &&
    !/^\d+\.\d+\.\d+[a-z]\d+$/.test(expectedUnityVersion)
  ) {
    throw new Error("ExpectedUnityVersion must be an exact Unity editor version.");
  }
  for (const pkgVer of [visualScriptingVersion, testFrameworkVersion]) {
    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(pkgVer)) {
      throw new Error(`Unity package versions must be exact semantic versions: ${pkgVer}`);
    }
  }

  const expectedRevision = banterPackageReference
    .slice(banterPackageReference.lastIndexOf("#") + 1)
    .toLowerCase();
  const startedAtUtc = new Date();

  const tempRoot = path.resolve(os.tmpdir());
  const fixtureId = crypto.randomUUID().replace(/-/g, "");
  const projectPath = path.join(tempRoot, `bantworks-unity-banter-vs-${fixtureId}`);
  const createLog = path.join(tempRoot, `bantworks-unity-banter-vs-${fixtureId}-create.log`);
  const resolveLog = path.join(tempRoot, `bantworks-unity-banter-vs-${fixtureId}-resolve.log`);
  const smokeLog = path.join(tempRoot, `bantworks-unity-banter-vs-${fixtureId}-smoke.log`);
  const generatorLog = path.join(tempRoot, `bantworks-unity-banter-vs-${fixtureId}-generator.log`);

  try {
    mkdirSync(projectPath, { recursive: true });

    // Step 1: Create project
    invokeUnity(
      unityEditorPath,
      ["-batchmode", "-nographics", "-quit", "-createProject", projectPath, "-logFile", createLog],
      createLog
    );

    // Step 2: Update Packages/manifest.json
    const manifestPath = path.join(projectPath, "Packages", "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.dependencies = manifest.dependencies || {};
    manifest.dependencies["com.unity.visualscripting"] = visualScriptingVersion;
    manifest.dependencies["com.unity.test-framework"] = testFrameworkVersion;
    manifest.dependencies["com.sidequest.banter"] = banterPackageReference;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

    // Step 3: Resolve packages
    invokeUnity(
      unityEditorPath,
      [
        "-batchmode",
        "-nographics",
        "-quit",
        "-accept-apiupdate",
        "-projectPath",
        projectPath,
        "-logFile",
        resolveLog,
      ],
      resolveLog
    );
    assertUnityLogCompiled(resolveLog);

    // Step 4: Build TypeScript MCP server
    const buildResult = spawnSync("npm", ["run", "build"], {
      cwd: repoRoot,
      stdio: "pipe",
      encoding: "utf8",
    });
    if (buildResult.status !== 0) {
      throw new Error(
        `The BANTWORKS TypeScript build failed before fixture generation:\n${
          buildResult.stderr || buildResult.stdout
        }`
      );
    }

    // Step 5: Generate fixture graph
    const fixtureWriterScript = path.join(repoRoot, "scripts", "write-banter-vs-fixture.mjs");
    const genResult = spawnSync(process.execPath, [fixtureWriterScript, projectPath], {
      cwd: repoRoot,
      stdio: "pipe",
      encoding: "utf8",
    });
    writeFileSync(generatorLog, (genResult.stdout || "") + (genResult.stderr || ""), "utf8");
    if (genResult.status !== 0) {
      throw new Error(`BANTWORKS graph generation failed:\n${readFileSync(generatorLog, "utf8")}`);
    }

    // Step 6: Install BanterMCPBridge.cs and BanterVisualScriptingSmoke.cs
    const editorDir = path.join(projectPath, "Assets", "Editor");
    mkdirSync(editorDir, { recursive: true });
    copyFileSync(
      path.join(repoRoot, "unity-extension", "Editor", "BanterMCPBridge.cs"),
      path.join(editorDir, "BanterMCPBridge.cs")
    );
    writeFileSync(path.join(editorDir, "BanterVisualScriptingSmoke.cs"), SMOKE_SOURCE, "utf8");

    // Step 7: Execute smoke test in Unity
    invokeUnity(
      unityEditorPath,
      [
        "-batchmode",
        "-nographics",
        "-quit",
        "-accept-apiupdate",
        "-projectPath",
        projectPath,
        "-executeMethod",
        "BantworksMCPFixture.BanterVisualScriptingSmoke.Run",
        "-logFile",
        smokeLog,
      ],
      smokeLog
    );
    assertUnityLogCompiled(smokeLog);

    // Step 8: Verify smoke marker
    const markerPath = path.join(projectPath, "banter-vs-smoke.json");
    if (!existsSync(markerPath)) {
      throw new Error(
        "Unity completed without publishing the Banter Visual Scripting smoke marker."
      );
    }
    const marker = JSON.parse(readFileSync(markerPath, "utf8"));
    for (const field of [
      "success",
      "graphImported",
      "attachmentPersisted",
      "positiveValidationPassed",
      "negativeValidationRejected",
      "recoveryValidationPassed",
    ]) {
      if (marker[field] !== true) {
        throw new Error(`Banter Visual Scripting smoke marker did not report ${field}=true.`);
      }
    }

    // Step 9: Verify packages-lock.json
    const lockPath = path.join(projectPath, "Packages", "packages-lock.json");
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    const banterLock = lock.dependencies?.["com.sidequest.banter"];
    if (!banterLock) {
      throw new Error("packages-lock.json did not contain com.sidequest.banter.");
    }
    if (String(banterLock.hash).toLowerCase() !== expectedRevision) {
      throw new Error(
        `Banter resolved revision '${banterLock.hash}' instead of '${expectedRevision}'.`
      );
    }
    if (expectedBanterVersion && String(marker.banterVersion) !== expectedBanterVersion) {
      throw new Error(
        `Banter package metadata reported '${marker.banterVersion}' instead of '${expectedBanterVersion}'.`
      );
    }
    if (
      expectedUnityVersion &&
      !allowUnityVersionMismatch &&
      String(marker.unityVersion) !== expectedUnityVersion
    ) {
      throw new Error(
        `Unity reported '${marker.unityVersion}' instead of '${expectedUnityVersion}'.`
      );
    }

    const visualScriptingLock = lock.dependencies?.["com.unity.visualscripting"];
    if (!visualScriptingLock || String(visualScriptingLock.version) !== visualScriptingVersion) {
      throw new Error(
        `Visual Scripting resolved '${visualScriptingLock?.version}' instead of '${visualScriptingVersion}'.`
      );
    }

    const testFrameworkLock = lock.dependencies?.["com.unity.test-framework"];
    if (!testFrameworkLock || String(testFrameworkLock.version) !== testFrameworkVersion) {
      throw new Error(
        `Test Framework resolved '${testFrameworkLock?.version}' instead of '${testFrameworkVersion}'.`
      );
    }

    const completedAtUtc = new Date();
    const durationSeconds = Math.round((completedAtUtc.getTime() - startedAtUtc.getTime()) / 1000 * 1000) / 1000;

    const evidence = {
      schemaVersion: 1,
      success: true,
      startedAtUtc: startedAtUtc.toISOString(),
      completedAtUtc: completedAtUtc.toISOString(),
      durationSeconds,
      unity: {
        version: String(marker.unityVersion),
        editorPath: path.resolve(unityEditorPath),
      },
      packages: {
        banter: {
          packageId: "com.sidequest.banter",
          version: String(marker.banterVersion),
          source: String(marker.banterSource),
          revision: expectedRevision,
          requested: banterPackageReference,
        },
        visualScripting: {
          packageId: "com.unity.visualscripting",
          version: String(visualScriptingLock.version),
        },
        testFramework: {
          packageId: "com.unity.test-framework",
          version: String(testFrameworkLock.version),
        },
      },
      checks: {
        graphImported: Boolean(marker.graphImported),
        attachmentPersisted: Boolean(marker.attachmentPersisted),
        positiveValidationPassed: Boolean(marker.positiveValidationPassed),
        negativeValidationRejected: Boolean(marker.negativeValidationRejected),
        recoveryValidationPassed: Boolean(marker.recoveryValidationPassed),
      },
    };

    if (resultPath) {
      writeJsonAtomically(resultPath, evidence);
    }

    console.log("Unity Banter Visual Scripting smoke passed:");
    console.log(`  Unity ${marker.unityVersion}`);
    console.log(`  Banter ${marker.banterVersion} (${expectedRevision})`);

    return evidence;
  } finally {
    if (keepFixture) {
      console.log(`Kept disposable fixture: ${projectPath}`);
    } else {
      if (existsSync(projectPath)) {
        const resolvedProject = path.resolve(projectPath);
        const requiredPrefix = path.join(tempRoot, "bantworks-unity-banter-vs-");
        if (!resolvedProject.startsWith(requiredPrefix)) {
          throw new Error(`Refusing to remove unexpected fixture path: ${resolvedProject}`);
        }
        rmSync(resolvedProject, { recursive: true, force: true });
      }
      for (const log of [createLog, resolveLog, smokeLog, generatorLog]) {
        if (existsSync(log)) {
          try {
            rmSync(log, { force: true });
          } catch {
            // ignore
          }
        }
      }
    }
  }
}

function parseCliArgs(argv) {
  const options = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--unity-editor-path" || arg === "-u" || arg === "-UnityEditorPath") {
      options.unityEditorPath = argv[++i];
    } else if (arg === "--auto-detect-unity" || arg === "-AutoDetectUnity") {
      options.autoDetectUnity = true;
    } else if (arg === "--banter-package-reference" || arg === "-BanterPackageReference") {
      options.banterPackageReference = argv[++i];
    } else if (arg === "--expected-banter-version" || arg === "-ExpectedBanterVersion") {
      options.expectedBanterVersion = argv[++i];
    } else if (arg === "--expected-unity-version" || arg === "-ExpectedUnityVersion") {
      options.expectedUnityVersion = argv[++i];
    } else if (arg === "--visual-scripting-version" || arg === "-VisualScriptingVersion") {
      options.visualScriptingVersion = argv[++i];
    } else if (arg === "--test-framework-version" || arg === "-TestFrameworkVersion") {
      options.testFrameworkVersion = argv[++i];
    } else if (arg === "--result-path" || arg === "-ResultPath") {
      options.resultPath = argv[++i];
    } else if (arg === "--keep-fixture" || arg === "--keep-fixtures" || arg === "-KeepFixture") {
      options.keepFixture = true;
    } else if (arg === "--allow-unity-version-mismatch") {
      options.allowUnityVersionMismatch = true;
    } else if (arg === "--help" || arg === "-h" || arg === "-Help") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/smoke-unity-banter-vs.mjs [options]

Runs an end-to-end Unity Visual Scripting smoke test against Banter SDK.

Options:
  --unity-editor-path, -u <path>      Path to Unity Editor binary
  --auto-detect-unity                 Opt-in auto-detection of installed Unity Hub Editor
  --banter-package-reference <ref>    Git package URL#commit (default: Banter SDK 3.2.2)
  --expected-banter-version <ver>     Expected semver reported by package (default: 3.2.2)
  --expected-unity-version <ver>      Expected Unity Editor version (default: 6000.3.2f1)
  --allow-unity-version-mismatch      Allow running with a different installed Unity version
  --visual-scripting-version <ver>    Visual Scripting package version (default: 1.9.9)
  --test-framework-version <ver>      Test Framework package version (default: 1.6.0)
  --result-path <path>                Path to save atomic JSON evidence report
  --keep-fixture                      Keep disposable Unity fixture folder and logs
  --help, -h                          Show this help message
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  let cliOptions;
  try {
    cliOptions = parseCliArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (cliOptions.help) {
    printHelp();
    process.exit(0);
  }

  runBanterVsSmoke(cliOptions).catch((err) => {
    console.error(`Smoke test failed: ${err.message}`);
    process.exit(1);
  });
}
