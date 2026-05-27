import type { ContentAnalysis, CrawledFile, FileRole } from "../types";

export function classifyFile(file: CrawledFile, analysis?: ContentAnalysis): {
  role: FileRole;
  roomType: string;
  landmark: boolean;
  xpValue: number;
} {
  const p = file.relativePath.toLowerCase();
  const name = file.name.toLowerCase();
  const ext = file.extension.toLowerCase();

  if (name === "package.json") {
    return { role: "package", roomType: "engine-room", landmark: true, xpValue: 50 };
  }

  if (name.startsWith(".env")) {
    return { role: "environment", roomType: "vault-room", landmark: true, xpValue: 75 };
  }

  if (name === "readme.md") {
    return { role: "documentation", roomType: "archive-room", landmark: true, xpValue: 35 };
  }

  if ((p.includes("/api/") || p.includes("app/api/")) && (name === "route.js" || name === "route.ts")) {
    return { role: "api-route", roomType: "portal-room", landmark: true, xpValue: 60 };
  }

  if (analysis?.hasPostHandler || analysis?.hasGetHandler) {
    return { role: "api-route", roomType: "portal-room", landmark: true, xpValue: 60 };
  }

  if (
    name === "page.jsx" ||
    name === "page.tsx" ||
    name === "layout.jsx" ||
    name === "layout.tsx" ||
    p.includes("/pages/")
  ) {
    return { role: "route", roomType: "route-room", landmark: true, xpValue: 45 };
  }

  if (
    p.includes("/components/") &&
    [".jsx", ".tsx", ".js", ".ts"].includes(ext)
  ) {
    return { role: "component", roomType: "machine-room", landmark: true, xpValue: 35 };
  }

  if (
    analysis &&
    [".jsx", ".tsx"].includes(ext) &&
    (analysis.hasJsx || analysis.hasReact || analysis.hasUseClient)
  ) {
    return { role: "component", roomType: "machine-room", landmark: true, xpValue: 35 };
  }

  if (p.includes("/hooks/") && [".jsx", ".tsx", ".js", ".ts"].includes(ext)) {
    return { role: "hook", roomType: "signal-room", landmark: false, xpValue: 25 };
  }

  if (
    name.includes("config") ||
    name === "tsconfig.json" ||
    name === "vite.config.ts" ||
    name === "vite.config.js" ||
    name === "next.config.js" ||
    name === "next.config.mjs" ||
    name === "tailwind.config.js" ||
    name === "tailwind.config.ts"
  ) {
    return { role: "config", roomType: "control-room", landmark: true, xpValue: 45 };
  }

  if (
    name.includes(".test.") ||
    name.includes(".spec.") ||
    p.includes("/tests/") ||
    p.includes("/__tests__/")
  ) {
    return { role: "test", roomType: "proving-chamber", landmark: false, xpValue: 30 };
  }

  if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".ico"].includes(ext)) {
    return { role: "asset", roomType: "relic-room", landmark: false, xpValue: 10 };
  }

  if ([".css", ".scss", ".sass", ".less"].includes(ext)) {
    return { role: "style", roomType: "style-room", landmark: false, xpValue: 15 };
  }

  if ([".md", ".txt"].includes(ext)) {
    return { role: "documentation", roomType: "archive-room", landmark: false, xpValue: 15 };
  }

  if ([".ps1", ".sh", ".bat", ".cmd"].includes(ext)) {
    return { role: "script", roomType: "script-room", landmark: false, xpValue: 20 };
  }

  if ([".js", ".ts", ".jsx", ".tsx"].includes(ext)) {
    return { role: "utility", roomType: "utility-room", landmark: false, xpValue: 20 };
  }

  return { role: "unknown", roomType: "unmapped-room", landmark: false, xpValue: 5 };
}
