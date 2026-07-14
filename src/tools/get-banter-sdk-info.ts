import * as fs from "fs";
import * as path from "path";

import type { BanterMCPConfig } from "../lib/config.js";
import { BANTER_COMPONENTS } from "../resources/banter-components.js";
import { BANTER_CUSTOM_VS_NODES } from "../resources/banter-custom-vs-nodes.js";
import { BANTER_SDK_COMPATIBILITY } from "../resources/banter-sdk-compatibility.js";

const PACKAGE_ID = "com.sidequest.banter";

interface LockedPackage {
  version?: string;
  source?: string;
  url?: string;
  hash?: string;
}

interface PackageCandidate {
  packageRoot: string;
  cacheIdentity: string;
  packageVersion?: string;
}

export function getBanterSDKInfo(config: BanterMCPConfig): Record<string, unknown> {
  if (!config.unityProjectPath) {
    return { success: false, error: "UNITY_PROJECT_PATH not set" };
  }

  const manifestPath = path.join(config.unityProjectPath, "Packages", "manifest.json");
  const lockPath = path.join(config.unityProjectPath, "Packages", "packages-lock.json");
  if (!fs.existsSync(manifestPath)) {
    return { success: false, error: `Unity package manifest not found: ${manifestPath}` };
  }

  try {
    const manifest = readJson(manifestPath) as { dependencies?: Record<string, string> };
    const lock = fs.existsSync(lockPath)
      ? readJson(lockPath) as { dependencies?: Record<string, LockedPackage> }
      : {};
    const requestedVersion = manifest.dependencies?.[PACKAGE_ID];
    const locked = lock.dependencies?.[PACKAGE_ID];
    const unityVersion = readUnityVersion(config.unityProjectPath);

    if (!requestedVersion && !locked) {
      return {
        success: true,
        installed: false,
        packageId: PACKAGE_ID,
        unityVersion,
        catalog: BANTER_SDK_COMPATIBILITY.catalog,
        nextStep: `Add ${PACKAGE_ID} to Packages/manifest.json, then let Unity resolve packages.`,
      };
    }

    const candidates = findPackageCandidates(config.unityProjectPath);
    const selected = selectPackageCandidate(candidates, requestedVersion, locked);
    const packageInfo = {
      requestedVersion,
      resolvedVersion: locked?.version ?? requestedVersion,
      packageVersion: selected?.packageVersion,
      source: locked?.source,
      url: locked?.url,
      revision: locked?.hash,
      packageCacheIdentity: selected?.cacheIdentity,
      packageRoot: selected?.packageRoot,
      candidateCount: candidates.length,
    };
    const publicReleaseValidation = matchPublicReleaseValidation(
      selected?.packageVersion,
      locked?.hash,
      unityVersion
    );

    if (!selected) {
      return {
        success: true,
        installed: true,
        packageId: PACKAGE_ID,
        unityVersion,
        package: packageInfo,
        publicReleaseValidation,
        visualScripting: unknownCoverage("Resolved Banter package source was not found in Library/PackageCache or Packages."),
        components: unknownCoverage("Resolved Banter package source was not found in Library/PackageCache or Packages."),
        catalog: BANTER_SDK_COMPATIBILITY.catalog,
        nextStep: "Open the project in Unity and wait for Package Manager resolution, then run get_banter_sdk_info again.",
      };
    }

    const discoveredNodes = scanVisualScriptingClasses(selected.packageRoot);
    const catalogNodes = new Set(Object.keys(BANTER_CUSTOM_VS_NODES));
    const discoveredComponents = scanSceneComponents(selected.packageRoot);
    const catalogComponents = new Set(
      Object.values(BANTER_COMPONENTS)
        .filter((component) => component.kind !== "runtime-helper")
        .map((component) => component.name)
    );

    return {
      success: true,
      installed: true,
      packageId: PACKAGE_ID,
      unityVersion,
      package: packageInfo,
      publicReleaseValidation,
      visualScripting: compareCoverage(catalogNodes, discoveredNodes),
      components: compareCoverage(catalogComponents, discoveredComponents),
      catalog: BANTER_SDK_COMPATIBILITY.catalog,
      caveat: "Coverage is based on source class presence. Unity import and Banter build validation remain authoritative for runtime compatibility.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not inspect Banter SDK metadata",
    };
  }
}

