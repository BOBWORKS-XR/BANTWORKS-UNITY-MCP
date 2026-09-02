import assert from "node:assert/strict";
import test from "node:test";

import { createConfigForProject } from "../dist/lib/config.js";
import { handleResourceRead, registerResources } from "../dist/resources/index.js";
import {
  ALWAYS_AVAILABLE_TOOLS,
  TOOL_GROUP_MEMBERSHIP,
  TOOL_GROUP_NAMES,
  describeToolGroupSelection,
  handleToolCall,
  parseToolGroupSelection,
  registerTools,
} from "../dist/tools/index.js";

test("tool groups cover every registered tool", () => {
  const allTools = registerTools().map((tool) => tool.name);
  const covered = new Set(ALWAYS_AVAILABLE_TOOLS);
  for (const group of TOOL_GROUP_NAMES) {
    for (const name of TOOL_GROUP_MEMBERSHIP[group]) covered.add(name);
  }

  assert.equal(allTools.length, 50);
  assert.deepEqual([...covered].sort(), [...allTools].sort());
});

test("tool group resource is generated from the enforced membership", () => {
  const config = createConfigForProject("");
  assert.ok(registerResources(config).some((resource) => resource.uri === "banter://tool-groups"));
  const response = handleResourceRead("banter://tool-groups", config);
  const payload = JSON.parse(response.contents[0].text);

  assert.deepEqual(payload.alwaysAvailable.sort(), [...ALWAYS_AVAILABLE_TOOLS].sort());
  for (const group of TOOL_GROUP_NAMES) {
    assert.deepEqual(payload.groups[group].sort(), [...TOOL_GROUP_MEMBERSHIP[group]].sort());
  }
});

test("tool group parsing is composable and rejects ambiguous configuration", () => {
  assert.equal(parseToolGroupSelection(undefined), "all");
  assert.equal(parseToolGroupSelection(" ALL "), "all");
  assert.equal(describeToolGroupSelection(parseToolGroupSelection("none")), "none");
  assert.equal(
    describeToolGroupSelection(parseToolGroupSelection("banter, read,banter")),
    "read,banter"
  );

  assert.throws(() => parseToolGroupSelection("all,read"), /cannot combine/i);
  assert.throws(() => parseToolGroupSelection("none,test"), /cannot combine/i);
  assert.throws(() => parseToolGroupSelection("admin"), /Unknown CREATOR_WORKS_TOOL_GROUPS/);
  assert.throws(() => parseToolGroupSelection(",,,"), /must contain/);
});

test("limited selections retain project routing and expose only selected capabilities", () => {
  const minimalNames = registerTools(parseToolGroupSelection("none")).map((tool) => tool.name);
  assert.deepEqual(minimalNames.sort(), [...ALWAYS_AVAILABLE_TOOLS].sort());

  const readNames = new Set(registerTools(parseToolGroupSelection("read")).map((tool) => tool.name));
  assert.ok(readNames.has("query_project_state"));
  assert.ok(readNames.has("capture_unity_screenshot"));
  assert.ok(!readNames.has("create_gameobject"));
  assert.ok(!readNames.has("run_unity_tests"));

  const banterNames = new Set(registerTools(parseToolGroupSelection("banter")).map((tool) => tool.name));
  assert.ok(banterNames.has("write_vs_graph"));
  assert.ok(banterNames.has("validate_banter_visual_scripting"));
  assert.ok(!banterNames.has("modify_gameobject"));
});

test("disabled tools cannot be invoked by name", async () => {
  await assert.rejects(
    handleToolCall(
      "create_gameobject",
      {},
      createConfigForProject(""),
      undefined,
      parseToolGroupSelection("read")
    ),
    /disabled by CREATOR_WORKS_TOOL_GROUPS/
  );
});
