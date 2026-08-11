import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getTenantId, isTenantFilterBypassed, runWithoutTenantFilter } from './tenantContext.js';

const prisma = new PrismaClient({});

// 1. Modelos con la columna tenantId directa
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

// 2. Modelos relacionales vinculados directamente al Empleado (Employee)
const EMPLOYEE_RELATION_MODELS = new Set([
    'Contract',
    'Attendance',
    'AbsenceRequest',
    'EmployeeBenefit',
    'SalaryAdvance',
    'EmployeeEvaluation',
    'Document',
    'Skill',
    'WorkHistory',
    'EmployeeGoal',
    'EmployeeAsset',
    'OffboardingProcess',
    'BiometricCredential',
    'Notification',
    'NotificationPreference',
    'EmployeeSchedule',
    'AnnouncementRead',
]);

// 3. Mapeo de modelos indirectos a la relación que contiene el tenantId o employee.tenantId
const INDIRECT_RELATION_MAP = {
    'PayrollDetail': { payroll: { tenantId: true } },
    'PayrollItem': { config: { tenantId: true } },
    'EvaluationReviewer': { evaluation: { employee: { tenantId: true } } },
    'JobApplication': { vacancy: { tenantId: true } },
    'ApplicationNote': { application: { vacancy: { tenantId: true } } },
    'Interview': { application: { vacancy: { tenantId: true } } },
    'CandidateEvaluation': { application: { vacancy: { tenantId: true } } },
    'ClimateResponse': { survey: { tenantId: true } },
    'JournalLine': { journalEntry: { tenantId: true } },
    'Entrepreneurship': { owner: { tenantId: true } },
    'EntrepreneurshipMember': { project: { owner: { tenantId: true } } },
    'EntrepreneurshipMentor': { project: { owner: { tenantId: true } } },
    'EntrepreneurshipMilestone': { project: { owner: { tenantId: true } } },
    'EntrepreneurshipDocument': { project: { owner: { tenantId: true } } },
    'EntrepreneurshipUpdate': { project: { owner: { tenantId: true } } },
    'EntrepreneurshipEquity': { project: { owner: { tenantId: true } } },
    'EntrepreneurshipFundingRound': { project: { owner: { tenantId: true } } },
    'EntrepreneurshipInterview': { project: { owner: { tenantId: true } } },
    'EntrepreneurshipTargetMarket': { project: { owner: { tenantId: true } } },
};

/**
 * Función auxiliar para inyectar filtros de aislamiento relacionales de forma defensiva
 */
function applyRelationFilter(targetObj, filterPath, tenantId) {
    if (typeof filterPath === 'string') {
        targetObj[filterPath] = tenantId;
    } else if (typeof filterPath === 'object') {
        for (const [key, val] of Object.entries(filterPath)) {
            if (val === true) {
                targetObj[key] = tenantId;
            } else {
                targetObj[key] = targetObj[key] || {};
                applyRelationFilter(targetObj[key], val, tenantId);
            }
        }
    }
}

/**
 * Obtener nombre del delegado del cliente de Prisma para un modelo
 */
function getDelegateName(model) {
    if (!model) return null;
    const name = model.charAt(0).toLowerCase() + model.slice(1);
    return prisma[name] ? name : null;
}

/**
 * Middleware Global de Prisma para Aislamiento Automático y Seguro por Tenant
 */
