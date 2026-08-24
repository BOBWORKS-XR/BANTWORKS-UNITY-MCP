param(
    [string]$UnityEditorPath = "C:\Program Files\Unity\Hub\Editor\6000.3.10f1\Editor\Unity.exe",
    [string]$ShaderGraphVersion = "17.3.0",
    [string]$ExpectedUnityVersion = "6000.3.10f1",
    [string]$ResultPath,
    [switch]$KeepFixture
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath $UnityEditorPath -PathType Leaf)) {
    throw "Unity Editor was not found: $UnityEditorPath"
}
if ($ShaderGraphVersion -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
    throw "ShaderGraphVersion must be an exact semantic version."
}

$StartedAtUtc = [System.DateTimeOffset]::UtcNow
$TempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar)
$FixtureId = [System.Guid]::NewGuid().ToString("N")
$ProjectPath = Join-Path $TempRoot ("bantworks-unity-shader-graph-" + $FixtureId)
$CreateLog = Join-Path $TempRoot ("bantworks-unity-shader-graph-" + $FixtureId + "-create.log")
$ResolveLog = Join-Path $TempRoot ("bantworks-unity-shader-graph-" + $FixtureId + "-resolve.log")
$SmokeLog = Join-Path $TempRoot ("bantworks-unity-shader-graph-" + $FixtureId + "-smoke.log")

