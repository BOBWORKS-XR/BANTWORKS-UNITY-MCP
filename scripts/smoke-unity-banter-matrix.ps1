param(
    [string]$UnityEditorPath = "C:\Program Files\Unity\Hub\Editor\6000.3.2f1\Editor\Unity.exe",
    [string]$MatrixPath,
    [string[]]$EntryId,
    [string]$OutputPath,
    [switch]$KeepFixtures
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not $MatrixPath) {
    $MatrixPath = Join-Path $RepoRoot "compatibility\banter-sdk-release-matrix.json"
}
if (-not $OutputPath) {
    $Timestamp = [System.DateTimeOffset]::UtcNow.ToString("yyyyMMddTHHmmssZ")
    $OutputPath = Join-Path $RepoRoot "artifacts\banter-sdk-matrix-$Timestamp.json"
}

function Assert-ExactPackageVersion([string]$Value, [string]$FieldName) {
    if ($Value -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
        throw "$FieldName must be an exact semantic version: '$Value'"
    }
}

function Write-JsonAtomically([string]$Path, $Value) {
    $ResolvedPath = [System.IO.Path]::GetFullPath($Path)
    $Parent = Split-Path -Parent $ResolvedPath
    if ($Parent) {
        New-Item -ItemType Directory -Path $Parent -Force | Out-Null
    }
    $TemporaryPath = $ResolvedPath + ".tmp-" + [System.Guid]::NewGuid().ToString("N")
    [System.IO.File]::WriteAllText(
        $TemporaryPath,
        ($Value | ConvertTo-Json -Depth 30),
        [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::Move($TemporaryPath, $ResolvedPath, $true)
}

if (-not (Test-Path -LiteralPath $UnityEditorPath -PathType Leaf)) {
    throw "Unity Editor was not found: $UnityEditorPath"
}
if (-not (Test-Path -LiteralPath $MatrixPath -PathType Leaf)) {
    throw "Banter SDK matrix was not found: $MatrixPath"
}

$Matrix = Get-Content -LiteralPath $MatrixPath -Raw | ConvertFrom-Json
if ($Matrix.schemaVersion -ne 1) {
    throw "Unsupported Banter SDK matrix schema version: $($Matrix.schemaVersion)"
}
if ($Matrix.source.repository -ne "https://github.com/SideQuestVR/BanterSDK.git") {
    throw "The matrix repository must be the public SideQuestVR/BanterSDK Git package."
}
if ($Matrix.source.packageId -ne "com.sidequest.banter") {
    throw "The matrix package ID must be com.sidequest.banter."
}

$RemoteTagLines = @(& git ls-remote --tags $Matrix.source.repository)
if ($LASTEXITCODE -ne 0) {
    throw "Could not read public Banter SDK release tags from $($Matrix.source.repository)."
}
$RemoteTags = @{}
foreach ($Line in $RemoteTagLines) {
    if ($Line -match '^([0-9a-f]{40})\s+refs/tags/(.+?)(\^\{\})?$') {
        $TagName = $Matches[2]
        $IsPeeledTag = -not [string]::IsNullOrEmpty($Matches[3])
        if ($IsPeeledTag -or -not $RemoteTags.ContainsKey($TagName)) {
            $RemoteTags[$TagName] = $Matches[1]
        }
    }
}

$Entries = @($Matrix.entries)
if ($Entries.Count -eq 0) {
    throw "The Banter SDK matrix has no entries."
}
$KnownIds = @{}
foreach ($Entry in $Entries) {
    if ([string]::IsNullOrWhiteSpace($Entry.id) -or $Entry.id -notmatch '^[a-z0-9][a-z0-9.-]+$') {
        throw "Matrix entry IDs must be stable lowercase identifiers: '$($Entry.id)'"
    }
    if ($KnownIds.ContainsKey($Entry.id)) {
        throw "Duplicate Banter SDK matrix entry ID: $($Entry.id)"
    }
    $KnownIds[$Entry.id] = $true
    Assert-ExactPackageVersion $Entry.releaseTag "releaseTag"
    Assert-ExactPackageVersion $Entry.packageVersion "packageVersion"
    Assert-ExactPackageVersion $Entry.visualScriptingVersion "visualScriptingVersion"
    Assert-ExactPackageVersion $Entry.testFrameworkVersion "testFrameworkVersion"
    if ($Entry.releaseTag -ne $Entry.packageVersion) {
        throw "Entry '$($Entry.id)' releaseTag and packageVersion must match."
    }
    if ($Entry.revision -notmatch '^[0-9a-f]{40}$') {
        throw "Entry '$($Entry.id)' must pin a lowercase 40-character commit."
    }
    if (-not $RemoteTags.ContainsKey($Entry.releaseTag)) {
        throw "Public Banter SDK release tag '$($Entry.releaseTag)' was not found."
    }
    if ($RemoteTags[$Entry.releaseTag] -ne $Entry.revision) {
        throw "Public Banter SDK release tag '$($Entry.releaseTag)' resolves to '$($RemoteTags[$Entry.releaseTag])', not '$($Entry.revision)'."
    }
    if ($Entry.unityVersion -notmatch '^\d+\.\d+\.\d+[a-z]\d+$') {
        throw "Entry '$($Entry.id)' must name an exact Unity editor version."
    }
    if ($Entry.expectedOutcome -notin @("passed", "package-compilation-failed")) {
        throw "Entry '$($Entry.id)' has an unsupported expectedOutcome: '$($Entry.expectedOutcome)'"
    }
    $ExpectedDiagnosticCodes = @(
        $Entry.expectedDiagnosticCodes |
            Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }
    )
    if ($Entry.expectedOutcome -eq "package-compilation-failed" -and $ExpectedDiagnosticCodes.Count -eq 0) {
        throw "Entry '$($Entry.id)' must name expected compiler diagnostic codes."
    }
    foreach ($DiagnosticCode in $ExpectedDiagnosticCodes) {
        if ($DiagnosticCode -notmatch '^CS\d{4}$') {
            throw "Entry '$($Entry.id)' has an invalid compiler diagnostic code: '$DiagnosticCode'"
        }
    }
}

if ($EntryId.Count -gt 0) {
    $UnknownIds = @($EntryId | Where-Object { -not $KnownIds.ContainsKey($_) })
    if ($UnknownIds.Count -gt 0) {
        throw "Unknown Banter SDK matrix entry ID(s): $($UnknownIds -join ', ')"
    }
    $SelectedEntries = @($Entries | Where-Object { $EntryId -contains $_.id })
} else {
    $SelectedEntries = $Entries
}

$RunStartedAtUtc = [System.DateTimeOffset]::UtcNow
$Results = [System.Collections.Generic.List[object]]::new()
$SmokeScript = Join-Path $PSScriptRoot "smoke-unity-banter-vs.ps1"
$TempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())

