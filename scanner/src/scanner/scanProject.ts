import path from "node:path";
import { promises as fs } from "node:fs";
import type { ProjectMap, Room, Zone } from "../types";
import { crawlProject } from "./crawlProject";
import { classifyFile } from "./classifyFile";
import { calculateRiskLevel, detectFileFindings, detectProjectFindings } from "./detectFindings";
import { analyzeFileContent } from "./analyzeFileContent";

export async function scanProject(rootPath: string): Promise<ProjectMap> {
  const root = path.resolve(rootPath);
  const stat = await fs.stat(root).catch(() => null);

  if (!stat || !stat.isDirectory()) {
    throw new Error(`Project folder does not exist or is not a directory: ${root}`);
  }

  const files = await crawlProject(root);
  const projectFindings = detectProjectFindings(files);

  const rooms: Room[] = await Promise.all(files.map(async (file) => {
    const analysis = await analyzeFileContent(file);
    const classification = classifyFile(file, analysis);
    const findings = detectFileFindings(file, analysis);

    return {
      id: `room-${safeId(file.relativePath)}`,
      name: file.name,
      path: file.relativePath,
      folder: file.folder,
      role: classification.role,
      roomType: classification.roomType,
      landmark: classification.landmark,
      riskLevel: calculateRiskLevel(findings),
      sizeBytes: file.sizeBytes,
      modifiedAt: file.modifiedAt,
      lineCount: analysis.lineCount,
      importCount: analysis.importCount,
      exportCount: analysis.exportCount,
      signals: analysis.signals,
      contentHash: file.contentHash,
      hashSkippedReason: file.hashSkippedReason,
      xpValue: classification.xpValue + findings.length * 10 + Math.min(50, Math.floor(analysis.lineCount / 50)),
      findings
    };
  }));

  const zones = buildZones(rooms);
  const allFindings = [...projectFindings, ...rooms.flatMap((room) => room.findings)];

  const routesFound = rooms.filter((room) => room.role === "route" || room.role === "api-route").length;
  const componentsFound = rooms.filter((room) => room.role === "component").length;
  const risksFound = allFindings.filter((finding) => ["low", "medium", "high", "critical"].includes(finding.severity)).length;
  const xpEarned = rooms.reduce((sum, room) => sum + room.xpValue, 0) + projectFindings.length * 25;
  const level = Math.max(1, Math.floor(xpEarned / 500) + 1);

  return {
    appName: "Probe.exe",
    scanMode: "discovery",
    scannedAt: new Date().toISOString(),
    rootPath: root.replaceAll("\\", "/"),
    summary: {
      foldersScanned: zones.length,
      filesScanned: rooms.length,
      routesFound,
      componentsFound,
      risksFound,
      xpEarned,
      level
    },
    zones,
    findings: allFindings
  };
}

function buildZones(rooms: Room[]): Zone[] {
  const zoneMap = new Map<string, Room[]>();

  for (const room of rooms) {
    const zonePath = room.folder || "root";
    const existing = zoneMap.get(zonePath) ?? [];
    existing.push(room);
    zoneMap.set(zonePath, existing);
  }

  return Array.from(zoneMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zonePath, zoneRooms]) => ({
      id: `zone-${safeId(zonePath)}`,
      name: zonePath,
      path: zonePath,
      level: Math.max(1, zonePath.split("/").length),
      rooms: zoneRooms
    }));
}

function safeId(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
