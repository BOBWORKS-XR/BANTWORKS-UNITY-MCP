param(
    [string]$UnityEditorPath = "C:\Program Files\Unity\Hub\Editor\6000.3.10f1\Editor\Unity.exe",
    [string]$VisualScriptingVersion = "1.9.9",
    [string]$ExpectedUnityVersion = "6000.3.10f1",
    [string]$ResultPath,
    [switch]$KeepFixture
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path -LiteralPath $UnityEditorPath -PathType Leaf)) {
    throw "Unity Editor was not found: $UnityEditorPath"
}
foreach ($version in @($VisualScriptingVersion)) {
    if ($version -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
        throw "Unity package versions must be exact semantic versions: $version"
    }
}

$StartedAtUtc = [System.DateTimeOffset]::UtcNow
$TempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar)
$FixtureId = [System.Guid]::NewGuid().ToString("N")
$ProjectPath = Join-Path $TempRoot ("bantworks-unity-vs-layout-" + $FixtureId)
$CreateLog = Join-Path $TempRoot ("bantworks-unity-vs-layout-" + $FixtureId + "-create.log")
$ResolveLog = Join-Path $TempRoot ("bantworks-unity-vs-layout-" + $FixtureId + "-resolve.log")
$SmokeLog = Join-Path $TempRoot ("bantworks-unity-vs-layout-" + $FixtureId + "-smoke.log")
$GeneratorLog = Join-Path $TempRoot ("bantworks-unity-vs-layout-" + $FixtureId + "-generator.log")

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

