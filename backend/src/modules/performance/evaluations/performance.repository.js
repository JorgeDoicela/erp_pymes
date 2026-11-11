/**
 * @file performance.repository.js
 * @description Repositorio de persistencia para el módulo de Desempeño, Evaluaciones 360 y Objetivos SMART (Norma ERP).
 * Encapsula la capa de datos de Prisma ORM aislando la lógica de negocio de la infraestructura de persistencia.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export class PerformanceRepository {
  /**
   * Resuelve el ID del empleado a partir del usuario en sesión.
   * @param {Object} user
   * @returns {Promise<string>}
   */
  async resolveEmployeeId(user) {
    if (!user) return null;
    const directId = user.employeeId || user.id;
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [
          ...(directId ? [{ id: directId }] : []),
          ...(user.email ? [{ email: user.email }] : []),
        ],
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
      select: { id: true },
    });
    return emp ? emp.id : directId;
  }

  // --- PLANTILLAS DE EVALUACIÓN ---

  async findTemplates(where = {}) {
    return prisma.evaluationTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countTemplates(where = {}) {
    return prisma.evaluationTemplate.count({ where });
  }

  async findTemplateById(id, where = {}) {
    return prisma.evaluationTemplate.findFirst({
      where: { id, ...where },
    });
  }

  async createTemplate(data) {
    return prisma.evaluationTemplate.create({ data });
  }

  // --- EVALUACIONES DE EMPLEADOS ---

  async findEvaluations({
    where = {},
    skip = 0,
    take = 15,
    _orderBy = { createdAt: 'desc' },
  } = {}) {
    return this.findEvaluationsForAdmin({ where, skip, take });
  }

  async findEvaluationsForAdmin({ where = {}, skip = 0, take = 15 } = {}) {
    return prisma.employeeEvaluation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityCard: true,
            department: true,
            position: true,
          },
        },
        template: {
          select: {
            id: true,
            title: true,
            period: true,
            scale: true,
          },
        },
        reviewers: {
          select: {
            id: true,
            reviewerId: true,
            status: true,
            score: true,
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async countEvaluations(where = {}) {
    return prisma.employeeEvaluation.count({ where });
  }

  async getPerformanceStatsData(templateWhere = {}, empWhere = {}) {
    const [
      totalTemplates,
      totalEvaluations,
      pendingEvaluations,
      completedEvaluations,
      completedWithScore,
    ] = await Promise.all([
      prisma.evaluationTemplate.count({ where: templateWhere }),
      prisma.employeeEvaluation.count({ where: empWhere }),
      prisma.employeeEvaluation.count({
        where: { ...empWhere, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      prisma.employeeEvaluation.count({
        where: { ...empWhere, status: 'COMPLETED' },
      }),
      prisma.employeeEvaluation.findMany({
        where: { ...empWhere, status: 'COMPLETED', finalScore: { not: null } },
        select: { finalScore: true },
      }),
    ]);

    return {
      totalTemplates,
      totalEvaluations,
      pendingEvaluations,
      completedEvaluations,
      completedWithScore,
    };
  }

  async findEmployeesByIds(ids, tenantId = null) {
    return prisma.employee.findMany({
      where: {
        id: { in: ids },
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findEvaluationById(id, where = {}) {
    return prisma.employeeEvaluation.findUnique({
      where: { id, ...where },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
            tenantId: true,
          },
        },
        template: true,
        reviewers: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                position: true,
              },
            },
          },
        },
      },
    });
  }

  async createEvaluation(data, include = undefined) {
    return prisma.employeeEvaluation.create({
      data,
      ...(include ? { include } : {}),
    });
  }

  async updateEvaluation(id, data) {
    return prisma.employeeEvaluation.update({
      where: { id },
      data,
    });
  }

  async findDetailedEvaluationResult(id) {
    return prisma.employeeEvaluation.findUnique({
      where: { id },
      include: {
        template: true,
        employee: true,
        reviewers: {
          include: {
            reviewer: true,
          },
        },
      },
    });
  }

  async findMyResults(employeeId) {
    return prisma.employeeEvaluation.findMany({
      where: { employeeId },
      include: { template: true },
      orderBy: { endDate: 'desc' },
    });
  }

  // --- REVISORES DE EVALUACIÓN ---

  async findMyReviewerTasks(reviewerId) {
    return prisma.evaluationReviewer.findMany({
      where: {
        reviewerId,
        evaluation: {
          status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
        },
      },
      include: {
        evaluation: {
          include: {
            template: true,
            employee: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReviewers(where = {}, include = {}) {
    return prisma.evaluationReviewer.findMany({
      where,
      include,
    });
  }

  async findReviewerById(id, include = {}) {
    return prisma.evaluationReviewer.findUnique({
      where: { id },
      include,
    });
  }

  async updateReviewer(id, data) {
    return prisma.evaluationReviewer.update({
      where: { id },
      data,
    });
  }

  // --- OBJETIVOS SMART (GOALS) ---

  async findGoalsByEmployee(employeeId) {
    return prisma.employeeGoal.findMany({
      where: { employeeId },
      orderBy: { deadline: 'asc' },
    });
  }

  async findGoalById(id) {
    return prisma.employeeGoal.findUnique({
      where: { id },
    });
  }

  async createGoal(data) {
    return prisma.employeeGoal.create({ data });
  }

  async updateGoal(id, data) {
    return prisma.employeeGoal.update({
      where: { id },
      data,
    });
  }

  async deleteGoal(id) {
    return prisma.employeeGoal.delete({
      where: { id },
    });
  }

  // --- EMPLEADOS (CONSULTAS DE DOMINIO PARA PERFORMANCE) ---

  async findActiveEmployees(where = {}) {
    return prisma.employee.findMany({
      where: { isActive: true, ...where },
      select: { id: true, firstName: true, lastName: true, department: true },
    });
  }
}

export const performanceRepository = new PerformanceRepository();
export default performanceRepository;
