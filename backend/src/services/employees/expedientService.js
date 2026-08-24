import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

class ExpedientService {
    // Categorías del expediente digital de un colaborador
    REQUIRED_CATEGORIES = [
        { key: 'IDENTIFICATION', label: 'Cédula de Identidad / DNI (Ambos lados)', required: true },
        { key: 'LABOR_CONTRACT', label: 'Contrato de Trabajo Firmado', required: true },
        { key: 'BANK_CERTIFICATE', label: 'Certificación Bancaria para Nómina', required: true },
        { key: 'TITLE_DIPLOMA', label: 'Título Académico / Certificado de Estudios', required: true },
        { key: 'POLICE_RECORD', label: 'Certificado de Antecedentes Penales', required: true },
        { key: 'CURRICULUM', label: 'Hoja de Vida / Currículum Vitae Actualizado', required: true },
        { key: 'SAFETY_CERTIFICATE', label: 'Certificado Médico Ocupacional / Salud', required: false },
        { key: 'IESS_AFFILIATION', label: 'Aviso de Entrada / Afiliación IESS', required: false },
        { key: 'DISCIPLINARY_RECORD', label: 'Memorandos y Registro Disciplinario', required: false },
        { key: 'OTHER', label: 'Otros Documentos y Anexos', required: false }
    ];

