import * as fs from "fs";
import * as path from "path";

import type { BanterMCPConfig } from "../lib/config.js";
import { BANTER_COMPONENTS } from "../resources/banter-components.js";
import { BANTER_CUSTOM_VS_NODES } from "../resources/banter-custom-vs-nodes.js";
import { BANTER_SDK_COMPATIBILITY } from "../resources/banter-sdk-compatibility.js";

const SDK_DEFINITIONS = [
  {
    family: "creator",
    packageId: "com.sidequest.creator-sdk",
    displayName: "SideQuest Creator SDK",
    componentNamespace: "BS",
    visualScriptingNamespace: "BS.VisualScripting",
    validatorType: "BS.SDKEditor.ValidateVisualScripting",
  },
  {
    family: "banter",
    packageId: "com.sidequest.banter",
    displayName: "Banter SDK",
    componentNamespace: "Banter.SDK",
    visualScriptingNamespace: "Banter.VisualScripting",
    validatorType: "Banter.SDKEditor.ValidateVisualScripting",
  },
] as const;

type SDKDefinition = typeof SDK_DEFINITIONS[number];
export type SidequestSDKProfile = SDKDefinition["family"] | "hybrid" | "none" | "unknown";

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

interface PackageInspection {
  definition: SDKDefinition;
  package: Record<string, unknown>;
  publicReleaseValidation: Record<string, unknown>;
  visualScripting: Record<string, unknown>;
  components: Record<string, unknown>;
  legacyStubsPresent?: boolean;
  nextStep?: string;
}

/**
 * Backward-compatible entry point. The result now covers both the legacy
 * Banter SDK and the Creator SDK/BS contract.
 */
export function getBanterSDKInfo(config: BanterMCPConfig): Record<string, unknown> {
  return getSidequestSDKInfo(config);
}

/**
 * Lightweight package-family detection for tools that only need to select a
 * namespace. Full provenance and source coverage remain in getSidequestSDKInfo.
 */
export function detectSidequestSDKProfile(config: BanterMCPConfig): SidequestSDKProfile {
  if (!config.unityProjectPath) return "unknown";

  const manifestPath = path.join(config.unityProjectPath, "Packages", "manifest.json");
  const lockPath = path.join(config.unityProjectPath, "Packages", "packages-lock.json");
  if (!fs.existsSync(manifestPath)) return "unknown";

  try {
    const manifest = readJson(manifestPath) as { dependencies?: Record<string, string> };
    const lock = fs.existsSync(lockPath)
      ? readJson(lockPath) as { dependencies?: Record<string, LockedPackage> }
      : {};
    const hasCreator = Boolean(
      manifest.dependencies?.["com.sidequest.creator-sdk"] ||
      lock.dependencies?.["com.sidequest.creator-sdk"]
    );
    const hasBanter = Boolean(
      manifest.dependencies?.["com.sidequest.banter"] ||
      lock.dependencies?.["com.sidequest.banter"]
    );

    if (hasCreator && hasBanter) return "hybrid";
    if (hasCreator) return "creator";
    if (hasBanter) return "banter";
    return "none";
  } catch {
    return "unknown";
  }
}

