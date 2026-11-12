/**
 * @file sustainability.js
 * @description Seed de legislación laboral de Ecuador, IESS, SRI, NIIF, LOPDP y Metas ODS 8 en el proceso de inicialización de BD
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { ECUADOR_LABOR_CORPUS } from '../../../src/modules/sustainability/data/ecuadorLaborKnowledge.js';

import sustainabilityRepository from '../../../src/modules/sustainability/sustainability.repository.js';

export async function seedSustainability(prisma) {
  console.log(
    '[SEED] Sincronizando Corpus Maestro + pgvector (Constitución, Código del Trabajo, IESS, OIT ODS 8)...'
  );

  // Sincronización idempotente del corpus íntegro (1,880+ artículos) con vectores 768-dim en pgvector
  const pgSynced = await sustainabilityRepository.ensurePgVectorCorpusSeeded();
  if (pgSynced) {
    console.log('[SEED] Corpus vectorial pgvector sincronizado exitosamente.');
    return;
  }

  for (const doc of ECUADOR_LABOR_CORPUS) {
    const normalizedCategory = doc.docId === 'constitucion_2008' ? 'CONSTITUTION' : doc.category;
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
          category: normalizedCategory,
          sourceUrl: doc.sourceUrl || null,
          version: doc.version,
          tenantId: null,
        },
      });
    }

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
      } else {
        await prisma.knowledgeChunk.update({
          where: { id: existingChunk.id },
          data: {
            content: chunk.content,
            odsTarget: chunk.odsTarget,
            metadata: chunk.metadata,
          },
        });
      }
    }
  }

  console.log('[SEED] Corpus Maestro sincronizado exitosamente.');
}
