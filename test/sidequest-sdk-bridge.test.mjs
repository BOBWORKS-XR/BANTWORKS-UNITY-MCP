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

test("bridge discovers Creator SDK and legacy Banter validators in preference order", () => {
  const creatorIndex = bridge.indexOf('"BS.SDKEditor.ValidateVisualScripting"');
  const banterIndex = bridge.indexOf('"Banter.SDKEditor.ValidateVisualScripting"');

  assert.ok(creatorIndex >= 0);
  assert.ok(banterIndex > creatorIndex);
  assert.match(bridge, /string\[\] validatorAssemblyNames = \{ "BS\.SDKEditor", "Banter\.SDKEditor" \}/);
  assert.match(bridge, /result\.sdkProfile = validatorType\.FullName\.StartsWith\("BS\."/);
  assert.match(bridge, /No supported SideQuest Visual Scripting validator is available/);
});

test("bridge accepts BS components without enabling arbitrary project scripts", () => {
  assert.match(bridge, /"BS\."/);
  assert.match(bridge, /typeNamespace == "BS"/);
  assert.match(bridge, /typeNamespace\.StartsWith\("BS\.", StringComparison\.Ordinal\)/);
  assert.match(
    bridge,
    /assembly\.GetType\(typeName\);[\s\S]*?IsAllowedSDKComponentType\(type\) \|\| EnableCustomScripts/
  );
  assert.doesNotMatch(bridge, /typeNamespace\.StartsWith\("BS"\)/);
  assert.match(bridge, /Disabled \(SDK Only\)/);
  assert.match(bridge, /Unity built-in, Banter SDK, and Creator SDK components/);
});

test("bridge advertises dual-SDK support while retaining compatibility capability names", () => {
  assert.match(bridge, /"sidequest_sdk_profiles"/);
  assert.match(bridge, /"banter_visual_scripting"/);
  assert.match(bridge, /Ran SideQuest SDK Visual Scripting validation/);
});
