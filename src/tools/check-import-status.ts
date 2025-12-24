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

/**
 * Check the status of asset import in Unity
 */
export async function checkImportStatus(
  assetPath: string | undefined,
  waitForImport: boolean = true,
  timeoutMs: number = 10000,
  config: BanterMCPConfig
): Promise<ImportStatusResult> {
  if (!config.hasUnityExtension) {
    // Can't check status without extension - just verify file exists
    if (assetPath) {
      const fullPath = path.join(config.assetsPath, assetPath);
      const exists = fs.existsSync(fullPath);
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
          const status = JSON.parse(fs.readFileSync(statusPath, "utf-8"));

          // Check if this is a recent status update
          if (status.timestamp && Date.now() - status.timestamp < 5000) {
            // Check if specific asset was imported
            if (assetPath) {
              const assetStatus = status.assets?.find(
                (a: { path: string }) => a.path.includes(assetPath)
              );

              if (assetStatus) {
                return {
                  success: !assetStatus.hasErrors,
                  imported: true,
                  errors: assetStatus.errors || [],
                  warnings: assetStatus.warnings || [],
                  assetPath: assetStatus.path,
                  message: assetStatus.hasErrors
                    ? "Asset imported with errors"
                    : "Asset imported successfully",
                };
              }
            } else {
              // Return overall status
              return {
                success: !status.hasErrors,
                imported: status.completed,
                errors: status.errors || [],
                warnings: status.warnings || [],
                message: status.hasErrors
                  ? `Import completed with ${status.errors?.length || 0} errors`
                  : "Import completed successfully",
              };
            }
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

      const status = JSON.parse(fs.readFileSync(statusPath, "utf-8"));

      return {
        success: !status.hasErrors,
        imported: status.completed,
        errors: status.errors || [],
        warnings: status.warnings || [],
        message: status.message || "Status retrieved",
      };
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
