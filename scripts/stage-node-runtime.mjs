#!/usr/bin/env node
// Stage a pinned Node.js runtime under release/runtime/ so the Tauri launcher
// can spawn MCP servers with a private, deterministic Node binary on every host
// platform. The legacy PowerShell version (stage-node-runtime.ps1) only handled
// Windows; this script handles Windows, Linux, and macOS.
//
// Behaviour mirrors stage-node-runtime.ps1:
//   * Re-downloads when the staged binary, license, version marker, or any
//     checksum no longer matches the requested version.
//   * Writes a VERSION marker file alongside the binary so we can detect stale
//     stages when the requested version changes.
//   * Cleans up its temporary download directory in a finally block.
//
// Usage:
//   node scripts/stage-node-runtime.mjs [--version 24.17.0] [--force]
//
// Checksum overrides (required together when staging an unpinned version):
//   STAGE_NODE_ARCHIVE_SHA256_<PLATFORM>  -- sha256 of the downloaded archive
//   STAGE_NODE_BINARY_SHA256_<PLATFORM>  -- sha256 of the extracted binary
// where <PLATFORM> is one of WIN_X64, LINUX_X64, LINUX_ARM64, DARWIN_X64,
// DARWIN_ARM64.

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(repoRoot, "release", "runtime");

const DEFAULT_VERSION = "24.17.0";

// Archive values are published in Node.js v24.17.0 SHASUMS256.txt. Unix
// binary values are derived from bin/node inside those exact verified archives.
const PINNED_CHECKSUMS = {
  "24.17.0": {
    "win-x64": {
      archiveSha256: "f2aa33b35b75aca5f3f7b85675a6f6423201053e9381911e64961f3bda2528ab",
      binarySha256: "c6335d08331c23d68b9f2b18adb102002d76ef150b47248e954c507e0d033664",
    },
    "linux-x64": {
      archiveSha256: "ab343a1b747c7cbf3630dfd7dbf818c5423fab2eb4f5ad1afc896f6bd121a917",
      binarySha256: "62d66443847de1f527f74afe715900b12884ace52136dc9cd8e91e61acc2f527",
    },
    "linux-arm64": {
      archiveSha256: "67324b9e515e7d13da72571a5dd522bb23145a820f7dde15497897e466759ab3",
      binarySha256: "4adeeca28663521e926659041cf26dbe5bded9d104316373c364a8b65ed17f03",
    },
    "darwin-x64": {
      archiveSha256: "fe50e386f6a5e0b29ce44b989e543da9fb9a80aed0b91a2f0cb19c55106921fc",
      binarySha256: "bd6cd97b046bd816399fea7893bcf6867e9ec55fd02aef3284875dd32b31e060",
    },
    "darwin-arm64": {
      archiveSha256: "cf7e9152d7bd86c140f6eccf3577abfbaf8960be1ca49d9d900e8484984dcb9a",
      binarySha256: "f5f9b9db4d95f5e0340982685f083de654c21eef9d9122cab5321081ccaa2601",
    },
  },
};

