#!/bin/sh

echo "=== Entrypoint: Sincronizando esquema de Prisma ==="
npx prisma migrate deploy
npx prisma db push --accept-data-loss || echo "WARNING: Falló la sincronización de BD. Continuando arranque..."

echo "=== Ejecutando Seeder Destructivo de 2 Empresas ==="
node prisma/seed.js || echo "WARNING: Falló la ejecución del seeder. Continuando arranque..."

echo "=== Sincronización completada. Iniciando servidor Node.js ==="
exec node src/server.js

