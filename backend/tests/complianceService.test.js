import { describe, it, expect, vi, beforeEach } from 'vitest';
import complianceService from '../src/services/compliance/complianceService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        contract: {
            findMany: vi.fn()
        },
        document: {
            findMany: vi.fn()
        }
    }
}));

describe('Labor Compliance & Preventive Alerts Service Test Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate CRITICAL urgency alert when probation period ends in <= 10 days', async () => {
        const today = new Date();
        const startProbation = new Date(today);
        startProbation.setDate(startProbation.getDate() - 83); // 83 days ago -> 7 days remaining for 90 days

        prisma.contract.findMany.mockResolvedValue([
            {
                id: 'ctr_prob_1',
                startDate: startProbation,
                endDate: null,
                type: 'Indefinido',
                status: 'Active',
                employee: {
                    id: 'emp_1',
                    firstName: 'Valeria',
                    lastName: 'Paz',
                    department: 'Operaciones'
                }
            }
        ]);
        prisma.document.findMany.mockResolvedValue([]);

        const result = await complianceService.getComplianceAlerts('tenant_1');

        expect(result.summary.totalAlerts).toBe(1);
        expect(result.summary.criticalCount).toBe(1);
        expect(result.alerts[0].type).toBe('PROBATION_PERIOD');
        expect(result.alerts[0].urgency).toBe('CRITICAL');
        expect(result.alerts[0].daysRemaining).toBeLessThanOrEqual(10);
    });

    it('should generate CONTRACT_EXPIRATION alert for fixed-term contracts ending soon', async () => {
        const today = new Date();
        const contractEnd = new Date(today);
        contractEnd.setDate(contractEnd.getDate() + 14); // Expires in 14 days -> HIGH urgency (<=15 days)

        prisma.contract.findMany.mockResolvedValue([
            {
                id: 'ctr_fix_1',
                startDate: new Date('2025-09-01'),
                endDate: contractEnd,
                type: 'Temporal',
                status: 'Active',
                employee: {
                    id: 'emp_2',
                    firstName: 'Jorge',
                    lastName: 'Salas',
                    department: 'Logística'
                }
            }
        ]);
        prisma.document.findMany.mockResolvedValue([]);

        const result = await complianceService.getComplianceAlerts('tenant_1');

        expect(result.summary.contractCount).toBe(1);
        const contractAlert = result.alerts.find(a => a.type === 'CONTRACT_EXPIRATION');
        expect(contractAlert).toBeDefined();
        expect(contractAlert.urgency).toBe('HIGH');
    });

    it('should generate DOCUMENT_EXPIRATION alert for rejected and expiring digital documents', async () => {
        prisma.contract.findMany.mockResolvedValue([]);
        prisma.document.findMany.mockResolvedValue([
            {
                id: 'doc_rej_1',
                documentCategory: 'CERTIFICADO_MEDICO',
                status: 'REJECTED',
                expiryDate: null,
                employee: {
                    id: 'emp_3',
                    firstName: 'David',
                    lastName: 'Rios',
                    department: 'Ventas'
                }
            }
        ]);

        const result = await complianceService.getComplianceAlerts('tenant_1');

        expect(result.summary.totalAlerts).toBe(1);
        expect(result.alerts[0].type).toBe('DOCUMENT_EXPIRATION');
        expect(result.alerts[0].urgency).toBe('HIGH');
        expect(result.alerts[0].title).toContain('Documento Rechazado');
    });
});
