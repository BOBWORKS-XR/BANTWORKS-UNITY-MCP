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

test("Unity graph validation fails closed on unbound ValueInput ports", () => {
  assert.match(bridge, /GetProperty\("valueInputs", flags\)/);
  assert.match(bridge, /ReadBooleanProperty\(input, inputRuntimeType, "hasValidConnection", flags\)/);
  assert.match(bridge, /ReadBooleanProperty\(input, inputRuntimeType, "hasDefaultValue", flags\)/);
  assert.match(bridge, /result\.unboundValueInputCount\+\+/);
  assert.match(
    bridge,
    /cmd\.allowUnboundValueInputs \|\| result\.unboundValueInputCount == 0/
  );
  assert.match(bridge, /MissingValuePortInputException/);
});

test("unbound port diagnostics retain the unit and input identity", () => {
  for (const field of ["unitType", "unitGuid", "portKey", "expectedType"]) {
    assert.match(bridge, new RegExp(`public string ${field};`));
  }
  assert.match(bridge, /unboundValueInputs = new List<VSValueInputDiagnostic>\(\)/);
  assert.match(bridge, /result\.unboundValueInputs\.Count >= 200/);
});
