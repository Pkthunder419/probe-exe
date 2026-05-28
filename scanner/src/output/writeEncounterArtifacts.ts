import type { ProjectMap, Room, RiskLevel } from "../types";

export interface ProbeEncounter {
  id: string;
  enemyType: string;
  title: string;
  severity: RiskLevel | "info";
  category: string;
  zone: string;
  description: string;
  evidence: {
    paths: string[];
    count: number;
    details: string[];
  };
  suggestedPowers: string[];
  cleanupActionIds: string[];
  xpReward: number;
}

export interface ProbeCleanupAction {
  id: string;
  type: "manual-review" | "quarantine-file-preview" | "compare-files" | "split-plan" | "ignore";
  abilityName: string;
  title: string;
  targetPath?: string;
  targetPaths: string[];
  reason: string;
  risk: "low" | "medium" | "high";
  reversible: boolean;
  requiresConfirmation: boolean;
  status: "planned";
}

export interface ProbeEncounterOutput {
  encountersReport: {
    schemaVersion: "0.1.0";
    generatedAt: string;
    rootPath: string;
    summary: {
      encountersFound: number;
      cleanupActionsPlanned: number;
      mirrorGoblins: number;
      bossRooms: number;
      vaultWraiths: number;
      codeGremlins: number;
      tangleHydras: number;
      emptyShells: number;
    };
    encounters: ProbeEncounter[];
  };
  cleanupPlan: {
    schemaVersion: "0.1.0";
    generatedAt: string;
    rootPath: string;
    safetyMode: "observe-and-plan";
    warning: string;
    actions: ProbeCleanupAction[];
  };
}

export function buildEncounterOutput(projectMap: ProjectMap): ProbeEncounterOutput {
  const rooms = projectMap.zones.flatMap((zone) => zone.rooms);
  const encounters: ProbeEncounter[] = [];
  const actions: ProbeCleanupAction[] = [];

  buildExactDuplicateEncounters(rooms, encounters, actions);
  buildDuplicateFilenameEncounters(rooms, encounters, actions);
  buildBossRoomEncounters(rooms, encounters, actions);
  buildVaultWraithEncounters(rooms, encounters, actions);
  buildCodeGremlinEncounters(rooms, encounters, actions);
  buildTangleHydraEncounters(rooms, encounters, actions);
  buildEmptyShellEncounters(rooms, encounters, actions);

  return {
    encountersReport: {
      schemaVersion: "0.1.0",
      generatedAt: projectMap.scannedAt,
      rootPath: projectMap.rootPath,
      summary: {
        encountersFound: encounters.length,
        cleanupActionsPlanned: actions.length,
        mirrorGoblins: encounters.filter((item) => item.enemyType.includes("Mirror")).length,
        bossRooms: encounters.filter((item) => item.enemyType === "Boss Room").length,
        vaultWraiths: encounters.filter((item) => item.enemyType === "Vault Wraith").length,
        codeGremlins: encounters.filter((item) => item.enemyType === "Code Gremlin").length,
        tangleHydras: encounters.filter((item) => item.enemyType === "Tangle Hydra").length,
        emptyShells: encounters.filter((item) => item.enemyType === "Empty Shell").length
      },
      encounters
    },
    cleanupPlan: {
      schemaVersion: "0.1.0",
      generatedAt: projectMap.scannedAt,
      rootPath: projectMap.rootPath,
      safetyMode: "observe-and-plan",
      warning: "No cleanup action in this file should be applied without explicit user confirmation, backup, quarantine, and audit logging.",
      actions
    }
  };
}

function buildExactDuplicateEncounters(
  rooms: Room[],
  encounters: ProbeEncounter[],
  actions: ProbeCleanupAction[]
): void {
  const groups = groupRooms(rooms.filter((room) => Boolean(room.contentHash)), (room) => room.contentHash ?? "");

  for (const [hash, group] of groups.entries()) {
    if (group.length < 2) continue;
    if (hash === "sha256-empty-file") continue;

    const sorted = [...group].sort((a, b) => a.path.localeCompare(b.path));
    const keep = sorted[0];
    const duplicateCandidates = sorted.slice(1);
    const actionIds: string[] = [];

    for (const duplicate of duplicateCandidates) {
      const action = createAction({
        type: "quarantine-file-preview",
        abilityName: "Quarantine Strike",
        title: `Preview quarantine duplicate file: ${duplicate.name}`,
        targetPath: duplicate.path,
        targetPaths: [duplicate.path],
        reason: `Exact content duplicate of ${keep.path}.`,
        risk: "low"
      });

      actions.push(action);
      actionIds.push(action.id);
    }

    encounters.push({
      id: `encounter-mirror-goblin-${safeId(hash)}`,
      enemyType: "Mirror Goblin",
      title: "Exact duplicate files detected",
      severity: "medium",
      category: "redundancy",
      zone: commonZone(sorted),
      description: "Multiple files have the same content hash. This is a strong redundancy signal.",
      evidence: {
        paths: sorted.map((room) => room.path),
        count: sorted.length,
        details: [`Keeping first path as default survivor: ${keep.path}`, `Duplicate hash: ${hash.slice(0, 24)}...`]
      },
      suggestedPowers: ["Inspect", "Compare Files", "Quarantine Strike", "Ignore"],
      cleanupActionIds: actionIds,
      xpReward: 50 + duplicateCandidates.length * 25
    });
  }
}

