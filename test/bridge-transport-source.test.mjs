import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "unity-extension", "Editor", "BanterMCPBridge.cs"),
  "utf-8"
);
const packageVersion = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;

test("Unity bridge advertises a versioned hybrid command protocol", () => {
  assert.ok(source.includes(`BridgeVersion = "${packageVersion}"`));
  assert.match(source, /BridgeProtocolVersion = 1/);
  assert.match(source, /"named_pipe_commands"/);
  assert.match(source, /"file_commands"/);
  assert.match(source, /preferredTransport = pipeServerAvailable \? "named_pipe" : "file"/);
});

test("pipe threads enqueue work and Unity drains it before file polling", () => {
  assert.match(source, /ConcurrentQueue<PendingPipeCommand>/);
  assert.match(source, /PendingPipeCommands\.Enqueue\(pending\)/);

  const updateStart = source.indexOf("private static void OnEditorUpdate()");
  const updateEnd = source.indexOf("private static void ExportProjectStateAutomatically()", updateStart);
  const update = source.slice(updateStart, updateEnd);
  assert.ok(update.indexOf("ProcessPendingPipeCommands();") < update.indexOf("ProcessCommands();"));
});

test("the background pipe loop does not call Unity serialization APIs", () => {
  const loopStart = source.indexOf("private static void PipeServerLoop()");
  const loopEnd = source.indexOf("private static string ReadBoundedPipeLine", loopStart);
  const loop = source.slice(loopStart, loopEnd);

  assert.doesNotMatch(loop, /JsonUtility|AssetDatabase|EditorApplication|GameObject|SceneManager/);
  assert.match(loop, /PendingPipeCommands\.Enqueue\(pending\)/);
});

test("every command is target-bound before Unity mutation", () => {
  const dispatchStart = source.indexOf("private static string ProcessCommandJson");
  const switchStart = source.indexOf("switch (baseCommand.type)", dispatchStart);
  const dispatchPrefix = source.slice(dispatchStart, switchStart);
  assert.match(dispatchPrefix, /ValidateCommandTarget\(baseCommand\)/);
  assert.match(source, /expectedProjectPath/);
  assert.match(source, /expectedEditorInstanceId/);
  assert.match(source, /StringComparison\.OrdinalIgnoreCase/);
});

test("pipe command completion is persisted for correlated status polling", () => {
  const drainStart = source.indexOf("private static void ProcessPendingPipeCommands()");
  const drainEnd = source.indexOf("private static void ProcessCommands()", drainStart);
  const drain = source.slice(drainStart, drainEnd);
  assert.match(drain, /WriteCommandResult\(result\)/);
  assert.match(source, /DeleteOldFiles\(CommandResultsFolder, "\*\.json", 200\)/);
  assert.match(source, /projectPath = ProjectRoot/);
  assert.match(source, /editorInstanceId = GetEditorInstanceId\(\)/);
});

test("screenshot results identify the actual camera and remain bounded", () => {
  assert.match(source, /cameraSelectionAmbiguous/);
  assert.match(source, /cameraCandidateCount/);
  assert.match(source, /Path\.Combine\(ScreenshotResultsFolder, cmd\.id \+ "\.json"\)/);
  assert.match(source, /DeleteOldFiles\(ScreenshotResultsFolder, "\*\.png", 20\)/);
  assert.match(source, /DeleteOldFiles\(ScreenshotResultsFolder, "\*\.json", 20\)/);
});
