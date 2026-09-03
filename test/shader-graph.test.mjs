import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  normalizeShaderGraphAssetPath,
  normalizeShaderGraphContentHash,
} from "../dist/tools/shader-graph.js";
import { registerTools } from "../dist/tools/index.js";

const tools = new Map(registerTools().map((tool) => [tool.name, tool]));
const bridgeSource = fs.readFileSync(
  new URL("../unity-extension/Editor/BanterMCPBridge.cs", import.meta.url),
  "utf8"
);

test("Shader Graph paths and mutation hashes fail closed", () => {
  assert.equal(
    normalizeShaderGraphAssetPath("Assets\\Graphs\\Water.shadergraph"),
    "Assets/Graphs/Water.shadergraph"
  );
  assert.equal(normalizeShaderGraphAssetPath("Assets/../Outside.shadergraph"), undefined);
  assert.equal(normalizeShaderGraphAssetPath("Packages/Demo.shadergraph"), undefined);
  assert.equal(normalizeShaderGraphAssetPath("C:/Outside.shadergraph"), undefined);

  const upperHash = "AB".repeat(32);
  assert.equal(normalizeShaderGraphContentHash(upperHash), upperHash.toLowerCase());
  assert.equal(normalizeShaderGraphContentHash("not-a-hash"), undefined);
});

test("Shader Graph mutation schemas require optimistic concurrency", () => {
  const add = tools.get("add_shader_graph_node")?.inputSchema;
  const connect = tools.get("connect_shader_graph_nodes")?.inputSchema;
  const create = tools.get("create_shader_graph")?.inputSchema;

  assert.ok(add?.required.includes("expectedContentHash"));
  assert.ok(connect?.required.includes("expectedContentHash"));
  assert.equal(connect?.properties.replaceExistingInput.default, false);
  assert.equal(create?.properties.expectedContentHash.pattern, "^[a-fA-F0-9]{64}$");
});

test("Shader Graph bridge uses package objects and verified transactional rollback", () => {
  assert.match(bridgeSource, /FileUtilities\.TryReadGraphDataFromDisk/);
  assert.match(bridgeSource, /MultiJson\.Serialize/);
  assert.match(bridgeSource, /EnsureExpectedShaderGraphHash/);
  assert.match(bridgeSource, /EnsureShaderGraphAssetIsNotOpen/);
  assert.match(bridgeSource, /replaceExistingInput=true/);
  assert.match(bridgeSource, /WriteAtomicBytes\(fullPath, original\)/);
  assert.match(bridgeSource, /Restored Shader Graph bytes did not match/);
  assert.doesNotMatch(bridgeSource, /File\.WriteAllBytes\(fullPath, original\)/);
});

test("Shader Graph reflection selection is signature-specific and fails on ambiguity", () => {
  assert.match(bridgeSource, /method\.Name == "IsCompatibleWith"[\s\S]*method\.GetParameters\(\)\.Length == 1/);
  assert.match(bridgeSource, /DefaultCategory"[\s\S]*parameter\.IsOptional/);
  assert.match(bridgeSource, /Shader Graph node name is ambiguous/);
  assert.match(bridgeSource, /pipeline=auto does not support the active render pipeline/);
});
