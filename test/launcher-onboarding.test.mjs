import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const launcherSource = fs.readFileSync("launcher/src-tauri/src/main.rs", "utf8");
const launcherHtml = fs.readFileSync("launcher/src/index.html", "utf8");
const launcherApp = fs.readFileSync("launcher/src/app.js", "utf8");
const tauriConfig = fs.readFileSync("launcher/src-tauri/tauri.conf.json", "utf8");
const runtimeStage = fs.readFileSync("scripts/stage-node-runtime.ps1", "utf8");

test("guided setup accepts a Unity project folder and configures selected clients", () => {
  assert.match(launcherSource, /fn add_project\(/);
  assert.match(launcherSource, /fn discover_unity_projects\(/);
  assert.match(launcherSource, /fn one_click_setup\(/);
  assert.match(launcherSource, /fn update_configured_unity_extensions\(/);
  assert.match(launcherApp, /invoke\('one_click_setup'/);
  assert.match(launcherApp, /invoke\('update_configured_unity_extensions'/);
  assert.match(launcherHtml, /Select a Unity project folder/);
  assert.match(launcherHtml, /Update Bridges/);
  assert.doesNotMatch(launcherHtml, /Add Scene Channel/);
});

test("launcher-managed clients use a pinned private Node runtime", () => {
  assert.match(launcherSource, /resolve_node_command/);
  assert.match(launcherSource, /"command": node_command/);
  assert.match(launcherSource, /command = \\\"\{\}\\\"/);
  assert.match(tauriConfig, /release\/runtime\/node\.exe/);
  assert.match(runtimeStage, /24\.17\.0/);
  assert.match(runtimeStage, /ArchiveSha256/);
  assert.match(runtimeStage, /NodeExeSha256/);
});

test("launcher presents Creator Works as the AI-facing MCP identity", () => {
  assert.match(launcherHtml, /Creator Works MCP/);
  assert.match(launcherSource, /const MCP_CLIENT_ID: &str = "creator-works"/);
  assert.match(launcherSource, /const TOOL_GROUPS_ENV: &str = "CREATOR_WORKS_TOOL_GROUPS"/);
  assert.match(launcherSource, /LEGACY_MCP_CLIENT_ID/);
  assert.doesNotMatch(launcherHtml, /BANTWORKS MCP/);
});
