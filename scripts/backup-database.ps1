# ==============================================================================
# NMS-NOC - Automated PostgreSQL Database Backup Script (PowerShell / Windows)
# ==============================================================================

param(
    [string]$ContainerName = "nms-noc-postgres",
    [string]$DbName = "nms_db",
    [string]$DbUser = "postgres",
    [string]$BackupDir = "./backups/postgres",
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir/${DbName}_backup_${Timestamp}.sql"
$LogFile = "$BackupDir/backup.log"

Write-Host "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] [INFO] Memulai backup database '$DbName'..." -ForegroundColor Cyan

try {
    # Run pg_dump via Docker
    docker exec -t $ContainerName pg_dump -U $DbUser -d $DbName --clean --if-exists --no-owner --no-privileges | Out-File -Encoding utf8 $BackupFile
    
    $FileSize = (Get-Item $BackupFile).Length / 1MB
    $FileSizeStr = "{0:N2} MB" -f $FileSize
    Write-Host "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] [SUCCESS] Backup berhasil dibuat: $BackupFile (Ukuran: $FileSizeStr)" -ForegroundColor Green

    # Auto-retention
    $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "${DbName}_backup_*.sql*" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
}
catch {
    Write-Host "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] [ERROR] Backup gagal: $($_.Exception.Message)" -ForegroundColor Red
}
