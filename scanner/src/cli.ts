import { scanProject } from "./scanner/scanProject";
import { writeArtifacts } from "./output/writeArtifacts";

async function main() {
  const [, , command, targetPath] = process.argv;

  if (command !== "scan" || !targetPath) {
    console.log("");
    console.log("PROBE.EXE");
    console.log("");
    console.log("Usage:");
    console.log('  npm run scan -- "C:\\path\\to\\project"');
    console.log("");
    process.exit(1);
  }

  console.log("");
  console.log("+----------------------------------------------+");
  console.log("| PROBE.EXE DISCOVERY RUN                      |");
  console.log("+----------------------------------------------+");
  console.log("");
  console.log(`Target: ${targetPath}`);
  console.log("Mode  : read-only discovery");
  console.log("");

  const startedAt = Date.now();
  const projectMap = await scanProject(targetPath);
  await writeArtifacts(projectMap);
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);

  console.log("Scan complete.");
  console.log("");
  console.log(`Files scanned     : ${projectMap.summary.filesScanned}`);
  console.log(`Folders scanned   : ${projectMap.summary.foldersScanned}`);
  console.log(`Routes found      : ${projectMap.summary.routesFound}`);
  console.log(`Components found  : ${projectMap.summary.componentsFound}`);
  console.log(`Risks found       : ${projectMap.summary.risksFound}`);
  console.log(`XP earned         : ${projectMap.summary.xpEarned}`);
  console.log(`Level             : ${projectMap.summary.level}`);
  console.log(`Elapsed           : ${elapsedSeconds}s`);
  console.log("");
  console.log("Artifacts written:");
  console.log("  .probe/project-map.json");
  console.log("  .probe/file-inventory.csv");
  console.log("  .probe/project-summary.md");
  console.log("  .probe/file-quest-report.html");
  console.log("  .probe/route-map.md");
  console.log("  .probe/build-readiness.md");
  console.log("  .probe/ui-map.json");
  console.log("  .probe/game-map.json");
  console.log("  .probe/mission-brief.md");
  console.log("  .probe/encounters.json");
  console.log("  .probe/cleanup-plan.json");
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("PROBE.EXE SCAN FAILED");
  console.error(error instanceof Error ? error.message : error);
  console.error("");
  process.exit(1);
});

