import assert from "node:assert/strict";
import test from "node:test";

import { createConfigForProject } from "../dist/lib/config.js";
import { handlePromptGet, registerPrompts } from "../dist/prompts/index.js";
import { BANTER_COMPONENTS } from "../dist/resources/banter-components.js";
import { BANTER_CUSTOM_VS_NODES } from "../dist/resources/banter-custom-vs-nodes.js";
import { BANTER_JS_API } from "../dist/resources/banter-js-api.js";
import {
  BANTER_WORKFLOW_IDS,
  BANTER_WORKFLOWS,
} from "../dist/resources/banter-workflows.js";
import { handleResourceRead, registerResources } from "../dist/resources/index.js";
import {
  TOOL_GROUP_NAMES,
  isToolEnabled,
  parseToolGroupSelection,
  registerTools,
} from "../dist/tools/index.js";

const focusedPromptNames = {
  "synced-object": "banter_synced_object_workflow",
  interaction: "banter_interaction_workflow",
  ui: "banter_ui_workflow",
  audio: "banter_audio_workflow",
  networking: "banter_networking_workflow",
  webroot: "banter_webroot_workflow",
};

test("Banter workflows reference real catalogue entries and callable tool profiles", () => {
  const registeredTools = new Set(registerTools().map((tool) => tool.name));

  assert.deepEqual(Object.keys(BANTER_WORKFLOWS), [...BANTER_WORKFLOW_IDS]);
  for (const workflow of Object.values(BANTER_WORKFLOWS)) {
    assert.ok(workflow.paths.length > 0, `${workflow.id} has no implementation path`);

    for (const component of workflow.evidence.components) {
      assert.ok(BANTER_COMPONENTS[component], `${workflow.id} references unknown component ${component}`);
    }
    for (const node of workflow.evidence.customVisualScriptingNodes) {
      assert.ok(BANTER_CUSTOM_VS_NODES[node], `${workflow.id} references unknown custom node ${node}`);
    }
    for (const api of workflow.evidence.javascriptApi) {
      assert.ok(hasJavascriptApi(api), `${workflow.id} references unknown JavaScript API ${api}`);
    }

    for (const path of workflow.paths) {
      assert.ok(path.requiredTools.length > 0, `${workflow.id}/${path.id} has no required tools`);
      for (const group of path.requiredToolGroups) {
        assert.ok(TOOL_GROUP_NAMES.includes(group), `${workflow.id}/${path.id} uses unknown group ${group}`);
      }
      const selection = parseToolGroupSelection(path.requiredToolGroups.join(","));
      for (const tool of path.requiredTools) {
        assert.ok(registeredTools.has(tool), `${workflow.id}/${path.id} references unknown tool ${tool}`);
        assert.ok(isToolEnabled(tool, selection), `${workflow.id}/${path.id} profile does not expose ${tool}`);
      }
    }
  }
});

test("workflow resource and focused prompts expose every workflow", () => {
  const config = createConfigForProject("");
  assert.ok(registerResources(config).some((resource) => resource.uri === "banter://workflows"));
  const payload = JSON.parse(handleResourceRead("banter://workflows", config).contents[0].text);
  assert.deepEqual(Object.keys(payload.workflows), [...BANTER_WORKFLOW_IDS]);
  assert.ok(payload.contract.preflight.some((step) => step.includes("get_banter_sdk_info")));
  const nodeLog = handleResourceRead("banter://custom-vs-node-log", config).contents[0].text;
  assert.match(nodeLog, /Source SHA256: [0-9A-F]{64}/);
  assert.doesNotMatch(nodeLog, /[A-Z]:[\\/](?:Users|home)[\\/]/i);

  const prompts = new Set(registerPrompts().map((prompt) => prompt.name));
  for (const [id, promptName] of Object.entries(focusedPromptNames)) {
    assert.ok(prompts.has(promptName));
    const text = handlePromptGet(promptName, { goal: `test ${id}` }).messages[0].content.text;
    assert.match(text, new RegExp(`'${id}' contract`));
    assert.match(text, /get_banter_sdk_info/);
    assert.match(text, new RegExp(`test ${id}`));
  }
});

test("generic workflow prompt fails closed for unknown domains", () => {
  assert.throws(
    () => handlePromptGet("banter_workflow", { workflow: "telepathy" }),
    /workflow must be one of/
  );
  const text = handlePromptGet("banter_workflow", {
    workflow: "networking",
    goal: "broadcast a round-start event",
  }).messages[0].content.text;
  assert.match(text, /broadcast a round-start event/);
  assert.match(text, /networking-graph/);
  assert.match(text, /networking-webroot/);
});

function hasJavascriptApi(reference) {
  const [owner, member] = reference.split(".");
  const apiOwner = BANTER_JS_API[owner];
  if (apiOwner) {
    return [...(apiOwner.methods ?? []), ...(apiOwner.staticMethods ?? [])]
      .some((method) => method.name === member);
  }
  return BANTER_COMPONENTS[owner]?.methods?.some((method) => method.name === member) ?? false;
}
