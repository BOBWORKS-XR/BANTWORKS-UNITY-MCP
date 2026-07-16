import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const bridgePath = "unity-extension/Editor/BanterMCPBridge.cs";
const bridge = fs.readFileSync(bridgePath, "utf8");

function blockStartingAt(marker) {
  const markerIndex = bridge.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Missing bridge marker: ${marker}`);
  const openIndex = bridge.indexOf("{", markerIndex);
  assert.notEqual(openIndex, -1, `Missing opening brace after: ${marker}`);

  let depth = 0;
  for (let index = openIndex; index < bridge.length; index += 1) {
    if (bridge[index] === "{") depth += 1;
    if (bridge[index] === "}") depth -= 1;
    if (depth === 0) return bridge.slice(openIndex + 1, index);
  }
  assert.fail(`Missing closing brace after: ${marker}`);
}

test("automatic full-state export is disabled throughout Play-mode transitions by default", () => {
  assert.match(
    bridge,
    /get\s*=>\s*EditorPrefs\.GetBool\(BackgroundStateExportKey, false\)/
  );
  assert.match(
    bridge,
    /!EditorApplication\.isPlayingOrWillChangePlaymode\s*\|\|\s*BackgroundStateExportInPlayMode/
  );

  const automaticExport = blockStartingAt("private static void ExportProjectStateAutomatically()");
  assert.match(automaticExport, /if \(!AutomaticStateExportAllowed\)\s*return;/);
  assert.match(automaticExport, /AutomaticStateExportProfilerMarker\.Auto\(\)/);
  assert.match(automaticExport, /ExportProjectState\(\);/);

  for (const callback of [
    "static BantworksMCPBridge()",
    "private static void OnSceneOpened",
    "private static void OnSceneSaved",
  ]) {
    const body = blockStartingAt(callback);
    assert.match(body, /ScheduleAutomaticStateExport\(\);/);
    assert.doesNotMatch(body, /ExportProjectState\(\);/);
    assert.doesNotMatch(body, /ExportSceneHierarchy\(\);/);
  }
});

test("Edit mode uses lightweight heartbeats and event-driven full exports", () => {
  const update = blockStartingAt("private static void OnEditorUpdate()");
  assert.match(update, /ProcessCommands\(\);/);
  assert.match(update, /ExportEditorState\(\);/);
  assert.match(update, /automaticStateExportPending/);
  assert.match(update, /ExportProjectStateAutomatically\(\);/);
  assert.doesNotMatch(
    bridge,
    /private static readonly double StateExportInterval\s*=\s*2\.0/
  );
  assert.match(bridge, /PeriodicPlayModeStateExportInterval\s*=\s*2\.0/);
  assert.match(
    update,
    /EditorApplication\.isPlaying\s*&&\s*BackgroundStateExportInPlayMode/
  );

  for (const callback of [
    "private static void OnHierarchyChanged",
    "private static void OnProjectChanged",
    "private static void OnUndoRedoPerformed",
    "private static UndoPropertyModification[] OnPostprocessModifications",
  ]) {
    assert.match(blockStartingAt(callback), /ScheduleAutomaticStateExport\(\);/);
  }
});

test("Play mode keeps command polling and explicit full exports operational", () => {
  const update = blockStartingAt("private static void OnEditorUpdate()");
  assert.ok(
    update.indexOf("ProcessCommands();") < update.indexOf("ExportProjectStateAutomatically();"),
    "Command polling must remain independent of the automatic export policy"
  );

  const refresh = blockStartingAt("private static void RefreshState()");
  assert.match(refresh, /ExportProjectState\(\);/);
  assert.match(bridge, /case "export-state":\s*ExportProjectState\(\);/);
  assert.match(bridge, /new ProfilerMarker\("BANTWORKS MCP\.AutomaticStateExport"\)/);
  assert.match(bridge, /new ProfilerMarker\("BANTWORKS MCP\.ExportProjectState"\)/);
});

test("launcher and setup package the source-of-truth bridge", () => {
  const tauri = fs.readFileSync("launcher/src-tauri/tauri.conf.json", "utf8");
  const setup = fs.readFileSync("setup.ps1", "utf8");
  assert.match(
    tauri,
    /"\.\.\/\.\.\/unity-extension\/Editor\/BanterMCPBridge\.cs"\s*:\s*"server\/unity-extension\/Editor\/BanterMCPBridge\.cs"/
  );
  assert.match(
    tauri,
    /"\.\.\/\.\.\/release\/runtime\/node\.exe"\s*:\s*"server\/runtime\/node\.exe"/
  );
  assert.match(setup, /unity-extension\\Editor\\BanterMCPBridge\.cs/);
});
