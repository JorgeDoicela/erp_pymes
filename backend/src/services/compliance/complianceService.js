import prisma from '../../database/db.js';

class ComplianceService {
    /**
     * Centro de Alertas Preventivas de Cumplimiento Laboral y Vencimientos.
     */
    async getComplianceAlerts() {
        const today = new Date();
        const alerts = [];

        // 1. Alertas de Fin de Período de Prueba (90 días)
        const activeContracts = await prisma.contract.findMany({
            where: {
                status: 'Active',
                OR: [{ endDate: null }, { endDate: { gte: today } }]
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true, position: true }
                }
            }
        });

        activeContracts.forEach(contract => {
            const startDate = new Date(contract.startDate);
            const probationEndDate = new Date(startDate);
            probationEndDate.setDate(probationEndDate.getDate() + 90);

            const diffTime = probationEndDate - today;
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Si el empleado lleva entre 60 y 95 días desde su ingreso
            if (daysRemaining >= -5 && daysRemaining <= 30) {
                let urgency = 'MEDIUM';
                if (daysRemaining <= 10) urgency = 'CRITICAL';
                else if (daysRemaining <= 20) urgency = 'HIGH';

                alerts.push({
                    id: `PROBATION_${contract.id}`,
                    type: 'PROBATION_PERIOD',
                    title: 'Fin de Período de Prueba (90 días)',
                    description: `${contract.employee.firstName} ${contract.employee.lastName} cumple los 90 días el ${probationEndDate.toLocaleDateString('es-EC')}`,
                    employee: contract.employee,
                    daysRemaining,
                    urgency,
                    actionRequired: 'Decidir renovación formal o notificación de terminación sin indemnización'
                });
            }

            // 2. Alertas de Vencimiento de Contrato Plazo Fijo / Por Obra
            if (contract.endDate) {
                const endDate = new Date(contract.endDate);
                const diffTime = endDate - today;
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (daysRemaining >= -2 && daysRemaining <= 30) {
                    let urgency = 'MEDIUM';
                    if (daysRemaining <= 7) urgency = 'CRITICAL';
                    else if (daysRemaining <= 15) urgency = 'HIGH';

                    alerts.push({
                        id: `CONTRACT_${contract.id}`,
                        type: 'CONTRACT_EXPIRATION',
                        title: `Vencimiento de Contrato (${contract.type || 'Plazo Fijo'})`,
                        description: `El contrato de ${contract.employee.firstName} ${contract.employee.lastName} vence el ${endDate.toLocaleDateString('es-EC')}`,
                        employee: contract.employee,
                        daysRemaining,
                        urgency,
                        actionRequired: 'Elaborar adenda de renovación o iniciar proceso de desahuicio/offboarding'
                    });
                }
            }
        });

        // 3. Alertas de Vencimiento de Documentos y Certificados Médicos
        const expiringDocs = await prisma.document.findMany({
            where: {
                OR: [
                    { status: 'REJECTED' },
                    { expiryDate: { lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) } }
                ]
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, identityCard: true, department: true }
                }
            }
        });

        expiringDocs.forEach(doc => {
            const isRejected = doc.status === 'REJECTED';
            let daysRemaining = 0;

            if (doc.expiryDate) {
                const diffTime = new Date(doc.expiryDate) - today;
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            alerts.push({
                id: `DOC_${doc.id}`,
                type: 'DOCUMENT_EXPIRATION',
                title: isRejected ? `Documento Rechazado: ${doc.documentCategory}` : `Documento Próximo a Caducar: ${doc.documentCategory}`,
                description: `${doc.employee.firstName} ${doc.employee.lastName} - ${isRejected ? 'Requiere re-subir archivo correcto' : `Caduca el ${new Date(doc.expiryDate).toLocaleDateString('es-EC')}`}`,
                employee: doc.employee,
                daysRemaining: isRejected ? 0 : daysRemaining,
                urgency: isRejected ? 'HIGH' : daysRemaining <= 7 ? 'CRITICAL' : 'MEDIUM',
                actionRequired: 'Solicitar al empleado la actualización del documento en su Expediente Digital'
            });
        });

        // Ordenar por nivel de urgencia (CRITICAL, HIGH, MEDIUM) y días restantes
        const urgencyWeight = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
        alerts.sort((a, b) => (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0) || a.daysRemaining - b.daysRemaining);

        return {
            summary: {
                totalAlerts: alerts.length,
                criticalCount: alerts.filter(a => a.urgency === 'CRITICAL').length,
                highCount: alerts.filter(a => a.urgency === 'HIGH').length,
                mediumCount: alerts.filter(a => a.urgency === 'MEDIUM').length,
                probationCount: alerts.filter(a => a.type === 'PROBATION_PERIOD').length,
                contractCount: alerts.filter(a => a.type === 'CONTRACT_EXPIRATION').length
            },
            alerts
        };
    }
}

export default new ComplianceService();
