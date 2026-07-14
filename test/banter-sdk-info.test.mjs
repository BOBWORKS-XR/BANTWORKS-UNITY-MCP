import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createConfigForProject } from "../dist/lib/config.js";
import { BANTER_COMPONENTS, BANTER_COMPONENT_CATALOG_METADATA } from "../dist/resources/banter-components.js";
import { BANTER_CUSTOM_VS_NODES } from "../dist/resources/banter-custom-vs-nodes.js";
import { BANTER_SDK_COMPATIBILITY } from "../dist/resources/banter-sdk-compatibility.js";
import { getBanterSDKInfo } from "../dist/tools/get-banter-sdk-info.js";

function createProject(packageVersion = "3.2.2", revision = undefined) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "bantworks-banter-sdk-"));
  fs.mkdirSync(path.join(project, "Assets"));
  fs.mkdirSync(path.join(project, "Packages"));
  fs.mkdirSync(path.join(project, "ProjectSettings"));
  fs.writeFileSync(path.join(project, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.39f1\n");

  const requested = revision ? "https://github.com/SideQuestVR/BanterSDK.git#dev" : packageVersion;
  fs.writeFileSync(path.join(project, "Packages", "manifest.json"), JSON.stringify({
    dependencies: { "com.sidequest.banter": requested },
  }));
  fs.writeFileSync(path.join(project, "Packages", "packages-lock.json"), JSON.stringify({
    dependencies: {
      "com.sidequest.banter": {
        version: requested,
        depth: 0,
        source: revision ? "git" : "registry",
        ...(revision ? { hash: revision } : {}),
      },
    },
  }));

  const identity = revision ? revision.slice(0, 12) : "testfingerprint";
  const packageRoot = path.join(project, "Library", "PackageCache", `com.sidequest.banter@${identity}`);
  fs.mkdirSync(path.join(packageRoot, "VisualScripting"), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, "Runtime", "Scripts", "Scene", "Components"), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({
    name: "com.sidequest.banter",
    version: packageVersion,
  }));
  return { project, packageRoot };
}

test("catalogue metadata stays source-checked and machine-counted", () => {
  assert.equal(Object.keys(BANTER_CUSTOM_VS_NODES).length, 162);
  assert.equal(BANTER_SDK_COMPATIBILITY.catalog.visualScriptingEventCount, 48);
  assert.equal(BANTER_COMPONENT_CATALOG_METADATA.catalogEntryCount, 64);
  assert.equal(BANTER_COMPONENT_CATALOG_METADATA.publicSceneComponentCount, 63);
  assert.equal(BANTER_COMPONENT_CATALOG_METADATA.runtimeHelperCount, 1);
});

test("reports exact git provenance and full source-class coverage", () => {
  const revision = "44e873c3dea26a2d4e12bd2f837d614da926c54f";
  const { project, packageRoot } = createProject("3.2.1", revision);
  try {
    const nodeClasses = Object.keys(BANTER_CUSTOM_VS_NODES)
      .map((name) => `public class ${name} {}`)
      .join("\n");
    fs.writeFileSync(
      path.join(packageRoot, "VisualScripting", "Nodes.cs"),
      `namespace Banter.VisualScripting {\n${nodeClasses}\n// class for this comment must not be counted\n}`
    );

    const componentClasses = Object.values(BANTER_COMPONENTS)
      .filter((component) => component.kind !== "runtime-helper")
      .map((component) => `public class ${component.name} : BanterComponentBase {}`)
      .join("\n");
    fs.writeFileSync(
      path.join(packageRoot, "Runtime", "Scripts", "Scene", "Components", "Components.cs"),
      componentClasses
    );

    const result = getBanterSDKInfo(createConfigForProject(project));
    assert.equal(result.success, true);
    assert.equal(result.package.revision, revision);
    assert.equal(result.package.packageVersion, "3.2.1");
    assert.equal(result.visualScripting.status, "full");
    assert.equal(result.visualScripting.matchedCount, 162);
    assert.equal(result.visualScripting.additionalInPackage.includes("for"), false);
    assert.equal(result.components.status, "full");
    assert.equal(result.components.matchedCount, 63);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test("reports an installed package with unknown coverage until Package Manager resolves source", () => {
  const { project } = createProject();
  try {
    fs.rmSync(path.join(project, "Library"), { recursive: true, force: true });
    const result = getBanterSDKInfo(createConfigForProject(project));
    assert.equal(result.success, true);
    assert.equal(result.installed, true);
    assert.equal(result.visualScripting.status, "unknown");
    assert.match(result.nextStep, /Open the project in Unity/);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
