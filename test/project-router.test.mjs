import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createConfigForProject } from "../dist/lib/config.js";
import { projectIdForPath, UnityProjectRouter } from "../dist/lib/project-router.js";

async function createUnityProject(root, name, updatedAt) {
  const projectPath = path.join(root, name);
  await mkdir(path.join(projectPath, "Assets", "Editor"), { recursive: true });
  await mkdir(path.join(projectPath, "ProjectSettings"), { recursive: true });
  await mkdir(path.join(projectPath, ".bantworks-mcp", "state"), { recursive: true });
  await writeFile(path.join(projectPath, "Assets", "Editor", "BanterMCPBridge.cs"), "// bridge");
  await writeFile(path.join(projectPath, ".bantworks-mcp", "state", "project-instance.json"), JSON.stringify({
    editorInstanceId: `${name}-instance`,
    projectPath,
    projectName: name,
    unityVersion: "2022.3.39f1",
    processId: 123,
    processStartedAt: updatedAt - 1000,
    updatedAt,
  }));
  return projectPath;
}

test("project router deduplicates launcher channels and snapshots selection per call", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bantworks-router-"));
  try {
    const now = Date.now();
    const projectA = await createUnityProject(root, "ProjectA", now);
    const projectB = await createUnityProject(root, "ProjectB", now - 20_000);
    const launcherPath = path.join(root, "launcher-config.json");
    await writeFile(launcherPath, JSON.stringify({
      active_channel_id: "channel-b",
      channels: [
        { id: "channel-a1", name: "Alpha", unity_project_path: projectA, scene_path: "A.unity", enabled: true },
        { id: "channel-a2", name: "Alpha Alt", unity_project_path: projectA, scene_path: "A2.unity", enabled: true },
        { id: "channel-b", name: "Beta", unity_project_path: projectB, scene_path: "B.unity", enabled: true },
      ],
    }));

    const router = new UnityProjectRouter(createConfigForProject(projectA), launcherPath);
    const listing = router.listProjects();
    assert.equal(listing.projects.length, 2);
    assert.equal(listing.activeProjectId, projectIdForPath(projectA));

    const alpha = listing.projects.find((project) => project.projectPath === projectA);
    const beta = listing.projects.find((project) => project.projectPath === projectB);
    assert.equal(alpha?.source, "environment+launcher");
    assert.equal(alpha?.channelIds.length, 2);
    assert.equal(alpha?.editorState, "live");
    assert.equal(beta?.editorState, "stale");

    const inFlightSnapshot = router.getActiveConfig();
    const selected = router.selectProject(projectIdForPath(projectB));
    assert.equal(selected.success, true);
    assert.equal(router.getActiveConfig().unityProjectPath, projectB);
    assert.equal(inFlightSnapshot.unityProjectPath, projectA);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("project router falls back to the launcher's active channel without an environment project", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bantworks-router-"));
  try {
    const projectA = await createUnityProject(root, "ProjectA", Date.now());
    const projectB = await createUnityProject(root, "ProjectB", Date.now());
    const launcherPath = path.join(root, "launcher-config.json");
    await writeFile(launcherPath, JSON.stringify({
      active_channel_id: "channel-b",
      channels: [
        { id: "channel-a", unity_project_path: projectA, enabled: true },
        { id: "channel-b", unity_project_path: projectB, enabled: true },
      ],
    }));

    const router = new UnityProjectRouter(createConfigForProject(""), launcherPath);
    assert.equal(router.getActiveConfig().unityProjectPath, projectB);
    assert.equal(router.selectProject("../outside").success, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
