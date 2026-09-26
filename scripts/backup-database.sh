#!/usr/bin/env bash
# ==============================================================================
# NMS-NOC - Automated PostgreSQL Database Backup Script
# Zero-Downtime Hot Backup using Docker Exec & Gzip Compression
# ==============================================================================

set -euo pipefail

# Configuration
CONTAINER_NAME="nms-noc-postgres"
DB_NAME="${POSTGRES_DB:-nms_db}"
DB_USER="${POSTGRES_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

# Timestamp format: YYYYMMDD_HHMMSS
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Memulai backup database '${DB_NAME}' dari container '${CONTAINER_NAME}'..." | tee -a "${LOG_FILE}"

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] Container '${CONTAINER_NAME}' tidak sedang berjalan! Backup dibatalkan." | tee -a "${LOG_FILE}"
    exit 1
fi

# Execute pg_dump inside container and compress with gzip
if docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip -9 > "${BACKUP_FILE}"; then
    FILE_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] Backup berhasil dibuat: ${BACKUP_FILE} (Ukuran: ${FILE_SIZE})" | tee -a "${LOG_FILE}"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] Gagal menjalankan pg_dump!" | tee -a "${LOG_FILE}"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Auto-retention: Remove backups older than RETENTION_DAYS
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Membersihkan file backup yang lebih lama dari ${RETENTION_DAYS} hari..." | tee -a "${LOG_FILE}"
find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -v {} \; | tee -a "${LOG_FILE}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] [DONE] Proses backup database selesai dengan sukses." | tee -a "${LOG_FILE}"
exit 0
