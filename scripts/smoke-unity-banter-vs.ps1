param(
    [string]$UnityEditorPath = "C:\Program Files\Unity\Hub\Editor\6000.3.2f1\Editor\Unity.exe",
    [string]$BanterPackageReference = "https://github.com/SideQuestVR/BanterSDK.git#8cff56ed80a7f694d0de204a4fa7bfc660f6d503",
    [string]$ExpectedBanterVersion = "3.2.2",
    [string]$ExpectedUnityVersion = "6000.3.2f1",
    [string]$VisualScriptingVersion = "1.9.9",
    [string]$TestFrameworkVersion = "1.6.0",
    [string]$ResultPath,
    [switch]$KeepFixture
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path -LiteralPath $UnityEditorPath -PathType Leaf)) {
    throw "Unity Editor was not found: $UnityEditorPath"
}
if ($BanterPackageReference -notmatch '^https://github\.com/SideQuestVR/BanterSDK\.git#[0-9a-fA-F]{40}$') {
    throw "BanterPackageReference must pin a 40-character commit from the public SideQuestVR/BanterSDK Git package."
}
if ($ExpectedBanterVersion -and $ExpectedBanterVersion -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
    throw "ExpectedBanterVersion must be an exact semantic version."
}
if ($ExpectedUnityVersion -and $ExpectedUnityVersion -notmatch '^\d+\.\d+\.\d+[a-z]\d+$') {
    throw "ExpectedUnityVersion must be an exact Unity editor version."
}
foreach ($packageVersion in @($VisualScriptingVersion, $TestFrameworkVersion)) {
    if ($packageVersion -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
        throw "Unity package versions must be exact semantic versions: $packageVersion"
    }
}
$ExpectedRevision = $BanterPackageReference.Substring($BanterPackageReference.LastIndexOf('#') + 1).ToLowerInvariant()
$StartedAtUtc = [System.DateTimeOffset]::UtcNow

$TempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar)
$FixtureId = [System.Guid]::NewGuid().ToString("N")
$ProjectPath = Join-Path $TempRoot ("bantworks-unity-banter-vs-" + $FixtureId)
$CreateLog = Join-Path $TempRoot ("bantworks-unity-banter-vs-" + $FixtureId + "-create.log")
$ResolveLog = Join-Path $TempRoot ("bantworks-unity-banter-vs-" + $FixtureId + "-resolve.log")
$SmokeLog = Join-Path $TempRoot ("bantworks-unity-banter-vs-" + $FixtureId + "-smoke.log")
$GeneratorLog = Join-Path $TempRoot ("bantworks-unity-banter-vs-" + $FixtureId + "-generator.log")

function Invoke-Unity([string[]]$Arguments, [string]$LogPath) {
    $process = Start-Process -FilePath $UnityEditorPath -ArgumentList $Arguments `
        -Wait -PassThru -NoNewWindow
    if ($process.ExitCode -ne 0) {
        $tail = if (Test-Path -LiteralPath $LogPath) {
            (Get-Content -LiteralPath $LogPath -Tail 160) -join [Environment]::NewLine
        } else {
            "Unity did not create a log file."
        }
        throw "Unity exited with code $($process.ExitCode).`n$tail"
    }
}

function Assert-UnityLogCompiled([string]$LogPath) {
    $errors = Select-String -LiteralPath $LogPath `
        -Pattern 'error CS\d+|Scripts have compiler errors|Compilation failed' `
        -ErrorAction SilentlyContinue
    if ($errors) {
        throw "Unity reported compiler errors:`n$($errors.Line -join [Environment]::NewLine)"
    }
}

function Set-PackageDependency($Manifest, [string]$Name, [string]$Value) {
    if ($null -eq $Manifest.dependencies.PSObject.Properties[$Name]) {
        $Manifest.dependencies | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
    } else {
        $Manifest.dependencies.$Name = $Value
    }
}

