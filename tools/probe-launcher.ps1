param(
  [string]$TargetPath = "",
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent
$ScannerRoot = Join-Path $RepoRoot "scanner"

function Select-ProbeFolder {
  Add-Type -AssemblyName System.Windows.Forms

  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = "Select a folder for Probe.exe to scan"
  $dialog.ShowNewFolderButton = $false

  if (Test-Path $RepoRoot) {
    $dialog.SelectedPath = $RepoRoot
  }

  $result = $dialog.ShowDialog()

  if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
    return ""
  }

  return $dialog.SelectedPath
}

function Assert-FileExists {
  param([string]$Path)

  if (!(Test-Path $Path)) {
    throw "Missing required file: $Path"
  }
}

function Show-EncounterSummary {
  param(
    [string]$EncountersPath,
    [string]$CleanupPath
  )

  if (!(Test-Path $EncountersPath) -or !(Test-Path $CleanupPath)) {
    Write-Host ""
    Write-Host "[PROBE LAUNCHER] Encounter artifacts not found."
    return
  }

  $encounters = Get-Content $EncountersPath -Raw | ConvertFrom-Json
  $cleanup = Get-Content $CleanupPath -Raw | ConvertFrom-Json

  Write-Host ""
  Write-Host "+----------------------------------------------+"
  Write-Host "| PROBE.EXE ENCOUNTER SUMMARY                  |"
  Write-Host "+----------------------------------------------+"
  Write-Host ""
  Write-Host "Encounters found       : $($encounters.summary.encountersFound)"
  Write-Host "Cleanup actions planned: $($cleanup.actions.Count)"
  Write-Host "Safety mode            : $($cleanup.safetyMode)"
  Write-Host ""
  Write-Host "Enemy breakdown:"
  Write-Host "  Mirror Goblins / Imps : $($encounters.summary.mirrorGoblins)"
  Write-Host "  Boss Rooms            : $($encounters.summary.bossRooms)"
  Write-Host "  Vault Wraiths         : $($encounters.summary.vaultWraiths)"
  Write-Host "  Code Gremlins         : $($encounters.summary.codeGremlins)"
  Write-Host "  Tangle Hydras         : $($encounters.summary.tangleHydras)"
  Write-Host "  Empty Shells          : $($encounters.summary.emptyShells)"
  Write-Host ""

  $top = @($encounters.encounters | Select-Object -First 8)

  if ($top.Count -gt 0) {
    Write-Host "Top encounters:"
    foreach ($encounter in $top) {
      Write-Host "  [$($encounter.enemyType)] $($encounter.title)"
      Write-Host "    Zone: $($encounter.zone)"
      Write-Host "    Power: $(@($encounter.suggestedPowers)[0])"
    }
  }
}

Write-Host ""
Write-Host "+----------------------------------------------+"
Write-Host "| PROBE.EXE FILE QUEST LAUNCHER                |"
Write-Host "+----------------------------------------------+"
Write-Host ""

if ([string]::IsNullOrWhiteSpace($TargetPath)) {
  Write-Host "Opening folder picker..."
  $TargetPath = Select-ProbeFolder
}

if ([string]::IsNullOrWhiteSpace($TargetPath)) {
  Write-Host "No folder selected. Probe launch cancelled."
  exit 0
}

if (!(Test-Path $TargetPath)) {
  throw "Target path does not exist: $TargetPath"
}

Write-Host "Selected target:"
Write-Host "  $TargetPath"
Write-Host ""
Write-Host "[PROBE LAUNCHER] Building scanner..."

cd $ScannerRoot

npm run build
if ($LASTEXITCODE -ne 0) {
  throw "Scanner build failed."
}

Write-Host ""
Write-Host "[PROBE LAUNCHER] Scanning selected folder..."

npm run scan -- "$TargetPath"
if ($LASTEXITCODE -ne 0) {
  throw "Probe scan failed."
}

$ProbeDir = Join-Path $TargetPath ".probe"
$HtmlReport = Join-Path $ProbeDir "file-quest-report.html"
$EncountersPath = Join-Path $ProbeDir "encounters.json"
$CleanupPath = Join-Path $ProbeDir "cleanup-plan.json"
$GameMapPath = Join-Path $ProbeDir "game-map.json"

Assert-FileExists $HtmlReport
Assert-FileExists $EncountersPath
Assert-FileExists $CleanupPath
Assert-FileExists $GameMapPath

Show-EncounterSummary -EncountersPath $EncountersPath -CleanupPath $CleanupPath

Write-Host ""
Write-Host "Artifacts:"
Write-Host "  $HtmlReport"
Write-Host "  $EncountersPath"
Write-Host "  $CleanupPath"
Write-Host "  $GameMapPath"

if (!$NoOpen) {
  Write-Host ""
  Write-Host "[PROBE LAUNCHER] Opening visual report..."
  Invoke-Item $HtmlReport
}

Write-Host ""
Write-Host "Probe.exe scan complete."
