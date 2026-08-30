// Cross-platform equivalent of scripts/build-standalone.ps1.
//
// Produces release/BANTWORKS-MCP-<version>-standalone.zip by staging the
// release bundle plus documentation, then zips the staging directory using
// a tiny built-in ZIP writer so we don't depend on system tools (PowerShell
// Compress-Archive on Windows, /usr/bin/zip on Linux). Also runs a smoke
// test that extracts the archive and runs setup.mjs install against the
// extracted layout, mirroring the Windows smoke behaviour.
//
// Usage: node scripts/build-standalone.mjs [--version <semver>]

import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_ZIP_PERMS_LINUX = 0o100755;
const DEFAULT_ZIP_PERMS_FILE = 0o100644;

function parseArgs(argv) {
  const args = { version: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--version") {
      args.version = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${argv[i]}`);
    }
  }
  return args;
}

function helpText() {
  return `Usage: node scripts/build-standalone.mjs [--version <semver>]

Builds a ZIP archive containing the standalone MCP server bundle plus
documentation and platform setup scripts. The archive is written to
release/BANTWORKS-MCP-<version>-standalone.zip and then smoke-tested by
extracting into a temp directory and running the bundled setup script.`;
}

function loadVersion(argValue) {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  const value = argValue || pkg.version;
  if (!/^[0-9A-Za-z][0-9A-Za-z.-]*$/.test(value)) {
    throw new Error(`Invalid release version: ${value}`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Tiny ZIP writer (store + deflate) compatible with the common PKZIP format.
// Used in place of PowerShell's Compress-Archive on Windows or /usr/bin/zip
// on Linux so the script runs on any host with only Node available.
// ---------------------------------------------------------------------------

import { deflateRawSync, inflateRawSync, crc32 } from "node:zlib";

function dosDateTime(date) {
  const seconds = Math.floor(date.getSeconds() / 2);
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | seconds;
  const day = (date.getDate() << 5) | (date.getMonth() + 1);
  const year = Math.max(date.getFullYear() - 1980, 0);
  return { time, date: (year << 9) | day };
}

function writeZipEntry(buffer, name, data, { mode = DEFAULT_ZIP_PERMS_FILE, mtime = new Date() } = {}) {
  const nameBuffer = Buffer.from(name, "utf8");
  const compressed = deflateRawSync(data);
  const useDeflate = compressed.length < data.length;
  const { time, date } = dosDateTime(mtime);

  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
  localHeader.writeUInt16LE(20, 4); // version needed
  localHeader.writeUInt16LE(0, 6); // flags
  localHeader.writeUInt16LE(useDeflate ? 8 : 0, 8); // compression method (8 = deflate)
  localHeader.writeUInt16LE(time, 10);
  localHeader.writeUInt16LE(date, 12);
  localHeader.writeUInt32LE(crc32(data) >>> 0, 14);
  localHeader.writeUInt32LE(compressed.length, 18);
  localHeader.writeUInt32LE(data.length, 22);
  localHeader.writeUInt16LE(nameBuffer.length, 26);
  localHeader.writeUInt16LE(0, 28);

  const payload = useDeflate ? compressed : data;
  buffer.write(localHeader);
  buffer.write(nameBuffer);
  buffer.write(payload);
  return {
    name: nameBuffer,
    crc: crc32(data) >>> 0,
    compressedSize: compressed.length,
    uncompressedSize: data.length,
    time,
    date,
    mode,
    useDeflate,
  };
}

function buildZip(archivePath, entries) {
  // Build the archive as a single buffer so the central-directory offsets
  // are guaranteed to match what actually lands on disk (WriteStream buffers
  // can otherwise produce archives that pass the local-header checks but
  // mismatch the central directory).
  const parts = [];
  let totalLength = 0;
  const centralRecords = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const compressed = deflateRawSync(entry.data);
    const useDeflate = compressed.length < entry.data.length;
    const { time, date } = dosDateTime(entry.mtime ?? new Date());

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(useDeflate ? 8 : 0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc32(entry.data) >>> 0, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localPart = Buffer.concat([
      localHeader,
      nameBuffer,
      useDeflate ? compressed : entry.data,
    ]);
    parts.push(localPart);
    totalLength += localPart.length;

    centralRecords.push({
      name: nameBuffer,
      crc: crc32(entry.data) >>> 0,
      compressedSize: compressed.length,
      uncompressedSize: entry.data.length,
      time,
      date,
      mode: entry.mode,
      useDeflate,
      offset,
    });
    offset += localPart.length;
  }

  const centralStart = totalLength;
  let centralLength = 0;
  for (const record of centralRecords) {
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(record.useDeflate ? 8 : 0, 10);
    header.writeUInt16LE(record.time, 12);
    header.writeUInt16LE(record.date, 14);
    header.writeUInt32LE(record.crc, 16);
    header.writeUInt32LE(record.compressedSize, 20);
    header.writeUInt32LE(record.uncompressedSize, 24);
    header.writeUInt16LE(record.name.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE((record.mode << 16) >>> 0, 38);
    header.writeUInt32LE(record.offset, 42);
    const centralPart = Buffer.concat([header, record.name]);
    parts.push(centralPart);
    centralLength += centralPart.length;
    totalLength += centralPart.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(centralRecords.length, 8);
  eocd.writeUInt16LE(centralRecords.length, 10);
  eocd.writeUInt32LE(centralLength, 12);
  eocd.writeUInt32LE(centralStart, 16);
  eocd.writeUInt16LE(0, 20);
  parts.push(eocd);
  totalLength += eocd.length;

  writeFileSync(archivePath, Buffer.concat(parts, totalLength));
  return archivePath;
}

// ---------------------------------------------------------------------------
// Staging
// ---------------------------------------------------------------------------

function copyRecursive(source, destination) {
  const stat = statSync(source);
  if (stat.isDirectory()) {
    mkdirSync(destination, { recursive: true });
    for (const entry of readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, readFileSync(source));
}

function collectFiles(rootDir) {
  const entries = [];
  const topLevel = path.basename(rootDir);
  function walk(directory, prefix) {
    for (const name of readdirSync(directory)) {
      const full = path.join(directory, name);
      const relative = prefix ? `${prefix}/${name}` : `${topLevel}/${name}`;
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full, relative);
      } else {
        const data = readFileSync(full);
        const mode = (process.platform !== "win32" && (stat.mode & 0o111) !== 0)
          ? DEFAULT_ZIP_PERMS_LINUX
          : DEFAULT_ZIP_PERMS_FILE;
        entries.push({ name: relative, data, mode, mtime: stat.mtime });
      }
    }
  }
  walk(rootDir, "");
  return entries;
}

async function extractZip(archivePath, destination) {
  // Minimal unzip implementation: scan local file headers + central directory,
  // inflate entries. Sufficient for archives produced by buildZip above.
  mkdirSync(destination, { recursive: true });
  const buffer = readFileSync(archivePath);
  // Find EOCD by scanning from the end.
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0 && i >= buffer.length - 65557; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Could not find end-of-central-directory record.");
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  const centralCount = buffer.readUInt16LE(eocdOffset + 10);
  let cursor = centralOffset;
  for (let i = 0; i < centralCount; i++) {
    const signature = buffer.readUInt32LE(cursor);
    if (signature !== 0x02014b50) throw new Error("Bad central directory signature.");
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.slice(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    cursor += 46 + nameLength + extraLength + commentLength;

    const localSignature = buffer.readUInt32LE(localOffset);
    if (localSignature !== 0x04034b50) throw new Error("Bad local file header signature.");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressedData = buffer.slice(dataStart, dataStart + compressedSize);
    const method = buffer.readUInt16LE(localOffset + 8);
    let payload;
    if (method === 0) {
      payload = compressedData;
    } else if (method === 8) {
      payload = inflateRawSync(compressedData, { maxOutputLength: uncompressedSize });
    } else {
      throw new Error(`Unsupported compression method: ${method}`);
    }
    const outPath = path.join(destination, name);
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, payload);
    if (process.platform !== "win32" && name.endsWith(".sh")) {
      const { chmodSync } = await import("node:fs");
      chmodSync(outPath, 0o755);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(helpText());
    return;
  }
  const version = loadVersion(args.version);
  const releaseRoot = path.join(repoRoot, "release");
  const standaloneRoot = path.join(releaseRoot, "standalone");
  const stagingRoot = path.join(standaloneRoot, `BANTWORKS-MCP-${version}`);
  const archivePath = path.join(releaseRoot, `BANTWORKS-MCP-${version}-standalone.zip`);
  const serverBundle = path.join(releaseRoot, "banter-mcp.mjs");

  if (!existsSync(serverBundle) || !statSync(serverBundle).isFile()) {
    throw new Error("Standalone server bundle is missing. Run 'npm run release:server' first.");
  }

  mkdirSync(standaloneRoot, { recursive: true });
  if (existsSync(stagingRoot)) {
    const resolvedStaging = path.resolve(stagingRoot);
    const resolvedParent = path.resolve(standaloneRoot);
    if (!resolvedStaging.startsWith(resolvedParent + path.sep) && resolvedStaging !== resolvedParent) {
      throw new Error(`Refusing to clean staging path outside release/standalone: ${resolvedStaging}`);
    }
    rmSync(resolvedStaging, { recursive: true, force: true });
  }
  mkdirSync(stagingRoot, { recursive: true });

  writeFileSync(path.join(stagingRoot, "banter-mcp.mjs"), readFileSync(serverBundle));

  const rootFiles = [
    "setup.ps1",
    "setup.bat",
    "setup.sh",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
  ];
  for (const file of rootFiles) {
    const source = path.join(repoRoot, file);
    if (existsSync(source)) {
      writeFileSync(path.join(stagingRoot, file), readFileSync(source));
    }
  }

  for (const directory of ["docs", "unity-extension", "scripts/cli"]) {
    const source = path.join(repoRoot, directory);
    if (existsSync(source)) {
      copyRecursive(source, path.join(stagingRoot, directory));
    }
  }

  if (existsSync(archivePath)) {
    rmSync(archivePath, { force: true });
  }
  const entries = collectFiles(stagingRoot);
  buildZip(archivePath, entries);

  // Smoke test the archive.
  const tempRoot = path.join(os.tmpdir(), `bantworks-standalone-smoke-${process.pid}-${Date.now()}`);
  mkdirSync(tempRoot, { recursive: true });
  try {
    await extractZip(archivePath, tempRoot);
    // extractZip preserves the archive's top-level directory structure, so
    // the entries land under <tempRoot>/BANTWORKS-MCP-<version>/.
    const extractedRoot = path.join(tempRoot, path.basename(stagingRoot));
    const setupScript = process.platform === "win32"
      ? path.join(extractedRoot, "setup.ps1")
      : path.join(extractedRoot, "setup.sh");
    if (!existsSync(setupScript)) {
      throw new Error(`Extracted archive is missing ${path.basename(setupScript)}.`);
    }
    if (process.platform === "win32") {
      await runPowerShell(setupScript, ["-Install"]);
    } else {
      await runShell(setupScript, ["install"]);
    }
    const docsCheck = path.join(extractedRoot, "docs", "compatibility.md");
    if (!existsSync(docsCheck)) {
      throw new Error("Standalone archive is missing docs/compatibility.md");
    }
    const archiveStat = statSync(archivePath);
    console.log(`Standalone release smoke passed: ${archivePath} (${archiveStat.size} bytes)`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function runNode(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(scriptPath)} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

function runShell(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("/bin/bash", [scriptPath, ...args], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(scriptPath)} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

function runPowerShell(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...args], {
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`PowerShell setup.ps1 exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});