import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bridge = fs.readFileSync(
  path.join(root, "unity-extension", "Editor", "BanterMCPBridge.cs"),
  "utf8"
);

test("Editor menu commands block unsafe Editor states and built-in roots", () => {
  assert.match(bridge, /EditorApplication\.isCompiling \|\| EditorApplication\.isUpdating/);
  assert.match(bridge, /EditorApplication\.isPlayingOrWillChangePlaymode && !cmd\.allowInPlayMode/);
  assert.match(bridge, /activeScene\.isDirty && !cmd\.allowDirtyScene/);
  for (const rootName of ["File", "Edit", "Assets", "GameObject", "Component", "Window", "Help", "CONTEXT"]) {
    assert.match(bridge, new RegExp(`"${rootName}"`));
  }
});

test("Editor menu commands return correlated execution evidence", () => {
  assert.match(bridge, /EditorApplication\.ExecuteMenuItem\(menuPath\)/);
  assert.match(bridge, /Path\.Combine\(EditorMenuResultsFolder, cmd\.id \+ "\.json"\)/);
  assert.match(bridge, /result\.before = CaptureEditorOperationState|before = CaptureEditorOperationState/);
  assert.match(bridge, /result\.after = CaptureEditorOperationState\(\)/);
  assert.match(bridge, /result\.durationMs = Math\.Max/);
  assert.match(bridge, /LogType\.Exception/);
  assert.match(bridge, /LogType\.Assert/);
});
