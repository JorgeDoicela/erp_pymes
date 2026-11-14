import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => {
  const mock = {
    payroll: { findFirst: vi.fn(), update: vi.fn() },
    payrollDetail: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    employeeBenefit: { updateMany: vi.fn() },
    salaryAdvance: { findMany: vi.fn(), update: vi.fn() },
    $executeRawUnsafe: vi.fn(),
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation(async (callback) => callback(mock));
  return mock;
});

vi.mock('../../../src/database/db.js', () => ({ default: prismaMock }));

vi.mock('../../../src/modules/audit/index.js', () => ({
  auditRepository: {
    createLog: vi.fn().mockResolvedValue({}),
    log: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../src/modules/notifications/index.js', () => ({
  notificationService: { createNotification: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../../src/modules/signatures/index.js', () => ({
  qrSignatureService: { generateQrSignature: vi.fn() },
}));

import payrollCalculationService from '../../../src/modules/payroll/calculation/payrollCalculation.service.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../src/core/errors/appError.js';

const TENANT_A = 'tenant-A';
const TENANT_B = 'tenant-B';

const buildPayroll = (overrides = {}) => ({
  id: 'pay-1',
  tenantId: TENANT_A,
  status: 'APPROVED',
  period: new Date(2026, 9, 1),
  totalAmount: 0,
  details: [],
  ...overrides,
});

const buildDetail = (overrides = {}) => ({
  id: 'det-1',
  employeeId: 'emp-1',
  signatureData: '{}',
  employee: { id: 'emp-1', firstName: 'Ana', lastName: 'Torres' },
  payroll: { id: 'pay-1', tenantId: TENANT_A, status: 'APPROVED' },
  ...overrides,
});

describe('Nómina: máquina de estados DRAFT -> APPROVED -> PAID', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
  });

  describe('markAsPaid', () => {
    it('rechaza registrar el pago de una nómina en borrador', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(buildPayroll({ status: 'DRAFT' }));

      await expect(
        payrollCalculationService.markAsPaid('pay-1', 'admin-1', TENANT_A)
      ).rejects.toThrow(ConflictError);
      expect(prismaMock.payroll.update).not.toHaveBeenCalled();
    });

    it('rechaza registrar dos veces el pago de la misma nómina', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(buildPayroll({ status: 'PAID' }));

      await expect(
        payrollCalculationService.markAsPaid('pay-1', 'admin-1', TENANT_A)
      ).rejects.toThrow('La nómina ya fue registrada como pagada');
      expect(prismaMock.payroll.update).not.toHaveBeenCalled();
    });

    it('registra el pago de una nómina aprobada', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(buildPayroll());
      prismaMock.payroll.update.mockResolvedValue(buildPayroll({ status: 'PAID' }));

      const result = await payrollCalculationService.markAsPaid('pay-1', 'admin-1', TENANT_A);

      expect(result.status).toBe('PAID');
      expect(prismaMock.payroll.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: 'PAID', paymentDate: expect.any(Date) },
      });
    });

    it('responde 404 y no modifica nada si la nómina es de otra empresa', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(null);

      await expect(
        payrollCalculationService.markAsPaid('pay-1', 'admin-1', TENANT_B)
      ).rejects.toThrow(NotFoundError);
      expect(prismaMock.payroll.findFirst).toHaveBeenCalledWith({
        where: { id: 'pay-1', tenantId: TENANT_B },
      });
      expect(prismaMock.payroll.update).not.toHaveBeenCalled();
    });
  });

  describe('confirmPayroll', () => {
    it('rechaza volver a aprobar una nómina ya pagada (evita descontar anticipos dos veces)', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(buildPayroll({ status: 'PAID' }));

      await expect(
        payrollCalculationService.confirmPayroll('pay-1', 'admin-1', TENANT_A)
      ).rejects.toThrow(ConflictError);
      expect(prismaMock.salaryAdvance.update).not.toHaveBeenCalled();
      expect(prismaMock.payroll.update).not.toHaveBeenCalled();
    });

    it('cierra el anticipo sin abonar más que el saldo pendiente en la última cuota', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(
        buildPayroll({
          status: 'DRAFT',
          totalAmount: 500,
          details: [
            {
              id: 'det-1',
              employeeId: 'emp-1',
              netSalary: 500,
              bonuses: '[]',
              deductions: JSON.stringify([
                { name: 'Anticipo/Préstamo (Cuota 3/3)', amount: 66.67, advanceId: 'adv-1' },
              ]),
            },
          ],
        })
      );
      prismaMock.salaryAdvance.findMany.mockResolvedValue([
        { id: 'adv-1', amount: 200, installments: 3, paidInstallments: 2, paidAmount: 133.34 },
      ]);
      prismaMock.payroll.update.mockResolvedValue(buildPayroll());

      await payrollCalculationService.confirmPayroll('pay-1', null, TENANT_A);

      expect(prismaMock.salaryAdvance.update).toHaveBeenCalledWith({
        where: { id: 'adv-1' },
        data: { paidInstallments: 3, paidAmount: 200, status: 'PAID' },
      });
    });
  });

  describe('generateBankFile', () => {
    it('rechaza generar el archivo bancario de una nómina en borrador', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(buildPayroll({ status: 'DRAFT' }));

      await expect(payrollCalculationService.generateBankFile('pay-1', TENANT_A)).rejects.toThrow(
        ConflictError
      );
    });

    it('genera el CSV con BOM UTF-8 y montos a 2 decimales para una nómina aprobada', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(buildPayroll());

      const csv = await payrollCalculationService.generateBankFile('pay-1', TENANT_A);

      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(csv.slice(1)).toBe(
        'Identificacion,Beneficiario,Banco,TipoCuenta,NumeroCuenta,Monto,Detalle\n'
      );
    });

    it('permite regenerar el archivo de una nómina ya pagada', async () => {
      prismaMock.payroll.findFirst.mockResolvedValue(buildPayroll({ status: 'PAID' }));

      await expect(
        payrollCalculationService.generateBankFile('pay-1', TENANT_A)
      ).resolves.toContain('Identificacion,Beneficiario');
    });
  });
});

