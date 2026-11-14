import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptCoordinate } from '../../../src/core/security/encryption.js';

const { mockAttendanceRepo, mockEmpRepo, mockSysRepo, mockAuditRepo } = vi.hoisted(() => ({
  mockAttendanceRepo: {
    findByEmployeeAndDate: vi.fn(),
    createEntry: vi.fn(),
    updateExit: vi.fn(),
    updateBreak: vi.fn(),
    findActiveSchedule: vi.fn(),
    findFirst: vi.fn(),
  },
  mockEmpRepo: {
    findEmployeeForAttendance: vi.fn(),
    findById: vi.fn(),
    findByIdentityCard: vi.fn(),
  },
  mockSysRepo: {
    findByTenantId: vi.fn(),
    findGlobalDefault: vi.fn(),
  },
  mockAuditRepo: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../src/modules/attendance/tracking/attendance.repository.js', () => ({
  attendanceRepository: mockAttendanceRepo,
  default: mockAttendanceRepo,
}));

vi.mock('../../../src/modules/employees/index.js', () => ({
  employeeRepository: mockEmpRepo,
}));

vi.mock('../../../src/modules/system/index.js', () => ({
  systemRepository: mockSysRepo,
}));

vi.mock('../../../src/modules/audit/index.js', () => ({
  auditRepository: mockAuditRepo,
}));

import { attendanceService } from '../../../src/modules/attendance/index.js';

