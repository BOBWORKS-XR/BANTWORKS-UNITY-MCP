[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$UnityEditorPath,

    [Parameter(Mandatory = $true)]
    [string]$ProjectPath,

    [string]$AssetPackagePath,
    [string]$BanterRevision,
    [int]$Seed = 314159,
    [ValidateRange(60, 3600)]
    [int]$UnityTimeoutSeconds = 300,
    [switch]$RunTests,
    [switch]$OpenEditor
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$FixtureRoot = Join-Path $RepoRoot "compatibility\obstacle-course"
$BridgeSource = Join-Path $RepoRoot "unity-extension\Editor\BanterMCPBridge.cs"
$GraphWriter = Join-Path $PSScriptRoot "write-obstacle-course-vs-fixture.mjs"
$ProjectPath = [System.IO.Path]::GetFullPath($ProjectPath).TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar,
    [System.IO.Path]::AltDirectorySeparatorChar)
$UnityEditorPath = [System.IO.Path]::GetFullPath($UnityEditorPath)
$ProjectMarkerPath = Join-Path $ProjectPath ".bantworks-obstacle-project.json"
$AssetMarkerPath = Join-Path $ProjectPath ".bantworks-obstacle-assets.json"
$ResultPath = Join-Path $ProjectPath "bantworks-obstacle-course.json"
$VisualScriptingResultPath = Join-Path $ProjectPath "bantworks-obstacle-visual-scripting.json"
$LogFolder = Join-Path $ProjectPath "BantworksLogs"

if (-not (Test-Path -LiteralPath $UnityEditorPath -PathType Leaf)) {
    throw "Unity Editor not found: $UnityEditorPath"
}
if (-not (Test-Path -LiteralPath $FixtureRoot -PathType Container)) {
    throw "Obstacle-course fixture source not found: $FixtureRoot"
}
if (-not (Test-Path -LiteralPath $BridgeSource -PathType Leaf)) {
    throw "BANTWORKS bridge source not found: $BridgeSource"
}
if (-not (Test-Path -LiteralPath $GraphWriter -PathType Leaf)) {
    throw "Visual Scripting fixture writer not found: $GraphWriter"
}
if ($AssetPackagePath) {
    $AssetPackagePath = [System.IO.Path]::GetFullPath($AssetPackagePath)
    if (-not (Test-Path -LiteralPath $AssetPackagePath -PathType Leaf)) {
        throw "Asset package not found: $AssetPackagePath"
    }
}

function Invoke-Unity {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$LogPath,

        [int]$TimeoutSeconds = $UnityTimeoutSeconds
    )

    Write-Host "Unity: $([System.IO.Path]::GetFileName((Split-Path -Parent (Split-Path -Parent $UnityEditorPath))))"
    Write-Host "Log: $LogPath"
    $argumentString = ($Arguments | ForEach-Object {
        if ($_ -match '[\s"]') {
            '"' + ($_ -replace '"', '\"') + '"'
        } else {
            $_
        }
    }) -join ' '
    $process = Start-Process `
        -FilePath $UnityEditorPath `
        -ArgumentList $argumentString `
        -NoNewWindow `
        -PassThru
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
        $rootProcessId = $process.Id
        Stop-UnityProcessTree -RootProcessId $rootProcessId
        Start-Sleep -Milliseconds 250
        Stop-ProjectBanterLink

        $logText = if (Test-Path -LiteralPath $LogPath) {
            Get-Content -LiteralPath $LogPath -Raw
        } else {
            ""
        }
        if ($logText -match 'Batchmode quit successfully invoked - shutting down!') {
            Write-Warning ((
                    "Unity completed the batch operation but did not exit within {0} seconds. " +
                    "Stopped only process tree {1}; the caller will verify the stage artifact."
                ) -f $TimeoutSeconds, $rootProcessId)
            return
        }

        $tail = if ($logText) {
            (($logText -split "`r?`n") | Select-Object -Last 100) -join [Environment]::NewLine
        } else {
            "Unity did not create its requested log file."
        }
        throw "Unity exceeded $TimeoutSeconds seconds without a successful shutdown marker.`n$tail"
    }
    $exitCode = $process.ExitCode
    Stop-ProjectBanterLink
    if ($exitCode -ne 0) {
        $tail = if (Test-Path -LiteralPath $LogPath) {
            (Get-Content -LiteralPath $LogPath -Tail 100) -join [Environment]::NewLine
        } else {
            "Unity did not create its requested log file."
        }
        throw "Unity exited with code $exitCode.`n$tail"
    }
}