describe('Rol de pagos: firma y observación con aislamiento multi-tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const signArgs = { detailId: 'det-1', employeeId: 'emp-1', tenantId: TENANT_A };
  const disputeArgs = { ...signArgs, reason: 'El valor de horas extra no coincide' };

  it('busca el rol filtrando por la empresa del usuario autenticado', async () => {
    prismaMock.payrollDetail.findFirst.mockResolvedValue(buildDetail());
    prismaMock.payrollDetail.update.mockResolvedValue(buildDetail({ signatureStatus: 'SIGNED' }));

    await payrollCalculationService.signPayslip(signArgs);

    expect(prismaMock.payrollDetail.findFirst).toHaveBeenCalledWith({
      where: { id: 'det-1', payroll: { tenantId: TENANT_A } },
      include: { employee: true, payroll: true },
    });
  });

  it.each([
    ['firmar', () => payrollCalculationService.signPayslip({ ...signArgs, tenantId: TENANT_B })],
    [
      'observar',
      () => payrollCalculationService.disputePayslip({ ...disputeArgs, tenantId: TENANT_B }),
    ],
  ])('responde 404 al %s un rol de otra empresa', async (_action, execute) => {
    prismaMock.payrollDetail.findFirst.mockResolvedValue(null);

    await expect(execute()).rejects.toThrow(NotFoundError);
    expect(prismaMock.payrollDetail.update).not.toHaveBeenCalled();
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it.each([
    ['firmar', () => payrollCalculationService.signPayslip({ ...signArgs, tenantId: null })],
    [
      'observar',
      () => payrollCalculationService.disputePayslip({ ...disputeArgs, tenantId: null }),
    ],
  ])('rechaza %s un rol sin contexto de empresa', async (_action, execute) => {
    await expect(execute()).rejects.toThrow(ForbiddenError);
    expect(prismaMock.payrollDetail.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.payrollDetail.update).not.toHaveBeenCalled();
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it.each([
    ['firmar', () => payrollCalculationService.signPayslip(signArgs)],
    ['observar', () => payrollCalculationService.disputePayslip(disputeArgs)],
  ])('rechaza %s el rol de otro colaborador de la misma empresa', async (_action, execute) => {
    prismaMock.payrollDetail.findFirst.mockResolvedValue(buildDetail({ employeeId: 'emp-2' }));

    await expect(execute()).rejects.toThrow(ForbiddenError);
    expect(prismaMock.payrollDetail.update).not.toHaveBeenCalled();
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it.each([
    ['firmar', () => payrollCalculationService.signPayslip(signArgs)],
    ['observar', () => payrollCalculationService.disputePayslip(disputeArgs)],
  ])('rechaza %s un rol cuya nómina sigue en borrador', async (_action, execute) => {
    prismaMock.payrollDetail.findFirst.mockResolvedValue(
      buildDetail({ payroll: { id: 'pay-1', tenantId: TENANT_A, status: 'DRAFT' } })
    );

    await expect(execute()).rejects.toThrow(ConflictError);
    expect(prismaMock.payrollDetail.update).not.toHaveBeenCalled();
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it.each(['APPROVED', 'PAID'])('permite firmar un rol propio con nómina %s', async (status) => {
    prismaMock.payrollDetail.findFirst.mockResolvedValue(
      buildDetail({ payroll: { id: 'pay-1', tenantId: TENANT_A, status } })
    );
    prismaMock.payrollDetail.update.mockImplementation(async ({ data }) =>
      buildDetail({ ...data })
    );

    const result = await payrollCalculationService.signPayslip(signArgs);

    expect(result.signatureStatus).toBe('SIGNED');
    expect(prismaMock.payrollDetail.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it('registra la observación de un rol propio publicado', async () => {
    prismaMock.payrollDetail.findFirst.mockResolvedValue(buildDetail());
    prismaMock.payrollDetail.update.mockImplementation(async ({ data }) =>
      buildDetail({ ...data })
    );

    const result = await payrollCalculationService.disputePayslip(disputeArgs);

    expect(result.signatureStatus).toBe('DISPUTED');
    expect(result.disputeReason).toBe(disputeArgs.reason);
    expect(prismaMock.payrollDetail.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
  });
});
