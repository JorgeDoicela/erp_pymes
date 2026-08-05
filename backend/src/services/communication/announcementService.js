import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

class AnnouncementService {
    /**
     * Crear un nuevo comunicado oficial.
     */
    async createAnnouncement({ title, content, category = 'GENERAL', priority = 'NORMAL', requiresAcknowledgment = false, attachmentUrl, authorId }) {
        if (!title || !title.trim()) throw new Error('El título del comunicado es obligatorio');
        if (!content || !content.trim()) throw new Error('El contenido del comunicado es obligatorio');

        const announcement = await prisma.announcement.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                category,
                priority,
                requiresAcknowledgment,
                attachmentUrl,
                createdById: authorId
            },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        if (authorId) {
            auditRepository.createLog({
                entity: 'Announcement',
                entityId: announcement.id,
                action: 'CREATE_ANNOUNCEMENT',
                performedBy: authorId,
                details: `Publicado comunicado '${announcement.title}' (${category}) - Acuse de recibo: ${requiresAcknowledgment}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return announcement;
    }

    /**
     * Obtener comunicados para el tablón con estado de lectura del empleado actual.
     */
    async getAnnouncementsForEmployee(employeeId, { category, search, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;
        const where = {};
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.announcement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    reads: employeeId ? {
                        where: { employeeId }
                    } : false
                }
            }),
            prisma.announcement.count({ where })
        ]);

        const formatted = data.map(ann => {
            const userRead = ann.reads && ann.reads.length > 0 ? ann.reads[0] : null;
            return {
                ...ann,
                readsCount: undefined,
                isRead: !!userRead,
                readAt: userRead?.readAt || null,
                isAcknowledged: userRead?.acknowledged || false
            };
        });

        return {
            data: formatted,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Marcar comunicado como Leído o Firmar Acuse de Recibo Digital.
     */
    async markAsReadOrAcknowledged(announcementId, employeeId, { acknowledge = false }) {
        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId }
        });

        if (!announcement) throw new Error('Comunicado no encontrado');

        const readRecord = await prisma.announcementRead.upsert({
            where: {
                announcementId_employeeId: {
                    announcementId,
                    employeeId
                }
            },
            create: {
                announcementId,
                employeeId,
                readAt: new Date(),
                acknowledged: acknowledge
            },
            update: {
                acknowledged: acknowledge ? true : undefined,
                readAt: new Date()
            }
        });

        return readRecord;
    }

    /**
     * Obtener estadísticas de lectura y acuse de recibo para administradores.
     */
    async getAnnouncementStats(announcementId) {
        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId },
            include: {
                createdBy: { select: { firstName: true, lastName: true } },
                reads: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true, department: true } }
                    }
                }
            }
        });

        if (!announcement) throw new Error('Comunicado no encontrado');

        const totalActiveEmployees = await prisma.employee.count({ where: { isActive: true } });
        const totalReads = announcement.reads.length;
        const totalAcknowledged = announcement.reads.filter(r => r.acknowledged).length;

        const readEmployeeIds = new Set(announcement.reads.map(r => r.employeeId));
        const pendingEmployees = await prisma.employee.findMany({
            where: {
                isActive: true,
                id: { notIn: Array.from(readEmployeeIds) }
            },
            select: { id: true, firstName: true, lastName: true, department: true }
        });

        return {
            announcement: {
                id: announcement.id,
                title: announcement.title,
                category: announcement.category,
                requiresAcknowledgment: announcement.requiresAcknowledgment,
                createdAt: announcement.createdAt
            },
            metrics: {
                totalActiveEmployees,
                totalReads,
                totalAcknowledged,
                readPercentage: totalActiveEmployees > 0 ? Number(((totalReads / totalActiveEmployees) * 100).toFixed(1)) : 0,
                acknowledgedPercentage: totalActiveEmployees > 0 ? Number(((totalAcknowledged / totalActiveEmployees) * 100).toFixed(1)) : 0
            },
            reads: announcement.reads,
            pendingEmployees
        };
    }

    /**
     * Obtener cumpleaños del mes actual.
     */
    async getBirthdaysOfMonth() {
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const activeEmployees = await prisma.employee.findMany({
            where: { isActive: true },
            select: { id: true, firstName: true, lastName: true, department: true, birthDate: true, position: true }
        });

        const birthdaysThisMonth = activeEmployees.filter(emp => {
            if (!emp.birthDate) return false;
            const bMonth = new Date(emp.birthDate).getUTCMonth() + 1;
            return bMonth === currentMonth;
        }).map(emp => {
            const bDay = new Date(emp.birthDate).getUTCDate();
            return {
                id: emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                department: emp.department,
                position: emp.position,
                day: bDay
            };
        }).sort((a, b) => a.day - b.day);

        return birthdaysThisMonth;
    }
}

export default new AnnouncementService();
