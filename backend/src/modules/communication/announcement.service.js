/**
 * @file announcement.service.js
 * @description Norma ERP - Servicio de Comunicación Interna y Comunicados
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import announcementRepository from './announcement.repository.js';
import auditRepository from '../audit/audit.repository.js';

export class AnnouncementService {
  /**
   * Crear un nuevo comunicado oficial.
   */
  async createAnnouncement({
    title,
    content,
    category = 'GENERAL',
    priority = 'NORMAL',
    requiresAcknowledgment = false,
    attachmentUrl,
    authorId,
    tenantId = null,
  }) {
    if (!title || !title.trim()) throw new Error('El título del comunicado es obligatorio');
    if (!content || !content.trim()) throw new Error('El contenido del comunicado es obligatorio');

    const announcement = await announcementRepository.createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      requiresAcknowledgment,
      attachmentUrl,
      createdById: authorId,
      ...(tenantId ? { tenantId } : {}),
    });

    if (authorId) {
      await auditRepository
        .log({
          tenantId: tenantId || null,
          entity: 'Announcement',
          entityId: announcement.id,
          action: 'CREATE_ANNOUNCEMENT',
          userId: authorId,
          details: {
            title: announcement.title,
            category,
            priority,
            requiresAcknowledgment,
          },
        })
        .catch((err) => console.error('[Audit Error] createAnnouncement:', err));
    }

    return announcement;
  }

  /**
   * Obtener estadísticas consolidadas del tablón de comunicados.
   */
  async getBoardStats(employeeId, tenantId = null) {
    const whereBase = tenantId ? { tenantId } : {};

    const [total, policyCount, holidayCount, activeEmployees] = await Promise.all([
      announcementRepository.countAnnouncements(whereBase),
      announcementRepository.countAnnouncements({ ...whereBase, category: 'POLICY' }),
      announcementRepository.countAnnouncements({ ...whereBase, category: 'HOLIDAY' }),
      announcementRepository.findActiveEmployeesBirthDates(tenantId),
    ]);

    const currentMonth = new Date().getUTCMonth() + 1;
    const birthdayCount = activeEmployees.filter((emp) => {
      if (!emp.birthDate) return false;
      return new Date(emp.birthDate).getUTCMonth() + 1 === currentMonth;
    }).length;

    let pendingAcknowledgmentCount = 0;
    if (employeeId) {
      const acknowledgmentsRequired = await announcementRepository.findRequiredAcknowledgments(
        whereBase,
        employeeId
      );

      pendingAcknowledgmentCount = acknowledgmentsRequired.filter(
        (a) => a.reads.length === 0
      ).length;
    }

    return {
      total,
      policyCount,
      holidayCount,
      birthdayCount,
      pendingAcknowledgmentCount,
    };
  }

  /**
   * Obtener comunicados para el tablón con estado de lectura del empleado actual.
   */
  async getAnnouncementsForEmployee(
    employeeId,
    { category, search, requiresAck, pendingOnly, page = 1, limit = 20, tenantId = null }
  ) {
    const skip = (page - 1) * limit;
    const where = {
      ...(tenantId ? { tenantId } : {}),
    };

    if (category) where.category = category;
    if (requiresAck !== undefined) {
      where.requiresAcknowledgment = requiresAck === 'true' || requiresAck === true;
    }
    if ((pendingOnly === 'true' || pendingOnly === true) && employeeId) {
      where.requiresAcknowledgment = true;
      where.reads = {
        none: {
          employeeId,
          acknowledged: true,
        },
      };
    }

    if (search) {
      const cleanSearch = search.trim();
      where.OR = [
        { title: { contains: cleanSearch, mode: 'insensitive' } },
        { content: { contains: cleanSearch, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await announcementRepository.findAnnouncementsPaginated(
      where,
      skip,
      limit,
      employeeId
    );

    const formatted = data.map((ann) => {
      const userRead = ann.reads && ann.reads.length > 0 ? ann.reads[0] : null;
      return {
        ...ann,
        reads: undefined,
        isRead: !!userRead,
        readAt: userRead?.readAt || null,
        isAcknowledged: userRead?.acknowledged || false,
      };
    });

    return {
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Marcar comunicado como Leído o Firmar Acuse de Recibo Digital.
   */
  async markAsReadOrAcknowledged(
    announcementId,
    employeeId,
    { acknowledge = false },
    tenantId = null
  ) {
    const announcement = await announcementRepository.findFirstAnnouncement({
      id: announcementId,
      ...(tenantId ? { tenantId } : {}),
    });

    if (!announcement) throw new Error('Comunicado no encontrado');

    const readRecord = await announcementRepository.upsertAnnouncementRead(
      announcementId,
      employeeId,
      acknowledge
    );

    if (acknowledge) {
      await auditRepository
        .log({
          tenantId: announcement.tenantId || tenantId,
          entity: 'Announcement',
          entityId: announcementId,
          action: 'ACKNOWLEDGE_ANNOUNCEMENT',
          userId: employeeId,
          details: { title: announcement.title, readAt: readRecord.readAt },
        })
        .catch((err) => console.error('[Audit Error] markAsReadOrAcknowledged:', err));
    }

    return readRecord;
  }

  /**
   * Obtener estadísticas de lectura y acuse de recibo para administradores.
   */
  async getAnnouncementStats(announcementId, tenantId = null) {
    const announcement = await announcementRepository.findAnnouncementWithReads({
      id: announcementId,
      ...(tenantId ? { tenantId } : {}),
    });

    if (!announcement) throw new Error('Comunicado no encontrado');

    const totalActiveEmployees = await announcementRepository.countActiveEmployees(tenantId);
    const totalReads = announcement.reads.length;
    const totalAcknowledged = announcement.reads.filter((r) => r.acknowledged).length;

    const readEmployeeIds = Array.from(new Set(announcement.reads.map((r) => r.employeeId)));
    const pendingEmployees = await announcementRepository.findPendingEmployees(
      tenantId,
      readEmployeeIds
    );

    return {
      announcement: {
        id: announcement.id,
        title: announcement.title,
        category: announcement.category,
        requiresAcknowledgment: announcement.requiresAcknowledgment,
        createdAt: announcement.createdAt,
      },
      metrics: {
        totalActiveEmployees,
        totalReads,
        totalAcknowledged,
        readPercentage:
          totalActiveEmployees > 0
            ? Number(((totalReads / totalActiveEmployees) * 100).toFixed(1))
            : 0,
        acknowledgedPercentage:
          totalActiveEmployees > 0
            ? Number(((totalAcknowledged / totalActiveEmployees) * 100).toFixed(1))
            : 0,
      },
      reads: announcement.reads,
      pendingEmployees,
    };
  }

  /**
   * Eliminar un comunicado oficial.
   */
  async deleteAnnouncement(id, tenantId = null, userId = null) {
    const announcement = await announcementRepository.findFirstAnnouncement({
      id,
      ...(tenantId ? { tenantId } : {}),
    });

    if (!announcement) throw new Error('Comunicado no encontrado o no pertenece a la empresa');

    await announcementRepository.deleteAnnouncementById(id);

    await auditRepository
      .log({
        tenantId: announcement.tenantId || tenantId,
        entity: 'Announcement',
        entityId: id,
        action: 'DELETE_ANNOUNCEMENT',
        userId: userId || null,
        details: { title: announcement.title, category: announcement.category },
      })
      .catch((err) => console.error('[Audit Error] deleteAnnouncement:', err));

    return { success: true, message: 'Comunicado eliminado exitosamente' };
  }

  /**
   * Obtener cumpleaños del mes actual.
   */
  async getBirthdaysOfMonth(tenantId = null) {
    const currentMonth = new Date().getMonth() + 1;
    const activeEmployees = await announcementRepository.findActiveEmployeesForBirthdays(tenantId);

    return activeEmployees
      .filter((emp) => {
        if (!emp.birthDate) return false;
        const bMonth = new Date(emp.birthDate).getUTCMonth() + 1;
        return bMonth === currentMonth;
      })
      .map((emp) => {
        const bDay = new Date(emp.birthDate).getUTCDate();
        return {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          department: emp.department,
          position: emp.position,
          day: bDay,
        };
      })
      .sort((a, b) => a.day - b.day);
  }
}

export default new AnnouncementService();

