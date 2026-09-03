#!/usr/bin/env bash
# Linux / macOS entry point for the Banter SDK matrix smoke test.
# Runs the cross-platform Node implementation in scripts/smoke-unity-banter-matrix.mjs.
#
# Usage:
#   ./scripts/smoke-unity-banter-matrix.sh [options]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="${SCRIPT_DIR}/smoke-unity-banter-matrix.mjs"

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

exec node "${NODE_SCRIPT}" "$@"
