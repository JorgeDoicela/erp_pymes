import { encryptSalary, encrypt } from '../../src/utils/encryption.js';

export const RESEARCH_TENANTS = [
    {
        id: 'research_tenant_a',
        name: 'TechSolutions Cía. Ltda.',
        slug: 'techsolutions-research',
        subscriptionStatus: 'ACTIVE',
        plan: 'ENTERPRISE',
        riskProfile: 'HIGH',
        avgSalaryRange: [750, 900],
        absenceRateAvg: 8,
        perfRange: [55, 65],
        rsiAuditsOutcome: [1, 1, 1, 1, 1, 0, 1, 0] // High turnover prevalence
    },
    {
        id: 'research_tenant_b',
        name: 'Distribuidora El Valle',
        slug: 'elvalle-research',
        subscriptionStatus: 'ACTIVE',
        plan: 'ENTERPRISE',
        riskProfile: 'MEDIUM',
        avgSalaryRange: [950, 1400],
        absenceRateAvg: 4,
        perfRange: [65, 78],
        rsiAuditsOutcome: [1, 0, 0, 1, 0, 0, 1, 0] // Mixed
    },
    {
        id: 'research_tenant_c',
        name: 'ConsultAnd S.A.',
        slug: 'consultand-research',
        subscriptionStatus: 'ACTIVE',
        plan: 'ENTERPRISE',
        riskProfile: 'LOW',
        avgSalaryRange: [1600, 2800],
        absenceRateAvg: 1.5,
        perfRange: [78, 92],
        rsiAuditsOutcome: [0, 0, 0, 0, 0, 1, 0, 0] // High retention
    }
];

const DEPARTMENTS = ['Tecnología', 'Operaciones', 'Finanzas', 'Ventas', 'Recursos Humanos'];
const POSITIONS = {
    'Tecnología': ['Desarrollador Junior', 'Desarrollador Senior', 'Soporte Técnico', 'Analista QA'],
    'Operaciones': ['Asistente Logístico', 'Coordinador de Bodega', 'Analista de Procesos'],
    'Finanzas': ['Contador', 'Auxiliar Contable', 'Analista Financiero'],
    'Ventas': ['Ejecutivo de Ventas', 'Asesor Comercial', 'Supervisor de Campo'],
    'Recursos Humanos': ['Asistente de RRHH', 'Analista de Selección', 'Coordinador de Personal']
};

const FIRST_NAMES = ['Carlos', 'María', 'Juan', 'Ana', 'Luis', 'Sofía', 'Diego', 'Lucía', 'Gabriel', 'Elena', 'Fernando', 'Paula', 'Mateo', 'Camila', 'Santiago', 'Daniela', 'Alejandro', 'Valeria', 'Andrés', 'Isabella', 'Ricardo', 'Natalia', 'Javier', 'Martina', 'Esteban'];
const LAST_NAMES = ['Zambrano', 'Pérez', 'Vargas', 'Mendoza', 'Gómez', 'Castillo', 'Torres', 'Salazar', 'Rios', 'Espinosa', 'Morales', 'Cárdenas', 'Benítez', 'Andrade', 'Paredes', 'Villavicencio', 'Suárez', 'Bravo', 'Montero', 'Galarza', 'Salgado', 'Ortega', 'Mejía', 'Valdez', 'Cordero'];

/**
 * Genera el dataset científico de 75 empleados y sus registros históricos asociados
 */
