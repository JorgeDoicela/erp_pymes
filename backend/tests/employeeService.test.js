import { describe, it, expect, vi, beforeEach } from 'vitest';
import employeeService from '../src/services/employees/employeeService.js';
import employeeRepository from '../src/repositories/employees/employeeRepository.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        tenant: {
            findUnique: vi.fn()
        },
        employee: {
            count: vi.fn()
        }
    }
}));

vi.mock('../src/repositories/employees/employeeRepository.js', () => ({
    default: {
        findByEmail: vi.fn(),
        findByIdentityCard: vi.fn(),
        findById: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        countAll: vi.fn()
    }
}));

vi.mock('../src/repositories/audit/auditRepository.js', () => ({
    default: {
        createLog: vi.fn().mockResolvedValue({})
    }
}));

describe('Employee Business Rules & Service Test Suite (Código del Trabajo Ecuador)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const validEmployeeInput = {
        firstName: 'Ana',
        lastName: 'Morales',
        email: 'ana.morales@empresa.ec',
        identityCard: '1721987654',
        birthDate: '1995-05-15',
        hireDate: '2024-01-01',
        department: 'Tecnología',
        position: 'Desarrolladora Senior',
        salary: 1200.00,
        address: 'Av. Amazonas N24-196 y Colón',
        phone: '0998765432',
        contractType: 'Indefinido',
        civilStatus: 'Soltero',
        tenantId: 'tenant_1'
    };

    it('should create employee successfully when all legal and business rules are met', async () => {
        prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant_1', maxEmployees: 50, plan: 'PRO', name: 'Empresa Demo' });
        prisma.employee.count.mockResolvedValue(10);
        employeeRepository.findByEmail.mockResolvedValue(null);
        employeeRepository.findByIdentityCard.mockResolvedValue(null);
        employeeRepository.create.mockResolvedValue({ id: 'emp_123', ...validEmployeeInput });

        const created = await employeeService.createEmployee(validEmployeeInput);
        expect(created).toBeDefined();
        expect(created.id).toBe('emp_123');
        expect(created.firstName).toBe('Ana');
    });

    it('should reject employee if age at hire is less than 18 years', async () => {
        const underage = {
            ...validEmployeeInput,
            birthDate: '2010-01-01',
            hireDate: '2024-01-01' // 14 years old
        };

        await expect(employeeService.createEmployee(underage))
            .rejects
            .toThrow('El empleado debe haber tenido al menos 18 años al momento de su contratación');
    });

    it('should reject employee if current age is older than 65 years', async () => {
        const overage = {
            ...validEmployeeInput,
            birthDate: '1950-01-01' // > 70 years old
        };

        await expect(employeeService.createEmployee(overage))
            .rejects
            .toThrow('El empleado supera la edad máxima de contratación (65 años)');
    });

    it('should reject salary below legal minimum basic wage ($450)', async () => {
        const lowSalary = {
            ...validEmployeeInput,
            salary: 400.00
        };

        await expect(employeeService.createEmployee(lowSalary))
            .rejects
            .toThrow('El salario no puede ser inferior al salario básico unificado ($450)');
    });

    it('should enforce tenant plan active employee capacity limit', async () => {
        prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant_1', maxEmployees: 5, plan: 'STARTER', name: 'PyME Alpha' });
        prisma.employee.count.mockResolvedValue(5); // At maximum limit

        await expect(employeeService.createEmployee(validEmployeeInput))
            .rejects
            .toThrow('Has alcanzado el límite máximo de empleados activos (5)');
    });

    it('should enforce identity card immutability during update', async () => {
        const existing = { id: 'emp_123', identityCard: '1721987654', firstName: 'Ana', lastName: 'Morales' };
        employeeRepository.findById.mockResolvedValue(existing);
        employeeRepository.update.mockImplementation((id, data) => Promise.resolve({ ...existing, ...data }));

        const updateData = {
            firstName: 'Ana María',
            identityCard: '9999999999' // Trying to change identity card
        };

        const updated = await employeeService.updateEmployee('emp_123', updateData, 'admin_1');
        // identityCard must be stripped and not changed
        expect(employeeRepository.update).toHaveBeenCalledWith('emp_123', expect.not.objectContaining({ identityCard: '9999999999' }));
    });
});
