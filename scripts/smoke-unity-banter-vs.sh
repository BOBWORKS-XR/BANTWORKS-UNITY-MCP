#!/usr/bin/env bash
# Linux / macOS entry point for the Banter Visual Scripting smoke test.
# Runs the cross-platform Node implementation in scripts/smoke-unity-banter-vs.mjs.
#
# Usage:
#   ./scripts/smoke-unity-banter-vs.sh [options]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="${SCRIPT_DIR}/smoke-unity-banter-vs.mjs"

if [ ! -f "${NODE_SCRIPT}" ]; then
  echo "error: ${NODE_SCRIPT} not found." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: Node.js 18 or newer is required but 'node' was not found on PATH." >&2
  exit 1
fi

NODE_VERSION="$(node --version | sed 's/^v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"
if [ "${NODE_MAJOR}" -lt 18 ] 2>/dev/null; then
  echo "error: Node.js 18 or newer is required; found ${NODE_VERSION}." >&2
  exit 1
fi

# Unity's embedded Mono runtime on Linux intermittently crashes with:
#   Assertion `fd < sysconf(_SC_OPEN_MAX)` in ToFileDescriptor()
# when ulimit -n is set to high systemd defaults (e.g. 1048576).
# Clamping the file descriptor limit to 8192 prevents this crash.
if [ "$(ulimit -n 2>/dev/null || echo 0)" -gt 8192 ] 2>/dev/null; then
  ulimit -n 8192 2>/dev/null || true
fi

exec node "${NODE_SCRIPT}" "$@"
