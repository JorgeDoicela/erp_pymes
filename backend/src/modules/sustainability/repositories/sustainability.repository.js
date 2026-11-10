/**
 * @file sustainability.repository.js
 * @description Repositorio de persistencia relacional y vectorial para el dominio de Sostenibilidad ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export class SustainabilityRepository {
  /**
   * Obtiene los datos agregados para computar los indicadores del ODS 8 del tenant
   * @param {string} tenantId 
   */
  async getOds8AggregatedData(tenantId) {
    const whereTenant = tenantId ? { tenantId } : {};

    const [
      totalEmployees,
      employeesWithActiveContract,
      allActiveEmployees,
      recentPayrolls,
      recentAttendances,
      recentOffboardings,
    ] = await Promise.all([
      // Total colaboradores activos
      prisma.employee.count({
        where: { ...whereTenant, isActive: true },
      }),

      // Colaboradores con contrato activo registrado
      prisma.employee.count({
        where: {
          ...whereTenant,
          isActive: true,
          contracts: {
            some: { status: 'Active' },
          },
        },
      }),

      // Empleados con sueldos y contratos para validar SBU
      prisma.employee.findMany({
        where: { ...whereTenant, isActive: true },
        select: {
          id: true,
          salary: true,
          department: true,
          contractType: true,
          contracts: {
            where: { status: 'Active' },
            select: { id: true, salary: true, contractType: true },
          },
        },
      }),

      // Nóminas emitidas y sus detalles
      prisma.payroll.findMany({
        where: { ...whereTenant, status: 'PAID' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          details: {
            select: {
              id: true,
              employeeId: true,
              baseSalary: true,
              iessDeduction: true,
              employerIess: true,
              overtimePay: true,
              netSalary: true,
            },
          },
        },
      }),

      // Registros de asistencia recientes con horas extras
      prisma.attendance.findMany({
        where: {
          ...whereTenant,
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          employeeId: true,
          overtimeHours: true,
          status: true,
        },
      }),

      // Procesos de desvinculación
      prisma.offboardingProcess.findMany({
        where: whereTenant,
        select: {
          id: true,
          employeeId: true,
          status: true,
          calculatedSeverance: true,
          digitalSignatureSha256: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalEmployees,
      employeesWithActiveContract,
      allActiveEmployees,
      recentPayrolls,
      recentAttendances,
      recentOffboardings,
    };
  }

  /**
   * Búsqueda de fragmentos de conocimiento legal y ODS 8
   * Soporta búsqueda semántica combinada por palabras clave y metadatos
   * @param {Object} params
   */
  async searchKnowledgeChunks({ query, odsTarget, category, tenantId, limit = 6 }) {
    const whereClause = {
      OR: [
        { document: { tenantId: null } }, // Legislación pública ecuatoriana
        ...(tenantId ? [{ document: { tenantId } }] : []),
      ],
    };

    if (odsTarget) {
      whereClause.odsTarget = odsTarget;
    }

    if (category) {
      whereClause.document = {
        ...whereClause.document,
        category,
      };
    }

    // Extracción de tokens clave de la consulta para matching relacional
    const tokens = (query || '')
      .toLowerCase()
      .replace(/[^a-záéíóúñ0-9\s]/gi, '')
      .split(/\s+/)
      .filter((t) => t.length > 3);

    const textFilter = tokens.length > 0
      ? {
          OR: tokens.map((token) => ({
            content: { contains: token, mode: 'insensitive' },
          })),
        }
      : {};

    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        ...whereClause,
        ...textFilter,
      },
      include: {
        document: {
          select: {
            title: true,
            category: true,
            version: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    // Si la búsqueda relacional directa devolvió menos del límite, traer fragmentos base del ODS / Código
    if (chunks.length === 0) {
      return prisma.knowledgeChunk.findMany({
        where: whereClause,
        include: {
          document: {
            select: {
              title: true,
              category: true,
              version: true,
            },
          },
        },
        take: limit,
      });
    }

    return chunks;
  }

  /**
   * Ingesta un documento con sus fragmentos en una transacción ACID
   * @param {Object} docData 
   */
  async ingestDocument(docData, tenantId = null) {
    return prisma.$transaction(async (tx) => {
      const document = await tx.knowledgeDocument.create({
        data: {
          tenantId,
          title: docData.title,
          category: docData.category,
          sourceUrl: docData.sourceUrl || null,
          version: docData.version || '2026',
        },
      });

      if (docData.chunks && docData.chunks.length > 0) {
        await tx.knowledgeChunk.createMany({
          data: docData.chunks.map((chunk) => ({
            documentId: document.id,
            content: chunk.content,
            articleCode: chunk.articleCode || null,
            odsTarget: chunk.odsTarget || null,
            metadata: chunk.metadata || {},
          })),
        });
      }

      return document;
    });
  }

  /**
   * Obtiene todos los fragmentos para construcción de datasets de Fine-Tuning
   */
  async getAllChunksForDataset({ categories, includeTenantData, tenantId }) {
    const where = {
      document: {
        ...(includeTenantData && tenantId
          ? { OR: [{ tenantId: null }, { tenantId }] }
          : { tenantId: null }),
        ...(categories && categories.length > 0
          ? { category: { in: categories } }
          : {}),
      },
    };

    return prisma.knowledgeChunk.findMany({
      where,
      include: {
        document: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export default new SustainabilityRepository();
