#!/usr/bin/env bash
# ==============================================================================
# NMS-NOC - PostgreSQL Database Restore Utility
# Restores compressed .sql.gz dump into nms-noc-postgres container
# ==============================================================================

set -euo pipefail

CONTAINER_NAME="nms-noc-postgres"
DB_NAME="${POSTGRES_DB:-nms_db}"
DB_USER="${POSTGRES_USER:-postgres}"

if [ "$#" -ne 1 ]; then
    echo "Penggunaan: $0 <path-ke-file-backup.sql.gz>"
    echo "Contoh: $0 ./backups/postgres/nms_db_backup_20260926_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[ERROR] File '${BACKUP_FILE}' tidak ditemukan!"
    exit 1
fi

echo "===================================================================="
echo "⚠️  PERINGATAN: RESTORE DATABASE AKAN MENIMPA DATA YANG ADA SAAT INI"
echo "Target Container : ${CONTAINER_NAME}"
echo "Target Database  : ${DB_NAME}"
echo "File Sumber      : ${BACKUP_FILE}"
echo "===================================================================="
read -p "Apakah Anda yakin ingin melanjutkan proses restore? (ketik 'YA' untuk lanjut): " CONFIRM

if [ "${CONFIRM}" != "YA" ]; then
    echo "Proses restore dibatalkan oleh pengguna."
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Memulai proses restore..."

if gzip -dc "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] Database '${DB_NAME}' berhasil dipulihkan dari '${BACKUP_FILE}'!"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] Terjadi kegagalan saat menjalankan proses restore!"
    exit 1
fi

exit 0
