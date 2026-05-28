param(
  [string]$TargetPath
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent
$ScannerRoot = Join-Path $RepoRoot "scanner"

if ([string]::IsNullOrWhiteSpace($TargetPath)) {
  $TargetPath = $RepoRoot
}

Write-Host ""
Write-Host "[PROBE SCAN] Target:"
Write-Host "  $TargetPath"

if (!(Test-Path $TargetPath)) {
  throw "Target path does not exist: $TargetPath"
}

cd $ScannerRoot

npm run build
if ($LASTEXITCODE -ne 0) {
  throw "Scanner build failed."
}

npm run scan -- "$TargetPath"
if ($LASTEXITCODE -ne 0) {
  throw "Probe scan failed."
}

$ProbeDir = Join-Path $TargetPath ".probe"
$Required = @(
  "project-map.json",
  "file-inventory.csv",
  "project-summary.md",
  "file-quest-report.html",
  "route-map.md",
  "build-readiness.md",
  "ui-map.json",
  "game-map.json",
  "mission-brief.md",
  "encounters.json",
  "cleanup-plan.json"
)

foreach ($file in $Required) {
  $fullPath = Join-Path $ProbeDir $file
  if (!(Test-Path $fullPath)) {
    throw "Missing artifact: $fullPath"
  }
}

Write-Host ""
Write-Host "[PROBE SCAN] Complete."
Write-Host "Artifacts:"
foreach ($file in $Required) {
  Write-Host "  $(Join-Path $ProbeDir $file)"
}
