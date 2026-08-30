# Building the BANTWORKS MCP Launcher

The Tauri launcher provides a native GUI for discovering Unity projects, installing the bridge, and configuring BANTWORKS MCP for Codex or Claude Code. It builds on Windows and Linux (and macOS, with caveats around code signing).

## Prerequisites

### Windows

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

### Linux (CachyOS / Arch / Ubuntu)

1. **Install Rust and the Tauri system dependencies**:
   ```bash
   # Arch / CachyOS
   sudo pacman -S --needed rustup webkit2gtk-4.1 base-devel curl wget file libappindicator librsvg dpkg fakeroot binutils
   rustup default stable

   # Ubuntu / Debian
   sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf build-essential file
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
   ```

2. **Restart your terminal** or `source ~/.cargo/env`.

3. **Verify installation:**
   ```bash
   rustc --version
   cargo --version
   ```

## Building the App

### Windows

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

The Windows build produces NSIS and MSI installers under `launcher\src-tauri\target\release\bundle\`.

### Linux

```bash
cd <path-to-bantworks-mcp>
npm ci
npm run release:launcher

# Install Tauri CLI
cargo install tauri-cli --version "^2"

# Build release version
cd launcher
NO_STRIP=1 cargo tauri build
```

> **Note:** `NO_STRIP=1` works around a known incompatibility between the
> `strip` binary bundled inside Tauri's `linuxdeploy` AppImage and modern
> CachyOS / Arch toolchains (glibc 2.36+). The bundled `strip` does not
> recognise the `.relr.dyn` ELF section and aborts. Tauri's release binaries
> are already produced with debug info stripped by `cargo`, so the AppImage
> build is unaffected.

The bare release binary will be at:
```
launcher/src-tauri/target/release/bantworks-mcp-launcher
```

The Linux build produces `.deb` and `.rpm` packages (and an `.AppImage`) under `launcher/src-tauri/target/release/bundle/`. Bundle filenames use `BANTWORKS-MCP` (kebab-case) so they remain compatible with linuxdeploy and other downstream tooling that does not handle spaces in package names.

The build runs the standalone server bundle and smoke test, downloads the pinned official Node.js 24.17.0 archive for the host platform (Windows zip / Linux tar.xz / macOS tar.xz), verifies the archive and extracted binary hashes, and packages the private runtime with the server, Unity bridge, `LICENSE`, and `THIRD_PARTY_NOTICES.md`. The launcher resolves those installed resources dynamically and does not require a `C:/tools/banter-mcp` checkout or system Node.js installation.

Run `cargo fmt --check` and `cargo test` in `launcher/src-tauri` before creating a release build. Building the launcher does not update an already installed copy under `%LOCALAPPDATA%` / `~/.local/share`; distribute or install the newly built artifact deliberately.

Version tags matching `v<package version>` run the release workflow. It creates draft installers (NSIS/MSI on Windows, `.deb` / `.rpm` on Linux) and a standalone Node 20+ ZIP. Version metadata must agree across `package.json`, the MCP handshake, Cargo, and Tauri configuration; verify it with `npm run check:version`.

## Code Signing

The repository does not contain code-signing certificates or signing secrets. Local builds and the default release workflow are therefore unsigned and may trigger **Unknown publisher** or platform equivalent warnings (Microsoft Defender SmartScreen on Windows, browser warnings on Linux when installing `.deb`/`.AppImage` from an unknown publisher). Before broad public distribution, sign the launcher and installer artifacts with the publisher's code-signing certificate and a trusted timestamp, then verify them with `Get-AuthenticodeSignature` (Windows) or `gpg --verify` / `cosign` (Linux). Continue publishing `SHA256SUMS.txt`; checksums verify artifact integrity but do not establish publisher identity.

## Development Mode

For development with hot-reload:
```bash
cargo tauri dev
```

## What the App Does

- **Discover Unity Hub projects** and select a project folder directly
- **Set up a first project and detected clients** in one action
- **Manage and switch between multiple Unity projects**
- **Configure Codex** (`~/.codex/config.toml`) and Claude Code (`~/.claude.json`)
- **Install or update the Unity bridge** and show live readiness status
- **Use a private packaged Node.js runtime** for launcher-managed clients

## Alternative: Setup Scripts

The launcher is optional. The same configuration can be applied via the platform setup scripts, which are useful for headless environments and CI.

### Windows

```powershell
.\setup.bat
# Or
powershell -ExecutionPolicy Bypass -File setup.ps1
```

### Linux / macOS

```bash
./setup.sh                 # interactive (TODO: future)
./setup.sh install         # build/validate the MCP server bundle
./setup.sh add-project "My Project" /path/to/UnityProject
./setup.sh list-projects
./setup.sh set-active 1
./setup.sh set-profile all
./setup.sh apply-claude
./setup.sh apply-codex
./setup.sh install-bridge
./setup.sh config-path
```

The shell wrapper invokes `scripts/cli/setup.mjs` which calls into the cross-platform library at `scripts/cli/setup-lib.mjs`. The PowerShell setup script on Windows uses the same library so JSON / TOML file formats stay in sync.
