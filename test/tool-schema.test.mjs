import assert from "node:assert/strict";
import test from "node:test";

import { isValidUnityTestRunId, playModeStateMatches, registerTools } from "../dist/tools/index.js";

const tools = new Map(registerTools().map((tool) => [tool.name, tool]));

test("tool names are unique", () => {
  const names = registerTools().map((tool) => tool.name);
  assert.equal(new Set(names).size, names.length);
});

test("scene tools expose stable ID selectors with path compatibility", () => {
  for (const name of ["delete_gameobject", "modify_gameobject", "add_component", "get_object_bounds"]) {
    const schema = tools.get(name)?.inputSchema;
    assert.ok(schema, `missing ${name}`);
    assert.ok(schema.properties.objectId, `${name} must expose objectId`);
    assert.ok(schema.properties.objectPath, `${name} must retain objectPath`);
    assert.ok(
      schema.anyOf?.some((option) => option.required.includes("objectId")),
      `${name} must accept objectId`
    );
  }
});

test("component property writes expose typed values and component IDs", () => {
  const schema = tools.get("set_component_property")?.inputSchema;
  assert.ok(schema);
  assert.ok(schema.properties.componentId);
  assert.ok(schema.properties.value.oneOf);
  assert.ok(schema.properties.value.oneOf.some((option) => option.type === "boolean"));
  assert.ok(schema.properties.value.oneOf.some((option) => option.type === "array"));
});

test("batch tools advertise rollback-first behavior", () => {
  for (const name of ["batch_create", "batch_instantiate_prefabs"]) {
    const option = tools.get(name)?.inputSchema.properties.continueOnError;
    assert.ok(option, `missing ${name}.continueOnError`);
    assert.equal(option.default, false);
  }
});

test("Play Mode schema is bounded and state matching waits for compilation", () => {
  const schema = tools.get("control_play_mode")?.inputSchema;
  assert.deepEqual(schema?.properties.action.enum, ["play", "pause", "resume", "stop"]);
  assert.equal(schema?.properties.timeoutMs.maximum, 120000);

  assert.equal(
    playModeStateMatches("play", { isPlaying: true, isPaused: false, isCompiling: true }),
    false
  );
  assert.equal(
    playModeStateMatches("pause", { isPlaying: true, isPaused: true, isCompiling: false }),
    true
  );
  assert.equal(
    playModeStateMatches("stop", {
      isPlaying: false,
      isPaused: false,
      isCompiling: false,
      isPlayingOrWillChangePlaymode: true,
    }),
    false
  );
});

test("screenshot tool exposes bounded Game and Scene capture", () => {
  const schema = tools.get("capture_unity_screenshot")?.inputSchema;
  assert.deepEqual(schema?.properties.source.enum, ["game", "scene"]);
  assert.equal(schema?.properties.width.minimum, 64);
  assert.equal(schema?.properties.width.maximum, 2048);
  assert.equal(schema?.properties.height.maximum, 2048);
  assert.ok(schema?.properties.cameraId);
});

test("project discovery exposes packages and bounded AssetDatabase search", () => {
  const packages = tools.get("get_unity_packages")?.inputSchema;
  assert.equal(packages?.properties.directOnly.default, false);

  const assets = tools.get("search_unity_assets")?.inputSchema;
  assert.deepEqual(assets?.required, ["query"]);
  assert.equal(assets?.properties.limit.maximum, 500);
  assert.equal(assets?.properties.includePackages.default, false);
});

test("Unity Test Runner tools expose bounded filters and safe run IDs", () => {
  const run = tools.get("run_unity_tests")?.inputSchema;
  assert.deepEqual(run?.properties.mode.enum, ["edit", "play", "all"]);
  assert.equal(run?.properties.timeoutMs.maximum, 600000);
  assert.equal(run?.properties.maxResults.maximum, 5000);
  assert.equal(run?.properties.testNames.maxItems, 200);

  const status = tools.get("get_unity_test_run")?.inputSchema;
  assert.deepEqual(status?.required, ["runId"]);
  assert.equal(isValidUnityTestRunId("2a2aa2d2-10ef-41c7-b852-fbc43a95f30c"), true);
  assert.equal(isValidUnityTestRunId("../outside"), false);
});
