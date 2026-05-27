import type { ContentAnalysis, CrawledFile, Finding, RiskLevel } from "../types";

export function detectFileFindings(file: CrawledFile, analysis?: ContentAnalysis): Finding[] {
  const findings: Finding[] = [];
  const p = file.relativePath.toLowerCase();
  const name = file.name.toLowerCase();

  if (name.startsWith(".env")) {
    findings.push({
      id: `finding-env-${safeId(file.relativePath)}`,
      severity: "medium",
      category: "security",
      title: "Environment file detected",
      message: "This file may contain secrets or environment-specific values. Probe.exe will not print its contents.",
      filePath: file.relativePath,
      suggestedAction: "Make sure this file is ignored by Git and provide a safe .env.example when appropriate."
    });
  }

  if (
    p.includes("secret") ||
    p.includes("token") ||
    p.includes("apikey") ||
    p.includes("api-key") ||
    p.includes("service_role")
  ) {
    findings.push({
      id: `finding-secret-name-${safeId(file.relativePath)}`,
      severity: "low",
      category: "security",
      title: "Secret-like filename or path",
      message: "The file path contains a sensitive keyword.",
      filePath: file.relativePath,
      suggestedAction: "Confirm that no private values are committed or exposed."
    });
  }

  if (file.sizeBytes > 300000) {
    findings.push({
      id: `finding-large-${safeId(file.relativePath)}`,
      severity: "low",
      category: "maintainability",
      title: "Large file detected",
      message: `This file is ${(file.sizeBytes / 1024).toFixed(1)} KB.`,
      filePath: file.relativePath,
      suggestedAction: "Review whether this file should be split, compressed, ignored, or moved."
    });
  }

  if (analysis?.lineCount && analysis.lineCount >= 300) {
    findings.push({
      id: `finding-large-source-${safeId(file.relativePath)}`,
      severity: "low",
      category: "maintainability",
      title: "Large source room",
      message: `This source file has ${analysis.lineCount} lines.`,
      filePath: file.relativePath,
      suggestedAction: "Review whether this room should be split into smaller modules or components."
    });
  }

  if (analysis?.importCount && analysis.importCount >= 20) {
    findings.push({
      id: `finding-high-import-${safeId(file.relativePath)}`,
      severity: "info",
      category: "structure",
      title: "High import count",
      message: `This file has ${analysis.importCount} import statements.`,
      filePath: file.relativePath,
      suggestedAction: "Review whether this file is doing too many jobs."
    });
  }

  if (analysis?.hasTodo) {
    findings.push({
      id: `finding-todo-${safeId(file.relativePath)}`,
      severity: "info",
      category: "workflow",
      title: "TODO or FIXME marker detected",
      message: "This file contains a TODO or FIXME marker.",
      filePath: file.relativePath,
      suggestedAction: "Review the marker and either resolve it or convert it into a tracked task."
    });
  }

  if (analysis?.hasConsoleLog) {
    findings.push({
      id: `finding-console-log-${safeId(file.relativePath)}`,
      severity: "info",
      category: "cleanup",
      title: "Console log detected",
      message: "This file contains console.log usage.",
      filePath: file.relativePath,
      suggestedAction: "Remove debug logging before production builds unless it is intentional."
    });
  }

  return findings;
}

export function detectProjectFindings(files: CrawledFile[]): Finding[] {
  const findings: Finding[] = [];
  const lowerNames = new Set(files.map((f) => f.name.toLowerCase()));
  const lowerPaths = new Set(files.map((f) => f.relativePath.toLowerCase()));

  if (!lowerNames.has("readme.md")) {
    findings.push({
      id: "finding-missing-readme",
      severity: "info",
      category: "documentation",
      title: "README not found",
      message: "No README.md was found at scan time.",
      suggestedAction: "Add a README with setup, environment, and run instructions."
    });
  }

  const hasEnv = files.some((f) => f.name.toLowerCase().startsWith(".env"));
  const hasEnvExample =
    lowerNames.has(".env.example") ||
    lowerNames.has("env.example") ||
    lowerPaths.has(".env.sample");

  if (hasEnv && !hasEnvExample) {
    findings.push({
      id: "finding-missing-env-example",
      severity: "medium",
      category: "build-readiness",
      title: "Environment file exists but no .env.example found",
      message: "A local environment file was detected, but a safe example file was not found.",
      suggestedAction: "Create a .env.example with placeholder values only."
    });
  }

  const nameCounts = new Map<string, number>();
  for (const file of files) {
    nameCounts.set(file.name.toLowerCase(), (nameCounts.get(file.name.toLowerCase()) ?? 0) + 1);
  }

  for (const [name, count] of nameCounts) {
    if (count >= 5 && !["index.ts", "index.js", "index.tsx", "index.jsx"].includes(name)) {
      findings.push({
        id: `finding-duplicate-name-${safeId(name)}`,
        severity: "info",
        category: "structure",
        title: "Repeated filename detected",
        message: `${count} files are named ${name}.`,
        suggestedAction: "Confirm this naming pattern is intentional and not hiding duplicate logic."
      });
    }
  }

  return findings;
}

export function calculateRiskLevel(findings: Finding[]): RiskLevel {
  if (findings.some((f) => f.severity === "critical")) return "critical";
  if (findings.some((f) => f.severity === "high")) return "high";
  if (findings.some((f) => f.severity === "medium")) return "medium";
  if (findings.some((f) => f.severity === "low")) return "low";
  return "none";
}

function safeId(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
