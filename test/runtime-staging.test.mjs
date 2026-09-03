import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveChecksums,
  verifyExpectedChecksum,
} from "../scripts/stage-node-runtime.mjs";

const targets = [
  "win-x64",
  "linux-x64",
  "linux-arm64",
  "darwin-x64",
  "darwin-arm64",
];

test("Node 24.17.0 has complete checksum pins for every supported target", () => {
  for (const target of targets) {
    const checksums = resolveChecksums("24.17.0", target, {});
    assert.match(checksums.archiveSha256, /^[a-f0-9]{64}$/);
    assert.match(checksums.binarySha256, /^[a-f0-9]{64}$/);
    assert.equal(checksums.source, "embedded pinned checksums");
  }
});

test("runtime staging fails closed when an alternate version has no checksums", () => {
  assert.throws(
    () => resolveChecksums("99.0.0", "linux-x64", {}),
    /No complete checksum pin/,
  );
});

test("runtime staging rejects a mismatched checksum", () => {
  assert.throws(
    () => verifyExpectedChecksum("Node.js archive", "expected", "actual"),
    /checksum mismatch/,
  );
  assert.throws(
    () => verifyExpectedChecksum("Node.js archive", "", "actual"),
    /Missing expected checksum/,
  );
});