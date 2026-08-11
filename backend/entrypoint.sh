#!/bin/sh
set -e

echo "=== Entrypoint: Iniciando backend ==="

# Esperar a que PostgreSQL esté listo antes de migrar
# (docker-compose depends_on: condition: service_healthy ya debería garantizarlo,
#  pero este fallback protege ante race conditions en reinicios)
MAX_RETRIES=15
RETRY=0
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "ERROR: PostgreSQL no respondió tras $MAX_RETRIES intentos. Abortando."
    exit 1
  fi
  echo "Esperando a PostgreSQL... intento $RETRY/$MAX_RETRIES"
  sleep 2
done

echo "=== PostgreSQL disponible. Aplicando migraciones... ==="
npx prisma migrate deploy

echo "=== Migraciones aplicadas. Iniciando servidor Node.js ==="
exec node src/server.js