function Stop-UnityProcessTree {
    param(
        [Parameter(Mandatory = $true)]
        [int]$RootProcessId
    )

    $allProcesses = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue)
    $pending = [System.Collections.Generic.Queue[int]]::new()
    $descendants = [System.Collections.Generic.List[int]]::new()
    $pending.Enqueue($RootProcessId)
    while ($pending.Count -gt 0) {
        $parentId = $pending.Dequeue()
        foreach ($child in $allProcesses | Where-Object { $_.ParentProcessId -eq $parentId }) {
            $childId = [int]$child.ProcessId
            $pending.Enqueue($childId)
            $descendants.Add($childId)
        }
    }

    for ($index = $descendants.Count - 1; $index -ge 0; $index--) {
        Stop-Process -Id $descendants[$index] -Force -ErrorAction SilentlyContinue
    }
    Stop-Process -Id $RootProcessId -Force -ErrorAction SilentlyContinue
}

function Stop-ProjectBanterLink {
    $projectPrefix = $ProjectPath + [System.IO.Path]::DirectorySeparatorChar
    $processes = Get-CimInstance Win32_Process -Filter "Name='banter-link.exe'" |
        Where-Object {
            $_.ExecutablePath -and
            [System.IO.Path]::GetFullPath($_.ExecutablePath).StartsWith(
                $projectPrefix,
                [System.StringComparison]::OrdinalIgnoreCase)
    }

    foreach ($banterProcess in $processes) {
        Stop-Process -Id $banterProcess.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Add-ManifestDependency {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Dependencies,

        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$Version
    )

    $existing = $Dependencies.PSObject.Properties[$Name]
    if ($null -eq $existing) {
        $Dependencies | Add-Member -NotePropertyName $Name -NotePropertyValue $Version
    } else {
        $existing.Value = $Version
    }
}

$projectExists = Test-Path -LiteralPath $ProjectPath -PathType Container
if ($projectExists -and -not (Test-Path -LiteralPath $ProjectMarkerPath -PathType Leaf)) {
    throw "Refusing to modify an existing project without the BANTWORKS obstacle marker: $ProjectPath"
}

if (-not $projectExists) {
    $parent = Split-Path -Parent $ProjectPath
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $createLog = Join-Path $env:TEMP ("bantworks-obstacle-create-" + [Guid]::NewGuid().ToString("N") + ".log")
    Invoke-Unity -Arguments @(
        "-batchmode", "-nographics", "-quit",
        "-createProject", $ProjectPath,
        "-logFile", $createLog
    ) -LogPath $createLog
}

New-Item -ItemType Directory -Path $LogFolder -Force | Out-Null
$projectVersionPath = Join-Path $ProjectPath "ProjectSettings\ProjectVersion.txt"
$projectVersionText = Get-Content -LiteralPath $projectVersionPath -Raw
if ($projectVersionText -notmatch 'm_EditorVersion:\s*([^\r\n]+)') {
    throw "Could not read Unity version from $projectVersionPath"
}
$unityVersion = $Matches[1].Trim()
$unityMajor = [int]($unityVersion.Split('.')[0])

$manifestPath = Join-Path $ProjectPath "Packages\manifest.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($null -eq $manifest.dependencies) {
    throw "Unity manifest does not contain a dependencies object: $manifestPath"
}

