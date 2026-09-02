import { createHash } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { BanterMCPConfig, createConfigForProject } from "./config.js";

interface LauncherProjectChannel {
  id?: string;
  name?: string;
  unity_project_path?: string;
  scene_path?: string | null;
  enabled?: boolean;
}

interface LauncherConfigFile {
  channels?: LauncherProjectChannel[];
  active_channel_id?: string | null;
}

interface ProjectInstanceState {
  editorInstanceId?: string;
  bridgeVersion?: string;
  protocolVersion?: number;
  minimumProtocolVersion?: number;
  capabilities?: string[];
  preferredTransport?: string;
  pipeName?: string;
  projectPath?: string;
  projectName?: string;
  unityVersion?: string;
  processId?: number;
  processStartedAt?: number;
  updatedAt?: number;
}

export interface UnityProjectRoute {
  projectId: string;
  projectPath: string;
  projectName: string;
  enabled: boolean;
  selected: boolean;
  source: "environment" | "launcher" | "environment+launcher" | "session";
  channelIds: string[];
  channelNames: string[];
  scenePaths: string[];
  validProject: boolean;
  bridgeInstalled: boolean;
  editorState: "live" | "stale" | "not_seen";
  editorInstance?: ProjectInstanceState;
}

export interface UnityProjectListResult {
  success: true;
  activeProjectId: string;
  activeProjectPath: string;
  launcherConfigPath: string;
  projects: UnityProjectRoute[];
  warnings: string[];
}

interface RouteCandidate {
  projectPath: string;
  fromEnvironment: boolean;
  fromSession: boolean;
  channels: LauncherProjectChannel[];
}

export class UnityProjectRouter {
  private activeProjectPath: string;
  private activeProjectId: string;
  private readonly environmentProjectPath: string;
  private readonly launcherConfigPath: string;

  constructor(initialConfig: BanterMCPConfig, launcherConfigPath = getLauncherConfigPath()) {
    this.launcherConfigPath = launcherConfigPath;
    this.environmentProjectPath = canonicalProjectPath(initialConfig.unityProjectPath);
    this.activeProjectPath = this.environmentProjectPath || launcherDefaultProjectPath(launcherConfigPath);
    this.activeProjectId = this.activeProjectPath ? projectIdForPath(this.activeProjectPath) : "";
  }

  getActiveConfig(): BanterMCPConfig {
    return createConfigForProject(this.activeProjectPath, this.activeProjectId);
  }

  listProjects(): UnityProjectListResult {
    const warnings: string[] = [];
    const launcher = readLauncherConfig(this.launcherConfigPath, warnings);
    const candidates = new Map<string, RouteCandidate>();

    const addCandidate = (projectPath: string, fromEnvironment: boolean, fromSession: boolean, channel?: LauncherProjectChannel) => {
      const canonical = canonicalProjectPath(projectPath);
      if (!canonical) return;
      const key = canonicalPathKey(canonical);
      const existing = candidates.get(key) ?? {
        projectPath: canonical,
        fromEnvironment: false,
        fromSession: false,
        channels: [],
      };
      existing.fromEnvironment ||= fromEnvironment;
      existing.fromSession ||= fromSession;
      if (channel) existing.channels.push(channel);
      candidates.set(key, existing);
    };

    addCandidate(this.environmentProjectPath, true, false);
    addCandidate(this.activeProjectPath, false, true);
    for (const channel of launcher.channels ?? []) {
      if (typeof channel.unity_project_path === "string") {
        addCandidate(channel.unity_project_path, false, false, channel);
      }
    }

    const projects = [...candidates.values()]
      .map((candidate) => buildProjectRoute(candidate, this.activeProjectId, this.environmentProjectPath))
      .sort((left, right) => {
        if (left.selected !== right.selected) return left.selected ? -1 : 1;
        const stateRank = { live: 0, stale: 1, not_seen: 2 } as const;
        if (left.editorState !== right.editorState) return stateRank[left.editorState] - stateRank[right.editorState];
        return left.projectName.localeCompare(right.projectName);
      });

    return {
      success: true,
      activeProjectId: this.activeProjectId,
      activeProjectPath: this.activeProjectPath,
      launcherConfigPath: this.launcherConfigPath,
      projects,
      warnings,
    };
  }

  selectProject(projectId: string): Record<string, unknown> {
    if (!isValidProjectId(projectId)) {
      return { success: false, error: "projectId has an invalid format." };
    }

    const listing = this.listProjects();
    const selected = listing.projects.find((project) => project.projectId === projectId);
    if (!selected) {
      return { success: false, error: `Unknown projectId: ${projectId}`, availableProjectIds: listing.projects.map((project) => project.projectId) };
    }
    if (!selected.enabled) {
      return { success: false, error: `Project route is disabled in the launcher: ${selected.projectName}` };
    }
    if (!selected.validProject) {
      return { success: false, error: `Unity project is missing or invalid: ${selected.projectPath}` };
    }

    this.activeProjectPath = selected.projectPath;
    this.activeProjectId = selected.projectId;
    return {
      success: true,
      activeProjectId: selected.projectId,
      activeProjectPath: selected.projectPath,
      projectName: selected.projectName,
      bridgeInstalled: selected.bridgeInstalled,
      editorState: selected.editorState,
      editorInstance: selected.editorInstance,
      message: "Selected this Unity project for subsequent calls in the current MCP session.",
    };
  }
}

