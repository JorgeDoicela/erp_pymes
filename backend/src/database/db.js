import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getTenantId, isSuperAdminContext } from './tenantContext.js';

const prisma = new PrismaClient({});

// Modelos que contienen directamente la columna tenantId
const DIRECT_TENANT_MODELS = new Set([
    'Employee',
    'Shift',
    'SystemSetting',
    'PayrollConfig',
    'Payroll',
    'AccountingPeriod',
    'AccountingAccount',
    'CostCenter',
    'JournalEntry',
    'JobVacancy',
    'ClimateSurvey',
    'EvaluationTemplate',
    'Announcement',
    'AuditLog',
]);

// Modelos relacionales vinculados al empleado (Employee)
const EMPLOYEE_RELATION_MODELS = new Set([
    'Contract',
    'Attendance',
    'AbsenceRequest',
    'EmployeeBenefit',
    'SalaryAdvance',
    'EmployeeEvaluation',
    'Document',
    'EmployeeSkill',
    'WorkHistory',
]);

/**
 * Middleware Global de Prisma para Aislamiento Automático por Tenant
 * Intercepta todas las consultas y aplica automáticamente 'where: { tenantId }' o 'where: { employee: { tenantId } }'
 */
prisma.$use(async (params, next) => {
    const tenantId = getTenantId();
    const isSuperAdmin = isSuperAdminContext();

    if (tenantId && !isSuperAdmin) {
        // 1. Modelos con columna tenantId directa
        if (DIRECT_TENANT_MODELS.has(params.model)) {
            if (['findMany', 'findFirst', 'count', 'groupBy', 'aggregate'].includes(params.action)) {
                params.args = params.args || {};
                params.args.where = params.args.where || {};
                if (params.args.where.tenantId === undefined) {
                    params.args.where.tenantId = tenantId;
                }
            } else if (['create', 'createMany'].includes(params.action)) {
                if (params.action === 'create') {
                    params.args = params.args || {};
                    params.args.data = params.args.data || {};
                    if (!params.args.data.tenantId) {
                        params.args.data.tenantId = tenantId;
                    }
                } else if (params.action === 'createMany' && Array.isArray(params.args?.data)) {
                    params.args.data.forEach(item => {
                        if (!item.tenantId) item.tenantId = tenantId;
                    });
                }
            } else if (['updateMany', 'deleteMany'].includes(params.action)) {
                params.args = params.args || {};
                params.args.where = params.args.where || {};
                if (params.args.where.tenantId === undefined) {
                    params.args.where.tenantId = tenantId;
                }
            }
        }
        // 2. Modelos vinculados a la relación Employee
        else if (EMPLOYEE_RELATION_MODELS.has(params.model)) {
            if (['findMany', 'findFirst', 'count', 'groupBy', 'aggregate'].includes(params.action)) {
                params.args = params.args || {};
                params.args.where = params.args.where || {};
                if (params.args.where.employee === undefined && params.args.where.employeeId === undefined) {
                    params.args.where.employee = { tenantId };
                }
            }
        }
    }

    return next(params);
});

export default prisma;
