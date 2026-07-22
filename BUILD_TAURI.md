# Building the BANTWORKS MCP Launcher

The Tauri launcher provides a native Windows GUI for discovering Unity projects, installing the bridge, and configuring BANTWORKS MCP for Codex or Claude Code.

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
Set-Location <path-to-bantworks-mcp>
npm ci
npm run release:launcher

# Install Tauri CLI
cargo install tauri-cli --version "^2"

# Build release version
Set-Location launcher
cargo tauri build
```

The built executable will be at:
```
launcher\src-tauri\target\release\bantworks-mcp-launcher.exe
```

The build runs the standalone server bundle and smoke test, downloads the pinned official Node.js 24.17.0 Windows x64 archive, verifies the archive and extracted executable hashes, and packages the private runtime with the server, Unity bridge, `LICENSE`, and `THIRD_PARTY_NOTICES.md`. The launcher resolves those installed resources dynamically and does not require a `C:/tools/banter-mcp` checkout or system Node.js installation.

Run `cargo fmt --check` and `cargo test` in `launcher/src-tauri` before creating a release build. Building the launcher does not update an already installed copy under `%LOCALAPPDATA%`; distribute or install the newly built artifact deliberately.

Version tags matching `v<package version>` run the release workflow. It creates draft NSIS/MSI installers and a standalone Node 20+ ZIP. Version metadata must agree across `package.json`, the MCP handshake, Cargo, and Tauri configuration; verify it with `npm run check:version`.

## Windows Signing

The repository does not contain an Authenticode certificate or signing secrets. Local builds and the default release workflow are therefore unsigned and may trigger **Unknown publisher** or Microsoft Defender SmartScreen warnings. Before broad public distribution, sign the launcher and installer artifacts with the publisher's code-signing certificate and a trusted timestamp, then verify them with `Get-AuthenticodeSignature`. Continue publishing `SHA256SUMS.txt`; checksums verify artifact integrity but do not establish publisher identity.

## Development Mode

For development with hot-reload:
```powershell
cargo tauri dev
```

## What the App Does

- **Discover Unity Hub projects** and select a project folder directly
- **Set up a first project and detected clients** in one action
- **Manage and switch between multiple Unity projects**
- **Configure Codex** (`~/.codex/config.toml`) and Claude Code (`~/.claude.json`)
- **Install or update the Unity bridge** and show live readiness status
- **Use a private packaged Node.js runtime** for launcher-managed clients

## Alternative: PowerShell Setup

If you don't want to install Rust, use the PowerShell script instead:
```powershell
.\setup.bat
```
Or:
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```
