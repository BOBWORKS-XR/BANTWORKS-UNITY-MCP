import * as fs from "fs";
import * as path from "path";

import type { BanterMCPConfig } from "../lib/config.js";

interface PackageManifest {
  dependencies?: Record<string, string>;
}

interface LockedPackage {
  version?: string;
  depth?: number;
  source?: string;
  url?: string;
  hash?: string;
  dependencies?: Record<string, string>;
}

interface PackagesLock {
  dependencies?: Record<string, LockedPackage>;
}

export function getUnityPackages(
  search: string | undefined,
  directOnly: boolean | undefined,
  config: BanterMCPConfig
): Record<string, unknown> {
  const packagesFolder = path.join(config.unityProjectPath, "Packages");
  const manifestPath = path.join(packagesFolder, "manifest.json");
  const lockPath = path.join(packagesFolder, "packages-lock.json");

  if (!fs.existsSync(manifestPath)) {
    return { success: false, error: `Unity package manifest not found: ${manifestPath}` };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as PackageManifest;
    const lock = fs.existsSync(lockPath)
      ? JSON.parse(fs.readFileSync(lockPath, "utf-8")) as PackagesLock
      : { dependencies: {} };
    const directDependencies = manifest.dependencies ?? {};
    const lockedDependencies = lock.dependencies ?? {};
    const packageNames = new Set([
      ...Object.keys(directDependencies),
      ...Object.keys(lockedDependencies),
    ]);
    const searchTerm = search?.trim().toLowerCase();

    const packages = [...packageNames]
      .map((name) => {
        const locked = lockedDependencies[name];
        const direct = Object.hasOwn(directDependencies, name);
        return {
          name,
          requestedVersion: direct ? directDependencies[name] : undefined,
          resolvedVersion: locked?.version ?? directDependencies[name],
          direct,
          depth: locked?.depth,
          source: locked?.source,
          url: locked?.url,
          hash: locked?.hash,
          dependencies: locked?.dependencies ?? {},
        };
      })
      .filter((entry) => directOnly !== true || entry.direct)
      .filter((entry) => !searchTerm ||
        entry.name.toLowerCase().includes(searchTerm) ||
        entry.resolvedVersion?.toLowerCase().includes(searchTerm))
      .sort((left, right) => left.name.localeCompare(right.name));

    return {
      success: true,
      unityVersion: readUnityVersion(config.unityProjectPath),
      directOnly: directOnly === true,
      directPackageCount: Object.keys(directDependencies).length,
      resolvedPackageCount: Object.keys(lockedDependencies).length,
      returnedPackageCount: packages.length,
      packages,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not read Unity package metadata",
    };
  }
}

function readUnityVersion(projectRoot: string): string | undefined {
  const versionPath = path.join(projectRoot, "ProjectSettings", "ProjectVersion.txt");
  if (!fs.existsSync(versionPath)) {
    return undefined;
  }

  const match = fs.readFileSync(versionPath, "utf-8").match(/^m_EditorVersion:\s*(.+)$/m);
  return match?.[1]?.trim();
}
