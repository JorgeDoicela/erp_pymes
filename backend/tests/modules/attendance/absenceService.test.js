import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAbsenceRepo, mockEmpRepo, mockNotificationService } = vi.hoisted(() => ({
  mockAbsenceRepo: {
    createRequest: vi.fn(),
    findOverlapping: vi.fn(),
    getPendingRequestsByEmployee: vi.fn(),
    getAllRequests: vi.fn(),
    getRequestById: vi.fn(),
    updateStatus: vi.fn(),
    approveVacationWithDecrement: vi.fn(),
    revertVacationWithIncrement: vi.fn(),
    getByEmployee: vi.fn(),
  },
  mockEmpRepo: {
    findById: vi.fn(),
    findAll: vi.fn(),
  },
  mockNotificationService: {
    sendAbsenceRequested: vi.fn().mockResolvedValue(true),
    sendAbsenceStatusUpdated: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../../src/modules/attendance/absences/absence.repository.js', () => ({
  absenceRepository: mockAbsenceRepo,
  default: mockAbsenceRepo,
}));

vi.mock('../../../src/modules/employees/index.js', () => ({
  employeeRepository: mockEmpRepo,
}));

vi.mock('../../../src/modules/notifications/index.js', () => ({
  notificationService: mockNotificationService,
}));

import { absenceService } from '../../../src/modules/attendance/absences/absence.service.js';

describe('AbsenceService Domain Rules & Multi-Tenant Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe calcular saldo neto descontando solicitudes PENDING al previsualizar vacaciones', async () => {
    mockEmpRepo.findById.mockResolvedValueOnce({
      id: 'emp-1',
      tenantId: 'tenant-1',
      isActive: true,
      vacationDays: 10,
    });
    mockAbsenceRepo.findOverlapping.mockResolvedValueOnce(null);
    mockAbsenceRepo.getPendingRequestsByEmployee.mockResolvedValueOnce([
      {
        id: 'req-p1',
        type: 'Vacaciones',
        startDate: new Date('2027-01-05T12:00:00Z'),
        endDate: new Date('2027-01-09T12:00:00Z'), // 5 días pendientes
      },
    ]);

    const preview = await absenceService.previewVacationRequest({
      employeeId: 'emp-1',
      tenantId: 'tenant-1',
      startDate: '2027-02-01',
      endDate: '2027-02-04', // 4 días solicitados
      reason: 'Viaje familiar',
      allowPastDates: false,
    });

    expect(preview.daysRequested).toBe(4);
    expect(preview.pendingVacationDays).toBe(5);
    expect(preview.netAvailableBefore).toBe(5);
    expect(preview.projectedAvailableAfter).toBe(1);
  });

  it('debe rechazar si las solicitudes PENDING dejan saldo neto insuficiente', async () => {
    mockEmpRepo.findById.mockResolvedValueOnce({
      id: 'emp-1',
      tenantId: 'tenant-1',
      isActive: true,
      vacationDays: 8,
    });
    mockAbsenceRepo.findOverlapping.mockResolvedValueOnce(null);
    mockAbsenceRepo.getPendingRequestsByEmployee.mockResolvedValueOnce([
      {
        id: 'req-p1',
        type: 'Vacaciones',
        startDate: new Date('2027-01-10T12:00:00Z'),
        endDate: new Date('2027-01-14T12:00:00Z'), // 5 días pendientes -> net = 3
      },
    ]);

    await expect(
      absenceService.previewVacationRequest({
        employeeId: 'emp-1',
        tenantId: 'tenant-1',
        startDate: '2027-03-01',
        endDate: '2027-03-04', // 4 días solicitados > 3 netos
        reason: 'Vacaciones anuales',
        allowPastDates: false,
      })
    ).rejects.toThrow(/Saldo neto insuficiente/);
  });

  it('debe bloquear acceso cross-tenant cuando employee.tenantId no coincide con tenantId', async () => {
    mockEmpRepo.findById.mockResolvedValueOnce({
      id: 'emp-1',
      tenantId: 'tenant-B',
      isActive: true,
      vacationDays: 15,
    });

    await expect(
      absenceService.previewVacationRequest({
        employeeId: 'emp-1',
        tenantId: 'tenant-A',
        startDate: '2027-04-01',
        endDate: '2027-04-02',
        reason: 'Descanso',
      })
    ).rejects.toThrow(/no pertenece a la empresa activa/);
  });

  it('debe crear solicitud PENDING pasando tenantId del empleado a notifyAdminsOnAbsenceRequest', async () => {
    mockEmpRepo.findById.mockResolvedValue({
      id: 'emp-1',
      tenantId: 'tenant-A',
      firstName: 'Sofia',
      lastName: 'Rios',
      role: 'employee',
      isActive: true,
      vacationDays: 15,
    });
    mockEmpRepo.findAll.mockResolvedValueOnce([{ id: 'adm-1', role: 'admin', isActive: true }]);
    mockAbsenceRepo.findOverlapping.mockResolvedValueOnce(null);
    mockAbsenceRepo.getPendingRequestsByEmployee.mockResolvedValueOnce([]);
    mockAbsenceRepo.createRequest.mockResolvedValueOnce({
      id: 'req-new-1',
      status: 'PENDING',
    });

    const created = await absenceService.createRequest({
      employeeId: 'emp-1',
      tenantId: 'tenant-A',
      type: 'Vacaciones',
      startDate: '2027-05-10',
      endDate: '2027-05-12',
      reason: 'Descanso familiar',
      allowPastDates: false,
    });

    expect(created.id).toBe('req-new-1');
    expect(mockAbsenceRepo.findOverlapping).toHaveBeenCalledWith(
      'emp-1',
      expect.any(Date),
      expect.any(Date),
      'tenant-A'
    );
    expect(mockAbsenceRepo.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: 'emp-1',
        type: 'Vacaciones',
        status: 'PENDING',
      })
    );
  });
});
