import path from "node:path";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import type { CrawledFile } from "../types";

const IGNORED_FOLDERS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".turbo",
  ".probe"
]);

const MAX_HASH_BYTES = 5_000_000;

export async function crawlProject(rootPath: string): Promise<CrawledFile[]> {
  const files: CrawledFile[] = [];
  const root = path.resolve(rootPath);

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_FOLDERS.has(entry.name)) continue;
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;

      const stats = await fs.stat(absolutePath);
      const relativePath = path.relative(root, absolutePath).replaceAll("\\", "/");
      const folder = path.dirname(relativePath).replaceAll("\\", "/");
      const extension = path.extname(entry.name).toLowerCase();
      const depth = relativePath.split("/").length - 1;
      const hashInfo = await hashFileIfSafe(absolutePath, entry.name, stats.size);

      files.push({
        absolutePath,
        relativePath,
        name: entry.name,
        extension,
        folder: folder === "." ? "" : folder,
        sizeBytes: stats.size,
        depth,
        modifiedAt: stats.mtime.toISOString(),
        contentHash: hashInfo.contentHash,
        hashSkippedReason: hashInfo.hashSkippedReason
      });
    }
  }

  await walk(root);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function hashFileIfSafe(
  absolutePath: string,
  fileName: string,
  sizeBytes: number
): Promise<{ contentHash?: string; hashSkippedReason?: string }> {
  const lowerName = fileName.toLowerCase();

  if (lowerName.startsWith(".env")) {
    return { hashSkippedReason: "environment file hash skipped" };
  }

  if (sizeBytes === 0) {
    return { contentHash: "sha256-empty-file" };
  }

  if (sizeBytes > MAX_HASH_BYTES) {
    return { hashSkippedReason: "file above hash size limit" };
  }

  try {
    const buffer = await fs.readFile(absolutePath);
    const hash = createHash("sha256").update(buffer).digest("hex");
    return { contentHash: `sha256-${hash}` };
  } catch {
    return { hashSkippedReason: "hash read failed" };
  }
}