function matchPublicReleaseValidation(
  packageVersion: string | undefined,
  revision: string | undefined,
  unityVersion: string | undefined
): Record<string, unknown> {
  const matrix = BANTER_SDK_COMPATIBILITY.publicReleaseValidationMatrix;
  const normalizedRevision = revision?.toLowerCase();
  const revisionProfile = matrix.profiles.find((profile) => profile.revision === normalizedRevision);

  if (revisionProfile && revisionProfile.packageVersion !== packageVersion) {
    return {
      status: "source-metadata-mismatch",
      projectRevision: revision,
      packageVersion,
      expectedPackageVersion: revisionProfile.packageVersion,
      profile: revisionProfile,
      reason: "Revision matches a tested public release, but resolved package metadata does not. Release evidence is not applied.",
    };
  }

  if (revisionProfile) {
    if (unityVersion === matrix.unityVersion) {
      return {
        status: "matched",
        testedUnityVersion: matrix.unityVersion,
        visualScriptingVersion: matrix.visualScriptingVersion,
        testFrameworkVersion: matrix.testFrameworkVersion,
        profile: revisionProfile,
      };
    }
    return {
      status: "unity-version-unverified",
      projectUnityVersion: unityVersion,
      testedUnityVersion: matrix.unityVersion,
      profile: revisionProfile,
      reason: "The exact public release revision is known, but this Unity editor version is not represented by the release matrix.",
    };
  }

  const sameVersion = matrix.profiles.filter((profile) => profile.packageVersion === packageVersion);
  if (sameVersion.length > 0) {
    return {
      status: "different-source",
      projectRevision: revision,
      packageVersion,
      testedProfiles: sameVersion,
      reason: "Package version matches a tested release, but source identity does not. Semantic version alone is not compatibility proof.",
    };
  }

  return {
    status: "unverified",
    projectRevision: revision,
    packageVersion,
    testedUnityVersion: matrix.unityVersion,
    reason: "No exact public release revision in the compatibility matrix matches the selected package.",
  };
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function findPackageCandidates(projectRoot: string): PackageCandidate[] {
  const roots: string[] = [];
  const embedded = path.join(projectRoot, "Packages", PACKAGE_ID);
  if (fs.existsSync(path.join(embedded, "package.json"))) {
    roots.push(embedded);
  }

  const cacheRoot = path.join(projectRoot, "Library", "PackageCache");
  if (fs.existsSync(cacheRoot)) {
    for (const entry of fs.readdirSync(cacheRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith(`${PACKAGE_ID}@`)) {
        roots.push(path.join(cacheRoot, entry.name));
      }
    }
  }

  return roots.flatMap((packageRoot) => {
    try {
      const packageJson = readJson(path.join(packageRoot, "package.json")) as { name?: string; version?: string };
      if (packageJson.name !== PACKAGE_ID) {
        return [];
      }
      return [{
        packageRoot,
        cacheIdentity: path.basename(packageRoot),
        packageVersion: packageJson.version,
      }];
    } catch {
      return [];
    }
  });
}

function selectPackageCandidate(
  candidates: PackageCandidate[],
  requestedVersion: string | undefined,
  locked: LockedPackage | undefined
): PackageCandidate | undefined {
  return [...candidates]
    .map((candidate) => ({ candidate, score: candidateScore(candidate, requestedVersion, locked) }))
    .sort((left, right) => right.score - left.score || left.candidate.packageRoot.localeCompare(right.candidate.packageRoot))[0]
    ?.candidate;
}

function candidateScore(
  candidate: PackageCandidate,
  requestedVersion: string | undefined,
  locked: LockedPackage | undefined
): number {
  let score = 0;
  const suffix = candidate.cacheIdentity.split("@").at(-1)?.toLowerCase() ?? "";
  if (locked?.hash && locked.hash.toLowerCase().startsWith(suffix)) score += 100;
  if (locked?.version && candidate.packageVersion === locked.version) score += 80;
  if (requestedVersion && candidate.packageVersion === requestedVersion) score += 40;
  if (candidate.cacheIdentity === PACKAGE_ID) score += 20;
  return score;
}

function scanVisualScriptingClasses(packageRoot: string): Set<string> {
  const sourceRoot = path.join(packageRoot, "VisualScripting");
  const result = new Set<string>();
  for (const filePath of listCSharpFiles(sourceRoot)) {
    const source = stripCSharpComments(fs.readFileSync(filePath, "utf-8"));
    if (!/namespace\s+Banter\.VisualScripting\b/.test(source)) continue;
    const classPattern = /(?:^|\n)\s*(?:(?:public|internal|private|protected|abstract|sealed|static|partial|new)\s+)*class\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
    for (const match of source.matchAll(classPattern)) result.add(match[1]);
  }
  return result;
}

function scanSceneComponents(packageRoot: string): Set<string> {
  const sourceRoot = path.join(packageRoot, "Runtime", "Scripts", "Scene", "Components");
  const result = new Set<string>();
  for (const filePath of listCSharpFiles(sourceRoot)) {
    const source = stripCSharpComments(fs.readFileSync(filePath, "utf-8"));
    const classPattern = /(?:^|\n)\s*(?:(?:public|internal|private|protected|abstract|sealed|static|partial|new)\s+)*class\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:BanterComponentBase|UnityComponentBase)\b/g;
    for (const match of source.matchAll(classPattern)) result.add(match[1]);
  }
  return result;
}

function listCSharpFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  const pending = [root];
  while (pending.length > 0 && files.length < 5000) {
    const current = pending.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(entryPath);
      else if (entry.isFile() && entry.name.endsWith(".cs")) files.push(entryPath);
    }
  }
  return files;
}

function stripCSharpComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, "");
}

function compareCoverage(catalog: Set<string>, discovered: Set<string>): Record<string, unknown> {
  const matched = [...catalog].filter((name) => discovered.has(name)).sort();
  const missingFromPackage = [...catalog].filter((name) => !discovered.has(name)).sort();
  const additionalInPackage = [...discovered].filter((name) => !catalog.has(name)).sort();
  return {
    status: discovered.size === 0 ? "unknown" : missingFromPackage.length === 0 ? "full" : "partial",
    catalogCount: catalog.size,
    discoveredSourceClassCount: discovered.size,
    matchedCount: matched.length,
    missingFromPackage,
    additionalInPackage,
  };
}

function unknownCoverage(reason: string): Record<string, unknown> {
  return { status: "unknown", reason };
}

function readUnityVersion(projectRoot: string): string | undefined {
  const versionPath = path.join(projectRoot, "ProjectSettings", "ProjectVersion.txt");
  if (!fs.existsSync(versionPath)) return undefined;
  return fs.readFileSync(versionPath, "utf-8").match(/^m_EditorVersion:\s*(.+)$/m)?.[1]?.trim();
}