foreach ($Entry in $SelectedEntries) {
    Write-Host "Running Banter SDK matrix entry: $($Entry.id)"
    $EntryStartedAtUtc = [System.DateTimeOffset]::UtcNow
    $EntryResultPath = Join-Path $TempRoot ("bantworks-banter-matrix-result-" + [System.Guid]::NewGuid().ToString("N") + ".json")
    try {
        $SmokeArguments = @{
            UnityEditorPath = $UnityEditorPath
            BanterPackageReference = "$($Matrix.source.repository)#$($Entry.revision)"
            ExpectedBanterVersion = [string]$Entry.packageVersion
            ExpectedUnityVersion = [string]$Entry.unityVersion
            VisualScriptingVersion = [string]$Entry.visualScriptingVersion
            TestFrameworkVersion = [string]$Entry.testFrameworkVersion
            ResultPath = $EntryResultPath
            KeepFixture = $KeepFixtures
        }
        & $SmokeScript @SmokeArguments
        if (-not (Test-Path -LiteralPath $EntryResultPath -PathType Leaf)) {
            throw "The fixture did not publish its evidence file."
        }
        $Evidence = Get-Content -LiteralPath $EntryResultPath -Raw | ConvertFrom-Json
        if ($Evidence.success -ne $true) {
            throw "The fixture evidence did not report success."
        }
        $ExpectationMatched = $Entry.expectedOutcome -eq "passed"
        $Results.Add([ordered]@{
            id = [string]$Entry.id
            releaseTag = [string]$Entry.releaseTag
            expectedOutcome = [string]$Entry.expectedOutcome
            observedOutcome = "passed"
            expectationMatched = $ExpectationMatched
            evidence = $Evidence
        })
        if (-not $ExpectationMatched) {
            Write-Error "Banter SDK matrix entry '$($Entry.id)' passed but expected '$($Entry.expectedOutcome)'." -ErrorAction Continue
        }
    }
    catch {
        $CompletedAtUtc = [System.DateTimeOffset]::UtcNow
        $ErrorMessage = $_.Exception.Message
        $ObservedOutcome = if ($ErrorMessage -match '^Unity reported compiler errors:') {
            "package-compilation-failed"
        } else {
            "fixture-failed"
        }
        $DiagnosticCodes = @(
            [System.Text.RegularExpressions.Regex]::Matches($ErrorMessage, 'error (CS\d{4})') |
                ForEach-Object { $_.Groups[1].Value } |
                Sort-Object -Unique
        )
        $MissingDiagnosticCodes = @(
            $Entry.expectedDiagnosticCodes |
                Where-Object {
                    -not [string]::IsNullOrWhiteSpace([string]$_) -and
                    $DiagnosticCodes -notcontains $_
                }
        )
        $ExpectationMatched = (
            $ObservedOutcome -eq $Entry.expectedOutcome -and
            $MissingDiagnosticCodes.Count -eq 0
        )
        $Results.Add([ordered]@{
            id = [string]$Entry.id
            releaseTag = [string]$Entry.releaseTag
            expectedOutcome = [string]$Entry.expectedOutcome
            observedOutcome = $ObservedOutcome
            expectationMatched = $ExpectationMatched
            diagnosticCodes = $DiagnosticCodes
            missingExpectedDiagnosticCodes = $MissingDiagnosticCodes
            startedAtUtc = $EntryStartedAtUtc.ToString("o")
            completedAtUtc = $CompletedAtUtc.ToString("o")
            durationSeconds = [Math]::Round(($CompletedAtUtc - $EntryStartedAtUtc).TotalSeconds, 3)
            error = $ErrorMessage
        })
        if ($ExpectationMatched) {
            Write-Host "Observed expected outcome for '$($Entry.id)': $ObservedOutcome"
        } else {
            Write-Error "Banter SDK matrix entry '$($Entry.id)' mismatch: expected '$($Entry.expectedOutcome)', observed '$ObservedOutcome'." -ErrorAction Continue
        }
    }
    finally {
        Remove-Item -LiteralPath $EntryResultPath -Force -ErrorAction SilentlyContinue
    }
}