function parseArgs(argv) {
  const args = { version: DEFAULT_VERSION, force: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--version" || arg === "-v") {
      args.version = argv[++i];
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function helpText() {
  return `Usage: node scripts/stage-node-runtime.mjs [--version <semver>] [--force]

Stages a pinned Node.js runtime under release/runtime/ for the current host
platform. The bundled binary name follows platform conventions:
  Windows -> node.exe
  Linux   -> node
  macOS   -> node
`;
}

function selectPlatform() {
  if (process.platform === "win32") return { key: "win-x64", binaryName: "node.exe", archiveExtension: "zip", archiveStem: "win-x64" };
  if (process.platform === "darwin") return { key: process.arch === "arm64" ? "darwin-arm64" : "darwin-x64", binaryName: "node", archiveExtension: "tar.xz", archiveStem: process.arch === "arm64" ? "darwin-arm64" : "darwin-x64" };
  if (process.platform === "linux") return { key: process.arch === "arm64" ? "linux-arm64" : "linux-x64", binaryName: "node", archiveExtension: "tar.xz", archiveStem: process.arch === "arm64" ? "linux-arm64" : "linux-x64" };
  throw new Error(`Unsupported platform: ${process.platform}/${process.arch}`);
}

function checksumEnvKey(platformKey, kind) {
  return `STAGE_NODE_${kind}_SHA256_${platformKey.replace(/-/g, "_").toUpperCase()}`;
}

export function resolveChecksums(version, platformKey, environment = process.env) {
  const archiveEnv = checksumEnvKey(platformKey, "ARCHIVE");
  const binaryEnv = checksumEnvKey(platformKey, "BINARY");
  const pinned = PINNED_CHECKSUMS[version]?.[platformKey];
  const archiveSha256 = environment[archiveEnv] || pinned?.archiveSha256;
  const binarySha256 = environment[binaryEnv] || pinned?.binarySha256;
  if (!archiveSha256 || !binarySha256) {
    throw new Error(
      "No complete checksum pin exists for Node.js " + version + " on " + platformKey +
      ". Set both " + archiveEnv + " and " + binaryEnv + " to stage an alternate version.",
    );
  }
  return {
    archiveSha256,
    binarySha256,
    source: environment[archiveEnv] || environment[binaryEnv]
      ? archiveEnv + "/" + binaryEnv
      : "embedded pinned checksums",
  };
}

export function verifyExpectedChecksum(label, expected, actual) {
  if (!expected) {
    throw new Error("Missing expected checksum for " + label + ".");
  }
  if (actual !== expected) {
    throw new Error(
      label + " checksum mismatch. Expected " + expected + ", got " + actual + ".",
    );
  }
}
async function sha256OfFile(filePath) {
  const hash = createHash("sha256");
  const { open } = await import("node:fs/promises");
  const handle = await open(filePath, "r");
  try {
    const stream = handle.createReadStream();
    for await (const chunk of stream) {
      hash.update(chunk);
    }
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
}

async function downloadToFile(url, destination) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error(`Failed to download ${url}: empty response body`);
  }
  mkdirSync(path.dirname(destination), { recursive: true });
  await pipeline(response.body, createWriteStream(destination));
}

function extractArchive(archivePath, destination, platform) {
  mkdirSync(destination, { recursive: true });
  if (platform.archiveExtension === "zip") {
    // Use system `unzip` on Linux/macOS for portable ZIP support; on Windows
    // fall back to PowerShell's Expand-Archive which ships with the OS.
    if (process.platform === "win32") {
      const result = spawnSync("powershell", [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${destination}' -Force`,
      ], { stdio: "inherit" });
      if (result.status !== 0) {
        throw new Error(`Expand-Archive failed with exit code ${result.status}`);
      }
      return;
    }
    const result = spawnSync("unzip", ["-q", "-o", archivePath, "-d", destination], { stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error(`unzip failed with exit code ${result.status}`);
    }
    return;
  }
  if (platform.archiveExtension === "tar.xz") {
    const result = spawnSync("tar", ["-xJf", archivePath, "-C", destination], { stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error(`tar failed with exit code ${result.status}`);
    }
    return;
  }
  throw new Error(`Unsupported archive extension: ${platform.archiveExtension}`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(helpText());
    return;
  }

  const platform = selectPlatform();
  const checksums = resolveChecksums(args.version, platform.key);

  const versionFile = path.join(outputDirectory, "VERSION");
  const licenseFile = path.join(outputDirectory, "LICENSE");
  const binaryFile = path.join(outputDirectory, platform.binaryName);
  const alternateName = platform.binaryName === "node.exe" ? "node" : "node.exe";
  const alternateFile = path.join(outputDirectory, alternateName);

  if (
    !args.force &&
    existsSync(binaryFile) &&
    existsSync(alternateFile) &&
    existsSync(licenseFile) &&
    existsSync(versionFile)
  ) {
    const recordedVersion = readFileSync(versionFile, "utf8").trim();
    if (recordedVersion === args.version) {
      const actualBinaryHash = await sha256OfFile(binaryFile);
      if (!checksums.binarySha256 || actualBinaryHash === checksums.binarySha256) {
        console.log(`Bundled Node.js runtime is already staged at ${binaryFile}`);
        return;
      }
      console.log(`Bundled binary checksum drift detected (expected ${checksums.binarySha256 ?? "<none>"}, got ${actualBinaryHash}); re-staging.`);
    } else {
      console.log(`Bundled runtime version is ${recordedVersion}, requested ${args.version}; re-staging.`);
    }
  }

  const archiveStem = `node-v${args.version}-${platform.archiveStem}`;
  const archiveName = `${archiveStem}.${platform.archiveExtension}`;
  const downloadUrl = `https://nodejs.org/download/release/v${args.version}/${archiveName}`;

  const temporaryRoot = path.join(tmpdir(), `bantworks-node-runtime-${Date.now()}-${process.pid}`);
  const archivePath = path.join(temporaryRoot, archiveName);
  const extractPath = path.join(temporaryRoot, "extract");

  try {
    mkdirSync(temporaryRoot, { recursive: true });
    console.log(`Downloading ${downloadUrl}`);
    await downloadToFile(downloadUrl, archivePath);

    const actualArchiveHash = await sha256OfFile(archivePath);
    verifyExpectedChecksum("Node.js archive", checksums.archiveSha256, actualArchiveHash);

    extractArchive(archivePath, extractPath, platform);

    const distributionRoot = path.join(extractPath, archiveStem);
    // Windows ZIP archives place node.exe at the root of the distribution,
    // while Linux/macOS tarballs place it under bin/node.
    const binaryCandidates = platform.archiveExtension === "zip"
      ? [platform.binaryName]
      : [path.join("bin", platform.binaryName), platform.binaryName];
    const sourceBinary = binaryCandidates
      .map((relative) => path.join(distributionRoot, relative))
      .find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
    if (!sourceBinary) {
      throw new Error(`The official Node.js archive did not contain ${platform.binaryName} (looked in ${binaryCandidates.join(", ")}).`);
    }
    const sourceLicense = path.join(distributionRoot, "LICENSE");
    if (!existsSync(sourceLicense) || !statSync(sourceLicense).isFile()) {
      throw new Error("The official Node.js archive did not contain LICENSE.");
    }

    const actualBinaryHash = await sha256OfFile(sourceBinary);
    verifyExpectedChecksum("Extracted Node.js binary", checksums.binarySha256, actualBinaryHash);

    mkdirSync(outputDirectory, { recursive: true });
    copyFileSync(sourceBinary, binaryFile);
    // Tauri's resource map is configured for both "node" and "node.exe" so
    // the launcher can be built for either host. Write the alternate name as
    // a symlink where supported and as a copy on Windows (where symlinks need
    // developer mode or admin), so the bundle config can reference both.

    try {
      rmSync(alternateFile, { force: true });
    } catch {
      // ignore
    }
    if (process.platform === "win32") {
      copyFileSync(binaryFile, alternateFile);
    } else {
      try {
        symlinkSync(platform.binaryName, alternateFile);
      } catch {
        copyFileSync(binaryFile, alternateFile);
      }
    }
    copyFileSync(sourceLicense, licenseFile);
    writeFileSync(versionFile, `${args.version}\n`, "utf8");

    if (process.platform !== "win32") {
      chmodSync(binaryFile, 0o755);
      // The alternate may be a symlink or a copy depending on platform
      // capabilities; chmod is a no-op on symlinks (the target keeps its mode).
      try {
        chmodSync(alternateFile, 0o755);
      } catch {
        // ignore: alternate may not exist on every host platform
      }
    }

    console.log(`Staged Node.js v${args.version} runtime at ${binaryFile}`);
  } finally {
    if (existsSync(temporaryRoot)) {
      try {
        rmSync(temporaryRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      } catch (error) {
        console.warn(`Failed to remove temporary directory ${temporaryRoot}: ${error.message}`);
      }
    }
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = path.resolve(fileURLToPath(import.meta.url));
if (invokedPath.toLowerCase() === modulePath.toLowerCase()) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
