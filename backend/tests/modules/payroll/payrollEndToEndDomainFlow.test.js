import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => {
  const mock = {
    payrollConfig: { findFirst: vi.fn() },
    payroll: { findFirst: vi.fn(), create: vi.fn() },
    employee: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    employeeSchedule: { findMany: vi.fn() },
    employeeBenefit: { findMany: vi.fn(), createMany: vi.fn() },
    salaryAdvance: { findMany: vi.fn() },
    absenceRequest: { findMany: vi.fn() },
    journalEntry: { findFirst: vi.fn(), create: vi.fn() },
    journalLine: { findMany: vi.fn() },
    accountingAccount: { findMany: vi.fn() },
    costCenter: { findMany: vi.fn() },
    $executeRawUnsafe: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation(async (cb) => cb(mock));
  return mock;
});

vi.mock('../../../src/database/db.js', () => ({ default: prismaMock }));

vi.mock('../../../src/modules/audit/index.js', () => ({
  auditRepository: {
    createLog: vi.fn().mockResolvedValue({}),
    log: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../src/modules/signatures/index.js', () => ({
  qrSignatureService: {
    generateQrSignature: vi.fn().mockResolvedValue({
      verificationCode: 'SIG-001',
      token: 'tok-001',
      qrDataUrl: 'data:image/png;base64,00',
      verificationUrl: 'https://normaerp.ec/v/SIG-001',
      docHash: 'hash-001',
    }),
  },
}));

import { computeExitMetrics } from '../../../src/modules/attendance/tracking/attendance.service.js';
import {
  evaluateAttendanceRecordMetrics,
  computeEmployeePayrollBreakdown,
} from '../../../src/modules/payroll/calculation/payrollDomainRules.helper.js';
import payrollCalculationService from '../../../src/modules/payroll/calculation/payrollCalculation.service.js';
import employeeBenefitService from '../../../src/modules/payroll/benefits/employeeBenefit.service.js';
import accountingService from '../../../src/modules/accounting/accounting.service.js';
import { encryptSalary } from '../../../src/core/security/encryption.js';
import { financial } from '../../../src/core/utils/financialUtils.js';

describe('Flujo E2E Nómina, Asistencias, Ausencias, Beneficios y Contabilidad (Issue #15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Asistencias, Turnos, Horas Extra (50% y 100%) y Recargo Nocturno (25%)', () => {
    it('elimina falsos positivos de horas extra cuando el colaborador entra 2h tarde y sale 1h después del fin de turno', () => {
      const checkIn = new Date(2026, 9, 5, 10, 0, 0); // Entró 10:00 (2h tarde respecto a 08:00)
      const checkOut = new Date(2026, 9, 5, 18, 0, 0); // Salió 18:00 (1h después de 17:00), trabajó 7h netas con 1h almuerzo
      const existingRecord = {
        checkIn,
        breakStart: new Date(2026, 9, 5, 13, 0, 0),
        breakEnd: new Date(2026, 9, 5, 14, 0, 0),
      };
      const activeSchedule = {
        shift: { startTime: '08:00', endTime: '17:00', breakMinutes: 60 },
      };

      const exitMetrics = computeExitMetrics(checkOut, existingRecord, activeSchedule);
      expect(exitMetrics.workedHours).toBe(7);
      expect(exitMetrics.overtimeHours).toBeUndefined();

      // Incluso si un registro histórico tuviese overtimeHours: 1, el motor de nómina lo corrige contra workedHours <= expectedHours
      const payrollMetrics = evaluateAttendanceRecordMetrics({
        rec: {
          date: new Date(2026, 9, 5),
          checkIn,
          checkOut,
          workedHours: 7,
          overtimeHours: 1,
        },
        schedules: [
          {
            startDate: new Date(2026, 0, 1),
            endDate: null,
            shift: activeSchedule.shift,
          },
        ],
        hourlyRate: financial.from(5),
      });

      expect(payrollMetrics.dailyOvertime.toNumber()).toBe(0);
      expect(payrollMetrics.overtimeCost.toNumber()).toBe(0);
      expect(payrollMetrics.undertimeHours.toNumber()).toBe(1);
    });

    it('separa horas suplementarias (50% hasta 24h00) y extraordinarias (100% de 24h00 a 06h00) en días hábiles', () => {
      // Lunes 2026-10-05: Turno 14:00 a 22:00 (0 min break = 8h). Trabajó de 14:00 a 02:00 del martes (12h -> 4h extra: 2h antes de medianoche al 50%, 2h en madrugada al 100%)
      const recDate = new Date(2026, 9, 5, 12, 0, 0);
      const checkIn = new Date(2026, 9, 5, 14, 0, 0);
      const checkOut = new Date(2026, 9, 6, 2, 0, 0);

      const metrics = evaluateAttendanceRecordMetrics({
        rec: { date: recDate, checkIn, checkOut, workedHours: 12 },
        schedules: [
          {
            startDate: new Date(2026, 0, 1),
            endDate: null,
            shift: { startTime: '14:00', endTime: '22:00', breakMinutes: 0 },
          },
        ],
        hourlyRate: financial.from(10),
        hasNightSurcharge: true,
        hasDoubleOvertime: true,
      });

      expect(metrics.dailyOvertime.toNumber()).toBe(4);
      expect(metrics.supplementaryHours50.toNumber()).toBe(2);
      expect(metrics.extraordinaryHours100.toNumber()).toBe(2);
      // Costo HE: (2h * $10 * 1.5) + (2h * $10 * 2.0) = $30 + $40 = $70
      expect(metrics.overtimeCost.toNumber()).toBe(70);
      // Horas nocturnas (19:00 a 02:00 = 7h) * $10 * 0.25 = $17.50
      expect(metrics.nightHours.toNumber()).toBe(7);
      expect(metrics.nightSurcharge.toNumber()).toBe(17.5);
    });
  });

  describe('2. Ausencias, Vacaciones y Permisos Médicos (AbsenceRequest -> Nómina)', () => {
    const baseConfig = { workingDays: 30, items: [] };
    const startDate = new Date(Date.UTC(2026, 9, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(2026, 9, 31, 23, 59, 59));

    it('mantiene remuneradas las vacaciones aprobadas aunque existan registros de Falta en esos días', () => {
      const breakdown = computeEmployeePayrollBreakdown({
        emp: { id: 'emp-1', hireDate: new Date(2024, 0, 1) },
        contract: { salary: 900, startDate: new Date(2024, 0, 1) },
        config: baseConfig,
        records: [
          { date: new Date(Date.UTC(2026, 9, 10, 12, 0, 0)), status: 'Falta', workedHours: 0 },
          { date: new Date(Date.UTC(2026, 9, 11, 12, 0, 0)), status: 'Falta', workedHours: 0 },
        ],
        approvedAbsences: [
          {
            type: 'Vacaciones Anuales',
            status: 'APPROVED',
            startDate: new Date(Date.UTC(2026, 9, 10)),
            endDate: new Date(Date.UTC(2026, 9, 14)),
          },
        ],
        startDate,
        endDate,
      });

      expect(breakdown.workedDays).toBe(30);
      expect(breakdown.roundedBaseSalary).toBe(900);
    });

    it('descuenta días de Permiso Sin Sueldo aprobado sin duplicar faltas del mismo día', () => {
      const breakdown = computeEmployeePayrollBreakdown({
        emp: { id: 'emp-1', hireDate: new Date(2024, 0, 1) },
        contract: { salary: 900, startDate: new Date(2024, 0, 1) },
        config: baseConfig,
        records: [
          { date: new Date(Date.UTC(2026, 9, 5, 12, 0, 0)), status: 'Falta', workedHours: 0 },
        ],
        approvedAbsences: [
          {
            type: 'Permiso Sin Sueldo',
            status: 'APPROVED',
            startDate: new Date(Date.UTC(2026, 9, 5)),
            endDate: new Date(Date.UTC(2026, 9, 7)), // 3 días: 5, 6 y 7
          },
        ],
        startDate,
        endDate,
      });

      expect(breakdown.workedDays).toBe(27);
      expect(breakdown.roundedBaseSalary).toBe(810);
    });

    it('aplica regla legal IESS en Permiso Médico: primeros 3 días empleador y desde el 4to día descuento del 75% de subsidio IESS', () => {
      // Sueldo $900 -> $30/día. Permiso médico de 5 días (del 10 al 14): 3 días al 100%, 2 días subsidiados al 75% ($30 * 2 * 0.75 = $45.00 deducción subsidio IESS)
      const breakdown = computeEmployeePayrollBreakdown({
        emp: { id: 'emp-1', hireDate: new Date(2024, 0, 1) },
        contract: { salary: 900, startDate: new Date(2024, 0, 1) },
        config: baseConfig,
        records: [
          { date: new Date(Date.UTC(2026, 9, 10, 12, 0, 0)), status: 'Falta', workedHours: 0 },
        ],
        approvedAbsences: [
          {
            type: 'Permiso Médico IESS',
            status: 'APPROVED',
            startDate: new Date(Date.UTC(2026, 9, 10)),
            endDate: new Date(Date.UTC(2026, 9, 14)),
          },
        ],
        startDate,
        endDate,
      });

      expect(breakdown.workedDays).toBe(30);
      expect(breakdown.roundedBaseSalary).toBe(900);
      expect(breakdown.employeeDeductions).toContainEqual({
        name: 'Subsidio IESS Enfermedad (2d al 75%)',
        amount: 45,
      });
      expect(breakdown.finalNetSalary).toBe(855);
    });
  });

  describe('3. Beneficios, Cifrado de Salario y Fondos de Reserva (Art. 196 CT)', () => {
    it('desencripta correctamente emp.salary en bulkCreate cuando el empleado no tiene salario en contrato', async () => {
      const encryptedSalary = encryptSalary(1200);
      prismaMock.employee.findMany.mockResolvedValue([
        {
          id: 'emp-enc',
          firstName: 'Carlos',
          lastName: 'Vega',
          hireDate: new Date('2023-01-01'),
          salary: encryptedSalary,
          contracts: [],
        },
      ]);
      prismaMock.employeeBenefit.createMany.mockResolvedValue({ count: 1 });

      const result = await employeeBenefitService.bulkCreate(
        {
          employeeIds: ['emp-enc'],
          name: 'Fondo de Reserva Mensual',
          type: 'OTHER',
          frequency: 'RECURRING',
          isSpecialCalculation: 'FONDO_RESERVA',
        },
        'tenant-1'
      );

      expect(result.count).toBe(1);
      expect(prismaMock.employeeBenefit.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            employeeId: 'emp-enc',
            amount: 100, // 1200 / 12
          }),
        ],
      });
    });

    it('omite Fondos de Reserva en generatePayroll para colaboradores con menos de 1 año de antigüedad y lo calcula sobre materia gravada para >= 1 año', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(null);
      prismaMock.payrollConfig.findFirst.mockResolvedValue({
        id: 'cfg-1',
        workingDays: 30,
        items: [
          { name: 'Fondos de Reserva', type: 'EARNING', percentage: 8.333333, fixedValue: null },
          { name: 'Aporte Personal IESS', type: 'DEDUCTION', percentage: 9.45, fixedValue: null },
        ],
      });
      prismaMock.employee.findMany.mockResolvedValue([
        {
          id: 'emp-senior',
          firstName: 'Ana',
          lastName: 'Senior',
          identityCard: '1710000001',
          hireDate: new Date('2023-01-10'),
          contracts: [{ salary: 1200, startDate: new Date('2023-01-10'), status: 'Active' }],
        },
        {
          id: 'emp-junior',
          firstName: 'Luis',
          lastName: 'Junior',
          identityCard: '1710000002',
          hireDate: new Date('2026-06-01'),
          contracts: [{ salary: 1200, startDate: new Date('2026-06-01'), status: 'Active' }],
        },
      ]);
      prismaMock.attendance.findMany.mockResolvedValue([]);
      prismaMock.employeeSchedule.findMany.mockResolvedValue([]);
      prismaMock.employeeBenefit.findMany.mockResolvedValue([]);
      prismaMock.salaryAdvance.findMany.mockResolvedValue([]);
      prismaMock.absenceRequest.findMany.mockResolvedValue([]);
      prismaMock.payroll.create.mockImplementation(async ({ data }) => ({
        id: 'pay-oct',
        ...data,
        details: data.details.create,
      }));

      const created = await payrollCalculationService.generatePayroll(10, 2026, null, 'tenant-1');
      const seniorDetail = created.details.find((d) => d.employeeId === 'emp-senior');
      const juniorDetail = created.details.find((d) => d.employeeId === 'emp-junior');

      const seniorBonuses = JSON.parse(seniorDetail.bonuses);
      const juniorBonuses = JSON.parse(juniorDetail.bonuses);

      expect(seniorBonuses).toContainEqual({ name: 'Fondos de Reserva', amount: 100 });
      expect(juniorBonuses).toEqual([]);
      expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('4. Integración Contable con Decimal.js (Partida Doble Exacta)', () => {
    it('integra una nómina aprobada usando Decimal.js sin errores de punto flotante y cuadrando DEBE === HABER', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue({
        id: 'pay-1',
        status: 'APPROVED',
        period: new Date(2026, 9, 1),
        details: [
          {
            baseSalary: 1000.1,
            overtimeAmount: 55.25,
            bonuses: JSON.stringify([{ name: 'Bono', amount: 44.65 }]),
            deductions: JSON.stringify([{ name: 'IESS', amount: 103.95 }]),
            netSalary: 996.05,
            employee: { department: 'Ventas', firstName: 'Ana', lastName: 'Paz' },
          },
          {
            baseSalary: 850.2,
            overtimeAmount: 19.8,
            bonuses: JSON.stringify([{ name: 'Bono', amount: 30.0 }]),
            deductions: JSON.stringify([{ name: 'IESS', amount: 85.05 }]),
            netSalary: 814.95,
            employee: { department: 'Ventas', firstName: 'Leo', lastName: 'Ríos' },
          },
        ],
      });
      prismaMock.journalEntry.findFirst.mockResolvedValue(null);
      prismaMock.accountingAccount.findMany.mockResolvedValue([
        { id: 'acc-511', code: '5.1.1' },
        { id: 'acc-512', code: '5.1.2' },
        { id: 'acc-513', code: '5.1.3' },
        { id: 'acc-211', code: '2.1.1' },
        { id: 'acc-212', code: '2.1.2' },
      ]);
      prismaMock.costCenter.findMany.mockResolvedValue([
        { id: 'cc-ventas', name: 'Ventas', code: 'VTA', isActive: true },
      ]);
      prismaMock.journalEntry.create.mockImplementation(async ({ data }) => ({
        id: 'je-1',
        ...data,
      }));

      const res = await accountingService.integratePayroll({
        payrollId: 'pay-1',
        tenantId: 'tenant-1',
        user: { id: 'admin-1' },
      });

      expect(res.entryId).toBe('je-1');
      const createdPayload = prismaMock.journalEntry.create.mock.calls[0][0].data;
      expect(createdPayload.totalDebit).toBe(2000);
      expect(createdPayload.totalCredit).toBe(2000);
      expect(createdPayload.totalDebit).toBe(createdPayload.totalCredit);
    });
  });
});
