param(
    [Parameter(Mandatory = $true)] [string] $BackupDirectory,
    [Parameter(Mandatory = $true)] [string] $MySqlConnectionName,
    [int] $RetentionDays = 30
)

$ErrorActionPreference = 'Stop'
$resolvedBackupDirectory = [System.IO.Path]::GetFullPath($BackupDirectory)
if ($resolvedBackupDirectory -eq [System.IO.Path]::GetPathRoot($resolvedBackupDirectory)) {
    throw 'BackupDirectory must not be a filesystem root.'
}
New-Item -ItemType Directory -Path $resolvedBackupDirectory -Force | Out-Null

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
$databaseBackup = Join-Path $resolvedBackupDirectory "sv5t-mysql-$timestamp.sql"
$redisBackup = Join-Path $resolvedBackupDirectory "sv5t-redis-$timestamp.rdb"

# Credentials must come from the process environment/secret manager. Never pass
# passwords on the command line. MySqlConnectionName identifies a preconfigured
# mysql_config_editor login path.
& mysqldump --login-path=$MySqlConnectionName --single-transaction --routines --events SV5T |
    Set-Content -LiteralPath $databaseBackup -Encoding utf8NoBOM
if ($LASTEXITCODE -ne 0) { throw 'MySQL backup failed.' }

& docker compose exec -T redis redis-cli --rdb /tmp/sv5t-backup.rdb
if ($LASTEXITCODE -ne 0) { throw 'Redis snapshot failed.' }
& docker compose cp redis:/tmp/sv5t-backup.rdb $redisBackup
if ($LASTEXITCODE -ne 0) { throw 'Redis snapshot copy failed.' }

Get-FileHash -Algorithm SHA256 -LiteralPath $databaseBackup, $redisBackup |
    ConvertTo-Json |
    Set-Content -LiteralPath (Join-Path $resolvedBackupDirectory "manifest-$timestamp.json") -Encoding utf8NoBOM

$cutoff = (Get-Date).ToUniversalTime().AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $resolvedBackupDirectory -File |
    Where-Object {
        $_.LastWriteTimeUtc -lt $cutoff -and
        ($_.Name -like 'sv5t-mysql-*.sql' -or
         $_.Name -like 'sv5t-redis-*.rdb' -or
         $_.Name -like 'manifest-*.json')
    } |
    Remove-Item -Force

Write-Output "Backup completed at $resolvedBackupDirectory. Replicate it to encrypted off-site storage."
