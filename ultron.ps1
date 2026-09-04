# ultron.ps1 — PowerShell CLI for ULTRON
param (
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$ArgsList
)

$cliPath = Join-Path $PSScriptRoot "cli.js"

if ($ArgsList) {
    node $cliPath $ArgsList
} else {
    node $cliPath
}
