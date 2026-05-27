import path from "node:path";
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

      files.push({
        absolutePath,
        relativePath,
        name: entry.name,
        extension,
        folder: folder === "." ? "" : folder,
        sizeBytes: stats.size,
        depth,
        modifiedAt: stats.mtime.toISOString()
      });
    }
  }

  await walk(root);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