$RunCompletedAtUtc = [System.DateTimeOffset]::UtcNow
$MatchedCount = @($Results | Where-Object { $_.expectationMatched -eq $true }).Count
$MismatchedCount = $Results.Count - $MatchedCount
$ObservedPassedCount = @($Results | Where-Object { $_.observedOutcome -eq "passed" }).Count
$ObservedCompatibilityFailureCount = @(
    $Results | Where-Object { $_.observedOutcome -eq "package-compilation-failed" }
).Count
$Report = [ordered]@{
    schemaVersion = 1
    success = ($MismatchedCount -eq 0)
    startedAtUtc = $RunStartedAtUtc.ToString("o")
    completedAtUtc = $RunCompletedAtUtc.ToString("o")
    durationSeconds = [Math]::Round(($RunCompletedAtUtc - $RunStartedAtUtc).TotalSeconds, 3)
    matrixPath = [System.IO.Path]::GetFullPath($MatrixPath)
    remoteTagsVerified = $true
    selectionPolicy = [string]$Matrix.selectionPolicy
    selectedCount = $SelectedEntries.Count
    matchedCount = $MatchedCount
    mismatchedCount = $MismatchedCount
    observedPassedCount = $ObservedPassedCount
    observedCompatibilityFailureCount = $ObservedCompatibilityFailureCount
    results = $Results
}
Write-JsonAtomically $OutputPath $Report
Write-Host "Banter SDK matrix report: $([System.IO.Path]::GetFullPath($OutputPath))"
Write-Host "Banter SDK matrix result: $MatchedCount matched, $MismatchedCount mismatched"

if ($MismatchedCount -gt 0) {
    throw "$MismatchedCount Banter SDK matrix expectation or expectations were not met. See $OutputPath"
}
