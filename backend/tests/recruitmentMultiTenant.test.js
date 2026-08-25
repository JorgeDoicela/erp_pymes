import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recruitmentService } from '../src/services/recruitment/recruitmentService.js';
import recruitmentRepository from '../src/repositories/recruitment/recruitmentRepository.js';

vi.mock('../src/repositories/recruitment/recruitmentRepository.js');
vi.mock('../src/repositories/audit/auditRepository.js', () => ({
    default: {
        createLog: vi.fn().mockResolvedValue({}),
        log: vi.fn().mockResolvedValue({})
    }
}));
vi.mock('../src/database/db.js', () => ({
    default: {
        tenant: {
            findUnique: vi.fn()
        }
    }
}));

describe('Recruitment Multi-Tenant Isolation Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Should filter vacancies strictly by tenantId when provided', async () => {
        recruitmentRepository.getVacancies.mockResolvedValue([
            { id: 'vac-1', title: 'Developer', tenantId: 'tenant-A' }
        ]);

        const result = await recruitmentService.getVacancies('tenant-A');

        expect(recruitmentRepository.getVacancies).toHaveBeenCalledWith(
            { tenantId: 'tenant-A' },
            expect.any(Object)
        );
        expect(result).toHaveLength(1);
    });

    it('Should reject access if vacancy belongs to a different tenantId', async () => {
        recruitmentRepository.getVacancyById.mockResolvedValue({
            id: 'vac-2',
            title: 'Designer',
            tenantId: 'tenant-B'
        });

        await expect(recruitmentService.getVacancyById('vac-2', 'tenant-A'))
            .rejects.toThrow("Acceso denegado: La vacante no pertenece a la empresa activa.");
    });

    it('Should assign tenantId to new Employee when candidate is hired', async () => {
        const mockApplication = {
            id: 'app-100',
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan.perez@example.com',
            phone: '0999999999',
            vacancyId: 'vac-10',
            vacancy: {
                title: 'Backend Engineer',
                department: 'Tech',
                tenantId: 'tenant-CORP'
            }
        };

        recruitmentRepository.getApplicationById.mockResolvedValue(mockApplication);
        recruitmentRepository.executeTransaction.mockImplementation(async (callback) => {
            const mockTx = {
                jobApplication: { update: vi.fn().mockResolvedValue({}) },
                employee: {
                    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'emp-100', ...data }))
                },
                contract: { create: vi.fn().mockResolvedValue({}) },
                jobVacancy: { update: vi.fn().mockResolvedValue({}) }
            };
            return callback(mockTx);
        });

        const hireData = {
            identityCard: '1712345678',
            birthDate: '1995-05-15',
            address: 'Av. Siempre Viva 123',
            civilStatus: 'Soltero',
            contractType: 'Indefinido',
            salary: '2000',
            startDate: '2026-09-01',
            password: 'Password123!',
            sendEmail: false
        };

        const createdEmployee = await recruitmentService.hireCandidate('app-100', hireData, 'tenant-CORP');

        expect(createdEmployee).toBeDefined();
        expect(createdEmployee.tenantId).toBe('tenant-CORP');
    });
});
