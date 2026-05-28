import { promises as fs } from "node:fs";
import path from "node:path";
import type { Finding, ProjectMap, Room, RiskLevel } from "../types";
import { toHtmlReport } from "./writeHtmlReport";
import { buildEncounterOutput } from "./writeEncounterArtifacts";

interface PackageJsonShape {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface GameRoom {
  id: string;
  name: string;
  path: string;
  folder: string;
  role: string;
  roomType: string;
  landmark: boolean;
  riskLevel: RiskLevel;
  difficulty: number;
  xpValue: number;
  rewardType: string;
  routePath?: string;
  lineCount: number;
  importCount: number;
  exportCount: number;
  signals: string[];
  findingsCount: number;
  position: {
    x: number;
    y: number;
  };
}

interface GameZone {
  id: string;
  name: string;
  path: string;
  level: number;
  roomCount: number;
  riskCount: number;
  landmarkCount: number;
  position: {
    x: number;
    y: number;
  };
  rooms: GameRoom[];
}

export async function writeArtifacts(projectMap: ProjectMap): Promise<void> {
  const outputDir = path.join(projectMap.rootPath, ".probe");
  await fs.mkdir(outputDir, { recursive: true });

  const packageJson = await readPackageJson(projectMap.rootPath);
  const encounterOutput = buildEncounterOutput(projectMap);

  await fs.writeFile(
    path.join(outputDir, "project-map.json"),
    JSON.stringify(projectMap, null, 2),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "file-inventory.csv"),
    toCsv(projectMap.zones.flatMap((zone) => zone.rooms)),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "project-summary.md"),
    toMarkdown(projectMap),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "file-quest-report.html"),
    toHtmlReport(projectMap),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "route-map.md"),
    toRouteMapMarkdown(projectMap),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "build-readiness.md"),
    toBuildReadinessMarkdown(projectMap, packageJson),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "ui-map.json"),
    JSON.stringify(toUiMap(projectMap), null, 2),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "game-map.json"),
    JSON.stringify(toGameMap(projectMap), null, 2),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "mission-brief.md"),
    toMissionBrief(projectMap),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "encounters.json"),
    JSON.stringify(encounterOutput.encountersReport, null, 2),
    "utf8"
  );

  await fs.writeFile(
    path.join(outputDir, "cleanup-plan.json"),
    JSON.stringify(encounterOutput.cleanupPlan, null, 2),
    "utf8"
  );
}

async function readPackageJson(rootPath: string): Promise<PackageJsonShape | null> {
  const packagePath = path.join(rootPath, "package.json");

  try {
    const raw = await fs.readFile(packagePath, "utf8");
    return JSON.parse(raw) as PackageJsonShape;
  } catch {
    return null;
  }
}

