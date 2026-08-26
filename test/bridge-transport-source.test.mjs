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
