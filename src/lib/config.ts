/**
 * Configuration management for Banter MCP
 */

import * as fs from "fs";
import * as path from "path";

export interface BanterMCPConfig {
  /** Path to the Unity project root */
  unityProjectPath: string;
  /** Path to the MCP state directory within Unity project */
  mcpStatePath: string;
  /** Path to the MCP commands directory */
  mcpCommandsPath: string;
  /** Path to the Assets folder */
  assetsPath: string;
  /** Path to WebRoot folder (for built scenes) */
  webRootPath: string;
  /** Whether the Unity extension is detected */
  hasUnityExtension: boolean;
}

/**
 * Get configuration from environment or defaults
 */
export function getConfig(): BanterMCPConfig {
  const unityProjectPath = process.env.UNITY_PROJECT_PATH || process.env.BANTER_PROJECT_PATH || "";

  const assetsPath = path.join(unityProjectPath, "Assets");
  const mcpStatePath = path.join(assetsPath, "_MCP", "state");
  const mcpCommandsPath = path.join(assetsPath, "_MCP", "commands");
  const webRootPath = path.join(assetsPath, "WebRoot");

  // Check if Unity extension is installed by looking for state directory
  const hasUnityExtension = fs.existsSync(mcpStatePath);

  return {
    unityProjectPath,
    mcpStatePath,
    mcpCommandsPath,
    assetsPath,
    webRootPath,
    hasUnityExtension,
  };
}

/**
 * Ensure the MCP directories exist in Unity project
 */
export function ensureMCPDirectories(config: BanterMCPConfig): void {
  if (!config.unityProjectPath) {
    throw new Error("UNITY_PROJECT_PATH environment variable not set");
  }

  const dirs = [config.mcpStatePath, config.mcpCommandsPath];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Check if Unity project is valid
 */
export function validateUnityProject(config: BanterMCPConfig): { valid: boolean; error?: string } {
  if (!config.unityProjectPath) {
    return { valid: false, error: "UNITY_PROJECT_PATH not set" };
  }

  if (!fs.existsSync(config.unityProjectPath)) {
    return { valid: false, error: `Unity project path does not exist: ${config.unityProjectPath}` };
  }

  if (!fs.existsSync(config.assetsPath)) {
    return { valid: false, error: `Assets folder not found: ${config.assetsPath}` };
  }

  return { valid: true };
}
