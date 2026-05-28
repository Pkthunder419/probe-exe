export type FileRole =
  | "route"
  | "api-route"
  | "component"
  | "hook"
  | "utility"
  | "config"
  | "environment"
  | "test"
  | "asset"
  | "style"
  | "documentation"
  | "package"
  | "script"
  | "unknown";

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface CrawledFile {
  absolutePath: string;
  relativePath: string;
  name: string;
  extension: string;
  folder: string;
  sizeBytes: number;
  depth: number;
  modifiedAt: string;
  contentHash?: string;
  hashSkippedReason?: string;
}

export interface ContentAnalysis {
  readable: boolean;
  skippedReason?: string;
  lineCount: number;
  importCount: number;
  exportCount: number;
  signals: string[];
  hasJsx: boolean;
  hasReact: boolean;
  hasUseClient: boolean;
  hasFetch: boolean;
  hasConsoleLog: boolean;
  hasTodo: boolean;
  hasPostHandler: boolean;
  hasGetHandler: boolean;
  hasDefaultExport: boolean;
}

export interface Finding {
  id: string;
  severity: FindingSeverity;
  category: string;
  title: string;
  message: string;
  filePath?: string;
  suggestedAction?: string;
}

export interface Room {
  id: string;
  name: string;
  path: string;
  folder: string;
  role: FileRole;
  roomType: string;
  landmark: boolean;
  riskLevel: RiskLevel;
  sizeBytes: number;
  modifiedAt: string;
  lineCount: number;
  importCount: number;
  exportCount: number;
  signals: string[];
  contentHash?: string;
  hashSkippedReason?: string;
  xpValue: number;
  findings: Finding[];
}

export interface Zone {
  id: string;
  name: string;
  path: string;
  level: number;
  rooms: Room[];
}

export interface ProjectMap {
  appName: "Probe.exe";
  scanMode: "discovery";
  scannedAt: string;
  rootPath: string;
  summary: {
    foldersScanned: number;
    filesScanned: number;
    routesFound: number;
    componentsFound: number;
    risksFound: number;
    xpEarned: number;
    level: number;
  };
  zones: Zone[];
  findings: Finding[];
}
