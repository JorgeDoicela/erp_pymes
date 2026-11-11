/**
 * @file entrepreneurship.repository.js
 * @description Norma ERP - Repositorio de Proyectos de Emprendimiento, CapTable y Validación
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export class EntrepreneurshipRepository {
  async findProjects({ stage, status, tenantId }) {
    return prisma.entrepreneurship.findMany({
      where: {
        ...(stage && { stage }),
        ...(status && { status }),
        ...(tenantId ? { owner: { tenantId } } : {}),
      },
      include: {
        owner: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { members: true, milestones: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProject(data) {
    return prisma.entrepreneurship.create({ data });
  }

  async findProjectDetails(id) {
    const employeeSelect = {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: true,
      position: true,
    };

    return prisma.entrepreneurship.findUnique({
      where: { id },
      include: {
        owner: { select: employeeSelect },
        members: { include: { employee: { select: employeeSelect } } },
        mentors: { include: { employee: { select: employeeSelect } } },
        milestones: { orderBy: { dueDate: 'asc' } },
        documents: true,
        updates: { orderBy: { createdAt: 'desc' } },
        equities: { orderBy: { percentage: 'desc' } },
        fundingRounds: { orderBy: { date: 'desc' } },
        interviews: { orderBy: { createdAt: 'desc' } },
        targetMarket: true,
      },
    });
  }

  async updateProject(id, data) {
    return prisma.entrepreneurship.update({ where: { id }, data });
  }

  async deleteProject(id) {
    return prisma.entrepreneurship.delete({ where: { id } });
  }

  async createMilestone(data) {
    return prisma.entrepreneurshipMilestone.create({ data });
  }

  async updateMilestone(id, data) {
    return prisma.entrepreneurshipMilestone.update({ where: { id }, data });
  }

  async deleteMilestone(id) {
    return prisma.entrepreneurshipMilestone.delete({ where: { id } });
  }

  async createUpdate(data) {
    return prisma.entrepreneurshipUpdate.create({ data });
  }

  async deleteUpdate(id) {
    return prisma.entrepreneurshipUpdate.delete({ where: { id } });
  }

  async findEquities(projectId) {
    return prisma.entrepreneurshipEquity.findMany({
      where: { projectId },
      orderBy: { percentage: 'desc' },
    });
  }

  async createEquity(data) {
    return prisma.entrepreneurshipEquity.create({ data });
  }

  async updateEquity(id, data) {
    return prisma.entrepreneurshipEquity.update({ where: { id }, data });
  }

  async deleteEquity(id) {
    return prisma.entrepreneurshipEquity.delete({ where: { id } });
  }

  async findFundingRounds(projectId) {
    return prisma.entrepreneurshipFundingRound.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });
  }

  async createFundingRound(data) {
    return prisma.entrepreneurshipFundingRound.create({ data });
  }

  async updateFundingRound(id, data) {
    return prisma.entrepreneurshipFundingRound.update({ where: { id }, data });
  }

  async deleteFundingRound(id) {
    return prisma.entrepreneurshipFundingRound.delete({ where: { id } });
  }

  async findInterviews(projectId) {
    return prisma.entrepreneurshipInterview.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInterview(data) {
    return prisma.entrepreneurshipInterview.create({ data });
  }

  async updateInterview(id, data) {
    return prisma.entrepreneurshipInterview.update({ where: { id }, data });
  }

  async deleteInterview(id) {
    return prisma.entrepreneurshipInterview.delete({ where: { id } });
  }

  async upsertTargetMarket(projectId, { tam, sam, som }) {
    return prisma.entrepreneurshipTargetMarket.upsert({
      where: { projectId },
      update: { tam, sam, som },
      create: { projectId, tam, sam, som },
    });
  }
}

export default new EntrepreneurshipRepository();