try {
    New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
    Invoke-Unity -Arguments @(
        "-batchmode", "-nographics", "-quit",
        "-createProject", $ProjectPath,
        "-logFile", $CreateLog
    ) -LogPath $CreateLog

    $ManifestPath = Join-Path $ProjectPath "Packages\manifest.json"
    $Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
    Set-PackageDependency $Manifest "com.unity.visualscripting" $VisualScriptingVersion
    # The exercised Banter package source imports NUnit but does not declare the package.
    Set-PackageDependency $Manifest "com.unity.test-framework" $TestFrameworkVersion
    Set-PackageDependency $Manifest "com.sidequest.banter" $BanterPackageReference
    [System.IO.File]::WriteAllText(
        $ManifestPath,
        ($Manifest | ConvertTo-Json -Depth 20),
        [System.Text.UTF8Encoding]::new($false))

    Invoke-Unity -Arguments @(
        "-batchmode", "-nographics", "-quit", "-accept-apiupdate",
        "-projectPath", $ProjectPath,
        "-logFile", $ResolveLog
    ) -LogPath $ResolveLog
    Assert-UnityLogCompiled $ResolveLog

    & npm --prefix $RepoRoot run build
    if ($LASTEXITCODE -ne 0) {
        throw "The BANTWORKS TypeScript build failed before fixture generation."
    }
    & node (Join-Path $PSScriptRoot "write-banter-vs-fixture.mjs") $ProjectPath *> $GeneratorLog
    if ($LASTEXITCODE -ne 0) {
        throw "BANTWORKS graph generation failed:`n$((Get-Content -LiteralPath $GeneratorLog) -join [Environment]::NewLine)"
    }

    $EditorPath = Join-Path $ProjectPath "Assets\Editor"
    New-Item -ItemType Directory -Path $EditorPath -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $RepoRoot "unity-extension\Editor\BanterMCPBridge.cs") `
        -Destination (Join-Path $EditorPath "BanterMCPBridge.cs") -Force
    Copy-Item -LiteralPath (Join-Path $RepoRoot "unity-extension\Editor\CreatorWorksMCPLogo.png") `
        -Destination (Join-Path $EditorPath "CreatorWorksMCPLogo.png") -Force

    $SmokeSource = @'