try {
    New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
    Invoke-Unity -Arguments @(
        "-batchmode", "-nographics", "-quit",
        "-createProject", $ProjectPath,
        "-logFile", $CreateLog
    ) -LogPath $CreateLog

    $ManifestPath = Join-Path $ProjectPath "Packages\manifest.json"
    $Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
    if ($null -eq $Manifest.dependencies.PSObject.Properties["com.unity.visualscripting"]) {
        $Manifest.dependencies | Add-Member `
            -NotePropertyName "com.unity.visualscripting" `
            -NotePropertyValue $VisualScriptingVersion
    } else {
        $Manifest.dependencies."com.unity.visualscripting" = $VisualScriptingVersion
    }
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
    & node (Join-Path $PSScriptRoot "write-vs-layout-fixture.mjs") $ProjectPath *> $GeneratorLog
    if ($LASTEXITCODE -ne 0) {
        throw "BANTWORKS graph generation failed:`n$((Get-Content -LiteralPath $GeneratorLog) -join [Environment]::NewLine)"
    }

    $EditorPath = Join-Path $ProjectPath "Assets\Editor"
    New-Item -ItemType Directory -Path $EditorPath -Force | Out-Null
    $SmokeSource = @'
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Unity.VisualScripting;
using UnityEditor;
using UnityEngine;

namespace BantworksMCPFixture
{
    public static class SpatialLayoutSmoke
    {
        private const string GraphPath = "Assets/BantworksFixtures/BantworksSpatialLayoutProbe.asset";

        [Serializable]
        private sealed class ExpectedFile { public ExpectedUnit[] units; }

        [Serializable]
        private sealed class ExpectedUnit
        {
            public string type;
            public float x;
            public float y;
        }

        [Serializable]
        private sealed class Result
        {
            public bool success;
            public bool graphImported;
            public bool positionsPersisted;
            public bool explicitPositionPreserved;
            public bool topologyOrdered;
            public bool distinctPositions;
            public string unityVersion;
            public int unitCount;
        }

        public static void Run()
        {
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            var graph = AssetDatabase.LoadAssetAtPath<ScriptGraphAsset>(GraphPath);
            Assert(graph != null, "BANTWORKS-generated ScriptGraphAsset did not import");

            string root = Directory.GetParent(Application.dataPath).FullName;
            var expected = JsonUtility.FromJson<ExpectedFile>(
                File.ReadAllText(Path.Combine(root, "vs-layout-expected.json")));
            var units = graph.graph.units.ToArray();
            Assert(units.Length == 3, "Expected exactly three imported units");
            Assert(expected != null && expected.units != null && expected.units.Length == units.Length,
                "Expected-position sidecar did not describe every unit");

            var actualByType = units.ToDictionary(unit => unit.GetType().FullName, unit => unit.position);
            foreach (ExpectedUnit item in expected.units)
            {
                Assert(actualByType.TryGetValue(item.type, out Vector2 actual),
                    "Imported graph did not contain " + item.type);
                Assert(Approximately(actual.x, item.x) && Approximately(actual.y, item.y),
                    item.type + " position changed during Unity import");
                Assert(Approximately(actual.x % 24f, 0f) && Approximately(actual.y % 24f, 0f),
                    item.type + " was not aligned to the requested 24-pixel grid");
            }

            Vector2 start = actualByType["Unity.VisualScripting.Start"];
            Vector2 literal = actualByType["Unity.VisualScripting.Literal"];
            Vector2 setter = actualByType["Unity.VisualScripting.SetVariable"];
            bool explicitPreserved = Approximately(start.x, -720f) && Approximately(start.y, 144f);
            bool ordered = setter.x > start.x && setter.x > literal.x;
            bool distinct = units.Select(unit => unit.position).Distinct().Count() == units.Length;
            Assert(explicitPreserved, "The authored Start position was not preserved");
            Assert(ordered, "The connected consumer was not placed after its producers");
            Assert(distinct, "Unity imported two or more units at the same position");

            var result = new Result {
                success = true,
                graphImported = true,
                positionsPersisted = true,
                explicitPositionPreserved = explicitPreserved,
                topologyOrdered = ordered,
                distinctPositions = distinct,
                unityVersion = Application.unityVersion,
                unitCount = units.Length
            };
            File.WriteAllText(Path.Combine(root, "vs-layout-smoke.json"), JsonUtility.ToJson(result, true));
            Debug.Log("[BANTWORKS FIXTURE] Visual Scripting spatial layout smoke passed");
        }

        private static bool Approximately(float a, float b) => Mathf.Abs(a - b) < 0.01f;

        private static void Assert(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }
    }
}
'@
    [System.IO.File]::WriteAllText(
        (Join-Path $EditorPath "SpatialLayoutSmoke.cs"),
        $SmokeSource,
        [System.Text.UTF8Encoding]::new($false))

    Invoke-Unity -Arguments @(
        "-batchmode", "-nographics", "-quit", "-accept-apiupdate",
        "-projectPath", $ProjectPath,
        "-executeMethod", "BantworksMCPFixture.SpatialLayoutSmoke.Run",
        "-logFile", $SmokeLog
    ) -LogPath $SmokeLog
    Assert-UnityLogCompiled $SmokeLog

    $MarkerPath = Join-Path $ProjectPath "vs-layout-smoke.json"
    if (-not (Test-Path -LiteralPath $MarkerPath -PathType Leaf)) {
        throw "Unity completed without writing the Visual Scripting spatial-layout marker."
    }
    $Marker = Get-Content -LiteralPath $MarkerPath -Raw | ConvertFrom-Json
    foreach ($field in @(
        "success", "graphImported", "positionsPersisted", "explicitPositionPreserved",
        "topologyOrdered", "distinctPositions")) {
        if ($Marker.$field -ne $true) {
            throw "Visual Scripting spatial-layout marker did not report $field=true."
        }
    }
    if ($ExpectedUnityVersion -and [string]$Marker.unityVersion -ne $ExpectedUnityVersion) {
        throw "Unity reported '$($Marker.unityVersion)' instead of '$ExpectedUnityVersion'."
    }

    $Lock = Get-Content -LiteralPath (Join-Path $ProjectPath "Packages\packages-lock.json") -Raw | ConvertFrom-Json
    $VisualScriptingLock = $Lock.dependencies.PSObject.Properties["com.unity.visualscripting"].Value
    if ($null -eq $VisualScriptingLock -or [string]$VisualScriptingLock.version -ne $VisualScriptingVersion) {
        throw "Visual Scripting resolved '$($VisualScriptingLock.version)' instead of '$VisualScriptingVersion'."
    }

    $CompletedAtUtc = [System.DateTimeOffset]::UtcNow
    $Evidence = [ordered]@{
        schemaVersion = 1
        success = $true
        startedAtUtc = $StartedAtUtc.ToString("o")
        completedAtUtc = $CompletedAtUtc.ToString("o")
        durationSeconds = [Math]::Round(($CompletedAtUtc - $StartedAtUtc).TotalSeconds, 3)
        unityVersion = [string]$Marker.unityVersion
        visualScriptingVersion = $VisualScriptingVersion
        graphImported = [bool]$Marker.graphImported
        positionsPersisted = [bool]$Marker.positionsPersisted
        explicitPositionPreserved = [bool]$Marker.explicitPositionPreserved
        topologyOrdered = [bool]$Marker.topologyOrdered
        distinctPositions = [bool]$Marker.distinctPositions
        unitCount = [int]$Marker.unitCount
        projectPath = $ProjectPath
        logs = [ordered]@{
            create = $CreateLog
            resolve = $ResolveLog
            generator = $GeneratorLog
            smoke = $SmokeLog
        }
    }
    $EvidenceJson = $Evidence | ConvertTo-Json -Depth 10
    if ($ResultPath) {
        $ResultPath = [System.IO.Path]::GetFullPath($ResultPath)
        New-Item -ItemType Directory -Path (Split-Path -Parent $ResultPath) -Force | Out-Null
        [System.IO.File]::WriteAllText($ResultPath, $EvidenceJson, [System.Text.UTF8Encoding]::new($false))
    }
    Write-Host $EvidenceJson
} finally {
    if (-not $KeepFixture -and (Test-Path -LiteralPath $ProjectPath)) {
        Remove-Item -LiteralPath $ProjectPath -Recurse -Force
    }
}