describe('Attendance Service & Geofencing Engine Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEmployee = {
    id: 'emp_att_1',
    identityCard: '1720000001',
    workLatitude: encryptCoordinate(-0.1806),
    workLongitude: encryptCoordinate(-78.4678),
    geofenceRadius: 200,
    enforceGeofence: true,
    trackingConsent: true,
    tenantId: 'tenant_1',
  };

  it('should register entry successfully when employee is within geofence radius', async () => {
    mockEmpRepo.findEmployeeForAttendance.mockResolvedValue(mockEmployee);
    mockSysRepo.findByTenantId.mockResolvedValue(null);
    mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);
    mockAttendanceRepo.findActiveSchedule.mockResolvedValue({
      shift: { startTime: '23:59', toleranceMinutes: 15 },
    });

    mockAttendanceRepo.createEntry.mockImplementation((data) =>
      Promise.resolve({
        id: 'att_rec_1',
        ...data,
      })
    );

    const location = { latitude: -0.1806, longitude: -78.4678 };
    const result = await attendanceService.registerAttendance(
      mockEmployee.id,
      'ENTRY',
      location,
      '192.168.1.100'
    );

    expect(result.message).toBe('Entrada registrada exitosamente');
    expect(result.record).toBeDefined();
    expect(result.record.status).toBe('Present');
    expect(result.record.isLate).toBe(false);
  });

  it('should flag entry as LATE when clock-in occurs after shift start time plus tolerance', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 10, 0, 0));

    try {
      mockEmpRepo.findEmployeeForAttendance.mockResolvedValue(mockEmployee);
      mockSysRepo.findByTenantId.mockResolvedValue(null);
      mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);
      mockAttendanceRepo.findActiveSchedule.mockResolvedValue({
        shift: { startTime: '01:00', toleranceMinutes: 10 },
      });

      mockAttendanceRepo.createEntry.mockImplementation((data) =>
        Promise.resolve({
          id: 'att_rec_1',
          ...data,
        })
      );

      const location = { latitude: -0.1806, longitude: -78.4678 };
      const result = await attendanceService.registerAttendance(
        mockEmployee.id,
        'ENTRY',
        location,
        '192.168.1.100'
      );

      expect(result.record.status).toBe('LATE');
      expect(result.record.isLate).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should reject entry when employee is outside geofence radius', async () => {
    mockEmpRepo.findEmployeeForAttendance.mockResolvedValue(mockEmployee);
    mockSysRepo.findByTenantId.mockResolvedValue(null);

    const distantLocation = { latitude: -0.2201, longitude: -78.5123 };

    await expect(
      attendanceService.registerAttendance(
        mockEmployee.id,
        'ENTRY',
        distantLocation,
        '192.168.1.100'
      )
    ).rejects.toThrow('Ubicación no permitida. Estás a');
  });

  it('should compute worked hours and deduct break duration on EXIT', async () => {
    mockEmpRepo.findEmployeeForAttendance.mockResolvedValue(mockEmployee);
    mockSysRepo.findByTenantId.mockResolvedValue(null);

    const checkInTime = new Date(Date.now() - 9 * 60 * 60 * 1000);
    const breakStart = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const breakEnd = new Date(Date.now() - 4 * 60 * 60 * 1000);

    mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue({
      id: 'att_rec_1',
      employeeId: mockEmployee.id,
      checkIn: checkInTime,
      breakStart,
      breakEnd,
      checkOut: null,
    });

    mockAttendanceRepo.findActiveSchedule.mockResolvedValue(null);

    mockAttendanceRepo.updateExit.mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
      })
    );

    const result = await attendanceService.registerAttendance(
      mockEmployee.id,
      'EXIT',
      { latitude: -0.1806, longitude: -78.4678 },
      '192.168.1.100'
    );

    expect(result.message).toBe('Salida registrada exitosamente');
    expect(result.workedHours).toBeCloseTo(8.0, 1);
  });

  it('should register break start and break end lifecycle properly', async () => {
    mockEmpRepo.findEmployeeForAttendance.mockResolvedValue(mockEmployee);
    mockSysRepo.findByTenantId.mockResolvedValue(null);

    const location = { latitude: -0.1806, longitude: -78.4678 };

    mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue({
      id: 'att_rec_1',
      checkIn: new Date(),
      checkOut: null,
      breakStart: null,
    });
    mockAttendanceRepo.updateBreak.mockResolvedValue({ id: 'att_rec_1', status: 'BREAK' });

    const breakStartRes = await attendanceService.registerAttendance(
      mockEmployee.id,
      'BREAK_START',
      location
    );
    expect(breakStartRes.message).toBe('Inicio de almuerzo registrado');

    mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue({
      id: 'att_rec_1',
      checkIn: new Date(),
      checkOut: null,
      breakStart: new Date(),
      breakEnd: null,
    });

    const breakEndRes = await attendanceService.registerAttendance(
      mockEmployee.id,
      'BREAK_END',
      location
    );
    expect(breakEndRes.message).toBe('Fin de almuerzo registrado');
  });

  it('should allow automatic EXIT when employee leaves geofence radius and autoGeofence is true', async () => {
    mockEmpRepo.findEmployeeForAttendance.mockResolvedValue(mockEmployee);
    mockSysRepo.findByTenantId.mockResolvedValue(null);

    const checkInTime = new Date(Date.now() - 8 * 60 * 60 * 1000);
    mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue({
      id: 'att_rec_auto_exit',
      employeeId: mockEmployee.id,
      checkIn: checkInTime,
      breakStart: null,
      breakEnd: null,
      checkOut: null,
    });
    mockAttendanceRepo.findActiveSchedule.mockResolvedValue(null);
    mockAttendanceRepo.updateExit.mockImplementation((id, data) =>
      Promise.resolve({ id, ...data })
    );

    const outsidePerimeterCoords = { latitude: -0.1845, longitude: -78.4678 };

    await expect(
      attendanceService.registerAttendance(
        mockEmployee.id,
        'EXIT',
        outsidePerimeterCoords,
        '192.168.1.100',
        false,
        { autoGeofence: false }
      )
    ).rejects.toThrow('Ubicación no permitida');

    const autoExitRes = await attendanceService.registerAttendance(
      mockEmployee.id,
      'EXIT',
      outsidePerimeterCoords,
      '192.168.1.100',
      false,
      { autoGeofence: true }
    );
    expect(autoExitRes.message).toBe('Salida registrada exitosamente');
    expect(autoExitRes.workedHours).toBeCloseTo(8.0, 1);
  });

  it('should expose decrypted geofence configuration and trackingConsent in getStatus', async () => {
    mockEmpRepo.findEmployeeForAttendance.mockResolvedValue({
      ...mockEmployee,
      firstName: 'Ana',
      lastName: 'Morales',
      position: 'Analista',
      department: 'Finanzas',
      biometricCredentials: [{ id: 'cred_1' }],
    });
    mockSysRepo.findByTenantId.mockResolvedValue(null);
    mockAttendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);
    mockAttendanceRepo.findActiveSchedule.mockResolvedValue(null);

    const statusRes = await attendanceService.getStatus(mockEmployee.id);
    expect(statusRes.status).toBe('NOT_STARTED');
    expect(statusRes.employee.hasBiometric).toBe(true);
    expect(statusRes.employee.trackingConsent).toBe(true);
    expect(statusRes.geofence.enabled).toBe(true);
    expect(statusRes.geofence.radius).toBe(200);
    expect(statusRes.geofence.targetLat).toBeCloseTo(-0.1806, 4);
    expect(statusRes.geofence.targetLng).toBeCloseTo(-78.4678, 4);
  });
});