using System;
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
'@
    [System.IO.File]::WriteAllText(
        (Join-Path $EditorPath "BanterVisualScriptingSmoke.cs"),
        $SmokeSource,
        [System.Text.UTF8Encoding]::new($false))

    Invoke-Unity -Arguments @(
        "-batchmode", "-nographics", "-quit", "-accept-apiupdate",
        "-projectPath", $ProjectPath,
        "-executeMethod", "BantworksMCPFixture.BanterVisualScriptingSmoke.Run",
        "-logFile", $SmokeLog
    ) -LogPath $SmokeLog
    Assert-UnityLogCompiled $SmokeLog

    $MarkerPath = Join-Path $ProjectPath "banter-vs-smoke.json"
    if (-not (Test-Path -LiteralPath $MarkerPath -PathType Leaf)) {
        throw "Unity completed without publishing the Banter Visual Scripting smoke marker."
    }
    $Marker = Get-Content -LiteralPath $MarkerPath -Raw | ConvertFrom-Json
    foreach ($field in @(
        "success", "graphImported", "attachmentPersisted", "positiveValidationPassed",
        "negativeValidationRejected", "recoveryValidationPassed")) {
        if ($Marker.$field -ne $true) {
            throw "Banter Visual Scripting smoke marker did not report $field=true."
        }
    }

    $LockPath = Join-Path $ProjectPath "Packages\packages-lock.json"
    $Lock = Get-Content -LiteralPath $LockPath -Raw | ConvertFrom-Json
    $BanterLock = $Lock.dependencies.PSObject.Properties["com.sidequest.banter"].Value
    if ($null -eq $BanterLock) {
        throw "packages-lock.json did not contain com.sidequest.banter."
    }
    if ([string]$BanterLock.hash -ne $ExpectedRevision) {
        throw "Banter resolved revision '$($BanterLock.hash)' instead of '$ExpectedRevision'."
    }
    if ($ExpectedBanterVersion -and [string]$Marker.banterVersion -ne $ExpectedBanterVersion) {
        throw "Banter package metadata reported '$($Marker.banterVersion)' instead of '$ExpectedBanterVersion'."
    }
    if ($ExpectedUnityVersion -and [string]$Marker.unityVersion -ne $ExpectedUnityVersion) {
        throw "Unity reported '$($Marker.unityVersion)' instead of '$ExpectedUnityVersion'."
    }

    $VisualScriptingLock = $Lock.dependencies.PSObject.Properties["com.unity.visualscripting"].Value
    if ($null -eq $VisualScriptingLock -or [string]$VisualScriptingLock.version -ne $VisualScriptingVersion) {
        throw "Visual Scripting resolved '$($VisualScriptingLock.version)' instead of '$VisualScriptingVersion'."
    }
    $TestFrameworkLock = $Lock.dependencies.PSObject.Properties["com.unity.test-framework"].Value
    if ($null -eq $TestFrameworkLock -or [string]$TestFrameworkLock.version -ne $TestFrameworkVersion) {
        throw "Test Framework resolved '$($TestFrameworkLock.version)' instead of '$TestFrameworkVersion'."
    }

    $CompletedAtUtc = [System.DateTimeOffset]::UtcNow
    $Evidence = [ordered]@{
        schemaVersion = 1
        success = $true
        startedAtUtc = $StartedAtUtc.ToString("o")
        completedAtUtc = $CompletedAtUtc.ToString("o")
        durationSeconds = [Math]::Round(($CompletedAtUtc - $StartedAtUtc).TotalSeconds, 3)
        unity = [ordered]@{
            version = [string]$Marker.unityVersion
            editorPath = [System.IO.Path]::GetFullPath($UnityEditorPath)
        }
        packages = [ordered]@{
            banter = [ordered]@{
                packageId = "com.sidequest.banter"
                version = [string]$Marker.banterVersion
                source = [string]$Marker.banterSource
                revision = $ExpectedRevision
                requested = $BanterPackageReference
            }
            visualScripting = [ordered]@{
                packageId = "com.unity.visualscripting"
                version = [string]$VisualScriptingLock.version
            }
            testFramework = [ordered]@{
                packageId = "com.unity.test-framework"
                version = [string]$TestFrameworkLock.version
            }
        }
        checks = [ordered]@{
            graphImported = [bool]$Marker.graphImported
            attachmentPersisted = [bool]$Marker.attachmentPersisted
            positiveValidationPassed = [bool]$Marker.positiveValidationPassed
            negativeValidationRejected = [bool]$Marker.negativeValidationRejected
            recoveryValidationPassed = [bool]$Marker.recoveryValidationPassed
        }
    }

    if ($ResultPath) {
        $ResolvedResultPath = [System.IO.Path]::GetFullPath($ResultPath)
        $ResultParent = Split-Path -Parent $ResolvedResultPath
        if ($ResultParent) {
            New-Item -ItemType Directory -Path $ResultParent -Force | Out-Null
        }
        $TemporaryResultPath = $ResolvedResultPath + ".tmp-" + [System.Guid]::NewGuid().ToString("N")
        [System.IO.File]::WriteAllText(
            $TemporaryResultPath,
            ($Evidence | ConvertTo-Json -Depth 20),
            [System.Text.UTF8Encoding]::new($false))
        [System.IO.File]::Move($TemporaryResultPath, $ResolvedResultPath, $true)
    }

    Write-Host "Unity Banter Visual Scripting smoke passed:"
    Write-Host "  Unity $($Marker.unityVersion)"
    Write-Host "  Banter $($Marker.banterVersion) ($ExpectedRevision)"
}
finally {
    if ($KeepFixture) {
        Write-Host "Kept disposable fixture: $ProjectPath"
    } elseif (Test-Path -LiteralPath $ProjectPath) {
        $ResolvedProject = [System.IO.Path]::GetFullPath($ProjectPath).TrimEnd(
            [System.IO.Path]::DirectorySeparatorChar,
            [System.IO.Path]::AltDirectorySeparatorChar)
        $RequiredPrefix = $TempRoot + [System.IO.Path]::DirectorySeparatorChar + "bantworks-unity-banter-vs-"
        if (-not $ResolvedProject.StartsWith($RequiredPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to remove unexpected fixture path: $ResolvedProject"
        }
        Remove-Item -LiteralPath $ResolvedProject -Recurse -Force
    }
    if (-not $KeepFixture) {
        Remove-Item -LiteralPath $CreateLog, $ResolveLog, $SmokeLog, $GeneratorLog `
            -Force -ErrorAction SilentlyContinue
    }
}
