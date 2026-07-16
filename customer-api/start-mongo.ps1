$dataDir = Join-Path $PSScriptRoot "mongo-data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}

& "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath $dataDir --port 27018