export function getSidequestSDKInfo(config: BanterMCPConfig): Record<string, unknown> {
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
    const unityVersion = readUnityVersion(config.unityProjectPath);
    const installedDefinitions = SDK_DEFINITIONS.filter((definition) =>
      Boolean(manifest.dependencies?.[definition.packageId] || lock.dependencies?.[definition.packageId])
    );

    if (installedDefinitions.length === 0) {
      return {
        success: true,
        installed: false,
        sdkProfile: "none",
        displayName: "No SideQuest SDK detected",
        unityVersion,
        checkedPackageIds: SDK_DEFINITIONS.map((definition) => definition.packageId),
        catalog: BANTER_SDK_COMPATIBILITY.catalog,
        readiness: {
          packageDetected: false,
          sourceResolved: false,
          editorDomainLoaded: "not-checked",
          sdkValidatorLoaded: "not-checked",
          hostedRuntime: "not-checked",
        },
        nextStep:
          "Install either com.sidequest.creator-sdk or com.sidequest.banter, then let Unity resolve packages.",
      };
    }

    const inspections = installedDefinitions.map((definition) => inspectPackage(
      config.unityProjectPath!,
      definition,
      manifest.dependencies?.[definition.packageId],
      lock.dependencies?.[definition.packageId],
      unityVersion
    ));
    const active = inspections.find((inspection) => inspection.definition.family === "creator")
      ?? inspections[0];
    const sdkProfile = inspections.length > 1 ? "hybrid" : active.definition.family;
    const displayName = inspections.length > 1
      ? "Hybrid Banter + Creator SDK"
      : active.definition.displayName;

    return {
      success: true,
      installed: true,
      sdkProfile,
      displayName,
      unityVersion,
      packageId: active.definition.packageId,
      package: active.package,
      packages: inspections.map((inspection) => ({
        family: inspection.definition.family,
        displayName: inspection.definition.displayName,
        packageId: inspection.definition.packageId,
        package: inspection.package,
        legacyStubsPresent: inspection.legacyStubsPresent,
      })),
      namespaces: {
        component: active.definition.componentNamespace,
        visualScripting: active.definition.visualScriptingNamespace,
      },
      validatorCandidates: inspections.map((inspection) => inspection.definition.validatorType),
      publicReleaseValidation: active.publicReleaseValidation,
      visualScripting: active.visualScripting,
      components: active.components,
      catalog: BANTER_SDK_COMPATIBILITY.catalog,
      readiness: {
        packageDetected: true,
        sourceResolved: typeof active.package.packageRoot === "string",
        editorDomainLoaded: "not-checked",
        sdkValidatorLoaded: "call validate_banter_visual_scripting",
        hostedRuntime: "requires target-client test",
      },
      compatibility: {
        legacyStubsPresent: active.legacyStubsPresent ?? false,
        authoringPolicy: active.definition.family === "creator"
          ? "Use concrete BS.* components and BS.VisualScripting nodes for new content. Treat legacy Banter aliases as compatibility inputs only."
          : "Use Banter.SDK components and Banter.VisualScripting nodes for this legacy project.",
        conversionPolicy:
          "Audit first. Convert only explicitly mapped components and graph member targets in duplicated assets; never rename raw .unity YAML blindly.",
      },
      caveat:
        "Source-class coverage and compatibility aliases do not prove hosted runtime support. Unity import, the selected SDK validator, and target-client testing remain authoritative.",
      ...(active.nextStep ? { nextStep: active.nextStep } : {}),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not inspect SideQuest SDK metadata",
    };
  }
}

function inspectPackage(
  projectRoot: string,
  definition: SDKDefinition,
  requestedVersion: string | undefined,
  locked: LockedPackage | undefined,
  unityVersion: string | undefined
): PackageInspection {
  const candidates = findPackageCandidates(projectRoot, definition.packageId);
  const selected = selectPackageCandidate(candidates, requestedVersion, locked, definition.packageId);
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
  const publicReleaseValidation = definition.family === "banter"
    ? matchPublicReleaseValidation(selected?.packageVersion, locked?.hash, unityVersion)
    : {
        status: "creator-sdk-not-in-legacy-matrix",
        packageVersion: selected?.packageVersion ?? locked?.version ?? requestedVersion,
        reason:
          "The embedded public release matrix covers com.sidequest.banter. Creator SDK validation is reported from the selected package and Unity runtime instead.",
      };

  if (!selected) {
    const reason = `Resolved ${definition.displayName} source was not found in Library/PackageCache or Packages.`;
    return {
      definition,
      package: packageInfo,
      publicReleaseValidation,
      visualScripting: unknownCoverage(reason),
      components: unknownCoverage(reason),
      nextStep: "Open the project in Unity and wait for Package Manager resolution, then inspect the SDK again.",
    };
  }

  const discoveredNodes = scanVisualScriptingClasses(
    selected.packageRoot,
    definition.visualScriptingNamespace
  );
  const catalogNodes = new Set(Object.keys(BANTER_CUSTOM_VS_NODES));
  const discoveredComponents = scanSceneComponents(selected.packageRoot);
  const catalogComponents = new Set(
    Object.values(BANTER_COMPONENTS)
      .filter((component) => component.kind !== "runtime-helper")
      .map((component) => componentNameForProfile(component.name, definition.family))
  );

  return {
    definition,
    package: packageInfo,
    publicReleaseValidation,
    visualScripting: {
      namespace: definition.visualScriptingNamespace,
      ...compareCoverage(catalogNodes, discoveredNodes),
    },
    components: {
      namespace: definition.componentNamespace,
      catalogNameTransform: definition.family === "creator" ? "Banter* -> BS*" : "none",
      ...compareCoverage(catalogComponents, discoveredComponents),
    },
    legacyStubsPresent: fs.existsSync(path.join(selected.packageRoot, "Runtime", "LegacyStubs")),
  };
}

