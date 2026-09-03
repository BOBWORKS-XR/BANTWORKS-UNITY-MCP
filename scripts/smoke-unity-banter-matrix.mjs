#!/usr/bin/env node

// Cross-platform equivalent of scripts/smoke-unity-banter-matrix.ps1.
//
// Validates the Banter SDK compatibility matrix (compatibility/banter-sdk-release-matrix.json)
// against public Git release tags, runs each entry (or filtered entries) through the
// Unity Visual Scripting smoke test, asserts whether the observed outcome matches expectations
// (including known package-compilation failures with expected CS compiler diagnostic codes),
// and publishes a consolidated matrix report JSON.
//
// Usage:
//   node scripts/smoke-unity-banter-matrix.mjs [options]
//   ./scripts/smoke-unity-banter-matrix.sh [options]

import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_EXPECTED_UNITY_VERSION,
  resolveUnityEditorPath,
  runBanterVsSmoke,
} from "./smoke-unity-banter-vs.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function assertExactPackageVersion(value, fieldName) {
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value)) {
    throw new Error(`${fieldName} must be an exact semantic version: '${value}'`);
  }
}

function writeJsonAtomically(filePath, value) {
  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);
  if (dir) {
    mkdirSync(dir, { recursive: true });
  }
  const temporaryPath = `${resolved}.tmp-${crypto.randomUUID().replace(/-/g, "")}`;
  writeFileSync(temporaryPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(temporaryPath, resolved);
}

function formatUtcTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function runBanterMatrix(options = {}) {
  const unityEditorPath = resolveUnityEditorPath(
    options.unityEditorPath,
    options.autoDetectUnity ?? false,
    DEFAULT_EXPECTED_UNITY_VERSION
  );
  const matrixPath = options.matrixPath
    ? path.resolve(options.matrixPath)
    : path.join(repoRoot, "compatibility", "banter-sdk-release-matrix.json");

  const runStartedAtUtc = new Date();
  const outputPath = options.outputPath
    ? path.resolve(options.outputPath)
    : path.join(repoRoot, "artifacts", `banter-sdk-matrix-${formatUtcTimestamp(runStartedAtUtc)}.json`);

  const keepFixtures = Boolean(options.keepFixtures);
  const allowUnityVersionMismatch = Boolean(options.allowUnityVersionMismatch);
  const relaxedDiagnostics = Boolean(options.relaxedDiagnostics);
  const entryIdFilter = options.entryId
    ? (Array.isArray(options.entryId) ? options.entryId : [options.entryId])
    : [];

  if (!existsSync(unityEditorPath)) {
    throw new Error(`Unity Editor was not found: ${unityEditorPath}`);
  }
  if (!existsSync(matrixPath)) {
    throw new Error(`Banter SDK matrix was not found: ${matrixPath}`);
  }

  const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
  if (matrix.schemaVersion !== 1) {
    throw new Error(`Unsupported Banter SDK matrix schema version: ${matrix.schemaVersion}`);
  }
  if (matrix.source?.repository !== "https://github.com/SideQuestVR/BanterSDK.git") {
    throw new Error("The matrix repository must be the public SideQuestVR/BanterSDK Git package.");
  }
  if (matrix.source?.packageId !== "com.sidequest.banter") {
    throw new Error("The matrix package ID must be com.sidequest.banter.");
  }

  const gitResult = spawnSync("git", ["ls-remote", "--tags", matrix.source.repository], {
    encoding: "utf8",
    stdio: "pipe",
  });
  if (gitResult.status !== 0) {
    throw new Error(`Could not read public Banter SDK release tags from ${matrix.source.repository}.`);
  }

  const remoteTags = new Map();
  const remoteTagLines = gitResult.stdout.split(/\r?\n/).filter((l) => l.trim());
  for (const line of remoteTagLines) {
    const match = line.match(/^([0-9a-f]{40})\s+refs\/tags\/(.+?)(\^\{\})?$/);
    if (match) {
      const commit = match[1];
      const tagName = match[2];
      const isPeeledTag = Boolean(match[3]);
      if (isPeeledTag || !remoteTags.has(tagName)) {
        remoteTags.set(tagName, commit);
      }
    }
  }

  const entries = Array.isArray(matrix.entries) ? matrix.entries : [];
  if (entries.length === 0) {
    throw new Error("The Banter SDK matrix has no entries.");
  }

  const knownIds = new Set();
  for (const entry of entries) {
    if (!entry.id || !/^[a-z0-9][a-z0-9.-]+$/.test(entry.id)) {
      throw new Error(`Matrix entry IDs must be stable lowercase identifiers: '${entry.id}'`);
    }
    if (knownIds.has(entry.id)) {
      throw new Error(`Duplicate Banter SDK matrix entry ID: ${entry.id}`);
    }
    knownIds.add(entry.id);
    assertExactPackageVersion(entry.releaseTag, "releaseTag");
    assertExactPackageVersion(entry.packageVersion, "packageVersion");
    assertExactPackageVersion(entry.visualScriptingVersion, "visualScriptingVersion");
    assertExactPackageVersion(entry.testFrameworkVersion, "testFrameworkVersion");
    if (entry.releaseTag !== entry.packageVersion) {
      throw new Error(`Entry '${entry.id}' releaseTag and packageVersion must match.`);
    }
    if (!/^[0-9a-f]{40}$/.test(entry.revision)) {
      throw new Error(`Entry '${entry.id}' must pin a lowercase 40-character commit.`);
    }
    if (!remoteTags.has(entry.releaseTag)) {
      throw new Error(`Public Banter SDK release tag '${entry.releaseTag}' was not found.`);
    }
    if (remoteTags.get(entry.releaseTag) !== entry.revision) {
      throw new Error(
        `Public Banter SDK release tag '${entry.releaseTag}' resolves to '${remoteTags.get(
          entry.releaseTag
        )}', not '${entry.revision}'.`
      );
    }
    if (!/^\d+\.\d+\.\d+[a-z]\d+$/.test(entry.unityVersion)) {
      throw new Error(`Entry '${entry.id}' must name an exact Unity editor version.`);
    }
    if (!["passed", "package-compilation-failed"].includes(entry.expectedOutcome)) {
      throw new Error(
        `Entry '${entry.id}' has an unsupported expectedOutcome: '${entry.expectedOutcome}'`
      );
    }
    const expectedDiagnosticCodes = (entry.expectedDiagnosticCodes || []).filter(
      (c) => c && String(c).trim()
    );
    if (entry.expectedOutcome === "package-compilation-failed" && expectedDiagnosticCodes.length === 0) {
      throw new Error(`Entry '${entry.id}' must name expected compiler diagnostic codes.`);
    }
    for (const code of expectedDiagnosticCodes) {
      if (!/^CS\d{4}$/.test(code)) {
        throw new Error(`Entry '${entry.id}' has an invalid compiler diagnostic code: '${code}'`);
      }
    }
  }

  let selectedEntries = entries;
  if (entryIdFilter.length > 0) {
    const unknownIds = entryIdFilter.filter((id) => !knownIds.has(id));
    if (unknownIds.length > 0) {
      throw new Error(`Unknown Banter SDK matrix entry ID(s): ${unknownIds.join(", ")}`);
    }
    selectedEntries = entries.filter((e) => entryIdFilter.includes(e.id));
  }

  const results = [];
  const tempRoot = path.resolve(os.tmpdir());

  for (const entry of selectedEntries) {
    console.log(`Running Banter SDK matrix entry: ${entry.id}`);
    const entryStartedAtUtc = new Date();
    const entryResultPath = path.join(
      tempRoot,
      `bantworks-banter-matrix-result-${crypto.randomUUID().replace(/-/g, "")}.json`
    );

    try {
      await runBanterVsSmoke({
        unityEditorPath,
        banterPackageReference: `${matrix.source.repository}#${entry.revision}`,
        expectedBanterVersion: String(entry.packageVersion),
        expectedUnityVersion: String(entry.unityVersion),
        visualScriptingVersion: String(entry.visualScriptingVersion),
        testFrameworkVersion: String(entry.testFrameworkVersion),
        resultPath: entryResultPath,
        keepFixture: keepFixtures,
        allowUnityVersionMismatch,
      });

      if (!existsSync(entryResultPath)) {
        throw new Error("The fixture did not publish its evidence file.");
      }
      const evidence = JSON.parse(readFileSync(entryResultPath, "utf8"));
      if (evidence.success !== true) {
        throw new Error("The fixture evidence did not report success.");
      }
      const expectationMatched = entry.expectedOutcome === "passed";
      results.push({
        id: String(entry.id),
        releaseTag: String(entry.releaseTag),
        expectedOutcome: String(entry.expectedOutcome),
        observedOutcome: "passed",
        expectationMatched,
        evidence,
      });
      if (!expectationMatched) {
        console.error(
          `Banter SDK matrix entry '${entry.id}' passed but expected '${entry.expectedOutcome}'.`
        );
      }
    } catch (err) {
      const completedAtUtc = new Date();
      const errorMessage = err.message || String(err);
      const observedOutcome = errorMessage.startsWith("Unity reported compiler errors:")
        ? "package-compilation-failed"
        : "fixture-failed";

      const matches = [...errorMessage.matchAll(/error (CS\d{4})/g)].map((m) => m[1]);
      const diagnosticCodes = [...new Set(matches)].sort();
      const expectedCodes = (entry.expectedDiagnosticCodes || []).filter(
        (c) => c && String(c).trim()
      );
      const missingExpectedDiagnosticCodes = expectedCodes.filter(
        (c) => !diagnosticCodes.includes(c)
      );
      const hasDiagnosticMatch = relaxedDiagnostics
        ? diagnosticCodes.some((c) => expectedCodes.includes(c)) || expectedCodes.length === 0
        : missingExpectedDiagnosticCodes.length === 0;
      const expectationMatched =
        observedOutcome === entry.expectedOutcome && hasDiagnosticMatch;

      const durationSeconds =
        Math.round((completedAtUtc.getTime() - entryStartedAtUtc.getTime()) / 1000 * 1000) / 1000;

      results.push({
        id: String(entry.id),
        releaseTag: String(entry.releaseTag),
        expectedOutcome: String(entry.expectedOutcome),
        observedOutcome,
        expectationMatched,
        diagnosticCodes,
        missingExpectedDiagnosticCodes,
        startedAtUtc: entryStartedAtUtc.toISOString(),
        completedAtUtc: completedAtUtc.toISOString(),
        durationSeconds,
        error: errorMessage,
      });

      if (expectationMatched) {
        console.log(`Observed expected outcome for '${entry.id}': ${observedOutcome}`);
      } else if (observedOutcome !== entry.expectedOutcome) {
        console.error(
          `Banter SDK matrix entry '${entry.id}' mismatch: expected '${entry.expectedOutcome}', observed '${observedOutcome}'.`
        );
      } else {
        console.error(
          `Banter SDK matrix entry '${entry.id}' diagnostic code mismatch: observed '${observedOutcome}', but missing expected compiler diagnostic codes: ${missingExpectedDiagnosticCodes.join(
            ", "
          )} (observed: ${diagnosticCodes.join(", ") || "none"}).`
        );
      }
    } finally {
      if (existsSync(entryResultPath)) {
        try {
          rmSync(entryResultPath, { force: true });
        } catch {
          // ignore
        }
      }
    }
  }

  const runCompletedAtUtc = new Date();
  const matchedCount = results.filter((r) => r.expectationMatched === true).length;
  const mismatchedCount = results.length - matchedCount;
  const observedPassedCount = results.filter((r) => r.observedOutcome === "passed").length;
  const observedCompatibilityFailureCount = results.filter(
    (r) => r.observedOutcome === "package-compilation-failed"
  ).length;

  const durationSeconds =
    Math.round((runCompletedAtUtc.getTime() - runStartedAtUtc.getTime()) / 1000 * 1000) / 1000;

  const report = {
    schemaVersion: 1,
    success: mismatchedCount === 0,
    startedAtUtc: runStartedAtUtc.toISOString(),
    completedAtUtc: runCompletedAtUtc.toISOString(),
    durationSeconds,
    matrixPath: path.resolve(matrixPath),
    remoteTagsVerified: true,
    selectionPolicy: String(matrix.selectionPolicy),
    selectedCount: selectedEntries.length,
    matchedCount,
    mismatchedCount,
    observedPassedCount,
    observedCompatibilityFailureCount,
    results,
  };

  writeJsonAtomically(outputPath, report);
  console.log(`Banter SDK matrix report: ${path.resolve(outputPath)}`);
  console.log(`Banter SDK matrix result: ${matchedCount} matched, ${mismatchedCount} mismatched`);

  if (mismatchedCount > 0) {
    throw new Error(
      `${mismatchedCount} Banter SDK matrix expectation or expectations were not met. See ${outputPath}`
    );
  }

  return report;
}

