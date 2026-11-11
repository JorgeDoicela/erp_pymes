/**
 * @file analytics.service.js
 * @description Norma ERP - Servicio de Analítica Descriptiva y Reportes Ejecutivos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';
import { financial } from '../../utils/financialUtils.js';

export class AnalyticsHttpError extends Error {
  constructor(statusCode, payload) {
    super(payload.message || 'Error en analítica');
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export class AnalyticsService {
  async getDashboardData(tenantId, isSuperAdmin) {
    if (!tenantId && !isSuperAdmin) {
      throw new AnalyticsHttpError(400, {
        success: false,
        message: 'Contexto de empresa (tenantId) no especificado.',
        code: 'TENANT_ID_REQUIRED',
      });
    }

    const tenantWhere = tenantId ? { tenantId } : {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalEmployees,
      newHires,
      openVacancies,
      employeesByDept,
      vacanciesByDept,
      activeContractsByDept,
      activeEmployees,
    ] = await Promise.all([
      prisma.employee.count({ where: tenantWhere }),
      prisma.employee.count({
        where: {
          ...tenantWhere,
          hireDate: { gte: startOfMonth },
        },
      }),
      prisma.jobVacancy.count({
        where: {
          status: 'OPEN',
          ...tenantWhere,
        },
      }),
      prisma.employee.groupBy({
        by: ['department'],
        where: tenantWhere,
        _count: { id: true },
      }),
      prisma.jobVacancy.groupBy({
        by: ['department'],
        _count: { id: true },
        where: {
          status: 'OPEN',
          ...tenantWhere,
        },
      }),
      prisma.contract.findMany({
        where: {
          status: 'Active',
          ...(tenantId ? { employee: { tenantId } } : {}),
        },
        select: {
          salary: true,
          employee: {
            select: {
              department: true,
            },
          },
        },
      }),
      prisma.employee.findMany({
        where: { ...tenantWhere, isActive: true },
        select: { department: true, salary: true },
      }),
    ]);

    const deptChartData = (employeesByDept || []).map((item) => ({
      name: item.department || 'Sin Dept',
      value: item._count.id,
    }));

    const vacancyChartData = (vacanciesByDept || []).map((item) => ({
      name: item.department || 'Sin Dept',
      value: item._count.id,
    }));

    let payrollTotal = 0;
    const deptSalaryMap = {};

    if (activeContractsByDept && activeContractsByDept.length > 0) {
      activeContractsByDept.forEach((c) => {
        const dept = c.employee?.department || 'Sin Dept';
        const sal = Number(c.salary) || 0;
        deptSalaryMap[dept] = (deptSalaryMap[dept] || 0) + sal;
        payrollTotal += sal;
      });
    } else if (activeEmployees && activeEmployees.length > 0) {
      activeEmployees.forEach((emp) => {
        const dept = emp.department || 'Sin Dept';
        const sal = parseFloat(emp.salary) || 0;
        deptSalaryMap[dept] = (deptSalaryMap[dept] || 0) + sal;
        payrollTotal += sal;
      });
    }

    const payrollByDeptChartData = Object.keys(deptSalaryMap)
      .map((dept) => ({
        name: dept,
        salary: financial.round(deptSalaryMap[dept] || 0),
      }))
      .sort((a, b) => b.salary - a.salary);

    return {
      kpis: {
        totalEmployees: totalEmployees || 0,
        newHires: newHires || 0,
        openVacancies: openVacancies || 0,
        payrollTotal: financial.round(payrollTotal || 0),
      },
      charts: {
        deptChartData,
        vacancyChartData,
        payrollByDeptChartData,
      },
    };
  }

  async getTurnoverReport({ startDate, endDate, tenantId }) {
    const tenantWhere = tenantId ? { tenantId } : {};
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const [exits, activeEmployees] = await Promise.all([
      prisma.employee.findMany({
        where: {
          ...tenantWhere,
          isActive: false,
          exitDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: true,
          exitDate: true,
          exitType: true,
          exitReason: true,
        },
      }),
      prisma.employee.count({
        where: {
          ...tenantWhere,
          isActive: true,
        },
      }),
    ]);

    const totalExits = exits.length;
    const avgEmployees = activeEmployees + totalExits;
    const turnoverRate =
      avgEmployees > 0 ? parseFloat(((totalExits / avgEmployees) * 100).toFixed(2)) : 0;

    const exitsByType = exits.reduce((acc, curr) => {
      const type = curr.exitType || 'Voluntario';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const exitsByReason = exits.reduce((acc, curr) => {
      const reason = curr.exitReason || 'Oportunidad de Crecimiento / Personal';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    return {
      turnoverRate,
      totalExits,
      exitsByType: Object.keys(exitsByType).map((key) => ({ name: key, value: exitsByType[key] })),
      exitsByReason: Object.keys(exitsByReason).map((key) => ({
        name: key,
        value: exitsByReason[key],
      })),
      exitsList: exits.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        department: e.department || 'General',
        exitDate: e.exitDate,
        type: e.exitType || 'Voluntario',
        reason: e.exitReason || 'Oportunidad de Crecimiento / Personal',
      })),
    };
  }

  async getPerformanceReport({ startDate, endDate, department, tenantId }) {
    const whereClause = {
      status: 'COMPLETED',
      ...(tenantId ? { employee: { tenantId } } : {}),
      ...(startDate && endDate
        ? {
            endDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    };

    if (department) {
      whereClause.employee = {
        ...(whereClause.employee || {}),
        department,
      };
    }

    const evaluations = await prisma.employeeEvaluation.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    });

    const deptScores = {};
    const deptCounts = {};

    evaluations.forEach((ev) => {
      const dept = ev.employee.department || 'Sin Dept';
      const score = ev.finalScore || 0;
      deptScores[dept] = (deptScores[dept] || 0) + score;
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const avgScoreByDept = Object.keys(deptScores).map((dept) => ({
      department: dept,
      average: parseFloat((deptScores[dept] / deptCounts[dept]).toFixed(2)),
    }));

    const sortedEvaluations = [...evaluations].sort(
      (a, b) => (b.finalScore || 0) - (a.finalScore || 0)
    );

    const mapPerformer = (ev) => ({
      id: ev.employee.id,
      name: `${ev.employee.firstName} ${ev.employee.lastName}`,
      department: ev.employee.department,
      score: ev.finalScore,
    });

    const topPerformers = sortedEvaluations.slice(0, 5).map(mapPerformer);
    const lowPerformers = [...sortedEvaluations].reverse().slice(0, 5).map(mapPerformer);

    const isScale100 = evaluations.some((ev) => (ev.finalScore || 0) > 5);

    const distribution = isScale100
      ? {
          '0-59 (Insuficiente)': 0,
          '60-69 (Regular)': 0,
          '70-84 (Satisfactorio)': 0,
          '85-100 (Sobresaliente)': 0,
        }
      : {
          '0-2 (Bajo)': 0,
          '2-3 (Regular)': 0,
          '3-4 (Bueno)': 0,
          '4-5 (Excelente)': 0,
        };

    evaluations.forEach((ev) => {
      const score = ev.finalScore || 0;
      if (isScale100) {
        if (score < 60) distribution['0-59 (Insuficiente)']++;
        else if (score < 70) distribution['60-69 (Regular)']++;
        else if (score < 85) distribution['70-84 (Satisfactorio)']++;
        else distribution['85-100 (Sobresaliente)']++;
      } else {
        if (score < 2) distribution['0-2 (Bajo)']++;
        else if (score < 3) distribution['2-3 (Regular)']++;
        else if (score < 4) distribution['3-4 (Bueno)']++;
        else distribution['4-5 (Excelente)']++;
      }
    });

    const distributionChartData = Object.keys(distribution).map((key) => ({
      range: key,
      count: distribution[key],
    }));

    const formatRecommendation = (score) => {
      if (isScale100) {
        if (score >= 85) return 'Promoción / Bono';
        if (score >= 70) return 'Felicitar / Mantener';
        if (score >= 60) return 'Capacitación';
        return 'Plan de Mejora (PIP)';
      }
      if (score >= 4.5) return 'Promoción / Bono';
      if (score >= 3.5) return 'Felicitar / Mantener';
      if (score >= 2.5) return 'Capacitación';
      return 'Plan de Mejora (PIP)';
    };

    const detailedList = evaluations.map((ev) => ({
      id: ev.id,
      employeeName: `${ev.employee.firstName} ${ev.employee.lastName}`,
      department: ev.employee.department,
      position: ev.employee.position,
      score: ev.finalScore,
      recommendation: formatRecommendation(ev.finalScore || 0),
      date: ev.endDate,
    }));

    return {
      isScale100,
      maxScale: isScale100 ? 100 : 5.0,
      avgScoreByDept,
      topPerformers,
      lowPerformers,
      distributionChartData,
      detailedList,
    };
  }

  async getPayrollCostReport({ startDate, endDate, tenantId }) {
    const whereClause = {
      ...(tenantId ? { tenantId } : {}),
      ...(startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    };

    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      select: {
        id: true,
        paymentDate: true,
        details: {
          select: {
            baseSalary: true,
            overtimeAmount: true,
            bonuses: true,
            employee: {
              select: { department: true },
            },
          },
        },
      },
      orderBy: { paymentDate: 'asc' },
    });

    let totalBaseSalary = financial.from(0);
    let totalOvertime = financial.from(0);
    let totalBonuses = financial.from(0);
    const deptCosts = {};
    const trendMap = {};

    payrolls.forEach((payroll) => {
      const date = new Date(payroll.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!trendMap[monthKey]) {
        trendMap[monthKey] = { name: monthKey, total: 0, salary: 0, overtime: 0, extras: 0 };
      }

      payroll.details.forEach((detail) => {
        const base = financial.from(detail.baseSalary || 0);
        const ot = financial.from(detail.overtimeAmount || 0);

        let bonuses = financial.from(0);
        try {
          const bonusList = JSON.parse(detail.bonuses || '[]');
          if (Array.isArray(bonusList)) {
            bonuses = bonusList.reduce(
              (sum, b) => sum.plus(parseFloat(b.amount) || 0),
              financial.from(0)
            );
          }
        } catch (e) {
          console.error('Error parsing bonuses JSON', e);
        }

        const totalDetailCost = base.plus(ot).plus(bonuses);

        totalBaseSalary = totalBaseSalary.plus(base);
        totalOvertime = totalOvertime.plus(ot);
        totalBonuses = totalBonuses.plus(bonuses);

        const dept = detail.employee?.department || 'Sin Dept';
        deptCosts[dept] = financial.from(deptCosts[dept] || 0).plus(totalDetailCost);

        trendMap[monthKey].total = financial.from(trendMap[monthKey].total).plus(totalDetailCost);
        trendMap[monthKey].salary = financial.from(trendMap[monthKey].salary).plus(base);
        trendMap[monthKey].overtime = financial.from(trendMap[monthKey].overtime).plus(ot);
        trendMap[monthKey].extras = financial.from(trendMap[monthKey].extras).plus(bonuses);
      });
    });

    const totalCost = totalBaseSalary.plus(totalOvertime).plus(totalBonuses);

    const breakdownChartData = [
      { name: 'Salario Base', value: financial.round(totalBaseSalary) },
      { name: 'Horas Extras', value: financial.round(totalOvertime) },
      { name: 'Bonificaciones', value: financial.round(totalBonuses) },
    ];

    const deptChartData = Object.keys(deptCosts).map((dept) => ({
      name: dept,
      value: financial.round(deptCosts[dept]),
    }));

    const trendChartData = Object.values(trendMap)
      .map((m) => ({
        ...m,
        total: financial.round(m.total),
        salary: financial.round(m.salary),
        overtime: financial.round(m.overtime),
        extras: financial.round(m.extras),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      metrics: {
        totalCost: financial.round(totalCost),
        avgMonthlyCost: trendChartData.length
          ? financial.round(financial.divide(totalCost, trendChartData.length))
          : financial.round(totalCost),
        headcount: payrolls.reduce((acc, p) => acc + p.details.length, 0),
      },
      charts: {
        breakdown: breakdownChartData,
        byDepartment: deptChartData,
        trend: trendChartData,
      },
      raw: trendChartData,
    };
  }

  async getSatisfactionReport(tenantId) {
    const survey = await prisma.climateSurvey.findFirst({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: 'desc' },
      include: { responses: true },
    });

    if (!survey || survey.responses.length === 0) {
      return {
        index: 0,
        nps: 0,
        dimensions: [],
        participation: 0,
        comments: [],
      };
    }

    const responses = survey.responses;
    const dimensionSums = {};
    const dimensionCounts = {};
    let totalScoreSum = 0;
    let totalScoreCount = 0;
    let promoters = 0;
    let detractors = 0;
    let npsCount = 0;
    const comments = [];

    responses.forEach((resp) => {
      try {
        const ratings = JSON.parse(resp.ratings || '{}');
        Object.keys(ratings).forEach((dim) => {
          const score = ratings[dim];
          dimensionSums[dim] = (dimensionSums[dim] || 0) + score;
          dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
          totalScoreSum += score;
          totalScoreCount++;
        });
      } catch {
        // Ignorar respuestas con JSON malformado sin interrumpir el agregado
      }

      if (resp.npsScore !== null) {
        if (resp.npsScore >= 9) promoters++;
        else if (resp.npsScore <= 6) detractors++;
        npsCount++;
      }

      if (resp.comments) {
        comments.push({
          text: resp.comments,
          dept: resp.department || 'General',
        });
      }
    });

    const dimensions = Object.keys(dimensionSums).map((dim) => ({
      subject: dim,
      A: parseFloat((dimensionSums[dim] / dimensionCounts[dim]).toFixed(1)),
      fullMark: 5,
    }));

    const avgScore = totalScoreCount > 0 ? totalScoreSum / totalScoreCount : 0;
    const index = Math.round((avgScore / 5) * 100);
    const nps = npsCount > 0 ? Math.round(((promoters - detractors) / npsCount) * 100) : 0;

    return {
      surveyTitle: survey.title,
      index,
      nps,
      dimensions,
      participation: responses.length,
      comments: comments.slice(0, 10),
    };
  }

  async getCustomReport({ module, fields, filters, limit, tenantId }) {
    const modelMap = {
      employees: prisma.employee,
      payrolls: prisma.payroll,
      job_applications: prisma.jobApplication,
      evaluations: prisma.employeeEvaluation,
    };

    const delegate = modelMap[module];
    if (!delegate) {
      throw new AnalyticsHttpError(400, { message: 'Módulo no válido' });
    }

    let select;
    if (fields && fields.length > 0) {
      select = {};
      fields.forEach((f) => {
        select[f] = true;
      });
    }

    const where = {};
    if (tenantId) {
      if (module === 'employees' || module === 'payrolls') {
        where.tenantId = tenantId;
      } else if (module === 'evaluations') {
        where.employee = { tenantId };
      } else if (module === 'job_applications') {
        where.vacancy = { tenantId };
      }
    }

    if (filters) {
      if (filters.department) where.department = filters.department;
      if (filters.status) where.status = filters.status;
      if (filters.dateRange && filters.dateField) {
        where[filters.dateField] = {
          gte: new Date(filters.dateRange.start),
          lte: new Date(filters.dateRange.end),
        };
      }
    }

    const maxTake = limit ? parseInt(limit, 10) : 1000;
    return delegate.findMany({
      where,
      select,
      take: maxTake,
    });
  }
}

export default new AnalyticsService();

