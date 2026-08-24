import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

class AssetService {
    /**
     * Registrar la entrega de un activo o EPP a un colaborador.
     */
    async deliverAsset({ employeeId, name, serialNumber, category = 'EQUIPMENT', condition = 'NEW', deliveryDate, receiptSignatureUrl, adminId, user }) {
        if (!name || !name.trim()) throw new Error('El nombre del activo o EPP es obligatorio');
        if (!employeeId) throw new Error('Debes seleccionar un colaborador para la entrega');

        // Validar que el empleado pertenezca al tenant si corresponde
        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                ...(user?.tenantId ? { tenantId: user.tenantId } : {})
            },
            select: { id: true, firstName: true, lastName: true, identityCard: true, department: true }
        });

        if (!employee) throw new Error('Colaborador no encontrado o no pertenece a tu organización');

        const parsedDeliveryDate = deliveryDate ? new Date(deliveryDate) : new Date();

        const asset = await prisma.employeeAsset.create({
            data: {
                employeeId,
                name: name.trim(),
                serialNumber: serialNumber ? serialNumber.trim() : null,
                category,
                condition,
                status: 'DELIVERED',
                deliveryDate: isNaN(parsedDeliveryDate.getTime()) ? new Date() : parsedDeliveryDate,
                receiptSignatureUrl
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                }
            }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'EmployeeAsset',
                entityId: asset.id,
                action: 'DELIVER_ASSET',
                performedBy: adminId,
                details: `Entregado ${asset.category} (${asset.name}) a ${asset.employee.firstName} ${asset.employee.lastName}. Serie: ${asset.serialNumber || 'S/N'}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return asset;
    }

    /**
     * Actualizar datos de un activo existente (nombre, serie, categoría, condición).
     */
    async updateAsset(assetId, { name, serialNumber, category, condition, deliveryDate }, adminId, user) {
        const whereClause = {
            id: assetId,
            ...(user?.tenantId ? { employee: { tenantId: user.tenantId } } : {})
        };

        const existing = await prisma.employeeAsset.findFirst({
            where: whereClause,
            include: { employee: true }
        });

        if (!existing) throw new Error('Activo no encontrado');

        const dataToUpdate = {};
        if (name && name.trim()) dataToUpdate.name = name.trim();
        if (serialNumber !== undefined) dataToUpdate.serialNumber = serialNumber ? serialNumber.trim() : null;
        if (category) dataToUpdate.category = category;
        if (condition) dataToUpdate.condition = condition;
        if (deliveryDate) {
            const parsed = new Date(deliveryDate);
            if (!isNaN(parsed.getTime())) dataToUpdate.deliveryDate = parsed;
        }

        const updated = await prisma.employeeAsset.update({
            where: { id: assetId },
            data: dataToUpdate,
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                }
            }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'EmployeeAsset',
                entityId: assetId,
                action: 'UPDATE_ASSET',
                performedBy: adminId,
                details: `Actualizado activo ${updated.name} de ${updated.employee.firstName} ${updated.employee.lastName}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return updated;
    }

    /**
     * Registrar la devolución de un activo / EPP a bodega o reporte de daño/pérdida.
     */
    async returnAsset(assetId, { returnNotes, condition = 'GOOD', status = 'RETURNED', returnDate }, adminId, user) {
        const whereClause = {
            id: assetId,
            ...(user?.tenantId ? { employee: { tenantId: user.tenantId } } : {})
        };

        const asset = await prisma.employeeAsset.findFirst({
            where: whereClause,
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, department: true }
                }
            }
        });

        if (!asset) throw new Error('Activo no encontrado');

        const parsedReturnDate = returnDate ? new Date(returnDate) : new Date();

        const updated = await prisma.employeeAsset.update({
            where: { id: assetId },
            data: {
                status, // 'RETURNED' o 'LOST_DAMAGED'
                condition,
                returnDate: isNaN(parsedReturnDate.getTime()) ? new Date() : parsedReturnDate,
                returnNotes: returnNotes ? returnNotes.trim() : null
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                }
            }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'EmployeeAsset',
                entityId: assetId,
                action: 'RETURN_ASSET',
                performedBy: adminId,
                details: `Devolución de activo (${asset.name}) por ${asset.employee.firstName} ${asset.employee.lastName}. Estado: ${status}. Observación: ${returnNotes || 'Sin notas'}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return updated;
    }

    /**
     * Eliminar registro de activo por error de digitación.
     */
    async deleteAsset(assetId, adminId, user) {
        const whereClause = {
            id: assetId,
            ...(user?.tenantId ? { employee: { tenantId: user.tenantId } } : {})
        };

        const asset = await prisma.employeeAsset.findFirst({
            where: whereClause,
            include: { employee: true }
        });

        if (!asset) throw new Error('Activo no encontrado');

        await prisma.employeeAsset.delete({
            where: { id: assetId }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'EmployeeAsset',
                entityId: assetId,
                action: 'DELETE_ASSET',
                performedBy: adminId,
                details: `Eliminado activo ${asset.name} asignado a ${asset.employee.firstName} ${asset.employee.lastName}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return { success: true, id: assetId };
    }

    /**
     * Obtener listado de activos de un empleado específico o del usuario autenticado.
     */
    async getEmployeeAssets(employeeId, user) {
        let emp = await prisma.employee.findFirst({
            where: {
                OR: [
                    ...(employeeId ? [{ id: employeeId }] : []),
                    ...(user?.employeeId ? [{ id: user.employeeId }] : []),
                    ...(user?.id ? [{ id: user.id }] : []),
                    ...(user?.email ? [{ email: user.email }] : [])
                ],
                ...(user?.tenantId ? { tenantId: user.tenantId } : {})
            }
        });

        if (!emp) return [];

        return await prisma.employeeAsset.findMany({
            where: { employeeId: emp.id },
            orderBy: { deliveryDate: 'desc' },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                }
            }
        });
    }

    /**
     * Obtener listado general de activos de la empresa con métricas de estado para administradores.
     */
    async getAllAssets({ status, category, search, page = 1, limit = 100, user }) {
        const where = {};

        if (user?.tenantId) {
            where.employee = { tenantId: user.tenantId };
        }

        if (status) where.status = status;
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
                { employee: { firstName: { contains: search, mode: 'insensitive' } } },
                { employee: { lastName: { contains: search, mode: 'insensitive' } } },
                { employee: { identityCard: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const skip = (page - 1) * limit;

        const [data, total, deliveredCount, returnedCount, lostDamagedCount] = await Promise.all([
            prisma.employeeAsset.findMany({
                where,
                skip,
                take: limit,
                orderBy: { deliveryDate: 'desc' },
                include: {
                    employee: {
                        select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true, email: true }
                    }
                }
            }),
            prisma.employeeAsset.count({ where: user?.tenantId ? { employee: { tenantId: user.tenantId } } : {} }),
            prisma.employeeAsset.count({ where: { status: 'DELIVERED', ...(user?.tenantId ? { employee: { tenantId: user.tenantId } } : {}) } }),
            prisma.employeeAsset.count({ where: { status: 'RETURNED', ...(user?.tenantId ? { employee: { tenantId: user.tenantId } } : {}) } }),
            prisma.employeeAsset.count({ where: { status: 'LOST_DAMAGED', ...(user?.tenantId ? { employee: { tenantId: user.tenantId } } : {}) } })
        ]);

        return {
            data,
            counts: {
                total,
                deliveredCount,
                returnedCount,
                lostDamagedCount
            },
            pagination: {
                total: data.length,
                page,
                limit,
                totalPages: Math.ceil(data.length / limit) || 1
            }
        };
    }
}

export default new AssetService();
