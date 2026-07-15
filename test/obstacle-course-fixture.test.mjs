import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const fixtureRoot = "compatibility/obstacle-course";
const provisionerPath = "scripts/setup-unity-obstacle-course.ps1";
const graphWriterPath = "scripts/write-obstacle-course-vs-fixture.mjs";

function read(relativePath) {
  return fs.readFileSync(relativePath, "utf8");
}

function filesUnder(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(root, entry.name);
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
}

test("obstacle fixture keeps serialized MonoBehaviours in matching source files", () => {
  const runtimeTypes = [
    "CourseMetadata",
    "DeterministicDoor",
    "KinematicMover",
    "KinematicRotator",
    "RespawnableBody",
    "RespawnTrigger",
  ];
  for (const type of runtimeTypes) {
    const source = read(`${fixtureRoot}/Runtime/${type}.cs`);
    assert.match(source, new RegExp(`public\\s+(?:sealed\\s+)?class\\s+${type}\\b`));
  }
});

test("obstacle fixture covers physics, persistence, and optional Banter validation", () => {
  const builder = read(`${fixtureRoot}/Editor/CompatibilityCourseBuilder.cs`);
  const validator = read(`${fixtureRoot}/Editor/VisualScriptingCompatibilityValidator.cs`);
  const mover = read(`${fixtureRoot}/Runtime/KinematicMover.cs`);
  const rotator = read(`${fixtureRoot}/Runtime/KinematicRotator.cs`);
  const asmdef = JSON.parse(read(`${fixtureRoot}/Editor/BantworksCompatibility.Editor.asmdef`));

  for (const method of [
    "CreateMovingPlatforms",
    "CreateRotatingObstacles",
    "CreateDoorSection",
    "CreateBallHazards",
    "CreateBanterIntegrationScene",
  ]) {
    assert.match(builder, new RegExp(`\\b${method}\\b`));
  }
  assert.match(mover, /FixedUpdate\s*\(\)/);
  assert.match(mover, /MovePosition\s*\(/);
  assert.match(rotator, /FixedUpdate\s*\(\)/);
  assert.match(rotator, /MoveRotation\s*\(/);
  assert.ok(asmdef.references.includes("Unity.VisualScripting.Core"));
  assert.ok(asmdef.references.includes("Unity.VisualScripting.Flow"));
  assert.match(validator, /validate_vs_graph_asset/);
  assert.match(validator, /set_asset_reference/);
  assert.match(validator, /validate_banter_visual_scripting/);
  assert.match(validator, /EditorSceneManager\.OpenScene/);
  assert.match(validator, /persistedMachine\.nest\.macro == graph/);
});

test("obstacle provisioner is marked-project-only and has bounded process cleanup", () => {
  const provisioner = read(provisionerPath);
  const graphWriter = read(graphWriterPath);

  assert.match(provisioner, /\.bantworks-obstacle-project\.json/);
  assert.match(provisioner, /Refusing to modify an existing project without/);
  assert.match(provisioner, /WaitForExit\(\$TimeoutSeconds \* 1000\)/);
  assert.match(provisioner, /Stop-UnityProcessTree -RootProcessId/);
  assert.match(provisioner, /Batchmode quit successfully invoked - shutting down!/);
  assert.match(provisioner, /StartsWith\(\s*\$projectPrefix/);
  assert.match(graphWriter, /\["unity", "banter"\]/);
  assert.match(graphWriter, /BantworksVisualScriptingProbe/);
});

test("public obstacle fixture contains no hard-coded local project or asset path", () => {
  const publicFiles = [
    ...filesUnder(fixtureRoot),
    provisionerPath,
    graphWriterPath,
  ];
  const combined = publicFiles.map(read).join("\n");
  for (const forbidden of [
    /["'][A-Za-z]:[\\/]/,
    /AppData[\\/]Roaming[\\/]Unity/i,
    /[A-Za-z0-9_-]+\.unitypackage/i,
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});
