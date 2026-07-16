param(
    [string]$Version = "24.17.0",
    [string]$ArchiveSha256 = "f2aa33b35b75aca5f3f7b85675a6f6423201053e9381911e64961f3bda2528ab",
    [string]$NodeExeSha256 = "c6335d08331c23d68b9f2b18adb102002d76ef150b47248e954c507e0d033664"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $repoRoot "release\runtime"
$nodePath = Join-Path $outputDirectory "node.exe"
$licensePath = Join-Path $outputDirectory "LICENSE"
$versionPath = Join-Path $outputDirectory "VERSION"

function Get-Sha256([string]$Path) {
    $stream = [System.IO.File]::OpenRead($Path)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        return ([System.BitConverter]::ToString($sha256.ComputeHash($stream))).Replace("-", "")
    }
    finally {
        $sha256.Dispose()
        $stream.Dispose()
    }
}

if ((Test-Path -LiteralPath $nodePath -PathType Leaf) -and
    (Test-Path -LiteralPath $licensePath -PathType Leaf) -and
    (Test-Path -LiteralPath $versionPath -PathType Leaf) -and
    ((Get-Content -LiteralPath $versionPath -Raw).Trim() -eq $Version) -and
    ((Get-Sha256 $nodePath) -eq $NodeExeSha256)) {
    Write-Host "Bundled Node.js runtime is already staged at $nodePath"
    exit 0
}

$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("bantworks-node-runtime-" + [guid]::NewGuid())
$archiveName = "node-v$Version-win-x64.zip"
$archivePath = Join-Path $temporaryRoot $archiveName
$extractPath = Join-Path $temporaryRoot "extract"
$downloadUrl = "https://nodejs.org/download/release/v$Version/$archiveName"

try {
    New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null
    Invoke-WebRequest -UseBasicParsing -Uri $downloadUrl -OutFile $archivePath

    $actualArchiveHash = Get-Sha256 $archivePath
    if ($actualArchiveHash -ne $ArchiveSha256) {
        throw "Node.js archive checksum mismatch. Expected $ArchiveSha256, got $actualArchiveHash."
    }

    Expand-Archive -LiteralPath $archivePath -DestinationPath $extractPath
    $distributionRoot = Join-Path $extractPath "node-v$Version-win-x64"
    $sourceNode = Join-Path $distributionRoot "node.exe"
    $sourceLicense = Join-Path $distributionRoot "LICENSE"
    if (-not (Test-Path -LiteralPath $sourceNode -PathType Leaf) -or
        -not (Test-Path -LiteralPath $sourceLicense -PathType Leaf)) {
        throw "The official Node.js archive did not contain node.exe and LICENSE."
    }

    $actualNodeHash = Get-Sha256 $sourceNode
    if ($actualNodeHash -ne $NodeExeSha256) {
        throw "Extracted node.exe checksum mismatch. Expected $NodeExeSha256, got $actualNodeHash."
    }

    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    Copy-Item -LiteralPath $sourceNode -Destination $nodePath -Force
    Copy-Item -LiteralPath $sourceLicense -Destination $licensePath -Force
    [System.IO.File]::WriteAllText($versionPath, "$Version`n", [System.Text.UTF8Encoding]::new($false))

    Write-Host "Staged Node.js v$Version runtime at $nodePath"
}
finally {
    $resolvedTemp = [System.IO.Path]::GetFullPath($temporaryRoot)
    $tempPrefix = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if ($resolvedTemp.StartsWith($tempPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $resolvedTemp).StartsWith("bantworks-node-runtime-")) {
        Remove-Item -LiteralPath $resolvedTemp -Recurse -Force -ErrorAction SilentlyContinue
    }
}
