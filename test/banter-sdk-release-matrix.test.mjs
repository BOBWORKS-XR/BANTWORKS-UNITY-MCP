import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { createConfigForProject } from "../dist/lib/config.js";
import { BANTER_SDK_COMPATIBILITY } from "../dist/resources/banter-sdk-compatibility.js";
import { handleResourceRead, registerResources } from "../dist/resources/index.js";

const matrix = JSON.parse(
  fs.readFileSync("compatibility/banter-sdk-release-matrix.json", "utf8")
);

test("Banter SDK release matrix pins stable public release commits", () => {
  assert.equal(matrix.schemaVersion, 1);
  assert.equal(matrix.source.repository, "https://github.com/SideQuestVR/BanterSDK.git");
  assert.equal(matrix.source.packageId, "com.sidequest.banter");

  const expected = new Map([
    ["3.0.2", {
      revision: "a25b261db11d7ced12704a3a9ffc83778da3afd6",
      outcome: "package-compilation-failed",
    }],
    ["3.1.2", {
      revision: "c75593e029cfcb7aecca6a880082f6d5d6853883",
      outcome: "package-compilation-failed",
    }],
    ["3.2.2", {
      revision: "8cff56ed80a7f694d0de204a4fa7bfc660f6d503",
      outcome: "passed",
    }],
  ]);
  assert.equal(matrix.entries.length, expected.size);
  assert.equal(new Set(matrix.entries.map((entry) => entry.id)).size, matrix.entries.length);

  for (const entry of matrix.entries) {
    assert.equal(entry.releaseTag, entry.packageVersion);
    assert.equal(entry.revision, expected.get(entry.releaseTag).revision);
    assert.equal(entry.expectedOutcome, expected.get(entry.releaseTag).outcome);
    assert.match(entry.revision, /^[0-9a-f]{40}$/);
    assert.match(entry.unityVersion, /^\d+\.\d+\.\d+[a-z]\d+$/);
    assert.match(entry.visualScriptingVersion, /^\d+\.\d+\.\d+$/);
    assert.match(entry.testFrameworkVersion, /^\d+\.\d+\.\d+$/);
    if (entry.expectedOutcome === "package-compilation-failed") {
      assert.deepEqual(entry.expectedDiagnosticCodes, ["CS0619", "CS0029", "CS0266"]);
    } else {
      assert.equal(entry.expectedDiagnosticCodes, undefined);
    }
  }

  const resourceMatrix = BANTER_SDK_COMPATIBILITY.publicReleaseValidationMatrix;
  assert.equal(resourceMatrix.sourceRepository, matrix.source.repository);
  assert.equal(resourceMatrix.selectionPolicy, matrix.selectionPolicy);
  assert.deepEqual(
    resourceMatrix.profiles.map((profile) => ({
      releaseTag: profile.releaseTag,
      packageVersion: profile.packageVersion,
      revision: profile.revision,
      expectedOutcome: profile.result === "passed" ? "passed" : "package-compilation-failed",
      expectedDiagnosticCodes: [...profile.diagnosticCodes],
    })),
    matrix.entries.map((entry) => ({
      releaseTag: entry.releaseTag,
      packageVersion: entry.packageVersion,
      revision: entry.revision,
      expectedOutcome: entry.expectedOutcome,
      expectedDiagnosticCodes: entry.expectedDiagnosticCodes ?? [],
    }))
  );

  const config = createConfigForProject("");
  assert.ok(registerResources(config).some((resource) => resource.uri === "banter://sdk-compatibility"));
  const resourcePayload = JSON.parse(
    handleResourceRead("banter://sdk-compatibility", config).contents[0].text
  );
  assert.deepEqual(resourcePayload.publicReleaseValidationMatrix, resourceMatrix);
});
