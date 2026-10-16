# Copy the submito consumer skill into a target project's agent skill dirs.
# Usage: ./skills/install.ps1 -Target C:\path\to\app [-Cursor] [-Claude] [-Codex] [-All]
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string] $Target,

  [switch] $All,
  [switch] $Cursor,
  [switch] $Claude,
  [switch] $Codex
)

$ErrorActionPreference = 'Stop'

$Root = $PSScriptRoot
$Src = Join-Path $Root 'submito'
$SkillMd = Join-Path $Src 'SKILL.md'

if (-not (Test-Path -LiteralPath $SkillMd)) {
  throw "Missing $SkillMd"
}

if (-not (Test-Path -LiteralPath $Target -PathType Container)) {
  throw "Target directory does not exist: $Target"
}

$doCursor = $false
$doClaude = $false
$doCodex = $false

# Default: install for all three tools when no tool flags are passed.
if ($All -or (-not $Cursor -and -not $Claude -and -not $Codex)) {
  $doCursor = $true
  $doClaude = $true
  $doCodex = $true
} else {
  if ($Cursor) { $doCursor = $true }
  if ($Claude) { $doClaude = $true }
  if ($Codex) { $doCodex = $true }
}

function Install-One([string] $Rel) {
  $destParent = Join-Path $Target $Rel
  $dest = Join-Path $destParent 'submito'
  $legacy = Join-Path $destParent 'formsub'
  New-Item -ItemType Directory -Force -Path $destParent | Out-Null
  if (Test-Path -LiteralPath (Join-Path $legacy 'SKILL.md')) {
    Remove-Item -Recurse -Force -LiteralPath $legacy
    Write-Host "removed old skill: $legacy"
  }
  if (Test-Path -LiteralPath $dest) {
    Remove-Item -Recurse -Force -LiteralPath $dest
  }
  Copy-Item -Recurse -Force -LiteralPath $Src -Destination $dest
  Write-Host "installed: $dest"
}

if ($doCursor) { Install-One '.cursor\skills' }
if ($doClaude) { Install-One '.claude\skills' }
if ($doCodex) { Install-One '.agents\skills' }

Write-Host 'Done. See skills/INSTALL.md'
