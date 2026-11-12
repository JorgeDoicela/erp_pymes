#!/bin/sh

echo "=== Entrypoint: Sincronizando esquema de Prisma ==="
npx prisma migrate deploy
npx prisma db push --accept-data-loss || echo "WARNING: Falló la sincronización de BD. Continuando arranque..."

if [ "$RUN_SEED" = "true" ] || [ -z "$RUN_SEED" ]; then
    echo "=== Ejecutando Seeder de Inicialización de Empresas ==="
    node prisma/seed.js || echo "WARNING: Falló la ejecución del seeder. Continuando arranque..."
else
    echo "=== RUN_SEED=$RUN_SEED. Omitiendo seed ==="
fi

echo "=== Entrypoint: Verificando artefactos de IA y RAG Legal (Hugging Face Hub) ==="
node src/modules/sustainability/data/syncHuggingFaceModels.js ensure || echo "WARNING: No se pudo verificar Hugging Face Hub. Usando índice embebido..."

echo "=== Sincronización completada. Iniciando servidor Node.js ==="
exec node src/server.js

