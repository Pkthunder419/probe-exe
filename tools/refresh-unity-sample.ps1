param(
  [string]$TargetPath = "C:\Users\smief654\Desktop\ProbeExe"
)

$ErrorActionPreference = "Stop"

$RepoRoot = "C:\Users\smief654\Desktop\ProbeExe"
$ScannerRoot = Join-Path $RepoRoot "scanner"
$UnitySamplePath = Join-Path $RepoRoot "game\Assets\StreamingAssets\probe-game-map.sample.json"

Write-Host ""
Write-Host "[PROBE UNITY] Refreshing Unity sample map..."
Write-Host "Target:"
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

$GameMap = Join-Path $TargetPath ".probe\game-map.json"

if (!(Test-Path $GameMap)) {
  throw "game-map.json was not created: $GameMap"
}

New-Item -ItemType Directory -Force (Split-Path $UnitySamplePath -Parent) | Out-Null
Copy-Item $GameMap $UnitySamplePath -Force

Write-Host ""
Write-Host "[PROBE UNITY] Sample map refreshed:"
Write-Host "  $UnitySamplePath"
