import assert from "node:assert/strict";
import test from "node:test";

import { encodeSerializedPropertyValue } from "../dist/tools/serialize-property-value.js";

test("encodes typed scalar values without losing legacy compatibility", () => {
  assert.deepEqual(encodeSerializedPropertyValue(true), {
    value: "true",
    valueJson: "true",
  });
  assert.deepEqual(encodeSerializedPropertyValue(2.5), {
    value: "2.5",
    valueJson: "2.5",
  });
});

test("distinguishes typed strings from legacy string payloads", () => {
  assert.deepEqual(encodeSerializedPropertyValue("hello"), {
    value: "hello",
    valueJson: "\"hello\"",
  });
});

test("preserves arrays and objects as JSON", () => {
  assert.deepEqual(encodeSerializedPropertyValue([1, 2, 3]), {
    value: "[1,2,3]",
    valueJson: "[1,2,3]",
  });
  assert.deepEqual(encodeSerializedPropertyValue({ center: [1, 2, 3], size: [4, 5, 6] }), {
    value: '{"center":[1,2,3],"size":[4,5,6]}',
    valueJson: '{"center":[1,2,3],"size":[4,5,6]}',
  });
});

test("rejects missing values", () => {
  assert.throws(() => encodeSerializedPropertyValue(undefined), /required/);
});
