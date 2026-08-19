/**
 * @file db.js
 * @description Cliente Prisma con interceptor multi-tenant y aislamiento estricto de base de datos.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

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
    'RsiCalibration',
    'RsiPredictionAudit',
    'CausalIntervention',
    'TenantPrivacyBudget',
    'MorlPolicyRun',
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
    'ParetoFrontierPoint': { policyRun: { tenantId: true } },
};

/**
 * Expande compound unique keys al convertir findUnique → findFirst.
 * Prisma genera keys compuestas con formato "field1_field2" cuyo valor es un objeto
 * con los campos individuales. En findFirst esos no existen, deben ser campos planos.
 *
 * Ejemplo: { employeeId_date: { employeeId: 'x', date: new Date() } }
 *      →   { employeeId: 'x', date: new Date() }
 */
function expandCompoundKeys(where) {
    const PRISMA_OPERATORS = new Set(['AND', 'OR', 'NOT']);
    for (const key of Object.keys(where)) {
        if (PRISMA_OPERATORS.has(key)) continue;
        const val = where[key];
        if (
            val !== null &&
            typeof val === 'object' &&
            !Array.isArray(val) &&
            !(val instanceof Date) &&
            key.includes('_')
        ) {
            // Verifica que todos los valores del objeto sean primitivos/Date (no objetos anidados de relación)
            const isCompoundKey = Object.values(val).every(
                v => v === null || typeof v !== 'object' || v instanceof Date
            );
            if (isCompoundKey) {
                Object.assign(where, val);
                delete where[key];
            }
        }
    }
}

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
    // IMPORTANTE: NO inicializar params.args.where aquí de forma global.
    // Las operaciones create/createMany no tienen 'where' y Prisma lanza error si se inyecta.

    const model = params.model;
    const action = params.action;

    if (!model) {
        return next(params);
    }

    // A. Transformar findUnique / findUniqueOrThrow a findFirst para aplicar scoping de Tenant
    if (['findUnique', 'findUniqueOrThrow'].includes(action)) {
        params.action = action === 'findUniqueOrThrow' ? 'findFirstOrThrow' : 'findFirst';
        params.args.where = params.args.where || {};
        // Expandir compound unique keys (ej: employeeId_date) en campos individuales
        // ya que findFirst no soporta esa sintaxis — es exclusiva de findUnique.
        expandCompoundKeys(params.args.where);
        if (DIRECT_TENANT_MODELS.has(model)) {
            params.args.where.tenantId = tenantId;
        } else if (EMPLOYEE_RELATION_MODELS.has(model)) {
            const relField = model === 'Notification' ? 'recipient' : 'employee';
            params.args.where[relField] = { ...(params.args.where[relField] || {}), tenantId };
        } else if (INDIRECT_RELATION_MAP[model]) {
            applyRelationFilter(params.args.where, INDIRECT_RELATION_MAP[model], tenantId);
        }
    }
    // B. Consultas masivas y lectura (findMany, findFirst, count, groupBy, aggregate)
    else if (['findMany', 'findFirst', 'count', 'groupBy', 'aggregate'].includes(action)) {
        params.args.where = params.args.where || {};
        if (DIRECT_TENANT_MODELS.has(model)) {
            if (params.args.where.tenantId === undefined) {
                params.args.where.tenantId = tenantId;
            }
        } else if (EMPLOYEE_RELATION_MODELS.has(model)) {
            const relField = model === 'Notification' ? 'recipient' : 'employee';
            params.args.where[relField] = { ...(params.args.where[relField] || {}), tenantId };
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
        } else if (EMPLOYEE_RELATION_MODELS.has(model) && action === 'create') {
            const empId = params.args.data?.employeeId || params.args.data?.recipientId;
            if (empId) {
                // Validar defensivamente que el employeeId pertenezca al Tenant activo
                const emp = await runWithoutTenantFilter(() =>
                    prisma.employee.findFirst({
                        where: { id: empId, tenantId },
                        select: { id: true }
                    })
                );
                if (!emp) {
                    throw new Error(`Acceso Denegado (Multi-Tenant): El empleado asociado en '${model}' no pertenece a la empresa activa.`);
                }
            }
        }
    }
    // D. Actualización y Eliminación Masiva (updateMany, deleteMany)
    else if (['updateMany', 'deleteMany'].includes(action)) {
        params.args.where = params.args.where || {};
        if (DIRECT_TENANT_MODELS.has(model)) {
            params.args.where.tenantId = tenantId;
        } else if (EMPLOYEE_RELATION_MODELS.has(model)) {
            const relField = model === 'Notification' ? 'recipient' : 'employee';
            params.args.where[relField] = { ...(params.args.where[relField] || {}), tenantId };
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
                const relField = model === 'Notification' ? 'recipient' : 'employee';
                whereCheck[relField] = { ...(whereCheck[relField] || {}), tenantId };
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


