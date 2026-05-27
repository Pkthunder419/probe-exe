$ErrorActionPreference = "Stop"

$RepoRoot = "C:\Users\smief654\Desktop\ProbeExe"
$ScannerRoot = Join-Path $RepoRoot "scanner"

Write-Host ""
Write-Host "[PROBE CHECK] Running repo self-check..."

cd $ScannerRoot

npm install
npm run build

if ($LASTEXITCODE -ne 0) {
  throw "Scanner build failed."
}

npm run scan -- "$RepoRoot"

if ($LASTEXITCODE -ne 0) {
  throw "Self-scan failed."
}

$Required = @(
  "$RepoRoot\.probe\project-map.json",
  "$RepoRoot\.probe\file-quest-report.html",
  "$RepoRoot\.probe\game-map.json",
  "$RepoRoot\.probe\mission-brief.md",
  "$RepoRoot\game\Assets\Scripts\Core\FileQuestBootstrap.cs",
  "$RepoRoot\game\Assets\Editor\ProbeSceneBuilder.cs"
)

foreach ($file in $Required) {
  if (!(Test-Path $file)) {
    throw "Missing required file: $file"
  }
}

Write-Host ""
Write-Host "[PROBE CHECK] Passed."
Write-Host "Repo is healthy."
