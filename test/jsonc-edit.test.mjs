import assert from "node:assert/strict";
import test from "node:test";

import {
  parseJsonc,
  updateJsoncManagedEntry,
} from "../scripts/cli/jsonc-edit.mjs";

const entry = {
  type: "local",
  command: ["node", "C:/Creator Works/server.mjs"],
  enabled: true,
  environment: {
    UNITY_PROJECT_PATH: "C:/Unity/Project",
    CREATOR_WORKS_TOOL_GROUPS: "read,author",
  },
};

test("OpenCode update preserves unrelated JSONC and accepts trailing commas", () => {
  const input = [
    "{",
    "  // Keep this user comment.",
    '  "theme": "https://example.com/a//b",',
    '  "quote": "say \\"hello\\"",',
    '  "mcp": {',
    "    /* Keep this server. */",
    '    "other": {',
    '      "type": "remote",',
    "    },",
    "    // Remove only the legacy managed entry.",
    '    "banter": {',
    '      "enabled": false,',
    "    },",
    "  },",
    "}",
  ].join("\n");

  const output = updateJsoncManagedEntry(
    input,
    "mcp",
    "creator-works",
    "banter",
    entry,
  );
  const parsed = parseJsonc(output);

  assert.match(output, /Keep this user comment/);
  assert.match(output, /Keep this server/);
  assert.match(output, /https:\/\/example\.com\/a\/\/b/);
  assert.match(output, /say \\"hello\\"/);
  assert.equal(parsed.mcp.other.type, "remote");
  assert.equal(parsed.mcp["creator-works"].enabled, true);
  assert.equal(parsed.mcp.banter, undefined);
  assert.equal(
    parsed.mcp["creator-works"].environment.CREATOR_WORKS_TOOL_GROUPS,
    "read,author",
  );
});

test("OpenCode update replaces only the managed value", () => {
  const input = [
    "{",
    '  "mcp": {',
    "    // Keep this user-owned comment.",
    '    "creator-works": { "enabled": false },',
    '    "other": { "enabled": true }',
    "  }",
    "}",
  ].join("\n");

  const output = updateJsoncManagedEntry(
    input,
    "mcp",
    "creator-works",
    "banter",
    entry,
  );
  const parsed = parseJsonc(output);

  assert.match(output, /Keep this user-owned comment/);
  assert.equal(parsed.mcp["creator-works"].enabled, true);
  assert.equal(parsed.mcp.other.enabled, true);
});

test("OpenCode update rejects a non-object mcp value", () => {
  assert.throws(
    () => updateJsoncManagedEntry(
      '{ "mcp": false }',
      "mcp",
      "creator-works",
      "banter",
      entry,
    ),
    /must be an object/,
  );
});