function buildDuplicateFilenameEncounters(
  rooms: Room[],
  encounters: ProbeEncounter[],
  actions: ProbeCleanupAction[]
): void {
  const ignored = new Set(["index.ts", "index.js", "index.tsx", "index.jsx", "route.ts", "route.js", "page.tsx", "page.jsx"]);
  const groups = groupRooms(rooms.filter((room) => !ignored.has(room.name.toLowerCase())), (room) => room.name.toLowerCase());

  for (const [name, group] of groups.entries()) {
    if (group.length < 3) continue;

    const sorted = [...group].sort((a, b) => a.path.localeCompare(b.path));
    const action = createAction({
      type: "compare-files",
      abilityName: "Mirror Scan",
      title: `Compare repeated filename group: ${name}`,
      targetPaths: sorted.map((room) => room.path),
      reason: `${sorted.length} files share the same filename. This may be normal or may hide redundant logic.`,
      risk: "low"
    });

    actions.push(action);

    encounters.push({
      id: `encounter-mirror-imp-${safeId(name)}`,
      enemyType: "Mirror Imp",
      title: `Repeated filename: ${name}`,
      severity: "info",
      category: "structure",
      zone: commonZone(sorted),
      description: "Several files share the same filename. This is not automatically bad, but it deserves inspection.",
      evidence: {
        paths: sorted.map((room) => room.path),
        count: sorted.length,
        details: [`Repeated filename: ${name}`]
      },
      suggestedPowers: ["Mirror Scan", "Inspect", "Ignore"],
      cleanupActionIds: [action.id],
      xpReward: 10 + sorted.length * 5
    });
  }
}

function buildBossRoomEncounters(
  rooms: Room[],
  encounters: ProbeEncounter[],
  actions: ProbeCleanupAction[]
): void {
  const bossRooms = rooms.filter((room) => room.lineCount >= 300 || room.importCount >= 25);

  for (const room of bossRooms) {
    const action = createAction({
      type: "split-plan",
      abilityName: "Refactor Limit Break",
      title: `Create split plan for ${room.name}`,
      targetPath: room.path,
      targetPaths: [room.path],
      reason: `Large or complex source room: ${room.lineCount} lines, ${room.importCount} imports.`,
      risk: "medium"
    });

    actions.push(action);

    encounters.push({
      id: `encounter-boss-room-${safeId(room.path)}`,
      enemyType: "Boss Room",
      title: `Large source room: ${room.name}`,
      severity: room.lineCount >= 600 || room.importCount >= 40 ? "high" : "medium",
      category: "maintainability",
      zone: room.folder || "root",
      description: "This file is large or highly connected. It may need splitting, extraction, or simplification.",
      evidence: {
        paths: [room.path],
        count: 1,
        details: [`Lines: ${room.lineCount}`, `Imports: ${room.importCount}`, `Exports: ${room.exportCount}`]
      },
      suggestedPowers: ["Inspect", "Map Imports", "Refactor Limit Break", "Generate Report"],
      cleanupActionIds: [action.id],
      xpReward: Math.min(300, 75 + room.lineCount)
    });
  }
}

function buildVaultWraithEncounters(
  rooms: Room[],
  encounters: ProbeEncounter[],
  actions: ProbeCleanupAction[]
): void {
  const vaultRooms = rooms.filter((room) => room.role === "environment" || room.findings.some((finding) => finding.category === "security"));

  for (const room of vaultRooms) {
    const action = createAction({
      type: "manual-review",
      abilityName: "Seal Vault",
      title: `Review sensitive file: ${room.name}`,
      targetPath: room.path,
      targetPaths: [room.path],
      reason: "Sensitive path or environment file detected. Contents are not printed by Probe.exe.",
      risk: "high"
    });

    actions.push(action);

    encounters.push({
      id: `encounter-vault-wraith-${safeId(room.path)}`,
      enemyType: "Vault Wraith",
      title: `Sensitive file/path detected: ${room.name}`,
      severity: "high",
      category: "security",
      zone: room.folder || "root",
      description: "This room may contain secrets, tokens, environment values, or sensitive configuration.",
      evidence: {
        paths: [room.path],
        count: 1,
        details: room.findings.map((finding) => finding.title)
      },
      suggestedPowers: ["Inspect Metadata", "Seal Vault", "Ignore"],
      cleanupActionIds: [action.id],
      xpReward: 100
    });
  }
}

