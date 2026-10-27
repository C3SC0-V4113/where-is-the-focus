Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = $env:CLAUDE_PROJECT_DIR
if ([string]::IsNullOrWhiteSpace($projectRoot)) {
  $projectRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')
}

Set-Location -LiteralPath $projectRoot

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace(($status | Out-String))) {
  exit 0
}

$scripts = @('lint', 'typecheck', 'format:check', 'test', 'doctor', 'check')
foreach ($scriptName in $scripts) {
  & cmd /c "pnpm run $scriptName"
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