if ($unityMajor -ge 6000) {
    Add-ManifestDependency -Dependencies $manifest.dependencies -Name "com.unity.visualscripting" -Version "1.9.9"
    Add-ManifestDependency -Dependencies $manifest.dependencies -Name "com.unity.test-framework" -Version "1.6.0"
} else {
    Add-ManifestDependency -Dependencies $manifest.dependencies -Name "com.unity.visualscripting" -Version "1.9.4"
    Add-ManifestDependency -Dependencies $manifest.dependencies -Name "com.unity.test-framework" -Version "1.1.33"
}
if ($BanterRevision) {
    Add-ManifestDependency `
        -Dependencies $manifest.dependencies `
        -Name "com.sidequest.banter" `
        -Version ("https://github.com/SideQuestVR/BanterSDK.git#" + $BanterRevision)
}
$manifest | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $manifestPath -Encoding utf8

$fixtureDestination = Join-Path $ProjectPath "Assets\BANTWORKSCompatibility"
New-Item -ItemType Directory -Path $fixtureDestination -Force | Out-Null
$fixtureDestinationFull = [System.IO.Path]::GetFullPath($fixtureDestination).TrimEnd('\')
foreach ($fixtureFolderName in @("Runtime", "Editor", "Tests")) {
    $fixtureFolder = Join-Path $fixtureDestination $fixtureFolderName
    $fixtureFolderFull = [System.IO.Path]::GetFullPath($fixtureFolder)
    if (-not $fixtureFolderFull.StartsWith(
        $fixtureDestinationFull + [System.IO.Path]::DirectorySeparatorChar,
        [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to replace fixture folder outside the marked project: $fixtureFolderFull"
    }
    if (Test-Path -LiteralPath $fixtureFolder -PathType Container) {
        Remove-Item -LiteralPath $fixtureFolder -Recurse -Force
    }
}
Copy-Item -LiteralPath (Join-Path $FixtureRoot "Runtime") -Destination $fixtureDestination -Recurse -Force
Copy-Item -LiteralPath (Join-Path $FixtureRoot "Editor") -Destination $fixtureDestination -Recurse -Force
Copy-Item -LiteralPath (Join-Path $FixtureRoot "Tests") -Destination $fixtureDestination -Recurse -Force

$editorDestination = Join-Path $ProjectPath "Assets\Editor"
New-Item -ItemType Directory -Path $editorDestination -Force | Out-Null
Copy-Item -LiteralPath $BridgeSource -Destination (Join-Path $editorDestination "BantworksMCPBridge.cs") -Force

$projectMarker = [ordered]@{
    schemaVersion = 1
    unityVersion = $unityVersion
    seed = $Seed
    banterRevision = $BanterRevision
    sourceRepository = "https://github.com/BOBWORKS-XR/CREATOR-WORKS-UNITY-MCP"
}
$projectMarker | ConvertTo-Json | Set-Content -LiteralPath $ProjectMarkerPath -Encoding utf8

$resolveLog = Join-Path $LogFolder "01-resolve-and-compile.log"
Invoke-Unity -Arguments @(
    "-batchmode", "-nographics", "-quit", "-accept-apiupdate",
    "-projectPath", $ProjectPath,
    "-logFile", $resolveLog
) -LogPath $resolveLog

if ($AssetPackagePath) {
    $assetHash = (Get-FileHash -LiteralPath $AssetPackagePath -Algorithm SHA256).Hash
    $assetAlreadyImported = $false
    if (Test-Path -LiteralPath $AssetMarkerPath -PathType Leaf) {
        $assetMarker = Get-Content -LiteralPath $AssetMarkerPath -Raw | ConvertFrom-Json
        $assetAlreadyImported = $assetMarker.sha256 -eq $assetHash
    }

    if (-not $assetAlreadyImported) {
        $importLog = Join-Path $LogFolder "02-import-assets.log"
        Invoke-Unity -Arguments @(
            "-batchmode", "-nographics", "-quit", "-accept-apiupdate",
            "-projectPath", $ProjectPath,
            "-importPackage", $AssetPackagePath,
            "-logFile", $importLog
        ) -LogPath $importLog

        [ordered]@{
            package = $AssetPackagePath
            sha256 = $assetHash
        } | ConvertTo-Json | Set-Content -LiteralPath $AssetMarkerPath -Encoding utf8
    }
}

$buildLog = Join-Path $LogFolder "03-build-course.log"
Invoke-Unity -Arguments @(
    "-batchmode", "-nographics", "-quit", "-accept-apiupdate",
    "-projectPath", $ProjectPath,
    "-executeMethod", "Bantworks.Compatibility.Editor.CompatibilityCourseBuilder.BuildFromCommandLine",
    "-bantworksCourseSeed", $Seed,
    "-logFile", $buildLog
) -LogPath $buildLog

if (-not (Test-Path -LiteralPath $ResultPath -PathType Leaf)) {
    throw "Unity completed without writing the obstacle-course report: $ResultPath"
}
$result = Get-Content -LiteralPath $ResultPath -Raw | ConvertFrom-Json
if ($result.success -ne $true) {
    throw "Obstacle-course build failed: $($result.error)"
}
if ($AssetPackagePath -and $result.importedDressingCount -lt 1) {
    throw "The asset package imported, but the course did not instantiate any matching dressing prefabs."
}

& npm --prefix $RepoRoot run build
if ($LASTEXITCODE -ne 0) {
    throw "The BANTWORKS TypeScript build failed before Visual Scripting fixture generation."
}
$visualScriptingMode = if ($BanterRevision) { "banter" } else { "unity" }
$generatorLog = Join-Path $LogFolder "04-generate-visual-scripting.log"
& node $GraphWriter $ProjectPath $visualScriptingMode *> $generatorLog
if ($LASTEXITCODE -ne 0) {
    $generatorOutput = if (Test-Path -LiteralPath $generatorLog) {
        (Get-Content -LiteralPath $generatorLog) -join [Environment]::NewLine
    } else {
        "The graph writer did not create its requested log file."
    }
    throw "BANTWORKS Visual Scripting graph generation failed:`n$generatorOutput"
}

