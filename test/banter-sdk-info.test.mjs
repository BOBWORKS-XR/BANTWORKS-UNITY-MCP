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

function createProject(packageVersion = "3.2.2", revision = undefined, unityVersion = "2022.3.39f1") {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "bantworks-banter-sdk-"));
  fs.mkdirSync(path.join(project, "Assets"));
  fs.mkdirSync(path.join(project, "Packages"));
  fs.mkdirSync(path.join(project, "ProjectSettings"));
  fs.writeFileSync(
    path.join(project, "ProjectSettings", "ProjectVersion.txt"),
    `m_EditorVersion: ${unityVersion}\n`
  );

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

function installCreatorSdkFixture(project, { version = "3.2.17", keepLegacy = false } = {}) {
  const manifestPath = path.join(project, "Packages", "manifest.json");
  const lockPath = path.join(project, "Packages", "packages-lock.json");
  const manifest = keepLegacy
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : { dependencies: {} };
  const lock = keepLegacy
    ? JSON.parse(fs.readFileSync(lockPath, "utf8"))
    : { dependencies: {} };
  manifest.dependencies["com.sidequest.creator-sdk"] = version;
  lock.dependencies["com.sidequest.creator-sdk"] = {
    version,
    depth: 0,
    source: "registry",
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  fs.writeFileSync(lockPath, JSON.stringify(lock));

  const packageRoot = path.join(
    project,
    "Library",
    "PackageCache",
    "com.sidequest.creator-sdk@creatorfixture"
  );
  fs.mkdirSync(path.join(packageRoot, "VisualScripting"), { recursive: true });
  fs.mkdirSync(
    path.join(packageRoot, "Runtime", "Scripts", "Scene", "Components"),
    { recursive: true }
  );
  fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({
    name: "com.sidequest.creator-sdk",
    version,
  }));

  const nodeClasses = Object.keys(BANTER_CUSTOM_VS_NODES)
    .map((name) => `public class ${name} {}`)
    .join("\n");
  fs.writeFileSync(
    path.join(packageRoot, "VisualScripting", "Nodes.cs"),
    `namespace BS.VisualScripting {\n${nodeClasses}\n}`
  );

  const componentClasses = Object.values(BANTER_COMPONENTS)
    .filter((component) => component.kind !== "runtime-helper")
    .map((component) => {
      const name = component.name.startsWith("Banter")
        ? `BS${component.name.slice("Banter".length)}`
        : component.name;
      return `public class ${name} : BSComponentBase {}`;
    })
    .join("\n");
  fs.writeFileSync(
    path.join(packageRoot, "Runtime", "Scripts", "Scene", "Components", "Components.cs"),
    componentClasses
  );
  return packageRoot;
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
    assert.equal(result.publicReleaseValidation.status, "unverified");
    assert.equal(result.visualScripting.status, "full");
    assert.equal(result.visualScripting.matchedCount, 162);
    assert.equal(result.visualScripting.additionalInPackage.includes("for"), false);
    assert.equal(result.components.status, "full");
    assert.equal(result.components.matchedCount, 63);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test("matches exact public release and Unity validation evidence", () => {
  const revision = "8cff56ed80a7f694d0de204a4fa7bfc660f6d503";
  const { project } = createProject("3.2.2", revision, "6000.3.2f1");
  try {
    const result = getBanterSDKInfo(createConfigForProject(project));
    assert.equal(result.success, true);
    assert.equal(result.publicReleaseValidation.status, "matched");
    assert.equal(result.publicReleaseValidation.profile.releaseTag, "3.2.2");
    assert.equal(result.publicReleaseValidation.profile.result, "passed");
    assert.equal(result.publicReleaseValidation.testFrameworkVersion, "1.6.0");
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test("surfaces known package compilation incompatibility for an exact release", () => {
  const revision = "a25b261db11d7ced12704a3a9ffc83778da3afd6";
  const { project } = createProject("3.0.2", revision, "6000.3.2f1");
  try {
    const result = getBanterSDKInfo(createConfigForProject(project));
    assert.equal(result.success, true);
    assert.equal(result.publicReleaseValidation.status, "matched");
    assert.equal(result.publicReleaseValidation.profile.result, "package compilation failed");
    assert.deepEqual(
      [...result.publicReleaseValidation.profile.diagnosticCodes],
      ["CS0619", "CS0029", "CS0266"]
    );
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test("does not generalize release evidence across Unity versions or source identities", () => {
  const revision = "8cff56ed80a7f694d0de204a4fa7bfc660f6d503";
  const exactRelease = createProject("3.2.2", revision, "2022.3.39f1");
  const registryBuild = createProject("3.2.2", undefined, "6000.3.2f1");
  const mismatchedMetadata = createProject("9.9.9", revision, "6000.3.2f1");
  try {
    const differentUnity = getBanterSDKInfo(createConfigForProject(exactRelease.project));
    assert.equal(differentUnity.publicReleaseValidation.status, "unity-version-unverified");
    assert.equal(differentUnity.publicReleaseValidation.testedUnityVersion, "6000.3.2f1");

    const differentSource = getBanterSDKInfo(createConfigForProject(registryBuild.project));
    assert.equal(differentSource.publicReleaseValidation.status, "different-source");
    assert.match(differentSource.publicReleaseValidation.reason, /Semantic version alone/);

    const metadataMismatch = getBanterSDKInfo(createConfigForProject(mismatchedMetadata.project));
    assert.equal(metadataMismatch.publicReleaseValidation.status, "source-metadata-mismatch");
    assert.equal(metadataMismatch.publicReleaseValidation.expectedPackageVersion, "3.2.2");
  } finally {
    fs.rmSync(exactRelease.project, { recursive: true, force: true });
    fs.rmSync(registryBuild.project, { recursive: true, force: true });
    fs.rmSync(mismatchedMetadata.project, { recursive: true, force: true });
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

test("detects Creator SDK and switches to concrete BS namespaces", () => {
  const { project } = createProject();
  try {
    installCreatorSdkFixture(project);
    const result = getBanterSDKInfo(createConfigForProject(project));

    assert.equal(result.success, true);
    assert.equal(result.installed, true);
    assert.equal(result.sdkProfile, "creator");
    assert.equal(result.packageId, "com.sidequest.creator-sdk");
    assert.equal(result.namespaces.component, "BS");
    assert.equal(result.namespaces.visualScripting, "BS.VisualScripting");
    assert.deepEqual(result.validatorCandidates, ["BS.SDKEditor.ValidateVisualScripting"]);
    assert.equal(result.visualScripting.status, "full");
    assert.equal(result.components.status, "full");
    assert.equal(result.publicReleaseValidation.status, "creator-sdk-not-in-legacy-matrix");
    assert.match(result.compatibility.authoringPolicy, /concrete BS\.\*/);
    assert.equal(result.readiness.packageDetected, true);
    assert.equal(result.readiness.sourceResolved, true);
    assert.equal(result.readiness.editorDomainLoaded, "not-checked");
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test("reports hybrid projects explicitly and prefers Creator SDK for new authoring", () => {
  const { project } = createProject();
  try {
    installCreatorSdkFixture(project, { keepLegacy: true });
    const result = getBanterSDKInfo(createConfigForProject(project));

    assert.equal(result.success, true);
    assert.equal(result.sdkProfile, "hybrid");
    assert.equal(result.packageId, "com.sidequest.creator-sdk");
    assert.equal(result.packages.length, 2);
    assert.deepEqual(result.validatorCandidates, [
      "BS.SDKEditor.ValidateVisualScripting",
      "Banter.SDKEditor.ValidateVisualScripting",
    ]);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
