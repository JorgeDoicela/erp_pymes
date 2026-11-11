/**
 * @file performanceService.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { auditRepository } from '../../audit/index.js';
import { notificationService } from '../../notifications/index.js';
import defaultPerformanceRepo from './performance.repository.js';

class PerformanceService {
  constructor({ repo = defaultPerformanceRepo } = {}) {
    this.performanceRepository = repo;
  }

  /**
   * Obtener listado de plantillas de evaluación.
   */
  async getEvaluationTemplates(tenantId = null) {
    const templates = await this.performanceRepository.findTemplates(tenantId ? { tenantId } : {});

    return templates.map((t) => {
      try {
        return {
          ...t,
          criteria: typeof t.criteria === 'string' ? JSON.parse(t.criteria) : t.criteria,
          scale: typeof t.scale === 'string' ? JSON.parse(t.scale) : t.scale,
        };
      } catch {
        return t;
      }
    });
  }

  /**
   * Crear una nueva plantilla de evaluación.
   */
  async createEvaluationTemplate(data, userId, tenantId = null) {
    const { title, description, period, instructions, criteria, scale } = data;

    const criteriaString = typeof criteria === 'object' ? JSON.stringify(criteria) : criteria;
    const scaleString = typeof scale === 'object' ? JSON.stringify(scale) : scale;

    const template = await this.performanceRepository.createTemplate({
      title,
      description,
      period,
      instructions,
      criteria: criteriaString,
      scale: scaleString,
      ...(tenantId ? { tenantId } : {}),
    });

    if (userId) {
      await auditRepository
        .log({
          action: 'CREATE_EVALUATION_TEMPLATE',
          entity: 'EvaluationTemplate',
          entityId: template.id,
          userId,
          tenantId,
          details: { title, period },
        })
        .catch((err) => console.error('[Audit Error] createEvaluationTemplate:', err));
    }

    return template;
  }

  /**
   * Obtener listado paginado de evaluaciones asignadas al personal (para Administradores y RRHH).
   */
  async getEmployeeEvaluations({
    page = 1,
    limit = 15,
    status,
    search,
    period,
    templateId,
    tenantId,
  }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) {
      if (status === 'IN_PROGRESS') {
        where.status = { in: ['PENDING', 'IN_PROGRESS'] };
      } else {
        where.status = status;
      }
    }

    if (templateId) {
      where.templateId = templateId;
    }

    const employeeWhere = tenantId ? { tenantId } : {};
    if (search) {
      const cleanSearch = search.trim();
      employeeWhere.OR = [
        { firstName: { contains: cleanSearch, mode: 'insensitive' } },
        { lastName: { contains: cleanSearch, mode: 'insensitive' } },
        { identityCard: { contains: cleanSearch, mode: 'insensitive' } },
        { department: { contains: cleanSearch, mode: 'insensitive' } },
        { position: { contains: cleanSearch, mode: 'insensitive' } },
      ];
    }

    if (Object.keys(employeeWhere).length > 0) {
      where.employee = employeeWhere;
    }

    if (period) {
      where.template = { period };
    }

    const [data, total] = await Promise.all([
      this.performanceRepository.findEvaluationsForAdmin({ where, skip, take: limit }),
      this.performanceRepository.countEvaluations(where),
    ]);

    const formattedData = data.map((ev) => {
      const totalReviewers = ev.reviewers.length;
      const completedReviewers = ev.reviewers.filter((r) => r.status === 'COMPLETED').length;

      return {
        ...ev,
        totalReviewers,
        completedReviewers,
        progressPercentage:
          totalReviewers > 0 ? Math.round((completedReviewers / totalReviewers) * 100) : 0,
      };
    });

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener estadísticas globales de desempeño y cumplimiento para el dashboard administrativo.
   */
  async getPerformanceStats(tenantId = null) {
    const empWhere = tenantId ? { employee: { tenantId } } : {};
    const templateWhere = tenantId ? { tenantId } : {};

    const {
      totalTemplates,
      totalEvaluations,
      pendingEvaluations,
      completedEvaluations,
      completedWithScore,
    } = await this.performanceRepository.getPerformanceStatsData(templateWhere, empWhere);

    const averageCompanyScore =
      completedWithScore.length > 0
        ? (
            completedWithScore.reduce((sum, e) => sum + (e.finalScore || 0), 0) /
            completedWithScore.length
          ).toFixed(2)
        : '0.00';

    return {
      totalTemplates,
      totalEvaluations,
      pendingEvaluations,
      completedEvaluations,
      averageCompanyScore: parseFloat(averageCompanyScore),
    };
  }

  /**
   * Asignar evaluaciones en lote a colaboradores.
   */
  async assignEvaluation(data, userId, tenantId = null) {
    const { templateId, employeeIds, evaluatorIds, startDate, endDate } = data;

    if (
      !templateId ||
      !employeeIds ||
      !employeeIds.length ||
      !evaluatorIds ||
      !evaluatorIds.length ||
      !startDate ||
      !endDate
    ) {
      throw new Error('Faltan datos requeridos (plantilla, colaboradores, evaluadores, fechas)');
    }

    const [allEmployees, template] = await Promise.all([
      this.performanceRepository.findEmployeesByIds(
        [...new Set([...employeeIds, ...evaluatorIds])],
        tenantId
      ),
      this.performanceRepository.findTemplateById(templateId, tenantId ? { tenantId } : {}),
    ]);

    if (!template) {
      throw new Error('Plantilla de evaluación no encontrada o sin permisos');
    }

    const employeesMap = Object.fromEntries(allEmployees.map((e) => [e.id, e]));
    const templateTitle = template.title || 'Evaluación de Desempeño';

    const validEvaluatorIds = evaluatorIds.filter((id) => employeesMap[id]);
    const validEmployeeIds = employeeIds.filter((id) => employeesMap[id]);

    if (validEvaluatorIds.length === 0) throw new Error('Ningún evaluador seleccionado es válido');
    if (validEmployeeIds.length === 0) throw new Error('Ningún colaborador seleccionado es válido');

    const createdEvaluations = await Promise.all(
      validEmployeeIds.map((empId) =>
        this.performanceRepository.createEvaluation(
          {
            templateId,
            employeeId: empId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'PENDING',
            reviewers: {
              create: validEvaluatorIds.map((reviewerId) => ({
                reviewerId,
                status: 'PENDING',
              })),
            },
          },
          { reviewers: true }
        )
      )
    );

    // Envío asíncrono no bloqueante de notificaciones
    setImmediate(async () => {
      try {
        for (const evaluation of createdEvaluations) {
          const employee = employeesMap[evaluation.employeeId];
          if (!employee) continue;
          for (const reviewerId of validEvaluatorIds) {
            const reviewer = employeesMap[reviewerId];
            if (reviewer) {
              await notificationService
                .sendEvaluationAssigned({
                  recipientId: reviewer.id,
                  recipientEmail: reviewer.email,
                  title: templateTitle,
                  employeeName: `${employee.firstName} ${employee.lastName}`,
                  endDate: evaluation.endDate,
                  evaluationId: evaluation.id,
                  role: reviewer.id === employee.id ? 'SELF' : 'REVIEWER',
                })
                .catch((notifErr) =>
                  console.error('[Notification Error] sendEvaluationAssigned:', notifErr)
                );
            }
          }
        }
      } catch (err) {
        console.error('[EVALUATION NOTIFICATIONS ERROR]:', err);
      }
    });

    if (userId) {
      await auditRepository
        .log({
          action: 'ASSIGN_EVALUATIONS_BATCH',
          entity: 'EmployeeEvaluation',
          userId,
          tenantId,
          details: {
            templateId,
            assignedCount: createdEvaluations.length,
            employeeIds: validEmployeeIds,
            evaluatorIds: validEvaluatorIds,
          },
        })
        .catch((err) => console.error('[Audit Error] assignEvaluation:', err));
    }

    return {
      success: true,
      count: createdEvaluations.length,
      evaluations: createdEvaluations,
    };
  }

  /**
   * Obtener evaluaciones asignadas a un colaborador específico (como evaluado o como evaluador).
   */
  async getMyEvaluations(userId, user = null) {
    let actualEmployeeId = userId;
    if (user) {
      const resolvedId = await this.performanceRepository.resolveEmployeeId(user);
      if (resolvedId) actualEmployeeId = resolvedId;
    }

    const reviews = await this.performanceRepository.findMyReviewerTasks(actualEmployeeId);

    return reviews.map((r) => {
      try {
        return {
          ...r,
          evaluation: {
            ...r.evaluation,
            template: {
              ...r.evaluation.template,
              criteria:
                typeof r.evaluation.template.criteria === 'string'
                  ? JSON.parse(r.evaluation.template.criteria)
                  : r.evaluation.template.criteria,
              scale:
                typeof r.evaluation.template.scale === 'string'
                  ? JSON.parse(r.evaluation.template.scale)
                  : r.evaluation.template.scale,
            },
          },
        };
      } catch {
        return r;
      }
    });
  }

  /**
   * Enviar y procesar una evaluación.
   */
  async submitAssessment(data, userId, tenantId = null) {
    const { reviewerId, responses, comments, status = 'COMPLETED' } = data;

    const review = await this.performanceRepository.findReviewerById(reviewerId, {
      evaluation: true,
    });

    if (!review) throw new Error('Evaluación no encontrada');
    if (review.reviewerId !== userId)
      throw new Error('No tienes permiso para responder esta evaluación');

    let calculatedScore = null;
    try {
      const values = Object.values(responses)
        .map((v) => parseFloat(v))
        .filter((v) => !isNaN(v));
      if (values.length > 0) {
        calculatedScore = values.reduce((a, b) => a + b, 0) / values.length;
      }
    } catch {}

    const updatedReview = await this.performanceRepository.updateReviewer(reviewerId, {
      responses: typeof responses === 'object' ? JSON.stringify(responses) : responses,
      comments,
      status: status || 'COMPLETED',
      score: calculatedScore,
      completedAt: status === 'COMPLETED' ? new Date() : undefined,
    });

    // Consolidación de evaluación padre
    if (status === 'COMPLETED') {
      try {
        const allReviewers = await this.performanceRepository.findReviewers({
          evaluationId: review.evaluationId,
        });

        const allCompleted = allReviewers.every((r) => r.status === 'COMPLETED');
        if (allCompleted && allReviewers.length > 0) {
          const validScores = allReviewers
            .map((r) => r.score)
            .filter((s) => s !== null && !isNaN(s));
          const parentScore =
            validScores.length > 0
              ? parseFloat((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2))
              : calculatedScore || 0;

          await this.performanceRepository.updateEvaluation(review.evaluationId, {
            status: 'COMPLETED',
            finalScore: parentScore,
          });
        } else {
          await this.performanceRepository.updateEvaluation(review.evaluationId, {
            status: 'IN_PROGRESS',
          });
        }
      } catch (evalErr) {
        console.error('[EVALUATION] Error en consolidación de estado:', evalErr.message);
      }
    }

    if (userId) {
      await auditRepository
        .log({
          action: 'SUBMIT_ASSESSMENT',
          entity: 'EvaluationReviewer',
          entityId: reviewerId,
          userId,
          tenantId,
          details: {
            evaluationId: review.evaluationId,
            score: calculatedScore,
            status: status || 'COMPLETED',
          },
        })
        .catch((err) => console.error('[Audit Error] submitAssessment:', err));
    }

    return updatedReview;
  }

  /**
   * Obtener resultados detallados de una evaluación.
   */
  async getEvaluationResults(id, userId, userRole, _tenantId = null) {
    const evaluation = await this.performanceRepository.findDetailedEvaluationResult(id);

    if (!evaluation) throw new Error('Evaluación no encontrada');

    if (userRole !== 'admin' && userRole !== 'hr' && evaluation.employeeId !== userId) {
      const isReviewer = evaluation.reviewers.some((r) => r.reviewerId === userId);
      if (!isReviewer) {
        throw new Error('No tienes permiso para ver los resultados de esta evaluación');
      }
    }

    let criteriaList = [];
    try {
      criteriaList =
        typeof evaluation.template.criteria === 'string'
          ? JSON.parse(evaluation.template.criteria)
          : evaluation.template.criteria;
      if (!Array.isArray(criteriaList)) criteriaList = [];
    } catch (e) {
      console.error('Error parsing criteriaList:', e);
    }

    let maxScore = 100;
    if (evaluation.template.scale) {
      try {
        const scaleObj =
          typeof evaluation.template.scale === 'string'
            ? JSON.parse(evaluation.template.scale)
            : evaluation.template.scale;
        if (scaleObj.max) maxScore = scaleObj.max;
        else if (scaleObj.type === '1-5') maxScore = 5;
        else if (scaleObj.type === '1-10') maxScore = 10;
        else if (scaleObj.type === 'percentage') maxScore = 100;
      } catch {}
    }

    const criteriaStats = {};
    criteriaList.forEach((c) => {
      criteriaStats[c.name] = { sum: 0, count: 0, fullData: c };
    });

    const completedReviewers = evaluation.reviewers.filter((r) => r.status === 'COMPLETED');
    const fallbackScore =
      evaluation.finalScore ||
      (completedReviewers.length > 0 && completedReviewers[0].score !== null
        ? completedReviewers[0].score
        : null);

    completedReviewers.forEach((r) => {
      if (!r.responses) return;
      try {
        const responses = typeof r.responses === 'string' ? JSON.parse(r.responses) : r.responses;
        if (Array.isArray(responses)) {
          responses.forEach((item, idx) => {
            const crit = criteriaList.find(
              (c, cIdx) => c.name === item.name || c.name === item.criteria || cIdx === idx
            );
            if (crit && criteriaStats[crit.name]) {
              const val = parseFloat(item.score ?? item.value ?? item);
              if (!isNaN(val)) {
                criteriaStats[crit.name].sum += val;
                criteriaStats[crit.name].count += 1;
              }
            }
          });
        } else if (typeof responses === 'object' && responses !== null) {
          Object.keys(responses).forEach((key) => {
            const val = parseFloat(responses[key]);
            if (isNaN(val)) return;

            const crit = criteriaList.find(
              (c, cIdx) =>
                c.name === key ||
                c.name.toLowerCase().trim() === key.toLowerCase().trim() ||
                String(cIdx) === key ||
                c.id === key
            );
            if (crit && criteriaStats[crit.name]) {
              criteriaStats[crit.name].sum += val;
              criteriaStats[crit.name].count += 1;
            }
          });
        }
      } catch (e) {
        console.error('[EVALUATION] Error parsing reviewer responses:', e);
      }
    });

    const results = criteriaList.map((c) => {
      const stats = criteriaStats[c.name] || { sum: 0, count: 0 };
      let average = 0;
      if (stats.count > 0) {
        average = parseFloat((stats.sum / stats.count).toFixed(2));
      } else if (fallbackScore !== null && fallbackScore !== undefined) {
        average = parseFloat(Number(fallbackScore).toFixed(2));
      }

      return {
        criteria: c.name,
        type: c.type || 'COMPETENCY',
        weight: c.weight,
        description: c.description,
        score: average,
        maxScore,
      };
    });

    let overallScore = 0;
    const validResults = results.filter((r) => r.score > 0);

    if (validResults.length > 0) {
      const hasWeights = validResults.some((r) => r.weight && parseFloat(r.weight) > 0);
      if (hasWeights) {
        const totalWeight = validResults.reduce(
          (acc, curr) => acc + (parseFloat(curr.weight) || 0),
          0
        );
        if (totalWeight > 0) {
          const weightedSum = validResults.reduce(
            (acc, curr) => acc + curr.score * (parseFloat(curr.weight) || 0),
            0
          );
          overallScore = parseFloat((weightedSum / totalWeight).toFixed(2));
        } else {
          overallScore = parseFloat(
            (validResults.reduce((acc, curr) => acc + curr.score, 0) / validResults.length).toFixed(
              2
            )
          );
        }
      } else {
        overallScore = parseFloat(
          (validResults.reduce((acc, curr) => acc + curr.score, 0) / validResults.length).toFixed(2)
        );
      }
    } else if (fallbackScore !== null && fallbackScore !== undefined) {
      overallScore = parseFloat(Number(fallbackScore).toFixed(2));
    }

    const feedback = completedReviewers
      .map((r) => ({
        reviewerName:
          r.reviewerId === evaluation.employeeId
            ? 'Autoevaluación'
            : userRole === 'admin'
              ? `${r.reviewer.firstName} ${r.reviewer.lastName}`
              : 'Evaluador',
        comments: r.comments,
        score: r.score,
      }))
      .filter((f) => f.comments);

    return {
      evaluation: {
        ...evaluation,
        template: { ...evaluation.template, criteria: criteriaList },
      },
      results,
      overallScore,
      feedback,
    };
  }
}

export { PerformanceService };
export default new PerformanceService();