function toCsv(rooms: Room[]): string {
  const header = [
    "path",
    "folder",
    "name",
    "role",
    "roomType",
    "landmark",
    "riskLevel",
    "lineCount",
    "importCount",
    "exportCount",
    "signals",
    "contentHash",
    "hashSkippedReason",
    "sizeBytes",
    "xpValue",
    "modifiedAt"
  ];

  const rows = rooms.map((room) => [
    room.path,
    room.folder,
    room.name,
    room.role,
    room.roomType,
    String(room.landmark),
    room.riskLevel,
    String(room.lineCount),
    String(room.importCount),
    String(room.exportCount),
    room.signals.join("|"),
    room.contentHash ?? "",
    room.hashSkippedReason ?? "",
    String(room.sizeBytes),
    String(room.xpValue),
    room.modifiedAt
  ]);

  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function toMarkdown(projectMap: ProjectMap): string {
  const lines: string[] = [];

  lines.push("# Probe.exe Discovery Report");
  lines.push("");
  lines.push(`Scanned at: ${projectMap.scannedAt}`);
  lines.push(`Root: ${projectMap.rootPath}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Files scanned: ${projectMap.summary.filesScanned}`);
  lines.push(`- Folders scanned: ${projectMap.summary.foldersScanned}`);
  lines.push(`- Routes found: ${projectMap.summary.routesFound}`);
  lines.push(`- Components found: ${projectMap.summary.componentsFound}`);
  lines.push(`- Risks found: ${projectMap.summary.risksFound}`);
  lines.push(`- XP earned: ${projectMap.summary.xpEarned}`);
  lines.push(`- Level: ${projectMap.summary.level}`);
  lines.push("");
  lines.push("## Top Landmarks");
  lines.push("");

  const landmarks = projectMap.zones.flatMap((zone) => zone.rooms).filter((room) => room.landmark).slice(0, 50);

  if (landmarks.length === 0) {
    lines.push("No landmarks detected.");
  } else {
    for (const room of landmarks) {
      lines.push(`- ${room.path} (${room.role}, ${room.roomType})`);
    }
  }

  lines.push("");
  lines.push("## Findings");
  lines.push("");

  if (projectMap.findings.length === 0) {
    lines.push("No findings detected.");
  } else {
    for (const finding of projectMap.findings) {
      lines.push(`### ${finding.severity.toUpperCase()}: ${finding.title}`);
      if (finding.filePath) lines.push(`File: ${finding.filePath}`);
      lines.push("");
      lines.push(finding.message);
      if (finding.suggestedAction) {
        lines.push("");
        lines.push(`Suggested action: ${finding.suggestedAction}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function toRouteMapMarkdown(projectMap: ProjectMap): string {
  const routeRooms = projectMap.zones
    .flatMap((zone) => zone.rooms)
    .filter((room) => room.role === "route" || room.role === "api-route");

  const lines: string[] = [];

  lines.push("# Probe.exe Route Map");
  lines.push("");
  lines.push(`Root: ${projectMap.rootPath}`);
  lines.push(`Routes found: ${routeRooms.length}`);
  lines.push("");

  if (routeRooms.length === 0) {
    lines.push("No route rooms detected.");
    return lines.join("\n");
  }

  for (const room of routeRooms) {
    lines.push(`## ${room.path}`);
    lines.push("");
    lines.push(`- Inferred route: ${inferRoutePath(room) ?? "unknown"}`);
    lines.push(`- Role: ${room.role}`);
    lines.push(`- Room type: ${room.roomType}`);
    lines.push(`- Risk level: ${room.riskLevel}`);
    lines.push(`- Lines: ${room.lineCount}`);
    lines.push(`- Imports: ${room.importCount}`);
    lines.push(`- Exports: ${room.exportCount}`);
    lines.push(`- XP value: ${room.xpValue}`);
    lines.push("");
  }

  return lines.join("\n");
}

function toBuildReadinessMarkdown(projectMap: ProjectMap, packageJson: PackageJsonShape | null): string {
  const rooms = projectMap.zones.flatMap((zone) => zone.rooms);
  const names = new Set(rooms.map((room) => room.name.toLowerCase()));

  const hasPackage = names.has("package.json");
  const hasReadme = names.has("readme.md");
  const hasEnv = rooms.some((room) => room.name.toLowerCase().startsWith(".env"));
  const hasEnvExample = names.has(".env.example") || names.has("env.example") || names.has(".env.sample");
  const hasBuildScript = Boolean(packageJson?.scripts?.build);
  const hasDevScript = Boolean(packageJson?.scripts?.dev);
  const hasStartScript = Boolean(packageJson?.scripts?.start);
  const hasTestScript = Boolean(packageJson?.scripts?.test);

  let score = 0;
  if (hasPackage) score += 20;
  if (hasReadme) score += 15;
  if (!hasEnv || hasEnvExample) score += 15;
  if (hasBuildScript) score += 20;
  if (hasDevScript || hasStartScript) score += 15;
  if (hasTestScript) score += 15;

  const dependencyCount =
    Object.keys(packageJson?.dependencies ?? {}).length +
    Object.keys(packageJson?.devDependencies ?? {}).length;

  const lines: string[] = [];

  lines.push("# Probe.exe Build Readiness Report");
  lines.push("");
  lines.push(`Root: ${projectMap.rootPath}`);
  lines.push(`Build readiness score: ${score}/100`);
  lines.push("");
  lines.push("## Checklist");
  lines.push("");
  lines.push(`- package.json detected: ${yesNo(hasPackage)}`);
  lines.push(`- README detected: ${yesNo(hasReadme)}`);
  lines.push(`- Environment example present when needed: ${yesNo(!hasEnv || hasEnvExample)}`);
  lines.push(`- Build script detected: ${yesNo(hasBuildScript)}`);
  lines.push(`- Dev or start script detected: ${yesNo(hasDevScript || hasStartScript)}`);
  lines.push(`- Test script detected: ${yesNo(hasTestScript)}`);
  lines.push("");
  lines.push("## Package Scripts");
  lines.push("");

  if (!packageJson?.scripts || Object.keys(packageJson.scripts).length === 0) {
    lines.push("No package scripts detected.");
  } else {
    for (const [scriptName, command] of Object.entries(packageJson.scripts)) {
      lines.push(`- ${scriptName}: \`${command}\``);
    }
  }

  lines.push("");
  lines.push("## Dependency Count");
  lines.push("");
  lines.push(`- Total dependencies and devDependencies: ${dependencyCount}`);
  lines.push("");

  if (score < 70) {
    lines.push("## Suggested Next Actions");
    lines.push("");
    if (!hasPackage) lines.push("- Add or verify package.json at the project root.");
    if (!hasReadme) lines.push("- Add README.md with setup and run instructions.");
    if (hasEnv && !hasEnvExample) lines.push("- Add .env.example with placeholder values only.");
    if (!hasBuildScript) lines.push("- Add or document a build script.");
    if (!hasDevScript && !hasStartScript) lines.push("- Add or document a dev/start script.");
    if (!hasTestScript) lines.push("- Add or document a test script.");
  }

  return lines.join("\n");
}

function toUiMap(projectMap: ProjectMap) {
  const rooms = projectMap.zones.flatMap((zone) => zone.rooms);

  return {
    scannedAt: projectMap.scannedAt,
    rootPath: projectMap.rootPath,
    summary: {
      routes: rooms.filter((room) => room.role === "route" || room.role === "api-route").length,
      components: rooms.filter((room) => room.role === "component").length,
      styles: rooms.filter((room) => room.role === "style").length,
      assets: rooms.filter((room) => room.role === "asset").length,
      configs: rooms.filter((room) => room.role === "config").length
    },
    routes: rooms.filter((room) => room.role === "route" || room.role === "api-route").map(toRoomSummary),
    components: rooms.filter((room) => room.role === "component").map(toRoomSummary),
    styles: rooms.filter((room) => room.role === "style").map(toRoomSummary),
    assets: rooms.filter((room) => room.role === "asset").map(toRoomSummary),
    configs: rooms.filter((room) => room.role === "config").map(toRoomSummary)
  };
}

function toGameMap(projectMap: ProjectMap) {
  const gameZones: GameZone[] = projectMap.zones.map((zone, zoneIndex) => {
    const rooms = zone.rooms.map((room, roomIndex) => toGameRoom(room, roomIndex, zoneIndex));
    const riskCount = rooms.filter((room) => room.riskLevel !== "none").length;
    const landmarkCount = rooms.filter((room) => room.landmark).length;

    return {
      id: zone.id,
      name: zone.name,
      path: zone.path,
      level: zone.level,
      roomCount: rooms.length,
      riskCount,
      landmarkCount,
      position: {
        x: (zoneIndex % 12) * 18,
        y: Math.floor(zoneIndex / 12) * -12
      },
      rooms
    };
  });

  const firstZone = gameZones[0];
  const firstRoom = firstZone?.rooms[0];

  return {
    gameTitle: "Probe.exe: File Quest",
    schemaVersion: "0.1.0",
    generatedAt: projectMap.scannedAt,
    rootPath: projectMap.rootPath,
    summary: projectMap.summary,
    playerStart: {
      zoneId: firstZone?.id ?? "",
      roomId: firstRoom?.id ?? ""
    },
    legend: {
      folder: "zone",
      file: "room",
      route: "portal room",
      component: "machine room",
      environment: "vault room",
      config: "control room",
      documentation: "archive room",
      asset: "relic room",
      finding: "encounter",
      risk: "hazard"
    },
    zones: gameZones
  };
}

function toGameRoom(room: Room, roomIndex: number, zoneIndex: number): GameRoom {
  return {
    id: room.id,
    name: room.name,
    path: room.path,
    folder: room.folder,
    role: room.role,
    roomType: room.roomType,
    landmark: room.landmark,
    riskLevel: room.riskLevel,
    difficulty: calculateDifficulty(room),
    xpValue: room.xpValue,
    rewardType: getRewardType(room),
    routePath: inferRoutePath(room),
    lineCount: room.lineCount,
    importCount: room.importCount,
    exportCount: room.exportCount,
    signals: room.signals,
    findingsCount: room.findings.length,
    position: {
      x: roomIndex * 5,
      y: zoneIndex * -3
    }
  };
}

function toMissionBrief(projectMap: ProjectMap): string {
  const rooms = projectMap.zones.flatMap((zone) => zone.rooms);
  const riskyRooms = rooms.filter((room) => room.riskLevel !== "none");
  const bigRooms = [...rooms].sort((a, b) => b.lineCount - a.lineCount).slice(0, 15);
  const routeRooms = rooms.filter((room) => room.role === "route" || room.role === "api-route").slice(0, 50);
  const topFindings = [...projectMap.findings].sort(sortFindingBySeverity).slice(0, 25);

  const lines: string[] = [];

  lines.push("# Probe.exe Mission Brief");
  lines.push("");
  lines.push(`Root: ${projectMap.rootPath}`);
  lines.push(`Generated: ${projectMap.scannedAt}`);
  lines.push("");
  lines.push("## Mission Status");
  lines.push("");
  lines.push(`- Files scanned: ${projectMap.summary.filesScanned}`);
  lines.push(`- Zones mapped: ${projectMap.summary.foldersScanned}`);
  lines.push(`- Routes mapped: ${projectMap.summary.routesFound}`);
  lines.push(`- Components mapped: ${projectMap.summary.componentsFound}`);
  lines.push(`- Risk findings: ${projectMap.summary.risksFound}`);
  lines.push(`- XP earned: ${projectMap.summary.xpEarned}`);
  lines.push(`- Scanner level: ${projectMap.summary.level}`);
  lines.push("");
  lines.push("## Top Risk Encounters");
  lines.push("");

  if (topFindings.length === 0) {
    lines.push("No risk encounters detected.");
  } else {
    for (const finding of topFindings) {
      lines.push(`- ${finding.severity.toUpperCase()}: ${finding.title}${finding.filePath ? ` (${finding.filePath})` : ""}`);
    }
  }

  lines.push("");
  lines.push("## Largest Rooms");
  lines.push("");

  for (const room of bigRooms) {
    lines.push(`- ${room.path}: ${room.lineCount} lines, ${room.importCount} imports, risk ${room.riskLevel}`);
  }

  lines.push("");
  lines.push("## Route Portals");
  lines.push("");

  if (routeRooms.length === 0) {
    lines.push("No route portals detected.");
  } else {
    for (const room of routeRooms) {
      lines.push(`- ${inferRoutePath(room) ?? "unknown"} -> ${room.path}`);
    }
  }

  lines.push("");
  lines.push("## Suggested Next Actions");
  lines.push("");
  if (riskyRooms.length > 0) {
    lines.push("- Filter the visual report by Risk only and inspect each hazard room.");
  }
  if (bigRooms.some((room) => room.lineCount >= 300)) {
    lines.push("- Review large source rooms for possible splitting or refactoring.");
  }
  if (routeRooms.length > 0) {
    lines.push("- Use route-map.md to verify that important routes match the expected application flow.");
  }
  lines.push("- Use game-map.json as the Unity bridge for the playable prototype.");
  lines.push("- Use encounters.json and cleanup-plan.json as the combat and ability bridge.");

  return lines.join("\n");
}

function toRoomSummary(room: Room) {
  return {
    name: room.name,
    path: room.path,
    folder: room.folder,
    role: room.role,
    roomType: room.roomType,
    landmark: room.landmark,
    riskLevel: room.riskLevel,
    routePath: inferRoutePath(room),
    lineCount: room.lineCount,
    importCount: room.importCount,
    exportCount: room.exportCount,
    signals: room.signals,
    contentHash: room.contentHash,
    hashSkippedReason: room.hashSkippedReason,
    xpValue: room.xpValue
  };
}

function inferRoutePath(room: Room): string | undefined {
  const p = room.path.replaceAll("\\", "/");

  if (room.role !== "route" && room.role !== "api-route") {
    return undefined;
  }

  if (p.includes("/app/")) {
    return inferAppRoute(p.split("/app/")[1]);
  }

  if (p.startsWith("app/")) {
    return inferAppRoute(p.slice("app/".length));
  }

  if (p.includes("/pages/")) {
    return inferPagesRoute(p.split("/pages/")[1]);
  }

  if (p.startsWith("pages/")) {
    return inferPagesRoute(p.slice("pages/".length));
  }

  return undefined;
}

function inferAppRoute(appPath: string): string {
  let route = appPath
    .replace(/\/page\.(tsx|ts|jsx|js)$/i, "")
    .replace(/\/layout\.(tsx|ts|jsx|js)$/i, "")
    .replace(/\/route\.(tsx|ts|jsx|js)$/i, "")
    .replace(/\/loading\.(tsx|ts|jsx|js)$/i, "")
    .replace(/\/error\.(tsx|ts|jsx|js)$/i, "");

  route = route
    .split("/")
    .filter((segment) => segment && !segment.startsWith("(") && !segment.endsWith(")"))
    .map((segment) => segment.replace(/^\[(.+)\]$/, ":$1"))
    .join("/");

  return "/" + route;
}

function inferPagesRoute(pagesPath: string): string {
  let route = pagesPath.replace(/\.(tsx|ts|jsx|js)$/i, "");

  if (route.endsWith("/index")) {
    route = route.slice(0, -"/index".length);
  }

  if (route === "index") {
    route = "";
  }

  route = route
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/^\[(.+)\]$/, ":$1"))
    .join("/");

  return "/" + route;
}

function calculateDifficulty(room: Room): number {
  let score = 1;

  score += Math.min(5, Math.floor(room.lineCount / 150));
  score += Math.min(3, Math.floor(room.importCount / 10));
  score += room.findings.length;

  if (room.riskLevel === "low") score += 1;
  if (room.riskLevel === "medium") score += 2;
  if (room.riskLevel === "high") score += 4;
  if (room.riskLevel === "critical") score += 6;

  return Math.max(1, Math.min(10, score));
}

function getRewardType(room: Room): string {
  if (room.riskLevel !== "none") return "risk-intel";
  if (room.role === "route" || room.role === "api-route") return "route-map";
  if (room.role === "component") return "component-map";
  if (room.role === "config" || room.role === "package") return "system-intel";
  if (room.role === "asset") return "asset-relic";
  if (room.role === "documentation") return "archive-intel";
  return "scan-xp";
}

function sortFindingBySeverity(a: Finding, b: Finding): number {
  return severityRank(b.severity) - severityRank(a.severity);
}

function severityRank(severity: Finding["severity"]): number {
  if (severity === "critical") return 5;
  if (severity === "high") return 4;
  if (severity === "medium") return 3;
  if (severity === "low") return 2;
  return 1;
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}
