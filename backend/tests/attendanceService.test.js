import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attendanceService } from '../src/services/attendance/attendanceService.js';
import { attendanceRepository } from '../src/repositories/attendance/attendanceRepository.js';
import employeeRepository from '../src/repositories/employees/employeeRepository.js';
import prisma from '../src/database/db.js';
import { encryptCoordinate } from '../src/utils/encryption.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        employee: {
            findUnique: vi.fn()
        },
        systemSetting: {
            findFirst: vi.fn()
        },
        attendance: {
            findFirst: vi.fn(),
            update: vi.fn()
        },
        employeeSchedule: {
            findFirst: vi.fn()
        },
        auditLog: {
            create: vi.fn().mockResolvedValue({})
        }
    }
}));

vi.mock('../src/repositories/attendance/attendanceRepository.js', () => ({
    attendanceRepository: {
        findByEmployeeAndDate: vi.fn(),
        createEntry: vi.fn(),
        updateExit: vi.fn()
    }
}));

vi.mock('../src/repositories/employees/employeeRepository.js', () => ({
    default: {
        findById: vi.fn(),
        findByIdentityCard: vi.fn()
    }
}));

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
        tenantId: 'tenant_1'
    };

    it('should register entry successfully when employee is within geofence radius', async () => {
        prisma.employee.findUnique.mockResolvedValue(mockEmployee);
        prisma.systemSetting.findFirst.mockResolvedValue(null);
        attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
        prisma.employeeSchedule.findFirst.mockResolvedValue({
            shift: { startTime: '23:59', toleranceMinutes: 15 } // Future shift -> on time
        });

        attendanceRepository.createEntry.mockImplementation(data => Promise.resolve({
            id: 'att_rec_1',
            ...data
        }));

        // Coordinate matches exactly
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
        prisma.employee.findUnique.mockResolvedValue(mockEmployee);
        prisma.systemSetting.findFirst.mockResolvedValue(null);
        attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
        prisma.employeeSchedule.findFirst.mockResolvedValue({
            shift: { startTime: '01:00', toleranceMinutes: 10 } // Past shift -> late
        });

        attendanceRepository.createEntry.mockImplementation(data => Promise.resolve({
            id: 'att_rec_1',
            ...data
        }));

        const location = { latitude: -0.1806, longitude: -78.4678 };
        const result = await attendanceService.registerAttendance(
            mockEmployee.id,
            'ENTRY',
            location,
            '192.168.1.100'
        );

        expect(result.record.status).toBe('LATE');
        expect(result.record.isLate).toBe(true);
    });

    it('should reject entry when employee is outside geofence radius', async () => {
        prisma.employee.findUnique.mockResolvedValue(mockEmployee);
        prisma.systemSetting.findFirst.mockResolvedValue(null);

        // Location ~3 km away in Quito
        const distantLocation = { latitude: -0.2201, longitude: -78.5123 };

        await expect(attendanceService.registerAttendance(
            mockEmployee.id,
            'ENTRY',
            distantLocation,
            '192.168.1.100'
        )).rejects.toThrow('Ubicación no permitida. Estás a');
    });

    it('should compute worked hours and deduct break duration on EXIT', async () => {
        prisma.employee.findUnique.mockResolvedValue(mockEmployee);
        prisma.systemSetting.findFirst.mockResolvedValue(null);

        const checkInTime = new Date(Date.now() - 9 * 60 * 60 * 1000); // 9 hours ago
        const breakStart = new Date(Date.now() - 5 * 60 * 60 * 1000);  // 5 hours ago
        const breakEnd = new Date(Date.now() - 4 * 60 * 60 * 1000);    // 4 hours ago (1 hr break)

        attendanceRepository.findByEmployeeAndDate.mockResolvedValue({
            id: 'att_rec_1',
            employeeId: mockEmployee.id,
            checkIn: checkInTime,
            breakStart,
            breakEnd,
            checkOut: null
        });

        prisma.employeeSchedule.findFirst.mockResolvedValue(null);

        attendanceRepository.updateExit.mockImplementation((id, data) => Promise.resolve({
            id,
            ...data
        }));

        const result = await attendanceService.registerAttendance(
            mockEmployee.id,
            'EXIT',
            { latitude: -0.1806, longitude: -78.4678 },
            '192.168.1.100'
        );

        expect(result.message).toBe('Salida registrada exitosamente');
        // 9 hours total - 1 hour break = 8 hours worked
        expect(result.workedHours).toBeCloseTo(8.00, 1);
    });

    it('should register break start and break end lifecycle properly', async () => {
        prisma.employee.findUnique.mockResolvedValue(mockEmployee);
        prisma.systemSetting.findFirst.mockResolvedValue(null);

        const location = { latitude: -0.1806, longitude: -78.4678 };

        // 1. Start break
        attendanceRepository.findByEmployeeAndDate.mockResolvedValue({
            id: 'att_rec_1',
            checkIn: new Date(),
            checkOut: null,
            breakStart: null
        });

        prisma.attendance.update.mockResolvedValue({ id: 'att_rec_1', status: 'BREAK' });

        const breakStartRes = await attendanceService.registerAttendance(mockEmployee.id, 'BREAK_START', location);
        expect(breakStartRes.message).toBe('Inicio de almuerzo registrado');

        // 2. End break
        attendanceRepository.findByEmployeeAndDate.mockResolvedValue({
            id: 'att_rec_1',
            checkIn: new Date(),
            checkOut: null,
            breakStart: new Date(),
            breakEnd: null
        });

        const breakEndRes = await attendanceService.registerAttendance(mockEmployee.id, 'BREAK_END', location);
        expect(breakEndRes.message).toBe('Fin de almuerzo registrado');
    });
});