function buildCodeGremlinEncounters(
  rooms: Room[],
  encounters: ProbeEncounter[],
  actions: ProbeCleanupAction[]
): void {
  const gremlinRooms = rooms.filter((room) => room.signals.includes("todo-or-fixme") || room.signals.includes("console-log"));

  for (const room of gremlinRooms) {
    const action = createAction({
      type: "manual-review",
      abilityName: "Cleanse Debug",
      title: `Review debug markers in ${room.name}`,
      targetPath: room.path,
      targetPaths: [room.path],
      reason: `Source signals detected: ${room.signals.filter((signal) => signal === "todo-or-fixme" || signal === "console-log").join(", ")}.`,
      risk: "low"
    });

    actions.push(action);

    encounters.push({
      id: `encounter-code-gremlin-${safeId(room.path)}`,
      enemyType: "Code Gremlin",
      title: `Debug/workflow marker detected: ${room.name}`,
      severity: "info",
      category: "cleanup",
      zone: room.folder || "root",
      description: "This room contains TODO/FIXME markers or console.log usage.",
      evidence: {
        paths: [room.path],
        count: 1,
        details: room.signals
      },
      suggestedPowers: ["Inspect", "Cleanse Debug", "Ignore"],
      cleanupActionIds: [action.id],
      xpReward: 20
    });
  }
}

function buildTangleHydraEncounters(
  rooms: Room[],
  encounters: ProbeEncounter[],
  actions: ProbeCleanupAction[]
): void {
  const hydraRooms = rooms.filter((room) => room.importCount >= 20);

  for (const room of hydraRooms) {
    const action = createAction({
      type: "manual-review",
      abilityName: "Dependency Vision",
      title: `Map high-import room: ${room.name}`,
      targetPath: room.path,
      targetPaths: [room.path],
      reason: `${room.importCount} imports detected. This may indicate high coupling.`,
      risk: "medium"
    });

    actions.push(action);

    encounters.push({
      id: `encounter-tangle-hydra-${safeId(room.path)}`,
      enemyType: "Tangle Hydra",
      title: `High import count: ${room.name}`,
      severity: "medium",
      category: "dependency",
      zone: room.folder || "root",
      description: "This file imports many dependencies and may be doing too much.",
      evidence: {
        paths: [room.path],
        count: 1,
        details: [`Imports: ${room.importCount}`, `Lines: ${room.lineCount}`]
      },
      suggestedPowers: ["Dependency Vision", "Inspect", "Refactor Limit Break"],
      cleanupActionIds: [action.id],
      xpReward: 60
    });
  }
}

function buildEmptyShellEncounters(
  rooms: Room[],
  encounters: ProbeEncounter[],
  actions: ProbeCleanupAction[]
): void {
  const sourceRoles = new Set(["utility", "component", "hook", "route", "api-route", "test", "script"]);
  const emptyRooms = rooms.filter((room) => sourceRoles.has(room.role) && room.lineCount > 0 && room.lineCount <= 2);

  for (const room of emptyRooms) {
    const action = createAction({
      type: "manual-review",
      abilityName: "Ghost Reveal",
      title: `Review tiny source room: ${room.name}`,
      targetPath: room.path,
      targetPaths: [room.path],
      reason: `This source room only has ${room.lineCount} lines.`,
      risk: "low"
    });

    actions.push(action);

    encounters.push({
      id: `encounter-empty-shell-${safeId(room.path)}`,
      enemyType: "Empty Shell",
      title: `Tiny source room: ${room.name}`,
      severity: "info",
      category: "structure",
      zone: room.folder || "root",
      description: "This file may be a placeholder, abandoned shell, or intentionally tiny module.",
      evidence: {
        paths: [room.path],
        count: 1,
        details: [`Lines: ${room.lineCount}`]
      },
      suggestedPowers: ["Ghost Reveal", "Inspect", "Ignore"],
      cleanupActionIds: [action.id],
      xpReward: 15
    });
  }
}

function createAction(input: Omit<ProbeCleanupAction, "id" | "reversible" | "requiresConfirmation" | "status">): ProbeCleanupAction {
  return {
    id: `action-${safeId(`${input.abilityName}-${input.title}-${input.targetPaths.join("-")}`)}`,
    ...input,
    reversible: input.type === "quarantine-file-preview",
    requiresConfirmation: true,
    status: "planned"
  };
}

function groupRooms<T extends string>(rooms: Room[], keyFactory: (room: Room) => T): Map<T, Room[]> {
  const groups = new Map<T, Room[]>();

  for (const room of rooms) {
    const key = keyFactory(room);
    const group = groups.get(key) ?? [];
    group.push(room);
    groups.set(key, group);
  }

  return groups;
}

function commonZone(rooms: Room[]): string {
  if (rooms.length === 0) return "root";
  const first = rooms[0].folder || "root";
  return rooms.every((room) => (room.folder || "root") === first) ? first : "multiple-zones";
}

function safeId(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 140);
}