function componentNameForProfile(name: string, family: SDKDefinition["family"]): string {
  return family === "creator" && name.startsWith("Banter")
    ? `BS${name.slice("Banter".length)}`
    : name;
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

function findPackageCandidates(projectRoot: string, packageId: string): PackageCandidate[] {
  const roots: string[] = [];
  const embedded = path.join(projectRoot, "Packages", packageId);
  if (fs.existsSync(path.join(embedded, "package.json"))) {
    roots.push(embedded);
  }

  const cacheRoot = path.join(projectRoot, "Library", "PackageCache");
  if (fs.existsSync(cacheRoot)) {
    for (const entry of fs.readdirSync(cacheRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith(`${packageId}@`)) {
        roots.push(path.join(cacheRoot, entry.name));
      }
    }
  }

  return roots.flatMap((packageRoot) => {
    try {
      const packageJson = readJson(path.join(packageRoot, "package.json")) as { name?: string; version?: string };
      if (packageJson.name !== packageId) {
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
  locked: LockedPackage | undefined,
  packageId: string
): PackageCandidate | undefined {
  return [...candidates]
    .map((candidate) => ({
      candidate,
      score: candidateScore(candidate, requestedVersion, locked, packageId),
    }))
    .sort((left, right) => right.score - left.score || left.candidate.packageRoot.localeCompare(right.candidate.packageRoot))[0]
    ?.candidate;
}

function candidateScore(
  candidate: PackageCandidate,
  requestedVersion: string | undefined,
  locked: LockedPackage | undefined,
  packageId: string
): number {
  let score = 0;
  const suffix = candidate.cacheIdentity.split("@").at(-1)?.toLowerCase() ?? "";
  if (locked?.hash && locked.hash.toLowerCase().startsWith(suffix)) score += 100;
  if (locked?.version && candidate.packageVersion === locked.version) score += 80;
  if (requestedVersion && candidate.packageVersion === requestedVersion) score += 40;
  if (candidate.cacheIdentity === packageId) score += 20;
  return score;
}

function scanVisualScriptingClasses(packageRoot: string, expectedNamespace: string): Set<string> {
  const sourceRoot = path.join(packageRoot, "VisualScripting");
  const result = new Set<string>();
  const escapedNamespace = expectedNamespace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const namespacePattern = new RegExp(`namespace\\s+${escapedNamespace}\\b`);
  for (const filePath of listCSharpFiles(sourceRoot)) {
    const source = stripCSharpComments(fs.readFileSync(filePath, "utf-8"));
    if (!namespacePattern.test(source)) continue;
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
    const classPattern = /(?:^|\n)\s*(?:(?:public|internal|private|protected|abstract|sealed|static|partial|new)\s+)*class\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:BanterComponentBase|BSComponentBase|UnityComponentBase)\b/g;
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
