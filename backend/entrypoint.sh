#!/bin/sh
set -e

echo "=== Entrypoint: Aplicando migraciones de Prisma ==="
npx prisma migrate deploy || {
  echo "WARNING: Primer intento de migrate deploy falló, reintentando en 3 segundos..."
  sleep 3
  npx prisma migrate deploy
}

echo "=== Migraciones completadas. Iniciando servidor Node.js ==="
exec node src/server.js
