#!/bin/sh

echo "=== Entrypoint: Sincronizando esquema de Prisma ==="
npx prisma migrate deploy || npx prisma db push --accept-data-loss || echo "WARNING: Falló la sincronización de BD. Continuando arranque..."

echo "=== Sincronización completada. Iniciando servidor Node.js ==="
exec node src/server.js