$visualScriptingLog = Join-Path $LogFolder "05-validate-visual-scripting.log"
Invoke-Unity -Arguments @(
    "-batchmode", "-nographics", "-quit", "-accept-apiupdate",
    "-projectPath", $ProjectPath,
    "-executeMethod", "Bantworks.Compatibility.Editor.VisualScriptingCompatibilityValidator.RunFromCommandLine",
    "-bantworksBanterVisualScripting", [bool]$BanterRevision,
    "-logFile", $visualScriptingLog
) -LogPath $visualScriptingLog

if (-not (Test-Path -LiteralPath $VisualScriptingResultPath -PathType Leaf)) {
    throw "Unity completed without writing the Visual Scripting report: $VisualScriptingResultPath"
}
$visualScriptingResult = Get-Content -LiteralPath $VisualScriptingResultPath -Raw | ConvertFrom-Json
foreach ($field in @("success", "graphImported", "bridgeRoundTripPassed", "attachmentPersisted")) {
    if ($visualScriptingResult.$field -ne $true) {
        throw "Visual Scripting compatibility report did not record $field=true."
    }
}
if ($BanterRevision -and (
    $visualScriptingResult.banterValidatorAvailable -ne $true -or
    $visualScriptingResult.banterValidationPassed -ne $true)) {
    throw "The Banter fixture did not pass the SDK Visual Scripting validator."
}

if ($RunTests) {
    $testLog = Join-Path $LogFolder "06-playmode-tests.log"
    $testResults = Join-Path $LogFolder "playmode-results.xml"
    Invoke-Unity -Arguments @(
        "-batchmode", "-nographics", "-accept-apiupdate",
        "-projectPath", $ProjectPath,
        "-runTests", "-testPlatform", "PlayMode",
        "-testResults", $testResults,
        "-logFile", $testLog
    ) -LogPath $testLog

    if (-not (Test-Path -LiteralPath $testResults -PathType Leaf)) {
        throw "Unity Test Framework did not write results: $testResults"
    }
    [xml]$testDocument = Get-Content -LiteralPath $testResults -Raw
    $testRun = $testDocument.'test-run'
    if ($null -eq $testRun -or [int]$testRun.failed -ne 0 -or [int]$testRun.passed -lt 1) {
        throw "Obstacle-course Play Mode tests did not pass. See $testResults"
    }
}

Write-Host "Obstacle course ready: $ProjectPath"
Write-Host "Unity: $unityVersion"
Write-Host "Scene: $($result.scenePath)"
Write-Host "Imported dressing prefabs: $($result.importedDressingCount)"
Write-Host "Banter synced objects: $($result.banterSyncedObjectCount)"
Write-Host "Visual Scripting graph: $($visualScriptingResult.expectedNodeType)"
Write-Host "Bridge graph persistence: $($visualScriptingResult.attachmentPersisted)"

if ($OpenEditor) {
    Start-Process -FilePath $UnityEditorPath -ArgumentList @("-projectPath", $ProjectPath)
}