    /**
     * Directorio General de Expedientes de Todos los Colaboradores de la Empresa
     */
    async getAllExpedientsSummary(user) {
        const whereClause = user?.tenantId ? { tenantId: user.tenantId } : {};

        const employees = await prisma.employee.findMany({
            where: {
                ...whereClause,
                isActive: true
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                identityCard: true,
                email: true,
                department: true,
                position: true,
                isActive: true,
                hireDate: true,
                documents: {
                    select: {
                        id: true,
                        documentCategory: true,
                        type: true,
                        status: true,
                        documentUrl: true,
                        originalName: true,
                        expiryDate: true,
                        createdAt: true
                    }
                }
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
        });

        const requiredKeys = this.REQUIRED_CATEGORIES.filter(c => c.required).map(c => c.key);
        const totalRequiredCount = requiredKeys.length;

        const summaryList = employees.map(emp => {
            const docs = emp.documents || [];
            
            // Requeridos verificados
            const verifiedRequired = requiredKeys.filter(reqKey => 
                docs.some(d => (d.documentCategory === reqKey || d.type === reqKey) && d.status === 'VERIFIED')
            ).length;

            const pendingReviewCount = docs.filter(d => d.status === 'PENDING').length;
            const verifiedCount = docs.filter(d => d.status === 'VERIFIED').length;
            const rejectedCount = docs.filter(d => d.status === 'REJECTED').length;
            const totalUploaded = docs.length;

            const completionPercentage = totalRequiredCount > 0 
                ? Math.round((verifiedRequired / totalRequiredCount) * 100) 
                : 0;

            const missingRequired = requiredKeys.filter(reqKey => 
                !docs.some(d => (d.documentCategory === reqKey || d.type === reqKey) && ['VERIFIED', 'PENDING'].includes(d.status))
            );

            return {
                id: emp.id,
                fullName: `${emp.firstName} ${emp.lastName}`.trim(),
                firstName: emp.firstName,
                lastName: emp.lastName,
                identityCard: emp.identityCard || 'S/N',
                email: emp.email,
                department: emp.department || 'General',
                position: emp.position || 'Colaborador',
                status: emp.isActive ? 'ACTIVE' : 'INACTIVE',
                startDate: emp.hireDate,
                completionPercentage,
                verifiedRequired,
                totalRequired: totalRequiredCount,
                pendingReviewCount,
                verifiedCount,
                rejectedCount,
                totalUploaded,
                missingRequiredCount: missingRequired.length,
                isComplete: completionPercentage === 100
            };
        });

        const totalEmployees = summaryList.length;
        const completeCount = summaryList.filter(s => s.isComplete).length;
        const pendingReviewsGlobal = summaryList.reduce((acc, s) => acc + s.pendingReviewCount, 0);
        const incompleteCount = totalEmployees - completeCount;
        const avgCompletion = totalEmployees > 0 
            ? Math.round(summaryList.reduce((acc, s) => acc + s.completionPercentage, 0) / totalEmployees) 
            : 0;

        return {
            stats: {
                totalEmployees,
                completeCount,
                incompleteCount,
                pendingReviewsGlobal,
                avgCompletion
            },
            categories: this.REQUIRED_CATEGORIES,
            employees: summaryList
        };
    }

    /**
     * Obtener estado del Expediente Digital de un Empleado con detalle de documentos y porcentaje de completitud.
     */
    async getEmployeeExpedient(employeeId, user = null) {
        const isSuperAdmin = user?.role === 'superadmin';
        const tenantFilter = (user?.tenantId && !isSuperAdmin) ? { tenantId: user.tenantId } : {};

        let employee = null;

        // 1. Si se provee employeeId explícito, buscar por ID
        if (employeeId && employeeId !== 'my' && employeeId !== 'undefined') {
            employee = await prisma.employee.findFirst({
                where: {
                    id: employeeId,
                    ...tenantFilter
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    identityCard: true,
                    department: true,
                    position: true,
                    email: true,
                    phone: true,
                    hireDate: true,
                    isActive: true,
                    tenantId: true
                }
            });
        }

        // 2. Si no se encontró por ID o es /my, buscar por sesión del usuario
        if (!employee && user) {
            employee = await prisma.employee.findFirst({
                where: {
                    OR: [
                        ...(user.employeeId ? [{ id: user.employeeId }] : []),
                        ...(user.email ? [{ email: user.email }] : [])
                    ],
                    ...tenantFilter
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    identityCard: true,
                    department: true,
                    position: true,
                    email: true,
                    phone: true,
                    hireDate: true,
                    isActive: true,
                    tenantId: true
                }
            });
        }

        if (!employee) {
            if (user && ['admin', 'hr', 'superadmin'].includes(user.role?.toLowerCase())) {
                employee = {
                    id: user.id || 'system-user',
                    firstName: user.firstName || user.name || 'Usuario',
                    lastName: user.lastName || 'Administrador',
                    identityCard: 'N/A',
                    department: 'Administración',
                    position: user.role || 'Administrador',
                    email: user.email,
                    isActive: true,
                    status: 'ACTIVE'
                };
            } else {
                throw new Error('Empleado no encontrado');
            }
        }

        const normalizedEmployee = {
            ...employee,
            startDate: employee.hireDate || employee.startDate,
            status: employee.isActive ? 'ACTIVE' : 'INACTIVE'
        };

        const documents = employee.id && !employee.id.startsWith('system-') ? await prisma.document.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: 'desc' }
        }) : [];

        // Mapear cada categoría con el documento más reciente cargado
        const checklist = this.REQUIRED_CATEGORIES.map(cat => {
            const doc = documents.find(d => d.documentCategory === cat.key || d.type === cat.key);
            return {
                categoryKey: cat.key,
                label: cat.label,
                required: cat.required,
                status: doc ? doc.status : 'MISSING',
                document: doc || null
            };
        });

        // Calcular porcentaje de Onboarding (Categorías requeridas verificadas)
        const requiredCats = checklist.filter(c => c.required);
        const verifiedCount = requiredCats.filter(c => c.status === 'VERIFIED').length;
        const pendingCount = documents.filter(d => d.status === 'PENDING').length;
        const completionPercentage = requiredCats.length > 0 ? Math.round((verifiedCount / requiredCats.length) * 100) : 0;

        return {
            employee: normalizedEmployee,
            completionPercentage,
            verifiedCount,
            pendingCount,
            totalRequired: requiredCats.length,
            checklist,
            allDocuments: documents
        };
    }

    /**
     * Subir o registrar un documento del expediente digital.
     */
    async uploadDocument({ employeeId, user, type, documentCategory, documentUrl, mimeType, originalName, expiryDate }) {
        const category = documentCategory || type || 'OTHER';

        // Si es Admin o RRHH y especificó employeeId explícito, usarlo
        const isAdminOrHr = user && ['admin', 'hr', 'superadmin'].includes(user.role?.toLowerCase());
        const targetId = (isAdminOrHr && employeeId) ? employeeId : (user?.employeeId || user?.id || employeeId);

        const isSuperAdmin = user?.role === 'superadmin';
        const tenantFilter = (user?.tenantId && !isSuperAdmin) ? { tenantId: user.tenantId } : {};

        let employee = await prisma.employee.findFirst({
            where: {
                OR: [
                    { id: targetId },
                    ...(user?.email && !isAdminOrHr ? [{ email: user.email }] : [])
                ],
                ...tenantFilter
            }
        });

        if (!employee) {
            throw new Error('No se puede cargar el documento: No se encontró el perfil del colaborador');
        }

        const actualEmployeeId = employee.id;

        // Desactivar o reemplazar versión previa de la misma categoría si existía
        const existing = await prisma.document.findFirst({
            where: { employeeId: actualEmployeeId, documentCategory: category }
        });

        let parsedExpiry = null;
        if (expiryDate) {
            parsedExpiry = new Date(expiryDate);
            if (isNaN(parsedExpiry.getTime())) parsedExpiry = null;
        }

        if (existing) {
            return await prisma.document.update({
                where: { id: existing.id },
                data: {
                    documentUrl,
                    mimeType: mimeType || existing.mimeType,
                    originalName: originalName || existing.originalName,
                    status: 'PENDING',
                    expiryDate: parsedExpiry || existing.expiryDate,
                    verificationNotes: null
                }
            });
        }

        return await prisma.document.create({
            data: {
                employeeId: actualEmployeeId,
                type: type || category,
                documentCategory: category,
                documentUrl,
                mimeType,
                originalName,
                expiryDate: parsedExpiry,
                status: 'PENDING'
            }
        });
    }

    /**
     * Aprobar o rechazar un documento del expediente por RRHH / Administrador.
     */
    async verifyDocument(documentId, status, notes, adminId) {
        if (!['VERIFIED', 'REJECTED'].includes(status)) {
            throw new Error('Estado no válido. Debe ser VERIFIED o REJECTED');
        }

        const doc = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, department: true }
                }
            }
        });

        if (!doc) throw new Error('Documento no encontrado');

        const updated = await prisma.document.update({
            where: { id: documentId },
            data: {
                status,
                verificationNotes: notes ? notes.trim() : null,
                verifiedBy: adminId,
                verifiedAt: new Date()
            }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'Document',
                entityId: documentId,
                action: status === 'VERIFIED' ? 'VERIFY_DOCUMENT' : 'REJECT_DOCUMENT',
                performedBy: adminId,
                details: `${status === 'VERIFIED' ? 'Aprobado' : 'Rechazado'} documento ${doc.documentCategory} para ${doc.employee.firstName} ${doc.employee.lastName}. Observación: ${notes || 'Sin notas'}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return updated;
    }

    /**
     * Eliminar un documento del expediente.
     */
    async deleteDocument(documentId, adminId) {
        const doc = await prisma.document.findUnique({
            where: { id: documentId },
            include: { employee: true }
        });

        if (!doc) throw new Error('Documento no encontrado');

        await prisma.document.delete({
            where: { id: documentId }
        });

        if (adminId) {
            auditRepository.createLog({
                entity: 'Document',
                entityId: documentId,
                action: 'DELETE_DOCUMENT',
                performedBy: adminId,
                details: `Eliminado documento ${doc.documentCategory} (${doc.originalName || doc.type}) de ${doc.employee?.firstName} ${doc.employee?.lastName}`
            }).catch(err => console.error('Audit Log Error:', err));
        }

        return { success: true, id: documentId };
    }
}

export default new ExpedientService();