export function getLauncherConfigPath(): string {
  const configuredPath = process.env.CREATOR_WORKS_LAUNCHER_CONFIG ?? process.env.BANTWORKS_LAUNCHER_CONFIG;
  if (configuredPath) {
    return path.resolve(configuredPath);
  }
  if (process.platform === "win32" && process.env.APPDATA) {
    const current = path.join(process.env.APPDATA, "creator-works-mcp", "launcher-config.json");
    const legacy = path.join(process.env.APPDATA, "banter-mcp", "launcher-config.json");
    return fs.existsSync(current) || !fs.existsSync(legacy) ? current : legacy;
  }
  const configRoot = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  const current = path.join(configRoot, "creator-works-mcp", "launcher-config.json");
  const legacy = path.join(configRoot, "banter-mcp", "launcher-config.json");
  return fs.existsSync(current) || !fs.existsSync(legacy) ? current : legacy;
}

export function projectIdForPath(projectPath: string): string {
  const key = canonicalPathKey(canonicalProjectPath(projectPath));
  if (!key) return "";
  return `unity-${createHash("sha256").update(key).digest("hex").slice(0, 20)}`;
}

export function isValidProjectId(projectId: string): boolean {
  return typeof projectId === "string" && /^unity-[a-f0-9]{20}$/.test(projectId);
}

function canonicalProjectPath(projectPath: string): string {
  if (typeof projectPath !== "string" || !projectPath.trim()) return "";
  return path.resolve(projectPath.trim());
}

function canonicalPathKey(projectPath: string): string {
  if (!projectPath) return "";
  return process.platform === "win32" ? projectPath.toLowerCase() : projectPath;
}

function readLauncherConfig(configPath: string, warnings: string[]): LauncherConfigFile {
  if (!fs.existsSync(configPath)) return { channels: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8")) as LauncherConfigFile;
    return { channels: Array.isArray(parsed.channels) ? parsed.channels : [], active_channel_id: parsed.active_channel_id };
  } catch (error) {
    warnings.push(`Could not parse launcher configuration: ${error instanceof Error ? error.message : "unknown error"}`);
    return { channels: [] };
  }
}

function launcherDefaultProjectPath(configPath: string): string {
  const launcher = readLauncherConfig(configPath, []);
  const channels = launcher.channels ?? [];
  const active = channels.find((channel) => channel.id === launcher.active_channel_id && channel.enabled !== false);
  const fallback = channels.find((channel) => channel.enabled !== false);
  return canonicalProjectPath(active?.unity_project_path || fallback?.unity_project_path || "");
}

function buildProjectRoute(
  candidate: RouteCandidate,
  activeProjectId: string,
  environmentProjectPath: string
): UnityProjectRoute {
  const projectId = projectIdForPath(candidate.projectPath);
  const assetsPath = path.join(candidate.projectPath, "Assets");
  const projectSettingsPath = path.join(candidate.projectPath, "ProjectSettings");
  const statePath = path.join(candidate.projectPath, ".bantworks-mcp", "state");
  const bridgePath = path.join(assetsPath, "Editor", "BanterMCPBridge.cs");
  const instance = readProjectInstance(path.join(statePath, "project-instance.json"));
  const updatedAt = instance?.updatedAt ?? readTimestamp(path.join(statePath, "editor-state.json"));
  const age = updatedAt ? Date.now() - updatedAt : Number.POSITIVE_INFINITY;
  const channelEnabled = candidate.channels.length === 0 || candidate.channels.some((channel) => channel.enabled !== false);
  const projectName = candidate.channels.find((channel) => channel.name)?.name || path.basename(candidate.projectPath);
  const fromEnvironment = candidate.fromEnvironment || canonicalPathKey(candidate.projectPath) === canonicalPathKey(environmentProjectPath);

  return {
    projectId,
    projectPath: candidate.projectPath,
    projectName,
    enabled: fromEnvironment || candidate.fromSession || channelEnabled,
    selected: projectId === activeProjectId,
    source: fromEnvironment && candidate.channels.length > 0
      ? "environment+launcher"
      : fromEnvironment ? "environment" : candidate.channels.length > 0 ? "launcher" : "session",
    channelIds: candidate.channels.flatMap((channel) => typeof channel.id === "string" ? [channel.id] : []),
    channelNames: candidate.channels.flatMap((channel) => typeof channel.name === "string" ? [channel.name] : []),
    scenePaths: candidate.channels.flatMap((channel) => typeof channel.scene_path === "string" ? [channel.scene_path] : []),
    validProject: fs.existsSync(assetsPath) && fs.existsSync(projectSettingsPath),
    bridgeInstalled: fs.existsSync(bridgePath),
    editorState: age <= 10_000 ? "live" : updatedAt ? "stale" : "not_seen",
    editorInstance: instance,
  };
}

function readProjectInstance(instancePath: string): ProjectInstanceState | undefined {
  try {
    return JSON.parse(fs.readFileSync(instancePath, "utf-8")) as ProjectInstanceState;
  } catch {
    return undefined;
  }
}

function readTimestamp(statePath: string): number | undefined {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf-8")) as { timestamp?: number };
    return typeof state.timestamp === "number" ? state.timestamp : undefined;
  } catch {
    return undefined;
  }
}
