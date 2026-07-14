import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const tauriVersion = JSON.parse(
  readFileSync("launcher/src-tauri/tauri.conf.json", "utf8")
).version;
const cargoManifest = readFileSync("launcher/src-tauri/Cargo.toml", "utf8");
const cargoVersion = cargoManifest.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const serverSource = readFileSync("src/index.ts", "utf8");
const serverVersion = serverSource.match(/name:\s*"banter-mcp",\s*\n\s*version:\s*"([^"]+)"/)?.[1];
const launcherHtml = readFileSync("launcher/src/index.html", "utf8");
const launcherUiVersion = launcherHtml.match(/id="appVersion">v([^<]+)</)?.[1];

assert.ok(packageVersion, "package.json version is missing");
assert.equal(tauriVersion, packageVersion, "Tauri config version does not match package.json");
assert.equal(cargoVersion, packageVersion, "Cargo package version does not match package.json");
assert.equal(serverVersion, packageVersion, "MCP protocol version does not match package.json");
assert.equal(launcherUiVersion, packageVersion, "Launcher UI version does not match package.json");

const releaseTag = process.env.GITHUB_REF_NAME;
if (releaseTag?.startsWith("v")) {
  assert.equal(releaseTag, `v${packageVersion}`, "Release tag does not match package.json");
}

console.log(`Version metadata is synchronized at ${packageVersion}`);
