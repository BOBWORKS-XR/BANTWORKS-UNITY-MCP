$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$TestRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("bantworks-setup-smoke-" + [guid]::NewGuid())
$AppData = Join-Path $TestRoot "AppData"
$UserProfile = Join-Path $TestRoot "User"
$Project = Join-Path $TestRoot "UnityProject"
$Editor = Join-Path $Project "Assets\Editor"
$ConfigDir = Join-Path $AppData "banter-mcp"
$CodexDir = Join-Path $UserProfile ".codex"

New-Item -ItemType Directory -Path $Editor, $ConfigDir, $CodexDir -Force | Out-Null
Set-Content -LiteralPath (Join-Path $Editor "BanterMCPBridge.cs") -Value "// old bridge"
Set-Content -LiteralPath (Join-Path $CodexDir "config.toml") -Value 'model = "existing"'

$config = @{
    channels = @(@{
        id = "test"
        name = "Test"
        unity_project_path = $Project
        scene_path = $null
        enabled = $true
    })
    active_channel_id = "test"
    mcp_server_path = (Resolve-Path (Join-Path $RepoRoot "release\banter-mcp.mjs")).Path
    auto_start = $false
    enable_custom_scripts = $false
} | ConvertTo-Json -Depth 10
Set-Content -LiteralPath (Join-Path $ConfigDir "launcher-config.json") -Value $config

$PreviousAppData = $env:APPDATA
$PreviousUserProfile = $env:USERPROFILE
try {
    $env:APPDATA = $AppData
    $env:USERPROFILE = $UserProfile
    "X`n`nE`n`nQ`n" | powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "setup.ps1") | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "setup.ps1 exited with code $LASTEXITCODE"
    }

    $installedHash = (Get-FileHash (Join-Path $Editor "BanterMCPBridge.cs")).Hash
    $sourceHash = (Get-FileHash (Join-Path $RepoRoot "unity-extension\Editor\BanterMCPBridge.cs")).Hash
    if ($installedHash -ne $sourceHash) {
        throw "Bridge replacement hash mismatch"
    }

    $backups = @(Get-ChildItem (Join-Path $Project ".bantworks-mcp\backups") -Filter "BanterMCPBridge-*.cs")
    if ($backups.Count -ne 1 -or (Get-Content $backups[0].FullName -Raw) -notmatch "old bridge") {
        throw "Bridge backup was not created correctly"
    }

    $codexConfig = Get-Content (Join-Path $CodexDir "config.toml") -Raw
    if ($codexConfig -notmatch 'model = "existing"' -or $codexConfig -notmatch '\[mcp_servers\.banter\]') {
        throw "Existing Codex configuration was not preserved and updated"
    }

    $temporaryFiles = @(Get-ChildItem $TestRoot -Recurse -Force -File | Where-Object {
        $_.Name -match '^\..*\.(tmp|replace-backup)$'
    })
    if ($temporaryFiles.Count -ne 0) {
        throw "Setup left temporary files: $($temporaryFiles.FullName -join ', ')"
    }

    Write-Host "PowerShell setup smoke passed"
} finally {
    $env:APPDATA = $PreviousAppData
    $env:USERPROFILE = $PreviousUserProfile
    $resolvedTestRoot = [System.IO.Path]::GetFullPath($TestRoot)
    $resolvedTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if (-not $resolvedTestRoot.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing cleanup outside temp directory: $resolvedTestRoot"
    }
    Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force
}
