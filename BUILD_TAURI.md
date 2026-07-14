# Building the BANTWORKS MCP Launcher

The Tauri launcher provides a native Windows GUI for managing Unity scene channels and configuring BANTWORKS MCP for Codex or Claude Code.

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
launcher\src-tauri\target\release\bantworks-mcp-launcher.exe
```

Run `cargo check` before creating a release build. Building the launcher does not update an already installed copy under `%LOCALAPPDATA%`; distribute or install the newly built artifact deliberately.

## Development Mode

For development with hot-reload:
```powershell
cargo tauri dev
```

## What the App Does

- **Manage multiple Unity projects** as "channels"
- **One-click switching** between projects
- **Configure Codex** (`~/.codex/config.toml`) and Claude Code (`~/.claude.json`)
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
