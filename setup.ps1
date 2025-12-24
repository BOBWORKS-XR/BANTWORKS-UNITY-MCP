# Banter MCP Setup Script
# Run this in PowerShell to configure your projects

param(
    [switch]$Install,
    [switch]$AddProject,
    [switch]$ListProjects,
    [switch]$SetActive,
    [switch]$Help
)

$ConfigPath = "$env:APPDATA\banter-mcp\config.json"
$ClaudeConfigPath = "$env:USERPROFILE\.claude.json"
$MCPRoot = "C:\tools\banter-mcp"

function Ensure-ConfigDir {
    $configDir = Split-Path $ConfigPath
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
}

function Load-Config {
    Ensure-ConfigDir
    if (Test-Path $ConfigPath) {
        return Get-Content $ConfigPath | ConvertFrom-Json
    }
    return @{
        channels = @()
        active_channel_id = $null
        mcp_server_path = "$MCPRoot\dist\index.js"
    }
}

function Save-Config($config) {
    Ensure-ConfigDir
    $config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath
}

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "       Banter MCP Configuration        " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    $config = Load-Config

    if ($config.channels.Count -eq 0) {
        Write-Host "  No projects configured yet." -ForegroundColor Yellow
    } else {
        Write-Host "  Your Projects:" -ForegroundColor Green
        Write-Host ""
        for ($i = 0; $i -lt $config.channels.Count; $i++) {
            $channel = $config.channels[$i]
            $marker = if ($channel.id -eq $config.active_channel_id) { "[ACTIVE]" } else { "        " }
            $color = if ($channel.id -eq $config.active_channel_id) { "Green" } else { "White" }
            Write-Host "  $($i + 1). $marker $($channel.name)" -ForegroundColor $color
            Write-Host "              $($channel.unity_project_path)" -ForegroundColor DarkGray
        }
    }

    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [A] Add new project"
    Write-Host "  [S] Set active project"
    Write-Host "  [R] Remove a project"
    Write-Host "  [C] Apply to Claude Code"
    Write-Host "  [E] Install Unity Extension"
    Write-Host "  [Q] Quit"
    Write-Host ""
}

function Add-Project {
    Write-Host ""
    Write-Host "Add New Project" -ForegroundColor Cyan
    Write-Host "---------------"

    $name = Read-Host "Project name"
    if ([string]::IsNullOrWhiteSpace($name)) {
        Write-Host "Cancelled." -ForegroundColor Yellow
        return
    }

    $path = Read-Host "Unity project path (e.g., E:\unity\MyProject)"
    if ([string]::IsNullOrWhiteSpace($path)) {
        Write-Host "Cancelled." -ForegroundColor Yellow
        return
    }

    # Validate path
    if (-not (Test-Path $path)) {
        Write-Host "Error: Path does not exist!" -ForegroundColor Red
        return
    }

    if (-not (Test-Path "$path\Assets")) {
        Write-Host "Error: Not a valid Unity project (no Assets folder)!" -ForegroundColor Red
        return
    }

    $config = Load-Config

    $newChannel = @{
        id = [guid]::NewGuid().ToString()
        name = $name
        unity_project_path = $path
        enabled = $true
    }

    $config.channels += $newChannel

    # If first project, make it active
    if ($config.channels.Count -eq 1) {
        $config.active_channel_id = $newChannel.id
    }

    Save-Config $config
    Write-Host "Project added successfully!" -ForegroundColor Green
}

function Set-ActiveProject {
    $config = Load-Config

    if ($config.channels.Count -eq 0) {
        Write-Host "No projects to select!" -ForegroundColor Yellow
        return
    }

    Write-Host ""
    $selection = Read-Host "Enter project number to activate"

    try {
        $index = [int]$selection - 1
        if ($index -ge 0 -and $index -lt $config.channels.Count) {
            $config.active_channel_id = $config.channels[$index].id
            Save-Config $config
            Write-Host "Active project set to: $($config.channels[$index].name)" -ForegroundColor Green
        } else {
            Write-Host "Invalid selection!" -ForegroundColor Red
        }
    } catch {
        Write-Host "Invalid input!" -ForegroundColor Red
    }
}

