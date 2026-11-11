/**
 * @file announcement.repository.js
 * @description Norma ERP - Repositorio de Comunicados Internos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class AnnouncementRepository {
  async createAnnouncement(data) {
    return prisma.announcement.create({
      data,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async countAnnouncements(where) {
    return prisma.announcement.count({ where });
  }

  async findActiveEmployeesBirthDates(tenantId = null) {
    return prisma.employee.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
      select: { birthDate: true },
    });
  }

  async findRequiredAcknowledgments(whereBase, employeeId) {
    return prisma.announcement.findMany({
      where: {
        ...whereBase,
        requiresAcknowledgment: true,
      },
      select: {
        id: true,
        reads: {
          where: { employeeId, acknowledged: true },
          select: { id: true },
        },
      },
    });
  }

  async findAnnouncementsPaginated(where, skip, limit, employeeId) {
    return Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          reads: employeeId ? { where: { employeeId } } : false,
        },
      }),
      prisma.announcement.count({ where }),
    ]);
  }

  async findFirstAnnouncement(where) {
    return prisma.announcement.findFirst({ where });
  }

  async upsertAnnouncementRead(announcementId, employeeId, acknowledge) {
    return prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: {
          announcementId,
          employeeId,
        },
      },
      create: {
        announcementId,
        employeeId,
        readAt: new Date(),
        acknowledged: acknowledge,
      },
      update: {
        acknowledged: acknowledge ? true : undefined,
        readAt: new Date(),
      },
    });
  }

  async findAnnouncementWithReads(where) {
    return prisma.announcement.findFirst({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        reads: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, department: true } },
          },
        },
      },
    });
  }

  async countActiveEmployees(tenantId = null) {
    return prisma.employee.count({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findPendingEmployees(tenantId, readEmployeeIds) {
    return prisma.employee.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
        id: { notIn: readEmployeeIds },
      },
      select: { id: true, firstName: true, lastName: true, department: true },
    });
  }

  async deleteAnnouncementById(id) {
    return prisma.announcement.delete({ where: { id } });
  }

  async findActiveEmployeesForBirthdays(tenantId = null) {
    return prisma.employee.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        birthDate: true,
        position: true,
      },
    });
  }
}

export default new AnnouncementRepository();

