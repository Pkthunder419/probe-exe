import { promises as fs } from "node:fs";
import type { CrawledFile, ContentAnalysis } from "../types";

const SAFE_TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".txt",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
  ".yml",
  ".yaml"
]);

const MAX_READ_BYTES = 750_000;

export async function analyzeFileContent(file: CrawledFile): Promise<ContentAnalysis> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.startsWith(".env")) {
    return emptyAnalysis(false, "environment files are intentionally not read");
  }

  if (!SAFE_TEXT_EXTENSIONS.has(file.extension)) {
    return emptyAnalysis(false, "non-text or unsupported extension");
  }

  if (file.sizeBytes > MAX_READ_BYTES) {
    return emptyAnalysis(false, "file is over safe read limit");
  }

  let text = "";

  try {
    text = await fs.readFile(file.absolutePath, "utf8");
  } catch {
    return emptyAnalysis(false, "file could not be read as utf8");
  }

  if (text.includes("\u0000")) {
    return emptyAnalysis(false, "binary-like file skipped");
  }

  const lines = text.split(/\r?\n/);
  const importMatches = text.match(/^\s*import\s.+from\s+["'][^"']+["'];?/gm) ?? [];
  const exportMatches = text.match(/^\s*export\s+/gm) ?? [];

  const hasJsx = /<[A-Z][A-Za-z0-9]*[\s>]/.test(text) || /<\w+[^>]*>/.test(text);
  const hasReact = /from\s+["']react["']/.test(text) || /\bReact\./.test(text);
  const hasUseClient = /["']use client["']/.test(text);
  const hasFetch = /\bfetch\s*\(/.test(text);
  const hasConsoleLog = /\bconsole\.log\s*\(/.test(text);
  const hasTodo = /\bTODO\b|\bFIXME\b/i.test(text);
  const hasPostHandler = /\bexport\s+async\s+function\s+POST\b|\bexport\s+function\s+POST\b/.test(text);
  const hasGetHandler = /\bexport\s+async\s+function\s+GET\b|\bexport\s+function\s+GET\b/.test(text);
  const hasDefaultExport = /\bexport\s+default\b/.test(text);

  const signals: string[] = [];

  if (hasUseClient) signals.push("client-component");
  if (hasReact) signals.push("react");
  if (hasJsx) signals.push("jsx");
  if (hasPostHandler) signals.push("post-handler");
  if (hasGetHandler) signals.push("get-handler");
  if (hasFetch) signals.push("fetch-call");
  if (hasDefaultExport) signals.push("default-export");
  if (hasTodo) signals.push("todo-or-fixme");
  if (hasConsoleLog) signals.push("console-log");

  if (lines.length >= 300) signals.push("large-source-room");
  if (importMatches.length >= 20) signals.push("high-import-room");

  return {
    readable: true,
    lineCount: lines.length,
    importCount: importMatches.length,
    exportCount: exportMatches.length,
    signals,
    hasJsx,
    hasReact,
    hasUseClient,
    hasFetch,
    hasConsoleLog,
    hasTodo,
    hasPostHandler,
    hasGetHandler,
    hasDefaultExport
  };
}

function emptyAnalysis(readable: boolean, skippedReason?: string): ContentAnalysis {
  return {
    readable,
    skippedReason,
    lineCount: 0,
    importCount: 0,
    exportCount: 0,
    signals: skippedReason ? [`skipped: ${skippedReason}`] : [],
    hasJsx: false,
    hasReact: false,
    hasUseClient: false,
    hasFetch: false,
    hasConsoleLog: false,
    hasTodo: false,
    hasPostHandler: false,
    hasGetHandler: false,
    hasDefaultExport: false
  };
}