function Remove-Project {
    $config = Load-Config

    if ($config.channels.Count -eq 0) {
        Write-Host "No projects to remove!" -ForegroundColor Yellow
        return
    }

    Write-Host ""
    $selection = Read-Host "Enter project number to remove"

    try {
        $index = [int]$selection - 1
        if ($index -ge 0 -and $index -lt $config.channels.Count) {
            $removedId = $config.channels[$index].id
            $removedName = $config.channels[$index].name

            $config.channels = @($config.channels | Where-Object { $_.id -ne $removedId })

            if ($config.active_channel_id -eq $removedId) {
                $config.active_channel_id = if ($config.channels.Count -gt 0) { $config.channels[0].id } else { $null }
            }

            Save-Config $config
            Write-Host "Removed: $removedName" -ForegroundColor Green
        } else {
            Write-Host "Invalid selection!" -ForegroundColor Red
        }
    } catch {
        Write-Host "Invalid input!" -ForegroundColor Red
    }
}

function Apply-ToClaudeCode {
    $config = Load-Config

    if (-not $config.active_channel_id) {
        Write-Host "No active project selected!" -ForegroundColor Yellow
        return
    }

    $activeChannel = $config.channels | Where-Object { $_.id -eq $config.active_channel_id }

    if (-not $activeChannel) {
        Write-Host "Active channel not found!" -ForegroundColor Red
        return
    }

    # Load or create Claude config
    $claudeConfig = if (Test-Path $ClaudeConfigPath) {
        Get-Content $ClaudeConfigPath | ConvertFrom-Json
    } else {
        @{}
    }

    # Ensure mcpServers exists
    if (-not $claudeConfig.mcpServers) {
        $claudeConfig | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue @{} -Force
    }

    # Add/update banter MCP
    $claudeConfig.mcpServers | Add-Member -NotePropertyName "banter" -NotePropertyValue @{
        command = "node"
        args = @($config.mcp_server_path)
        env = @{
            UNITY_PROJECT_PATH = $activeChannel.unity_project_path
        }
    } -Force

    $claudeConfig | ConvertTo-Json -Depth 10 | Set-Content $ClaudeConfigPath

    Write-Host ""
    Write-Host "Applied to Claude Code!" -ForegroundColor Green
    Write-Host "  Project: $($activeChannel.name)" -ForegroundColor Cyan
    Write-Host "  Path: $($activeChannel.unity_project_path)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Restart Claude Code for changes to take effect." -ForegroundColor Yellow
}

function Install-UnityExtension {
    $config = Load-Config

    if (-not $config.active_channel_id) {
        Write-Host "No active project selected!" -ForegroundColor Yellow
        return
    }

    $activeChannel = $config.channels | Where-Object { $_.id -eq $config.active_channel_id }

    if (-not $activeChannel) {
        Write-Host "Active channel not found!" -ForegroundColor Red
        return
    }

    $sourcePath = "$MCPRoot\unity-extension\Editor\BanterMCPBridge.cs"
    $destDir = "$($activeChannel.unity_project_path)\Assets\Editor"
    $destPath = "$destDir\BanterMCPBridge.cs"

    if (-not (Test-Path $sourcePath)) {
        Write-Host "Source extension not found at: $sourcePath" -ForegroundColor Red
        return
    }

    # Create Editor directory if needed
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    Copy-Item $sourcePath $destPath -Force

    Write-Host ""
    Write-Host "Unity extension installed!" -ForegroundColor Green
    Write-Host "  Destination: $destPath" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Open Unity to compile the extension." -ForegroundColor Yellow
}

# Main loop
while ($true) {
    Show-Menu
    $choice = Read-Host "Select option"

    switch ($choice.ToUpper()) {
        "A" { Add-Project; Read-Host "Press Enter to continue" }
        "S" { Set-ActiveProject; Read-Host "Press Enter to continue" }
        "R" { Remove-Project; Read-Host "Press Enter to continue" }
        "C" { Apply-ToClaudeCode; Read-Host "Press Enter to continue" }
        "E" { Install-UnityExtension; Read-Host "Press Enter to continue" }
        "Q" { Write-Host "Goodbye!" -ForegroundColor Cyan; exit }
        default { Write-Host "Invalid option!" -ForegroundColor Red; Start-Sleep -Seconds 1 }
    }
}
