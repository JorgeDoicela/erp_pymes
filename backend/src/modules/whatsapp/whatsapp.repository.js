/**
 * @file whatsapp.repository.js
 * @description Repositorio de datos para resolución de identidad, estado del empleado y métricas de tenant vía WhatsApp.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class WhatsappRepository {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Construye lista de candidatos telefónicos en BD eliminando falsos positivos mediante coincidencia canónica exacta.
   * Filtra únicamente colaboradores activos pertenecientes a empresas (tenants) activas.
   * @param {string[]} phoneVariants
   * @returns {Promise<Array<Object>>}
   */
  async findEmployeesByPhoneVariants(phoneVariants) {
    if (!phoneVariants || !phoneVariants.length) {
      return [];
    }

    try {
      const cleanVariants = Array.from(
        new Set(phoneVariants.map((v) => String(v || '').trim()).filter(Boolean))
      );

      // Extraer sufijo mínimo de 9 dígitos para capturar teléfonos almacenados con guiones/espacios
      const suffixTailSet = new Set(
        cleanVariants
          .map((v) => v.replace(/[^\d]/g, ''))
          .filter((d) => d.length >= 9)
          .map((d) => d.slice(-9))
      );

      const orConditions = [
        { phone: { in: cleanVariants } },
        ...Array.from(suffixTailSet).map((tail) => ({ phone: { endsWith: tail } })),
      ];

      const employees = await this.prisma.employee.findMany({
        where: {
          OR: orConditions,
          isActive: true,
          tenantId: { not: null },
          tenant: {
            isActive: true,
            subscriptionStatus: { notIn: ['SUSPENDED', 'CANCELLED'] },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          identityCard: true,
          department: true,
          position: true,
          role: true,
          phone: true,
          vacationDays: true,
          hireDate: true,
          tenantId: true,
          isActive: true,
          tenant: {
            select: {
              id: true,
              name: true,
              ruc: true,
            },
          },
        },
        orderBy: [{ tenantId: 'asc' }, { createdAt: 'asc' }],
      });

      // Verificación canónica exacta sobre dígitos normalizados para evitar colisiones parciales
      const canonicalTargets = new Set(cleanVariants.map((v) => this.normalizeDigitsForMatch(v)));
      return employees.filter((emp) => {
        const storedDigits = this.normalizeDigitsForMatch(emp.phone);
        return Boolean(storedDigits && canonicalTargets.has(storedDigits));
      });
    } catch (err) {
      console.error(
        '[WhatsApp Repository Error] Error al buscar colaboradores por teléfono:',
        err.message
      );
      return [];
    }
  }

  /**
   * Normaliza dígitos telefónicos para comparación canónica multi-formato (Ecuador E.164 / local).
   * @private
   */
  normalizeDigitsForMatch(rawPhone) {
    const digits = String(rawPhone || '').replace(/[^\d]/g, '');
    if (!digits) return '';
    if (digits.startsWith('0') && digits.length === 10) {
      return `593${digits.substring(1)}`;
    }
    if (digits.length === 9 && digits.startsWith('9')) {
      return `593${digits}`;
    }
    return digits;
  }

  /**
   * Busca un colaborador único (compatibilidad con flujos de lectura simples).
   * @param {string[]} phoneVariants
   * @returns {Promise<Object|null>}
   */
  async findEmployeeByPhoneVariants(phoneVariants) {
    const matches = await this.findEmployeesByPhoneVariants(phoneVariants);
    return matches[0] || null;
  }

  /**
   * Resuelve el colaborador y su contexto multi-tenant activo para el teléfono remitente.
   * Si un mismo teléfono pertenece a varias empresas activas, requiere selección explícita si aún no tiene contexto activo.
   * @param {{ phoneKey: string, phoneVariants: string[] }} params
   */
  async resolveEmployeeContext({ phoneKey, phoneVariants }) {
    const matches = await this.findEmployeesByPhoneVariants(phoneVariants);

    if (!matches.length) {
      return {
        status: 'UNREGISTERED',
        employee: null,
        candidates: [],
      };
    }

    if (matches.length === 1) {
      return {
        status: 'RESOLVED',
        employee: matches[0],
        candidates: matches,
      };
    }

    const context = phoneKey
      ? await this.prisma.whatsappConversationContext.findUnique({
          where: { phoneKey },
        })
      : null;

    if (context?.activeTenantId) {
      const selected = matches.find((emp) => emp.tenantId === context.activeTenantId);
      if (selected) {
        return {
          status: 'RESOLVED',
          employee: selected,
          candidates: matches,
        };
      }
    }

    const pendingList = matches.map((emp, idx) => ({
      index: idx + 1,
      tenantId: emp.tenantId,
      tenantName: emp.tenant?.name || `Empresa ${idx + 1}`,
      ruc: emp.tenant?.ruc || null,
      employeeId: emp.id,
    }));

    if (phoneKey) {
      await this.prisma.whatsappConversationContext.upsert({
        where: { phoneKey },
        create: {
          phoneKey,
          activeTenantId: null,
          pendingTenantSelectionJson: pendingList,
        },
        update: {
          activeTenantId: null,
          pendingTenantSelectionJson: pendingList,
        },
      });
    }

    return {
      status: 'MULTI_TENANT_SELECTION_REQUIRED',
      employee: null,
      candidates: matches,
      pendingSelection: pendingList,
    };
  }

  async getConversationContext(phoneKey) {
    if (!phoneKey) return null;
    return this.prisma.whatsappConversationContext.findUnique({
      where: { phoneKey },
    });
  }

  async setActiveTenantContext({ phoneKey, tenantId }) {
    if (!phoneKey || !tenantId) return null;
    return this.prisma.whatsappConversationContext.upsert({
      where: { phoneKey },
      create: {
        phoneKey,
        activeTenantId: tenantId,
        pendingTenantSelectionJson: null,
      },
      update: {
        activeTenantId: tenantId,
        pendingTenantSelectionJson: null,
      },
    });
  }

  async clearActiveTenantSelection({ phoneKey, pendingSelection = null }) {
    if (!phoneKey) return null;
    return this.prisma.whatsappConversationContext.upsert({
      where: { phoneKey },
      create: {
        phoneKey,
        activeTenantId: null,
        pendingTenantSelectionJson: pendingSelection,
      },
      update: {
        activeTenantId: null,
        pendingTenantSelectionJson: pendingSelection,
      },
    });
  }

  /**
   * Obtiene el registro de marcación de asistencia del colaborador para la fecha de hoy.
   * @param {string} employeeId
   * @returns {Promise<Object|null>}
   */
  async getEmployeeAttendanceToday(employeeId) {
    if (!employeeId) return null;

    try {
      const now = new Date();
      // Rango del día actual (00:00:00 a 23:59:59 UTC)
      const startOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
      );
      const endOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)
      );

      const attendance = await this.prisma.attendance.findFirst({
        where: {
          employeeId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return attendance;
    } catch (err) {
      console.error(
        '[WhatsApp Repository Error] Error al consultar asistencia de hoy:',
        err.message
      );
      return null;
    }
  }

  /**
   * Obtiene métricas agregadas del tenant para directores o administradores con permisos.
   * @param {string} tenantId
   * @returns {Promise<Object>}
   */
  async getTenantSummaryMetrics(tenantId) {
    if (!tenantId) return {};

    try {
      const now = new Date();
      const startOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
      );
      const endOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)
      );

      const [totalActiveEmployees, totalAttendancesToday, pendingAbsenceRequests] =
        await Promise.all([
          this.prisma.employee.count({
            where: { tenantId, isActive: true },
          }),
          this.prisma.attendance.count({
            where: {
              employee: { tenantId },
              date: { gte: startOfDay, lte: endOfDay },
            },
          }),
          this.prisma.absenceRequest.count({
            where: {
              employee: { tenantId },
              status: 'PENDING',
            },
          }),
        ]);

      return {
        totalActiveEmployees,
        totalAttendancesToday,
        pendingAbsenceRequests,
      };
    } catch (err) {
      console.error(
        '[WhatsApp Repository Error] Error al consultar métricas de tenant:',
        err.message
      );
      return {};
    }
  }
}

const whatsappRepository = new WhatsappRepository();
export default whatsappRepository;
