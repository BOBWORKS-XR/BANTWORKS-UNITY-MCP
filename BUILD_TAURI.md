# Building the Tauri Desktop App

The Tauri launcher provides a native desktop GUI for managing Banter MCP projects.

## Prerequisites

1. **Install Rust** (required for Tauri):
   ```powershell
   # Download and run rustup-init.exe from:
   # https://rustup.rs/

   # Or use winget:
   winget install Rustlang.Rustup
   ```

2. **Restart your terminal** after installing Rust

3. **Verify installation:**
   ```powershell
   rustc --version
   cargo --version
   ```

## Building the App

```powershell
cd C:\tools\banter-mcp\launcher

# Install Tauri CLI
cargo install tauri-cli

# Build release version
cargo tauri build
```

The built executable will be at:
```
launcher\src-tauri\target\release\banter-mcp-launcher.exe
```

## Development Mode

For development with hot-reload:
```powershell
cargo tauri dev
```

## What the App Does

- **Manage multiple Unity projects** as "channels"
- **One-click switching** between projects
- **Auto-configure Claude Code** (~/.claude.json)
- **Install Unity extension** with one click
- **Shows extension status** for each project

## Alternative: PowerShell Setup

If you don't want to install Rust, use the PowerShell script instead:
```powershell
.\setup.bat
```
Or:
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```
