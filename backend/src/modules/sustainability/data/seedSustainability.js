/**
 * @file seedSustainability.js
 * @description Script de carga e indexación inicial del corpus normativo de Ecuador y ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';
import { ECUADOR_LABOR_CORPUS } from './ecuadorLaborKnowledge.js';

export async function seedSustainabilityKnowledge() {
  console.log('[SUSTAINABILITY SEED] Iniciando ingesta de legislación laboral ecuatoriana y ODS 8...');

  for (const doc of ECUADOR_LABOR_CORPUS) {
    // Buscar si ya existe el documento público por título
    let existingDoc = await prisma.knowledgeDocument.findFirst({
      where: {
        title: doc.title,
        tenantId: null,
      },
    });

    if (!existingDoc) {
      existingDoc = await prisma.knowledgeDocument.create({
        data: {
          title: doc.title,
          category: doc.category,
          version: doc.version,
          tenantId: null,
        },
      });
      console.log(`[SUSTAINABILITY SEED] Documento creado: ${doc.title}`);
    }

    // Ingestar los chunks
    for (const chunk of doc.chunks) {
      const existingChunk = await prisma.knowledgeChunk.findFirst({
        where: {
          documentId: existingDoc.id,
          articleCode: chunk.articleCode,
        },
      });

      if (!existingChunk) {
        await prisma.knowledgeChunk.create({
          data: {
            documentId: existingDoc.id,
            articleCode: chunk.articleCode,
            odsTarget: chunk.odsTarget,
            content: chunk.content,
            metadata: chunk.metadata,
          },
        });
      }
    }
  }

  console.log('[SUSTAINABILITY SEED] Ingesta completada con éxito.');
}

// Si se ejecuta directamente desde CLI
if (process.argv[1]?.endsWith('seedSustainability.js')) {
  seedSustainabilityKnowledge()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SUSTAINABILITY SEED] Error:', err);
      process.exit(1);
    });
}
