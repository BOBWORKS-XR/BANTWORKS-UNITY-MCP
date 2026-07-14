/**
 * File helpers shared by MCP tools.
 *
 * The Unity bridge polls JSON files directly, so a completed write must become
 * visible as one operation. Temp files are kept in the same directory to make
 * the final rename atomic on the local filesystem.
 */
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

export function resolvePathWithin(root: string, requestedPath: string, label: string): string {
  if (!requestedPath || typeof requestedPath !== "string") {
    throw new Error(`${label} must be a non-empty relative path`);
  }

  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, requestedPath);
  const relative = path.relative(resolvedRoot, resolvedPath);

  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} must stay inside ${resolvedRoot}`);
  }

  return resolvedPath;
}

export function atomicWriteFileSync(filePath: string, contents: string): void {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });

  const temporaryPath = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`
  );

  try {
    fs.writeFileSync(temporaryPath, contents, "utf-8");
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}