prisma.$use(async (params, next) => {
    const tenantId = getTenantId();
    const bypassed = isTenantFilterBypassed();

    // Si el filtro está explícitamente desactivado (bypass interno) o no hay tenantId en contexto, continuar sin interceptar
    if (bypassed || !tenantId) {
        return next(params);
    }

    params.args = params.args || {};
    params.args.where = params.args.where || {};

    const model = params.model;
    const action = params.action;

    if (!model) {
        return next(params);
    }

    // A. Transformar findUnique / findUniqueOrThrow a findFirst para aplicar scoping de Tenant
    if (['findUnique', 'findUniqueOrThrow'].includes(action)) {
        params.action = 'findFirst';
        if (DIRECT_TENANT_MODELS.has(model)) {
            params.args.where.tenantId = tenantId;
        } else if (EMPLOYEE_RELATION_MODELS.has(model)) {
            params.args.where.employee = { ...(params.args.where.employee || {}), tenantId };
        } else if (INDIRECT_RELATION_MAP[model]) {
            applyRelationFilter(params.args.where, INDIRECT_RELATION_MAP[model], tenantId);
        }
    }
    // B. Consultas masivas y lectura (findMany, findFirst, count, groupBy, aggregate)
    else if (['findMany', 'findFirst', 'count', 'groupBy', 'aggregate'].includes(action)) {
        if (DIRECT_TENANT_MODELS.has(model)) {
            if (params.args.where.tenantId === undefined) {
                params.args.where.tenantId = tenantId;
            }
        } else if (EMPLOYEE_RELATION_MODELS.has(model)) {
            params.args.where.employee = { ...(params.args.where.employee || {}), tenantId };
        } else if (INDIRECT_RELATION_MAP[model]) {
            applyRelationFilter(params.args.where, INDIRECT_RELATION_MAP[model], tenantId);
        }
    }
    // C. Creación de registros (create, createMany)
    else if (['create', 'createMany'].includes(action)) {
        if (DIRECT_TENANT_MODELS.has(model)) {
            if (action === 'create') {
                params.args.data = params.args.data || {};
                params.args.data.tenantId = tenantId;
            } else if (action === 'createMany' && Array.isArray(params.args.data)) {
                params.args.data.forEach(item => {
                    item.tenantId = tenantId;
                });
            }
        } else if (EMPLOYEE_RELATION_MODELS.has(model) && action === 'create' && params.args.data?.employeeId) {
            // Validar defensivamente que el employeeId pertenezca al Tenant activo
            const emp = await runWithoutTenantFilter(() =>
                prisma.employee.findFirst({
                    where: { id: params.args.data.employeeId, tenantId },
                    select: { id: true }
                })
            );
            if (!emp) {
                throw new Error(`Acceso Denegado (Multi-Tenant): El empleado asociado en '${model}' no pertenece a la empresa activa.`);
            }
        }
    }
    // D. Actualización y Eliminación Masiva (updateMany, deleteMany)
    else if (['updateMany', 'deleteMany'].includes(action)) {
        if (DIRECT_TENANT_MODELS.has(model)) {
            params.args.where.tenantId = tenantId;
        } else if (EMPLOYEE_RELATION_MODELS.has(model)) {
            params.args.where.employee = { ...(params.args.where.employee || {}), tenantId };
        } else if (INDIRECT_RELATION_MAP[model]) {
            applyRelationFilter(params.args.where, INDIRECT_RELATION_MAP[model], tenantId);
        }
    }
    // E. Actualización y Eliminación Individual (update, delete)
    else if (['update', 'delete'].includes(action)) {
        const delegateName = getDelegateName(model);
        if (delegateName && params.args.where) {
            let whereCheck = { ...params.args.where };
            let requiresCheck = false;

            if (DIRECT_TENANT_MODELS.has(model)) {
                whereCheck.tenantId = tenantId;
                requiresCheck = true;
            } else if (EMPLOYEE_RELATION_MODELS.has(model)) {
                whereCheck.employee = { ...(whereCheck.employee || {}), tenantId };
                requiresCheck = true;
            } else if (INDIRECT_RELATION_MAP[model]) {
                applyRelationFilter(whereCheck, INDIRECT_RELATION_MAP[model], tenantId);
                requiresCheck = true;
            }

            if (requiresCheck) {
                // Ejecutar verificación previa con bypass para prevenir recursión
                const existing = await runWithoutTenantFilter(() =>
                    prisma[delegateName].findFirst({
                        where: whereCheck,
                        select: { id: true }
                    })
                );

                if (!existing) {
                    throw new Error(`Acceso Denegado (Multi-Tenant): El registro en '${model}' no existe o no pertenece a la empresa activa.`);
                }
            }
        }
    }

    return next(params);
});

export default prisma;


