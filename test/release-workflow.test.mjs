import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseWorkflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "release.yml"),
  "utf8"
);

test("release checksums use GitHub-normalized asset names", () => {
  assert.match(
    releaseWorkflow,
    /\$releaseAssetName = \$artifact\.Name\.Replace\(" ", "\."\)/
  );
  assert.match(releaseWorkflow, /"\$hash  \$releaseAssetName"/);
});

test("release metadata states the enforced standalone Node requirement", () => {
  assert.match(releaseWorkflow, /standalone ZIP remains available for manual Node\.js 20\+ deployments/);
  assert.doesNotMatch(releaseWorkflow, /Node\.js 18\+/);
});
