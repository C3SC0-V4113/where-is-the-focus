Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = $env:CLAUDE_PROJECT_DIR
if ([string]::IsNullOrWhiteSpace($projectRoot)) {
  $projectRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')
}

Set-Location -LiteralPath $projectRoot

$reactDoctor = Join-Path $projectRoot 'node_modules\.bin\react-doctor.cmd'
if (Test-Path -LiteralPath $reactDoctor) {
  & cmd /c "`"$reactDoctor`" --verbose --diff --blocking warning --no-score"
  exit $LASTEXITCODE
}

& cmd /c 'npx --yes react-doctor@latest --verbose --diff --blocking warning --no-score'
exit $LASTEXITCODE
