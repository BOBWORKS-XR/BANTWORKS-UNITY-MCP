import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { getUnityPackages } from "../dist/tools/get-unity-packages.js";

test("returns direct and resolved Unity package metadata", () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "bantworks-packages-"));
  try {
    fs.mkdirSync(path.join(project, "Packages"), { recursive: true });
    fs.mkdirSync(path.join(project, "ProjectSettings"), { recursive: true });
    fs.writeFileSync(path.join(project, "Packages", "manifest.json"), JSON.stringify({
      dependencies: { "com.unity.inputsystem": "1.7.0" },
    }));
    fs.writeFileSync(path.join(project, "Packages", "packages-lock.json"), JSON.stringify({
      dependencies: {
        "com.unity.inputsystem": { version: "1.7.0", depth: 0, source: "registry" },
        "com.unity.modules.ui": { version: "1.0.0", depth: 1, source: "builtin" },
      },
    }));
    fs.writeFileSync(path.join(project, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.39f1\n");

    const config = { unityProjectPath: project };
    const all = getUnityPackages(undefined, false, config);
    assert.equal(all.success, true);
    assert.equal(all.unityVersion, "2022.3.39f1");
    assert.equal(all.returnedPackageCount, 2);

    const direct = getUnityPackages("input", true, config);
    assert.equal(direct.returnedPackageCount, 1);
    assert.equal(direct.packages[0].direct, true);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
