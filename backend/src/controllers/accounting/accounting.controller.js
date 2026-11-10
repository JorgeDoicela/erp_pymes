/**
 * @file accounting.controller.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import accountingRepository from '../../repositories/accounting/accountingRepository.js';
import auditRepository from '../../repositories/audit/auditRepository.js';
import { financial } from '../../utils/financialUtils.js';

// Helper para obtener tenantId de la petición
const getTenantId = (req) => req.tenantId || req.user?.tenantId || null;

// ==========================================
// 1. Accounting Periods (Periodos Contables)
// ==========================================

export const getPeriods = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const periods = await accountingRepository.getPeriods(tenantId);
    res.status(200).json(periods);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching periods', error: error.message });
  }
};

export const createPeriod = async (req, res) => {
  try {
    const { year, month, startDate, endDate } = req.body;
    const tenantId = getTenantId(req);

    // Validar si ya existe en la empresa actual
    const existing = await accountingRepository.findPeriodByMonthYear(year, month, tenantId);

    if (existing) {
      return res.status(400).json({ message: 'El periodo ya existe.' });
    }

    const period = await accountingRepository.createPeriod({
      tenantId,
      year: parseInt(year),
      month: parseInt(month),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'OPEN',
    });

    auditRepository
      .createLog({
        entity: 'AccountingPeriod',
        entityId: period.id,
        action: 'CREATE',
        performedBy: req.user?.id || 'Admin',
        details: `Periodo creado: ${month}/${year}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(201).json(period);
  } catch (error) {
    res.status(500).json({ message: 'Error creating period', error: error.message });
  }
};

export const togglePeriodStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const period = await accountingRepository.findPeriodById(id);

    if (!period) return res.status(404).json({ message: 'Periodo no encontrado' });

    const updated = await accountingRepository.updatePeriod(id, {
      status: period.status === 'OPEN' ? 'CLOSED' : 'OPEN',
    });

    auditRepository
      .createLog({
        entity: 'AccountingPeriod',
        entityId: id,
        action: 'UPDATE',
        performedBy: req.user?.id || 'Admin',
        details: `Estado cambiado a ${updated.status}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating period', error: error.message });
  }
};

export const deletePeriod = async (req, res) => {
  try {
    const { id } = req.params;
    await accountingRepository.deletePeriod(id);
    res.status(200).json({ message: 'Periodo eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting period', error: error.message });
  }
};

// ==========================================
// 2. Chart of Accounts (Catálogo de Cuentas)
// ==========================================

export const getAccounts = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const accounts = await accountingRepository.getAccounts(tenantId);
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts', error: error.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { code, name, description, type, level, isTransactional, parentId } = req.body;
    const tenantId = getTenantId(req);

    const existing = await accountingRepository.findAccountByCode(code, tenantId);
    if (existing) return res.status(400).json({ message: 'El código de cuenta ya existe.' });

    const account = await accountingRepository.createAccount({
      tenantId,
      code,
      name,
      description,
      type,
      level: parseInt(level),
      isTransactional,
      parentId: parentId || null,
    });
    auditRepository
      .createLog({
        entity: 'AccountingAccount',
        entityId: account.id,
        action: 'CREATE',
        performedBy: req.user?.id || 'Admin',
        details: `Cuenta creada: ${code} - ${name} (${type})`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error creating account', error: error.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isTransactional } = req.body;
    const updated = await accountingRepository.updateAccount(id, {
      name,
      description,
      isTransactional,
    });

    auditRepository
      .createLog({
        entity: 'AccountingAccount',
        entityId: id,
        action: 'UPDATE',
        performedBy: req.user?.id || 'Admin',
        details: `Cuenta actualizada: ${updated.code}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating account', error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const hasChildren = await accountingRepository.countSubAccounts(id);
    if (hasChildren > 0)
      return res.status(400).json({ message: 'No se puede eliminar una cuenta con sub-cuentas.' });

    const hasMovements = await accountingRepository.countAccountMovements(id);
    if (hasMovements > 0)
      return res
        .status(400)
        .json({ message: 'No se puede eliminar una cuenta que ya tiene movimientos contables.' });

    await accountingRepository.deleteAccount(id);

    auditRepository
      .createLog({
        entity: 'AccountingAccount',
        entityId: id,
        action: 'DELETE',
        performedBy: req.user?.id || 'Admin',
        details: `Cuenta eliminada: ID ${id}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(200).json({ message: 'Cuenta eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
};

// ==========================================
// 3. Cost Centers (Centros de Costo)
// ==========================================

export const getCostCenters = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const centers = await accountingRepository.getCostCenters(tenantId);
    res.status(200).json(centers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cost centers', error: error.message });
  }
};

export const createCostCenter = async (req, res) => {
  try {
    const { code, name, description } = req.body;
    const tenantId = getTenantId(req);
    const existing = await accountingRepository.findCostCenterByCode(code, tenantId);
    if (existing)
      return res.status(400).json({ message: 'El código de centro de costo ya existe.' });

    const center = await accountingRepository.createCostCenter({
      tenantId,
      code,
      name,
      description,
    });
    res.status(201).json(center);
  } catch (error) {
    res.status(500).json({ message: 'Error creating cost center', error: error.message });
  }
};

export const updateCostCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await accountingRepository.updateCostCenter(id, { name, description });

    auditRepository
      .createLog({
        entity: 'CostCenter',
        entityId: id,
        action: 'UPDATE',
        performedBy: req.user?.id || 'Admin',
        details: `Centro de costo actualizado: ${updated.code}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cost center', error: error.message });
  }
};

export const deleteCostCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const hasMovements = await accountingRepository.countCostCenterMovements(id);
    if (hasMovements > 0)
      return res
        .status(400)
        .json({ message: 'No se puede eliminar un centro de costo con movimientos registrados.' });

    await accountingRepository.deleteCostCenter(id);

    auditRepository
      .createLog({
        entity: 'CostCenter',
        entityId: id,
        action: 'DELETE',
        performedBy: req.user?.id || 'Admin',
        details: `Centro de costo eliminado: ID ${id}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(200).json({ message: 'Centro de costo eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting cost center', error: error.message });
  }
};

// ==========================================
// 4. Journal Entries (Asientos Contables)
// ==========================================

export const getJournalEntries = async (req, res) => {
  try {
    const { periodId, limit } = req.query;
    const tenantId = getTenantId(req);
    const where = tenantId ? { tenantId } : {};

    if (periodId && periodId !== 'undefined') {
      const period = await accountingRepository.findPeriodById(periodId, tenantId);
      if (period) {
        where.date = {
          gte: period.startDate,
          lte: period.endDate,
        };
      }
    }

    const maxTake = limit ? parseInt(limit) : 150;
    const entries = await accountingRepository.getJournalEntries(where, maxTake);
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching journals', error: error.message });
  }
};

export const createJournalEntry = async (req, res) => {
  try {
    const { entryNumber, date, description, type, lines, referenceModule, referenceId } = req.body;
    const tenantId = getTenantId(req);

    // 1. Validar Cuadratura Perfecta usando la utilidad financiera
    const totalDebitFin = lines.reduce(
      (acc, line) => acc.plus(financial.from(line.debit || 0)),
      financial.from(0)
    );
    const totalCreditFin = lines.reduce(
      (acc, line) => acc.plus(financial.from(line.credit || 0)),
      financial.from(0)
    );

    if (!totalDebitFin.equals(totalCreditFin)) {
      return res.status(400).json({
        message: `El asiento está descuadrado. El total AL DEBE (${totalDebitFin.toFixed(2)}) debe ser igual al total AL HABER (${totalCreditFin.toFixed(2)}).`,
      });
    }

    // 2. Validar Periodo Abierto
    const entryDate = new Date(date);
    const period = await accountingRepository.findOpenPeriodByDate(entryDate, tenantId);

    if (!period) {
      return res
        .status(400)
        .json({ message: 'No hay un periodo abierto para la fecha seleccionada.' });
    }

    // 3. Crear Asiento y Líneas Transaccionalmente vía Repositorio
    const result = await accountingRepository.createJournalEntryWithLines(
      {
        tenantId,
        entryNumber,
        date: entryDate,
        description,
        type,
        status: 'DRAFT',
        totalDebit: financial.round(totalDebitFin),
        totalCredit: financial.round(totalCreditFin),
        referenceModule,
        referenceId,
      },
      lines
    );

    auditRepository
      .createLog({
        entity: 'JournalEntry',
        entityId: result.id,
        action: 'CREATE',
        performedBy: req.user?.id || 'Admin',
        details: `Asiento creado: ${entryNumber} por $${financial.round(totalDebitFin)}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error creating journal entry', error: error.message });
  }
};

export const postJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscar el asiento con sus líneas vía Repositorio
    const entry = await accountingRepository.findJournalEntryById(id);

    if (!entry) {
      return res.status(404).json({ message: 'Asiento no encontrado.' });
    }

    // 2. Validar que esté en BORRADOR (DRAFT)
    if (entry.status !== 'DRAFT') {
      return res.status(400).json({
        message: `No se puede mayorizar un asiento que ya está en estado ${entry.status}.`,
      });
    }

    // 3. Validar que el periodo contable para la fecha del asiento esté ABIERTO
    const entryDate = new Date(entry.date);
    const period = await accountingRepository.findOpenPeriodByDate(entryDate);

    if (!period) {
      return res.status(400).json({
        message: `El periodo contable (${entryDate.getMonth() + 1}/${entryDate.getFullYear()}) está CERRADO o no existe. No se permiten mayorizaciones en periodos cerrados.`,
      });
    }

    // 4. Actualizar estado a POSTED (Mayorizado) vía Repositorio
    const updatedEntry = await accountingRepository.updateJournalEntryStatus(id, 'POSTED');

    auditRepository
      .createLog({
        entity: 'JournalEntry',
        entityId: id,
        action: 'CONFIRM',
        performedBy: req.user?.id || 'Admin',
        details: `Asiento mayorizado: ${updatedEntry.entryNumber}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(200).json({
      message: 'Asiento mayorizado exitosamente. Los saldos han sido afectados.',
      entry: updatedEntry,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al mayorizar asiento', error: error.message });
  }
};

export const deleteJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await accountingRepository.findJournalEntryById(id);
    if (!entry) return res.status(404).json({ message: 'Asiento no encontrado' });
    if (entry.status === 'POSTED')
      return res.status(400).json({ message: 'No se puede eliminar un asiento ya mayorizado.' });

    await accountingRepository.deleteJournalEntry(id);

    auditRepository
      .createLog({
        entity: 'JournalEntry',
        entityId: id,
        action: 'DELETE',
        performedBy: req.user?.id || 'Admin',
        details: `Asiento eliminado: ID ${id}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.status(200).json({ message: 'Asiento eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting journal entry', error: error.message });
  }
};

export const getTrialBalance = async (req, res) => {
  try {
    const { periodId } = req.query;
    const where = {
      journalEntry: {
        status: 'POSTED',
      },
    };

    // Mejora: Filtro por fecha basado en el periodo para mayor precisión
    if (periodId && periodId !== 'undefined') {
      const period = await accountingRepository.findPeriodById(periodId);
      if (period) {
        where.journalEntry.date = {
          gte: period.startDate,
          lte: period.endDate,
        };
      }
    }

    const lines = await accountingRepository.getTrialBalanceLines(where);

    // Sumarizar por ID de cuenta
    const sums = {};
    lines.forEach((line) => {
      if (!sums[line.accountId]) {
        sums[line.accountId] = {
          account: line.account,
          debit: 0,
          credit: 0,
        };
      }
      sums[line.accountId].debit += line.debit;
      sums[line.accountId].credit += line.credit;
    });

    const result = Object.values(sums).map((item) => {
      const isDebitNature = ['ASSET', 'EXPENSE'].includes(item.account.type);
      let balance = 0;
      if (isDebitNature) {
        balance = item.debit - item.credit;
      } else {
        balance = item.credit - item.debit;
      }
      return {
        id: item.account.id,
        code: item.account.code,
        name: item.account.name,
        totalDebits: item.debit,
        totalCredits: item.credit,
        balance,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error generating trial balance', error: error.message });
  }
};

export const getGeneralLedger = async (req, res) => {
  try {
    const { accountId, periodId, costCenterId } = req.query;
    // Al menos uno de los dos filtros principales debe estar presente
    if (!accountId && !costCenterId)
      return res.status(400).json({ message: 'AccountId or CostCenterId is required' });

    const where = {
      journalEntry: {
        status: 'POSTED',
      },
    };

    if (accountId) where.accountId = accountId;
    if (costCenterId) where.costCenterId = costCenterId;

    if (periodId && periodId !== 'undefined') {
      const period = await accountingRepository.findPeriodById(periodId);
      if (period) {
        where.journalEntry.date = {
          gte: period.startDate,
          lte: period.endDate,
        };
      }
    }

    const movements = await accountingRepository.getGeneralLedgerLines(where);

    res.status(200).json(movements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching general ledger', error: error.message });
  }
};

// --- INTEGRACIÓN CON OTROS MÓDULOS ---

export const integratePayroll = async (req, res) => {
  const { payrollId } = req.body;
  const tenantId = getTenantId(req);

  try {
    // 1. Obtener la nómina con detalles y departamentos de empleados con aislamiento de tenant vía Repositorio
    const payroll = await accountingRepository.getPayrollForIntegration(payrollId, tenantId);

    if (!payroll) return res.status(404).json({ message: 'Nómina no encontrada' });
    if (payroll.status === 'DRAFT')
      return res.status(400).json({ message: 'La nómina debe estar APROBADA para contabilizarse' });

    // 2. Verificar si ya existe un asiento para esta nómina vía Repositorio
    const existingEntry = await accountingRepository.findJournalEntryByReference(
      'PAYROLL',
      payrollId,
      tenantId
    );
    if (existingEntry)
      return res
        .status(400)
        .json({ message: 'Esta nómina ya ha sido contabilizada', entryId: existingEntry.id });

    // 3. Obtener Cuentas Contables y Centros de Costo filtradas por Tenant vía Repositorio
    const [accounts, allCostCenters] = await Promise.all([
      accountingRepository.findAccountsByCodes(
        ['5.1.1', '5.1.2', '5.1.3', '2.1.1', '2.1.2'],
        tenantId
      ),
      accountingRepository.getActiveCostCenters(tenantId),
    ]);

    const accMap = {};
    accounts.forEach((a) => (accMap[a.code] = a.id));

    if (!accMap['5.1.1'] || !accMap['2.1.1']) {
      return res
        .status(500)
        .json({ message: 'Faltan cuentas críticas en el catálogo (Sueldos o Pasivos por pagar)' });
    }

    // 4. Procesar líneas agrupadas por Centro de Costo
    const lines = [];
    let totalSueldos = 0;
    let totalHorasExtras = 0;
    let totalBonos = 0;
    let totalDeducciones = 0;
    let totalNeto = 0;

    // Mapa para agrupar gastos por centro de costo
    const expensesByCC = {};

    payroll.details.forEach((det) => {
      const dept = det.employee.department;
      const cc = allCostCenters.find(
        (c) =>
          c.name.toLowerCase() === dept.toLowerCase() || c.code.toLowerCase() === dept.toLowerCase()
      );
      const ccId = cc ? cc.id : null;

      if (!expensesByCC[ccId || 'DEFAULT']) {
        expensesByCC[ccId || 'DEFAULT'] = { ccId, sueldos: 0, extras: 0, bonos: 0 };
      }

      const bonuses =
        typeof det.bonuses === 'string' ? JSON.parse(det.bonuses || '[]') : det.bonuses || [];
      const detBonuses = bonuses.reduce((acc, b) => acc + (b.amount || 0), 0);

      expensesByCC[ccId || 'DEFAULT'].sueldos += det.baseSalary;
      expensesByCC[ccId || 'DEFAULT'].extras += det.overtimeAmount;
      expensesByCC[ccId || 'DEFAULT'].bonos += detBonuses;

      totalSueldos += det.baseSalary;
      totalHorasExtras += det.overtimeAmount;
      totalBonos += detBonuses;
      totalNeto += det.netSalary;

      const deductions =
        typeof det.deductions === 'string'
          ? JSON.parse(det.deductions || '[]')
          : det.deductions || [];
      deductions.forEach((d) => (totalDeducciones += d.amount || 0));
    });

    // Generar líneas de Gasto (Débito) por Centro de Costo
    Object.values(expensesByCC).forEach((group) => {
      if (group.sueldos > 0) {
        lines.push({
          accountId: accMap['5.1.1'],
          costCenterId: group.ccId,
          description: `Gasto Sueldos - ${group.ccId ? 'CC' : 'Gral'}`,
          debit: Number(group.sueldos.toFixed(2)),
          credit: 0,
        });
      }
      if (group.extras > 0) {
        lines.push({
          accountId: accMap['5.1.2'] || accMap['5.1.1'],
          costCenterId: group.ccId,
          description: `Gasto Horas Extras - ${group.ccId ? 'CC' : 'Gral'}`,
          debit: Number(group.extras.toFixed(2)),
          credit: 0,
        });
      }
      if (group.bonos > 0) {
        lines.push({
          accountId: accMap['5.1.3'] || accMap['5.1.1'],
          costCenterId: group.ccId,
          description: `Gasto Bonos y Beneficios - ${group.ccId ? 'CC' : 'Gral'}`,
          debit: Number(group.bonos.toFixed(2)),
          credit: 0,
        });
      }
    });

    // Generar líneas de Pasivo (Crédito) Consolidadas
    lines.push({
      accountId: accMap['2.1.1'],
      description: 'Nómina por Pagar (Neto Consolidado)',
      debit: 0,
      credit: Number(totalNeto.toFixed(2)),
    });

    if (totalDeducciones > 0) {
      lines.push({
        accountId: accMap['2.1.2'] || accMap['2.1.1'],
        description: 'Retenciones y Deducciones de Nómina',
        debit: 0,
        credit: Number(totalDeducciones.toFixed(2)),
      });
    }

    const dateObj = new Date(payroll.period);
    const sumDebits = lines.reduce(
      (acc, l) => acc.plus(financial.from(l.debit || 0)),
      financial.from(0)
    );
    const sumCredits = lines.reduce(
      (acc, l) => acc.plus(financial.from(l.credit || 0)),
      financial.from(0)
    );

    // Cuadratura estricta para evitar diferencias por centavos de redondeo
    const calculatedTotalDebit = financial.round(sumDebits);
    let calculatedTotalCredit = financial.round(sumCredits);

    if (calculatedTotalDebit !== calculatedTotalCredit && lines.length > 0) {
      // Ajustar diferencia de centavos en la línea de pasivo
      const diff = financial.from(calculatedTotalDebit).minus(calculatedTotalCredit).toNumber();
      const lastCreditLine = lines
        .slice()
        .reverse()
        .find((l) => l.credit > 0);
      if (lastCreditLine) {
        lastCreditLine.credit = Number((lastCreditLine.credit + diff).toFixed(2));
        calculatedTotalCredit = calculatedTotalDebit;
      }
    }

    const entry = await accountingRepository.createJournalEntryRaw({
      tenantId,
      entryNumber: `PAY-${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date(),
      description: `Nexus: Importación de Nómina ${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`,
      type: 'DAILY',
      status: 'DRAFT',
      referenceModule: 'PAYROLL',
      referenceId: payrollId,
      totalDebit: calculatedTotalDebit,
      totalCredit: calculatedTotalCredit,
      lines: { create: lines },
    });

    auditRepository
      .createLog({
        entity: 'JournalEntry',
        entityId: entry.id,
        action: 'GENERATE',
        performedBy: req.user?.id || 'Admin',
        details: `Integración de nómina realizada. Asiento: ${entry.entryNumber}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    res.json({
      message: 'Nexus: Nómina importada exitosamente como BORRADOR',
      entryId: entry.id,
      entryNumber: entry.entryNumber,
    });
  } catch (error) {
    console.error('Nexus Integration Error:', error);
    res.status(500).json({ message: 'Error en el Nexus de integración', error: error.message });
  }
};
