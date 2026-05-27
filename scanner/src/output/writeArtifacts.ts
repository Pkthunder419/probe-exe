import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProjectMap, Room } from "../types";
import { toHtmlReport } from "./writeHtmlReport";

interface PackageJsonShape {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function writeArtifacts(projectMap: ProjectMap): Promise<void> {
  const outputDir = path.join(projectMap.rootPath, ".probe");
  await fs.mkdir(outputDir, { recursive: true });

  const packageJson = await readPackageJson(projectMap.rootPath);

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
    lines.push(`- Role: ${room.role}`);
    lines.push(`- Room type: ${room.roomType}`);
    lines.push(`- Risk level: ${room.riskLevel}`);
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

function toRoomSummary(room: Room) {
  return {
    name: room.name,
    path: room.path,
    folder: room.folder,
    role: room.role,
    roomType: room.roomType,
    landmark: room.landmark,
    riskLevel: room.riskLevel,
    xpValue: room.xpValue
  };
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}
