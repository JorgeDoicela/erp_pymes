#!/bin/bash
set -e

# Script de respaldo de PostgreSQL para Norma ERP
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/erp_pymes_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "=== Generando respaldo de PostgreSQL: ${BACKUP_FILE} ==="
docker compose exec -T db pg_dump -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-db_recursos_humanos}" | gzip > "$BACKUP_FILE"

echo "=== Respaldo completado exitosamente: ${BACKUP_FILE} ==="