function Invoke-Unity([string[]]$Arguments, [string]$LogPath) {
    $process = Start-Process -FilePath $UnityEditorPath -ArgumentList $Arguments `
        -Wait -PassThru -NoNewWindow
    if ($process.ExitCode -ne 0) {
        $tail = if (Test-Path -LiteralPath $LogPath) {
            (Get-Content -LiteralPath $LogPath -Tail 180) -join [Environment]::NewLine
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
    if ($null -eq $Manifest.dependencies.PSObject.Properties["com.unity.shadergraph"]) {
        $Manifest.dependencies | Add-Member `
            -NotePropertyName "com.unity.shadergraph" `
            -NotePropertyValue $ShaderGraphVersion
    } else {
        $Manifest.dependencies."com.unity.shadergraph" = $ShaderGraphVersion
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

    $EditorPath = Join-Path $ProjectPath "Assets\Editor"
    New-Item -ItemType Directory -Path $EditorPath -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $RepoRoot "unity-extension\Editor\BanterMCPBridge.cs") `
        -Destination (Join-Path $EditorPath "BanterMCPBridge.cs") -Force

    $SmokeSource = @'
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using UnityEditor;
using UnityEngine;

namespace BantworksMCPFixture
{
    public static class ShaderGraphSmoke
    {
        private const string GraphPath = "Assets/BantworksFixtures/GeneratedUnlit.shadergraph";

        [Serializable]
        private sealed class Command
        {
            public string id;
            public string type;
            public string assetPath;
            public string pipeline;
            public string shaderType;
            public bool overwrite;
            public string expectedContentHash;
            public bool openInEditor;
            public int limit;
            public string nodeType;
            public bool hasPosition;
            public string sourceNodeId;
            public int sourceSlotId;
            public string destinationNodeId;
            public int destinationSlotId;
            public bool replaceExistingInput;
        }

        [Serializable]
        private sealed class Result
        {
            public bool success;
            public string error;
            public bool rolledBack;
            public bool writeAttempted;
            public bool writeCompleted;
            public Capabilities capabilities;
            public Graph graph;
            public Mutation mutation;
        }

        [Serializable]
        private sealed class Capabilities
        {
            public bool packageInstalled;
            public bool assemblyLoaded;
            public bool readSupported;
            public bool writeSupported;
            public bool createSupported;
            public bool nodeMutationSupported;
            public bool connectionSupported;
            public string packageVersion;
        }

        [Serializable]
        private sealed class Graph
        {
            public bool graphDeserialized;
            public string contentHash;
            public bool validationPassed;
            public bool hasCompileErrors;
            public int targetCount;
            public int nodeCount;
            public int edgeCount;
            public int unknownObjectCount;
            public Node[] nodes;
        }

        [Serializable]
        private sealed class Node
        {
            public string id;
            public string type;
            public bool isBlock;
            public string blockDescriptor;
            public float[] position;
            public Slot[] slots;
        }

        [Serializable]
        private sealed class Slot
        {
            public int id;
            public string direction;
        }

        [Serializable]
        private sealed class Mutation
        {
            public string nodeId;
            public string nodeType;
            public Slot[] slots;
            public bool connectionCreated;
        }

        [Serializable]
        private sealed class Marker
        {
            public bool success;
            public bool capabilitiesPassed;
            public bool createPassed;
            public bool inspectPassed;
            public bool addPassed;
            public bool connectPassed;
            public bool validatePassed;
            public bool rollbackPassed;
            public bool staleHashPassed;
            public bool occupiedInputPassed;
            public bool postWriteRollbackPassed;
            public string unityVersion;
            public string shaderGraphVersion;
            public int finalNodeCount;
            public int finalEdgeCount;
        }

        public static void Run()
        {
            Result capabilities = Execute(new Command { type = "shader_graph_capabilities" });
            Assert(capabilities.success, capabilities.error);
            Assert(capabilities.capabilities != null && capabilities.capabilities.packageInstalled,
                "Shader Graph package was not detected");
            Assert(capabilities.capabilities.assemblyLoaded && capabilities.capabilities.readSupported &&
                capabilities.capabilities.writeSupported && capabilities.capabilities.createSupported &&
                capabilities.capabilities.nodeMutationSupported && capabilities.capabilities.connectionSupported,
                "Required Shader Graph reflection capabilities were unavailable");

            Result created = Execute(new Command {
                type = "create_shader_graph",
                assetPath = GraphPath,
                pipeline = "built_in",
                shaderType = "unlit"
            });
            Assert(created.success, "Create failed: " + created.error);
            Assert(created.graph != null && created.graph.validationPassed && created.graph.targetCount == 1,
                "Created graph did not pass target/compiler validation");

            Result inspected = Execute(new Command { type = "inspect_shader_graph", assetPath = GraphPath });
            Assert(inspected.success && inspected.graph.graphDeserialized && !inspected.graph.hasCompileErrors,
                "Inspect failed: " + inspected.error);
            Node baseColor = inspected.graph.nodes.FirstOrDefault(node =>
                node.isBlock && string.Equals(node.blockDescriptor, "BaseColor", StringComparison.OrdinalIgnoreCase));
            Assert(baseColor != null, "Generated graph did not expose a BaseColor block");
            Slot baseColorInput = baseColor.slots.FirstOrDefault(slot => slot.direction == "input");
            Assert(baseColorInput != null, "BaseColor block did not expose an input slot");

            string beforeStaleMutation = Sha256(Path.Combine(ProjectRoot(), GraphPath));
            Result staleMutation = Execute(new Command {
                type = "add_shader_graph_node",
                assetPath = GraphPath,
                nodeType = "Time",
                expectedContentHash = new string('0', 64)
            });
            Assert(!staleMutation.success && !staleMutation.rolledBack,
                "Stale mutation precondition did not fail before writing");
            Assert(beforeStaleMutation == Sha256(Path.Combine(ProjectRoot(), GraphPath)),
                "Stale hash rejection changed the Shader Graph bytes");

            Result added = Execute(new Command {
                type = "add_shader_graph_node",
                assetPath = GraphPath,
                nodeType = "Time",
                expectedContentHash = inspected.graph.contentHash
            });
            Assert(added.success, "Node add failed: " + added.error);
            Assert(added.mutation != null && !string.IsNullOrEmpty(added.mutation.nodeId),
                "Node add did not return an object id");
            Slot timeOutput = added.mutation.slots.FirstOrDefault(slot => slot.direction == "output");
            Assert(timeOutput != null, "Time node did not expose an output slot");

            Result connected = Execute(new Command {
                type = "connect_shader_graph_nodes",
                assetPath = GraphPath,
                sourceNodeId = added.mutation.nodeId,
                sourceSlotId = timeOutput.id,
                destinationNodeId = baseColor.id,
                destinationSlotId = baseColorInput.id,
                expectedContentHash = added.graph.contentHash
            });
            Assert(connected.success && connected.mutation.connectionCreated,
                "Connection failed: " + connected.error);

            Result validated = Execute(new Command { type = "validate_shader_graph", assetPath = GraphPath });
            Assert(validated.success && validated.graph.validationPassed && validated.graph.edgeCount >= 1,
                "Final validation failed: " + validated.error);

            string beforeOccupiedInput = Sha256(Path.Combine(ProjectRoot(), GraphPath));
            Result occupiedInput = Execute(new Command {
                type = "connect_shader_graph_nodes",
                assetPath = GraphPath,
                sourceNodeId = added.mutation.nodeId,
                sourceSlotId = timeOutput.id,
                destinationNodeId = baseColor.id,
                destinationSlotId = baseColorInput.id,
                expectedContentHash = validated.graph.contentHash
            });
            Assert(!occupiedInput.success && occupiedInput.rolledBack,
                "Occupied input was replaced without explicit opt-in");
            Assert(beforeOccupiedInput == Sha256(Path.Combine(ProjectRoot(), GraphPath)),
                "Occupied-input rejection changed the Shader Graph bytes");

            string beforeInvalidMutation = Sha256(Path.Combine(ProjectRoot(), GraphPath));
            Result rejected = Execute(new Command {
                type = "connect_shader_graph_nodes",
                assetPath = GraphPath,
                sourceNodeId = baseColor.id,
                sourceSlotId = baseColorInput.id,
                destinationNodeId = added.mutation.nodeId,
                destinationSlotId = timeOutput.id,
                expectedContentHash = validated.graph.contentHash
            });
            string afterInvalidMutation = Sha256(Path.Combine(ProjectRoot(), GraphPath));
            Assert(!rejected.success && rejected.rolledBack,
                "Invalid reverse-direction connection was not rejected transactionally");
            Assert(beforeInvalidMutation == afterInvalidMutation,
                "Rejected mutation changed the Shader Graph bytes");

            string beforeCompileFailure = Sha256(Path.Combine(ProjectRoot(), GraphPath));
            string beforeCompileFailureMeta = Sha256(Path.Combine(ProjectRoot(), GraphPath + ".meta"));
            Result rejectedCompileFailure = Execute(new Command {
                type = "add_shader_graph_node",
                assetPath = GraphPath,
                nodeType = "Property",
                expectedContentHash = validated.graph.contentHash
            });
            Assert(!rejectedCompileFailure.success && rejectedCompileFailure.rolledBack &&
                rejectedCompileFailure.writeCompleted,
                "Unbound Property node did not fail after a completed write and roll back");
            Assert(beforeCompileFailure == Sha256(Path.Combine(ProjectRoot(), GraphPath)),
                "Post-write validation rollback did not restore Shader Graph bytes");
            Assert(beforeCompileFailureMeta == Sha256(Path.Combine(ProjectRoot(), GraphPath + ".meta")),
                "Post-write validation rollback changed Shader Graph metadata");

            var marker = new Marker {
                success = true,
                capabilitiesPassed = true,
                createPassed = true,
                inspectPassed = true,
                addPassed = true,
                connectPassed = true,
                validatePassed = true,
                rollbackPassed = true,
                staleHashPassed = true,
                occupiedInputPassed = true,
                postWriteRollbackPassed = true,
                unityVersion = Application.unityVersion,
                shaderGraphVersion = capabilities.capabilities.packageVersion,
                finalNodeCount = validated.graph.nodeCount,
                finalEdgeCount = validated.graph.edgeCount
            };
            File.WriteAllText(Path.Combine(ProjectRoot(), "shader-graph-smoke.json"), JsonUtility.ToJson(marker, true));
            Debug.Log("[BANTWORKS FIXTURE] Shader Graph smoke passed");
        }

        private static Result Execute(Command command)
        {
            command.id = Guid.NewGuid().ToString();
            string root = ProjectRoot();
            string commandFolder = Path.Combine(root, ".bantworks-mcp", "commands");
            string resultPath = Path.Combine(
                root, ".bantworks-mcp", "state", "shader-graph-results", command.id + ".json");
            Directory.CreateDirectory(commandFolder);
            File.WriteAllText(Path.Combine(commandFolder, command.id + ".json"), JsonUtility.ToJson(command, true));

            Type bridge = Type.GetType("BantworksMCP.BantworksMCPBridge, Assembly-CSharp-Editor");
            Assert(bridge != null, "Could not resolve BANTWORKS bridge type");
            MethodInfo process = bridge.GetMethod("ProcessCommands", BindingFlags.Static | BindingFlags.NonPublic);
            Assert(process != null, "Could not reflect BANTWORKS command processor");
            process.Invoke(null, null);
            Assert(File.Exists(resultPath), "Bridge did not publish Shader Graph result: " + resultPath);
            return JsonUtility.FromJson<Result>(File.ReadAllText(resultPath));
        }

        private static string ProjectRoot() => Directory.GetParent(Application.dataPath).FullName;

        private static string Sha256(string path)
        {
            using (var stream = File.OpenRead(path))
            using (var sha = SHA256.Create())
                return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "");
        }

        private static void Assert(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }
    }
}
'@
    [System.IO.File]::WriteAllText(
        (Join-Path $EditorPath "ShaderGraphSmoke.cs"),
        $SmokeSource,
        [System.Text.UTF8Encoding]::new($false))

    Invoke-Unity -Arguments @(
        "-batchmode", "-nographics", "-quit", "-accept-apiupdate",
        "-projectPath", $ProjectPath,
        "-executeMethod", "BantworksMCPFixture.ShaderGraphSmoke.Run",
        "-logFile", $SmokeLog
    ) -LogPath $SmokeLog
    Assert-UnityLogCompiled $SmokeLog

    $MarkerPath = Join-Path $ProjectPath "shader-graph-smoke.json"
    if (-not (Test-Path -LiteralPath $MarkerPath -PathType Leaf)) {
        throw "Unity completed without writing the Shader Graph smoke marker."
    }
    $Marker = Get-Content -LiteralPath $MarkerPath -Raw | ConvertFrom-Json
    foreach ($field in @(
        "success", "capabilitiesPassed", "createPassed", "inspectPassed", "addPassed",
        "connectPassed", "validatePassed", "rollbackPassed", "staleHashPassed", "occupiedInputPassed",
        "postWriteRollbackPassed")) {
        if ($Marker.$field -ne $true) {
            throw "Shader Graph smoke marker did not report $field=true."
        }
    }
    if ($ExpectedUnityVersion -and [string]$Marker.unityVersion -ne $ExpectedUnityVersion) {
        throw "Unity reported '$($Marker.unityVersion)' instead of '$ExpectedUnityVersion'."
    }
    if ([string]$Marker.shaderGraphVersion -ne $ShaderGraphVersion) {
        throw "Shader Graph reported '$($Marker.shaderGraphVersion)' instead of '$ShaderGraphVersion'."
    }

    $CompletedAtUtc = [System.DateTimeOffset]::UtcNow
    $Evidence = [ordered]@{
        schemaVersion = 1
        success = $true
        startedAtUtc = $StartedAtUtc.ToString("o")
        completedAtUtc = $CompletedAtUtc.ToString("o")
        durationSeconds = [Math]::Round(($CompletedAtUtc - $StartedAtUtc).TotalSeconds, 3)
        unityVersion = [string]$Marker.unityVersion
        shaderGraphVersion = [string]$Marker.shaderGraphVersion
        capabilitiesPassed = [bool]$Marker.capabilitiesPassed
        createPassed = [bool]$Marker.createPassed
        inspectPassed = [bool]$Marker.inspectPassed
        addPassed = [bool]$Marker.addPassed
        connectPassed = [bool]$Marker.connectPassed
        validatePassed = [bool]$Marker.validatePassed
        rollbackPassed = [bool]$Marker.rollbackPassed
        staleHashPassed = [bool]$Marker.staleHashPassed
        occupiedInputPassed = [bool]$Marker.occupiedInputPassed
        postWriteRollbackPassed = [bool]$Marker.postWriteRollbackPassed
        finalNodeCount = [int]$Marker.finalNodeCount
        finalEdgeCount = [int]$Marker.finalEdgeCount
        projectPath = $ProjectPath
        logs = [ordered]@{ create = $CreateLog; resolve = $ResolveLog; smoke = $SmokeLog }
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
