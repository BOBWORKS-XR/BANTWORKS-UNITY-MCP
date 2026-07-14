/**
 * Check Import Status
 *
 * Verify that Unity has imported assets correctly.
 */

import * as fs from "fs";
import * as path from "path";
import type { BanterMCPConfig } from "../lib/config.js";

export interface ImportStatusResult {
  success: boolean;
  imported: boolean;
  errors?: string[];
  warnings?: string[];
  assetPath?: string;
  message?: string;
}

interface BridgeAssetStatus {
  path: string;
  hasErrors?: boolean;
  errors?: string[];
  warnings?: string[];
}

interface BridgeImportStatus {
  completed?: boolean;
  hasErrors?: boolean;
  errorMessage?: string;
  errors?: string[];
  warnings?: string[];
  timestamp?: number;
  assets?: BridgeAssetStatus[];
}

/**
 * Check the status of asset import in Unity
 */
export async function checkImportStatus(
  assetPath: string | undefined,
  waitForImport: boolean = true,
  timeoutMs: number = 10000,
  config: BanterMCPConfig
): Promise<ImportStatusResult> {
  const fullAssetPath = assetPath
    ? resolveAssetPath(assetPath, config)
    : undefined;

  if (fullAssetPath && !fs.existsSync(fullAssetPath)) {
    return {
      success: false,
      imported: false,
      message: "Asset file not found",
      assetPath,
    };
  }

  if (!config.hasUnityExtension) {
    // Can't check status without extension - just verify file exists
    if (assetPath) {
      const exists = Boolean(fullAssetPath && fs.existsSync(fullAssetPath));
      return {
        success: exists,
        imported: exists,
        message: exists
          ? "Asset file exists (cannot verify Unity import without MCP Bridge)"
          : "Asset file not found",
        assetPath,
      };
    }

    return {
      success: false,
      imported: false,
      message: "Unity MCP Bridge not detected. Cannot verify import status.",
    };
  }

  try {
    const statusPath = path.join(config.mcpStatePath, "import-status.json");

    if (waitForImport) {
      // Poll for import completion
      const startTime = Date.now();

      while (Date.now() - startTime < timeoutMs) {
        if (fs.existsSync(statusPath)) {
          const status = readStatus(statusPath);

          if (isStatusCurrentForAsset(status, fullAssetPath)) {
            return createResult(status, assetPath, fullAssetPath);
          }
        }

        // Wait before next check
        await sleep(250);
      }

      return {
        success: false,
        imported: false,
        message: `Timeout waiting for import status (${timeoutMs}ms)`,
        assetPath,
      };
    } else {
      // Just read current status
      if (!fs.existsSync(statusPath)) {
        return {
          success: false,
          imported: false,
          message: "No import status available",
        };
      }

      return createResult(readStatus(statusPath), assetPath, fullAssetPath);
    }
  } catch (error) {
    return {
      success: false,
      imported: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      message: "Error checking import status",
    };
  }
}

function resolveAssetPath(
  assetPath: string,
  config: BanterMCPConfig
): string {
  if (path.isAbsolute(assetPath)) {
    return path.normalize(assetPath);
  }

  const normalized = assetPath.replace(/\\/g, "/");
  if (normalized === "Assets" || normalized.startsWith("Assets/")) {
    return path.join(config.unityProjectPath, normalized);
  }

  return path.join(config.assetsPath, normalized);
}

function readStatus(statusPath: string): BridgeImportStatus {
  return JSON.parse(fs.readFileSync(statusPath, "utf-8")) as BridgeImportStatus;
}

function isStatusCurrentForAsset(
  status: BridgeImportStatus,
  fullAssetPath: string | undefined
): boolean {
  if (!status.completed) {
    return false;
  }

  if (!fullAssetPath) {
    return true;
  }

  if (!status.timestamp) {
    return false;
  }

  const assetModifiedAt = fs.statSync(fullAssetPath).mtimeMs;
  const metaPath = fullAssetPath.endsWith(".meta")
    ? fullAssetPath
    : `${fullAssetPath}.meta`;
  const metaModifiedAt = fs.existsSync(metaPath)
    ? fs.statSync(metaPath).mtimeMs
    : assetModifiedAt;

  // Filesystem timestamps can be slightly ahead of Date.now() on Windows.
  return status.timestamp + 1000 >= Math.max(assetModifiedAt, metaModifiedAt);
}

function createResult(
  status: BridgeImportStatus,
  assetPath: string | undefined,
  fullAssetPath: string | undefined
): ImportStatusResult {
  const assetStatus = assetPath
    ? status.assets?.find((candidate) =>
        pathsReferToSameAsset(candidate.path, assetPath)
      )
    : undefined;

  if (assetStatus) {
    const hasErrors = Boolean(assetStatus.hasErrors);
    return {
      success: !hasErrors,
      imported: true,
      errors: assetStatus.errors || [],
      warnings: assetStatus.warnings || [],
      assetPath: assetStatus.path,
      message: hasErrors
        ? "Asset imported with errors"
        : "Asset imported successfully",
    };
  }

  const errors = status.errors ||
    (status.errorMessage ? [status.errorMessage] : []);
  const hasErrors = Boolean(status.hasErrors || errors.length);

  if (assetPath && fullAssetPath) {
    const metaPath = fullAssetPath.endsWith(".meta")
      ? fullAssetPath
      : `${fullAssetPath}.meta`;
    const hasMetaFile = fs.existsSync(metaPath);
    const imported = Boolean(status.completed && hasMetaFile);

    return {
      success: imported && !hasErrors,
      imported,
      errors,
      warnings: status.warnings || [],
      assetPath,
      message: !hasMetaFile
        ? "Asset exists, but Unity has not created its .meta file"
        : hasErrors
          ? "Unity's latest import completed with errors"
          : "Asset and .meta file exist; Unity's latest import completed successfully",
    };
  }

  return {
    success: Boolean(status.completed && !hasErrors),
    imported: Boolean(status.completed),
    errors,
    warnings: status.warnings || [],
    message: hasErrors
      ? `Import completed with ${errors.length} errors`
      : "Import completed successfully",
  };
}

function pathsReferToSameAsset(candidate: string, requested: string): boolean {
  const normalize = (value: string) =>
    value.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
  const normalizedCandidate = normalize(candidate);
  const normalizedRequested = normalize(requested);

  return normalizedCandidate === normalizedRequested ||
    normalizedCandidate.endsWith(`/${normalizedRequested}`) ||
    normalizedRequested.endsWith(`/${normalizedCandidate}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
