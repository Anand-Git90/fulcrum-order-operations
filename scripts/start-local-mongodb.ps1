$ErrorActionPreference = 'Stop'
$serverRoot = 'C:\Program Files\MongoDB\Server'
$install = Get-ChildItem -LiteralPath $serverRoot -Directory | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
if (-not $install) { throw "MongoDB Server was not found under $serverRoot." }
$mongod = Join-Path $install.FullName 'bin\mongod.exe'
if (-not (Test-Path -LiteralPath $mongod)) { throw "mongod.exe was not found at $mongod." }
$dataPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'data\mongodb'
New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
Write-Host "Starting MongoDB from $mongod"
Write-Host "Database files: $dataPath"
& $mongod --dbpath $dataPath --bind_ip 127.0.0.1 --port 27017
