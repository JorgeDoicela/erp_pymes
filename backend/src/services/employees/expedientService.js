import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

class ExpedientService {
    // Categorías obligatorias para el expediente de Onboarding de un empleado
    REQUIRED_CATEGORIES = [
        { key: 'IDENTIFICATION', label: 'Cédula de Identidad / DNI (Ambos lados)', required: true },
        { key: 'BANK_CERTIFICATE', label: 'Certificación Bancaria de Cuenta', required: true },
        { key: 'TITLE_DIPLOMA', label: 'Título Académico / Certificado de Estudios', required: true },
        { key: 'POLICE_RECORD', label: 'Certificado de Antecedentes Penales / Policiales', required: true },
        { key: 'CURRICULUM', label: 'Hoja de Vida / Currículum Vitae Actualizado', required: true },
        { key: 'SAFETY_CERTIFICATE', label: 'Certificado de Salud / Capacitación EPP', required: false }
    ];

    /**
     * Obtener estado del Expediente Digital del Empleado con porcentaje de completitud Onboarding.
     */
    async getEmployeeExpedient(employeeId) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
        });

        if (!employee) throw new Error('Empleado no encontrado');

        const documents = await prisma.document.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });

        // Mapear cada categoría obligatoria con el estado del documento cargado
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
        const completionPercentage = Math.round((verifiedCount / requiredCats.length) * 100);

        return {
            employee,
            completionPercentage,
            verifiedCount,
            totalRequired: requiredCats.length,
            checklist,
            allDocuments: documents
        };
    }

    /**
     * Subir o registrar un documento del expediente digital.
     */
    async uploadDocument({ employeeId, type, documentCategory, documentUrl, mimeType, originalName }) {
        const category = documentCategory || type || 'OTHER';

        // Desactivar o reemplazar versión previa de la misma categoría si existía
        const existing = await prisma.document.findFirst({
            where: { employeeId, documentCategory: category }
        });

        if (existing) {
            return await prisma.document.update({
                where: { id: existing.id },
                data: {
                    documentUrl,
                    mimeType: mimeType || existing.mimeType,
                    originalName: originalName || existing.originalName,
                    status: 'PENDING',
                    verificationNotes: null
                }
            });
        }

        return await prisma.document.create({
            data: {
                employeeId,
                type: type || category,
                documentCategory: category,
                documentUrl,
                mimeType,
                originalName,
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
            include: { employee: true }
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
}

export default new ExpedientService();
