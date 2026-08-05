import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

class AssetService {
    /**
     * Registrar la entrega de un activo o EPP a un empleado.
     */
    async deliverAsset({ employeeId, name, serialNumber, category = 'EQUIPMENT', condition = 'GOOD', receiptSignatureUrl, adminId }) {
        if (!name || !name.trim()) throw new Error('El nombre del activo o EPP es obligatorio');

        const asset = await prisma.employeeAsset.create({
            data: {
                employeeId,
                name: name.trim(),
                serialNumber: serialNumber ? serialNumber.trim() : null,
                category,
                condition,
                status: 'DELIVERED',
                deliveryDate: new Date(),
                receiptSignatureUrl
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true }
                }
            }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'EmployeeAsset',
                entityId: asset.id,
                action: 'DELIVER_ASSET',
                performedBy: adminId,
                details: `Entregado ${asset.category} (${asset.name}) a ${asset.employee.firstName} ${asset.employee.lastName}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return asset;
    }

    /**
     * Registrar la devolución de un activo / EPP durante Offboarding o cambio.
     */
    async returnAsset(assetId, { returnNotes, condition = 'GOOD', status = 'RETURNED' }, adminId) {
        const asset = await prisma.employeeAsset.findUnique({
            where: { id: assetId },
            include: { employee: true }
        });

        if (!asset) throw new Error('Activo no encontrado');

        const updated = await prisma.employeeAsset.update({
            where: { id: assetId },
            data: {
                status, // RETURNED o LOST_DAMAGED
                condition,
                returnDate: new Date(),
                returnNotes: returnNotes ? returnNotes.trim() : null
            }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'EmployeeAsset',
                entityId: assetId,
                action: 'RETURN_ASSET',
                performedBy: adminId,
                details: `Devolución de activo (${asset.name}) por ${asset.employee.firstName} ${asset.employee.lastName}. Estado: ${status}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return updated;
    }

    /**
     * Obtener listado de activos de un empleado.
     */
    async getEmployeeAssets(employeeId) {
        return await prisma.employeeAsset.findMany({
            where: { employeeId },
            orderBy: { deliveryDate: 'desc' }
        });
    }

    /**
     * Obtener listado general de activos de la empresa para administradores.
     */
    async getAllAssets({ status, category, search, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;
        const where = {};

        if (status) where.status = status;
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
                { employee: { firstName: { contains: search, mode: 'insensitive' } } },
                { employee: { lastName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.employeeAsset.findMany({
                where,
                skip,
                take: limit,
                orderBy: { deliveryDate: 'desc' },
                include: {
                    employee: {
                        select: { id: true, firstName: true, lastName: true, identityCard: true, department: true }
                    }
                }
            }),
            prisma.employeeAsset.count({ where })
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}

export default new AssetService();
