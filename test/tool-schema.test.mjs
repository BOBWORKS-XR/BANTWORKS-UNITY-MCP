import assert from "node:assert/strict";
import test from "node:test";

import { registerTools } from "../dist/tools/index.js";

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