function parseCliArgs(argv) {
  const options = { entryId: [] };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--unity-editor-path" || arg === "-u" || arg === "-UnityEditorPath") {
      options.unityEditorPath = argv[++i];
    } else if (arg === "--auto-detect-unity" || arg === "-AutoDetectUnity") {
      options.autoDetectUnity = true;
    } else if (arg === "--matrix-path" || arg === "-MatrixPath") {
      options.matrixPath = argv[++i];
    } else if (arg === "--entry-id" || arg === "-EntryId") {
      const val = argv[++i];
      if (val.includes(",")) {
        options.entryId.push(...val.split(",").map((s) => s.trim()).filter(Boolean));
      } else {
        options.entryId.push(val);
      }
    } else if (arg === "--output-path" || arg === "-OutputPath") {
      options.outputPath = argv[++i];
    } else if (arg === "--keep-fixtures" || arg === "--keep-fixture" || arg === "-KeepFixtures") {
      options.keepFixtures = true;
    } else if (arg === "--allow-unity-version-mismatch") {
      options.allowUnityVersionMismatch = true;
    } else if (arg === "--relaxed-diagnostics" || arg === "-RelaxedDiagnostics") {
      options.relaxedDiagnostics = true;
    } else if (arg === "--help" || arg === "-h" || arg === "-Help") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/smoke-unity-banter-matrix.mjs [options]

Validates the Banter SDK release matrix across pinned releases.

Options:
  --unity-editor-path, -u <path>      Path to Unity Editor binary
  --auto-detect-unity                 Opt-in auto-detection of installed Unity Hub Editor
  --matrix-path <path>                Path to matrix JSON (default: compatibility/banter-sdk-release-matrix.json)
  --entry-id <id>                     Filter run to specific matrix entry ID(s) (can repeat)
  --output-path <path>                Path to write matrix report JSON (default: artifacts/banter-sdk-matrix-*.json)
  --keep-fixtures                     Keep fixture project folders and logs
  --allow-unity-version-mismatch      Allow running with a different installed Unity version
  --relaxed-diagnostics               Allow matching a subset of expected compiler diagnostic codes
  --help, -h                          Show this help message
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  let cliOptions;
  try {
    cliOptions = parseCliArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (cliOptions.help) {
    printHelp();
    process.exit(0);
  }

  runBanterMatrix(cliOptions).catch((err) => {
    console.error(`Matrix run failed: ${err.message}`);
    process.exit(1);
  });
}