export async function seedResearchData(prisma) {
    console.log('[INFO] Creando tenants y dataset de investigación científica (3 tenants x 25 empleados)...');

    // 1. Limpiar datos de investigación previos si existen
    const researchTenantIds = RESEARCH_TENANTS.map(t => t.id);
    await prisma.paretoFrontierPoint.deleteMany({ where: { policyRun: { tenantId: { in: researchTenantIds } } } });
    await prisma.morlPolicyRun.deleteMany({ where: { tenantId: { in: researchTenantIds } } });
    await prisma.causalIntervention.deleteMany({ where: { tenantId: { in: researchTenantIds } } });
    await prisma.rsiPredictionAudit.deleteMany({ where: { tenantId: { in: researchTenantIds } } });
    await prisma.rsiCalibration.deleteMany({ where: { tenantId: { in: researchTenantIds } } });
    await prisma.tenantPrivacyBudget.deleteMany({ where: { tenantId: { in: researchTenantIds } } });
    await prisma.employeeEvaluation.deleteMany({ where: { employee: { tenantId: { in: researchTenantIds } } } });
    await prisma.evaluationTemplate.deleteMany({ where: { tenantId: { in: researchTenantIds } } });
    await prisma.employeeGoal.deleteMany({ where: { employee: { tenantId: { in: researchTenantIds } } } });
    await prisma.absenceRequest.deleteMany({ where: { employee: { tenantId: { in: researchTenantIds } } } });
    await prisma.contract.deleteMany({ where: { employee: { tenantId: { in: researchTenantIds } } } });
    await prisma.employee.deleteMany({ where: { tenantId: { in: researchTenantIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: researchTenantIds } } });

    // 2. Poblar Tenants y Presupuestos de Privacidad
    for (const tConfig of RESEARCH_TENANTS) {
        await prisma.tenant.create({
            data: {
                id: tConfig.id,
                name: tConfig.name,
                slug: tConfig.slug,
                subscriptionStatus: tConfig.subscriptionStatus,
                plan: tConfig.plan
            }
        });

        await prisma.tenantPrivacyBudget.create({
            data: {
                tenantId: tConfig.id,
                epsilonBudgetMax: 10.0,
                epsilonSpent: 0.0,
                delta: 1e-5,
                roundsParticipated: 0
            }
        });

        // Crear plantilla de evaluación por defecto
        const evalTemplateId = `eval_template_${tConfig.id}`;
        await prisma.evaluationTemplate.upsert({
            where: { id: evalTemplateId },
            update: {
                tenantId: tConfig.id,
                title: `Evaluación Trimestral 360° (${tConfig.name})`,
                description: 'Evaluación estandarizada de competencias y KPIs',
                period: '2025-Q1',
                criteria: JSON.stringify(['Desempeño', 'Trabajo en Equipo', 'Puntualidad']),
                scale: '1-100'
            },
            create: {
                id: evalTemplateId,
                tenantId: tConfig.id,
                title: `Evaluación Trimestral 360° (${tConfig.name})`,
                description: 'Evaluación estandarizada de competencias y KPIs',
                period: '2025-Q1',
                criteria: JSON.stringify(['Desempeño', 'Trabajo en Equipo', 'Puntualidad']),
                scale: '1-100'
            }
        });

        console.log(`  [OK] Tenant '${tConfig.name}' creado con presupuesto de privacidad y plantilla de evaluación.`);

        // 3. Crear 25 Empleados por Tenant
        const employeesCreated = [];
        for (let i = 0; i < 25; i++) {
            const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
            const lastName = LAST_NAMES[(i + tConfig.id.length) % LAST_NAMES.length];
            const dept = DEPARTMENTS[i % DEPARTMENTS.length];
            const posList = POSITIONS[dept];
            const position = posList[i % posList.length];

            const minSal = tConfig.avgSalaryRange[0];
            const maxSal = tConfig.avgSalaryRange[1];
            const salaryVal = Math.round(minSal + Math.random() * (maxSal - minSal));

            // Antigüedad (1 a 48 meses)
            const tenureMonths = Math.round(1 + Math.random() * 47);
            const hireDate = new Date();
            hireDate.setMonth(hireDate.getMonth() - tenureMonths);

            const empId = `emp_${tConfig.id}_${i + 1}`;

            const birthDate = new Date('1992-05-15');
            const employee = await prisma.employee.create({
                data: {
                    id: empId,
                    tenantId: tConfig.id,
                    firstName,
                    lastName,
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i + 1}@${tConfig.slug}.com`,
                    password: '$2a$10$YourHashedPasswordHereOrBcryptValuePlaceholderKey123',
                    identityCard: `17${String(10000000 + i + Math.floor(Math.random() * 8000000))}`,
                    department: dept,
                    position,
                    salary: encryptSalary(salaryVal),
                    address: 'Av. 6 de Diciembre y Orellana, Quito',
                    birthDate,
                    civilStatus: i % 2 === 0 ? 'Soltero/a' : 'Casado/a',
                    contractType: 'Indefinido',
                    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
                    hireDate,
                    isActive: true,
                    workLatitude: encrypt(-0.1807),
                    workLongitude: encrypt(-78.4678),
                    geofenceRadius: 200,
                    contracts: {
                        create: [{
                            type: 'Indefinido',
                            salary: salaryVal,
                            startDate: hireDate,
                            status: 'ACTIVE'
                        }]
                    }
                }
            });

            employeesCreated.push(employee);

            // Generar ausencias según tasa promedio del perfil
            const absenceCount = Math.floor(Math.random() * (tConfig.absenceRateAvg * 1.5));
            for (let a = 0; a < absenceCount; a++) {
                const absDaysAgo = Math.floor(Math.random() * 180);
                const absDate = new Date();
                absDate.setDate(absDate.getDate() - absDaysAgo);

                await prisma.absenceRequest.create({
                    data: {
                        employeeId: employee.id,
                        type: a % 2 === 0 ? 'SICK_LEAVE' : 'PERSONAL',
                        startDate: absDate,
                        endDate: absDate,
                        reason: 'Motivo personal de salud',
                        status: 'APPROVED',
                        createdAt: absDate
                    }
                });
            }

            // Generar evaluaciones continuas (1 a 3 por empleado)
            const evalCount = 1 + Math.floor(Math.random() * 3);
            for (let e = 0; e < evalCount; e++) {
                const perfMin = tConfig.perfRange[0];
                const perfMax = tConfig.perfRange[1];
                const finalScore = Math.round(perfMin + Math.random() * (perfMax - perfMin));

                const evalDate = new Date();
                evalDate.setMonth(evalDate.getMonth() - (e * 4));

                await prisma.employeeEvaluation.create({
                    data: {
                        templateId: evalTemplateId,
                        employeeId: employee.id,
                        startDate: evalDate,
                        endDate: evalDate,
                        finalScore,
                        status: 'COMPLETED',
                        createdAt: evalDate
                    }
                });
            }

            // Generar metas SMART
            const prog = Math.round(Math.min(100, (tConfig.perfRange[0] + Math.random() * 20)));
            await prisma.employeeGoal.create({
                data: {
                    employeeId: employee.id,
                    title: `Objetivo Trimestral de ${dept}`,
                    description: 'Cumplimiento de KPIs operativos estratégicos',
                    targetValue: 100,
                    currentValue: prog,
                    progress: prog,
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
        }

        console.log(`  [OK] 25 Empleados, ausencias y evaluaciones creadas para '${tConfig.name}'.`);

        // 4. Pre-cargar auditorías RSI resueltas para calibración empírica
        for (let idx = 0; idx < tConfig.rsiAuditsOutcome.length; idx++) {
            const outcome = tConfig.rsiAuditsOutcome[idx];
            const targetEmp = employeesCreated[idx];
            const predictedScore = Math.round(40 + Math.random() * 45);

            await prisma.rsiPredictionAudit.create({
                data: {
                    tenantId: tConfig.id,
                    employeeId: targetEmp.id,
                    predictedScore,
                    predictedTurnover: predictedScore / 100,
                    actualOutcome: outcome,
                    resolvedAt: new Date(Date.now() - (idx + 1) * 7 * 24 * 60 * 60 * 1000)
                }
            });
        }

        console.log(`  [OK] 8 Auditorías RSI resueltas registradas para '${tConfig.name}' (Outcome: ${tConfig.rsiAuditsOutcome.join(', ')}).`);
    }

    console.log('[OK] Poblamiento del dataset de investigación científica completado exitosamente.');
}
