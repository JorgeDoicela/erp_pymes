import { encryptSalary } from '../../src/utils/encryption.js';

export async function seedResearchData(prisma) {
    console.log('[RESEARCH_DATA] Inicializando módulos de IA (RSI, Causal AI, MORL, Privacidad Diferencial) para los 3 tenants de investigación (N=75)...');

    // 1. Garantizar 3 Tenants de investigación
    let tenantA = await prisma.tenant.findFirst({ where: { slug: 'empresa-demo' } });
    let tenantB = await prisma.tenant.findFirst({ where: { slug: 'tech-solutions' } });
    let tenantC = await prisma.tenant.findFirst({ where: { slug: 'innovate-corp' } });

    if (!tenantC) {
        tenantC = await prisma.tenant.create({
            data: {
                name: 'Innovate Corp S.A.S.',
                slug: 'innovate-corp',
                ruc: '1799988776001',
                plan: 'GROWTH',
                subscriptionStatus: 'ACTIVE'
            }
        });
    }

    const tenants = [tenantA, tenantB, tenantC].filter(Boolean);

    // 2. Garantizar 25 empleados por tenant (Total N=75) con distribución interdepartamental estadísticamente significativa
    const departments = [
        { name: 'Ventas', baseRisk: 62, basePerf: 74, count: 9 },
        { name: 'Tecnología', baseRisk: 44, basePerf: 79, count: 8 },
        { name: 'Operaciones', baseRisk: 26, basePerf: 82, count: 8 }
    ];

    for (const tenant of tenants) {
        const tenantId = tenant.id;

        // Eliminar empleados de investigación previos para recrearlos con covariables diferenciadas
        const researchEmps = await prisma.employee.findMany({
            where: { tenantId, email: { contains: '@emplifi.com' } },
            select: { id: true }
        });
        if (researchEmps.length > 0) {
            const researchIds = researchEmps.map(e => e.id);
            // Limpiar datos derivados antes de eliminar empleados
            await prisma.rsiPredictionAudit.deleteMany({ where: { employeeId: { in: researchIds } } });
            await prisma.absenceRequest.deleteMany({ where: { employeeId: { in: researchIds } } });
            await prisma.employeeEvaluation.deleteMany({ where: { employeeId: { in: researchIds } } });
            // Eliminar uno a uno para ignorar empleados referenciados por vacantes (FK RESTRICT)
            for (const eid of researchIds) {
                try {
                    await prisma.employee.delete({ where: { id: eid } });
                } catch (_) { /* skip si tiene FK activa en job_vacancies u otras tablas */ }
            }
        }

        // Crear template de evaluación si no existe
        let evalTemplate = await prisma.evaluationTemplate.findFirst({ where: { tenantId } });
        if (!evalTemplate) {
            evalTemplate = await prisma.evaluationTemplate.create({
                data: {
                    tenantId,
                    title: 'Evaluación Anual de Desempeño 360°',
                    period: '2025-Q4',
                    criteria: JSON.stringify([]),
                    scale: '1-100'
                }
            });
        }

        {
            let empIndex = 1;
            for (const deptSpec of departments) {
                for (let k = 0; k < deptSpec.count; k++) {
                    if (empIndex > 25) break;

                    // Salarios diferenciados por departamento — generan varianza real en el modelo Weibull
                    // Ventas: salarios bajos (~800-1100 USD) → mayor riesgo por beta_salary
                    // Tecnología: salarios altos (~1500-1900 USD) → menor riesgo
                    // Operaciones: salarios medios (~1200-1500 USD) → riesgo bajo
                    const salaryRanges = {
                        'Ventas': 800 + Math.floor(Math.random() * 300),
                        'Tecnología': 1500 + Math.floor(Math.random() * 400),
                        'Operaciones': 1200 + Math.floor(Math.random() * 300)
                    };
                    const salaryVal = salaryRanges[deptSpec.name] || 1200;
                    const email = `emp.${empIndex}.${tenant.slug}@emplifi.com`;

                    const existingEmp = await prisma.employee.findFirst({ where: { tenantId, email } });
                    if (!existingEmp) {
                        const hireDate = new Date(Date.now() - (6 + Math.floor(Math.random() * 48)) * 30 * 24 * 60 * 60 * 1000);
                        const newEmp = await prisma.employee.create({
                            data: {
                                tenantId,
                                firstName: `Investigación_${empIndex}`,
                                lastName: `Colaborador_${tenant.slug.substring(0, 3)}`,
                                email,
                                identityCard: `17900${String(tenantId).substring(0, 3)}${String(empIndex).padStart(3, '0')}`,
                                department: deptSpec.name,
                                position: deptSpec.name === 'Tecnología' ? 'Desarrollador' : deptSpec.name === 'Ventas' ? 'Ejecutivo Comercial' : 'Analista Operativo',
                                salary: encryptSalary(salaryVal),
                                civilStatus: 'Soltero',
                                contractType: 'Indefinido',
                                password: '$2a$10$e8V9B7C6D5E4F3A2B1C0DuN0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C',
                                address: 'Av. Amazonas N24-102, Quito',
                                phone: '0991234567',
                                birthDate: new Date('1992-05-15'),
                                hireDate,
                                isActive: true
                            }
                        });

                        // Evaluación de desempeño diferenciada por departamento con varianza estocástica natural (sigma approx 7.0)
                        await prisma.employeeEvaluation.create({
                            data: {
                                templateId: evalTemplate.id,
                                employeeId: newEmp.id,
                                startDate: new Date('2025-01-01'),
                                endDate: new Date('2025-12-31'),
                                finalScore: Math.max(50, Math.min(100, deptSpec.basePerf + (Math.random() * 24 - 12))),
                                status: 'COMPLETED'
                            }
                        });

                        // Ausencias diferenciadas por riesgo departamental (alimentan beta_absence del modelo Weibull)
                        // Ventas: 4-8 ausencias → score alto | Tecnología: 0-2 | Operaciones: 0-1
                        const absenceCountByDept = {
                            'Ventas': 4 + Math.floor(Math.random() * 5),
                            'Tecnología': Math.floor(Math.random() * 3),
                            'Operaciones': Math.floor(Math.random() * 2)
                        };
                        const numAbsences = absenceCountByDept[deptSpec.name] || 0;
                        for (let a = 0; a < numAbsences; a++) {
                            const absDate = new Date(Date.now() - (20 + a * 12) * 24 * 60 * 60 * 1000);
                            try {
                                await prisma.absenceRequest.create({
                                    data: {
                                        tenantId,
                                        employeeId: newEmp.id,
                                        type: 'INJUSTIFICADA',
                                        startDate: absDate,
                                        endDate: absDate,
                                        reason: 'Ausencia registrada en protocolo de investigación'
                                    }
                                });
                            } catch (_) { /* ignorar si el schema difiere */ }
                        }
                    }
                    empIndex++;
                }
            }
        }

        // Cargar todos los 25 empleados del tenant
        const tenantEmployees = await prisma.employee.findMany({
            where: { tenantId, isActive: true },
            take: 25
        });

        // 3. Presupuesto de Privacidad Diferencial (DP-FL)
        const existingBudget = await prisma.tenantPrivacyBudget.findUnique({ where: { tenantId } });
        if (!existingBudget) {
            await prisma.tenantPrivacyBudget.create({
                data: {
                    tenantId,
                    epsilonBudgetMax: 10.0,
                    epsilonSpent: 1.25,
                    delta: 1e-5,
                    roundsParticipated: 4
                }
            });
        }

        // 4. Calibración RSI (Retention Risk Index) - Baseline uncalibrated (Época 1: 0.1650)
        const existingCalibration = await prisma.rsiCalibration.findFirst({ where: { tenantId } });
        if (!existingCalibration) {
            await prisma.rsiCalibration.create({
                data: {
                    tenantId,
                    epoch: 1,
                    brierScore: 0.1650,  // Baseline no calibrado
                    logLoss: 0.4200,
                    improvementPercentage: 0,
                    weightsJson: JSON.stringify({
                        beta_salary: -0.85, beta_absence: 0.35, beta_perf: 1.10,
                        beta_no_promo: 0.25, k_weibull: 1.25, lambda_weibull: 48,
                        weight_retention: 0.25, weight_performance: 0.25,
                        weight_attendance: 0.20, weight_growth: 0.15, weight_engagement: 0.15
                    }),
                    sampleCount: tenantEmployees.length,
                    triggerReason: 'INITIALIZATION'
                }
            });
        }

        // 5. Auditorías Predictivas RSI y Resultados Resueltos
        for (let idx = 0; idx < tenantEmployees.length; idx++) {
            const emp = tenantEmployees[idx];
            const isVentas = emp.department === 'Ventas';
            const isOps = emp.department === 'Operaciones';
            const predictedScore = isVentas ? Math.round(58 + Math.random() * 12) : isOps ? Math.round(22 + Math.random() * 10) : Math.round(40 + Math.random() * 12);

            const existingAudit = await prisma.rsiPredictionAudit.findFirst({
                where: { tenantId, employeeId: emp.id }
            });

            if (!existingAudit) {
                await prisma.rsiPredictionAudit.create({
                    data: {
                        tenantId,
                        employeeId: emp.id,
                        predictedScore,
                        predictedTurnover: predictedScore / 100,
                        actualOutcome: predictedScore > 50 ? 1 : 0,
                        resolvedAt: new Date(Date.now() - (idx + 1) * 7 * 24 * 60 * 60 * 1000)
                    }
                });
            }
        }

        // 6. Intervención Causal Dirigida (Causal AI Engine - ROI +191.6%, +$27,600 Ahorro Neto)
        const existingIntervention = await prisma.causalIntervention.findFirst({ where: { tenantId } });
        if (!existingIntervention) {
            await prisma.causalIntervention.create({
                data: {
                    tenantId,
                    title: `Programa de Retención Dirigida (+10% Bono Salarial) en ${tenant.name}`,
                    treatmentType: 'SALARY_INCREASE',
                    treatmentValue: 10.0,
                    targetDepartment: 'ALL',
                    sampleSize: tenantEmployees.length,
                    ate: -0.1020,          // ATE de -10.20% (reducción de rotación)
                    baselineTurnoverRate: 0.2450,
                    counterfactualTurnoverRate: 0.1430,
                    costEstimate: 14400.0,
                    savingsEstimate: 42000.0,
                    netRoi: 27600.0,      // ROI neto positivo de +$27,600
                    confidenceIntervalLower: -0.1280,
                    confidenceIntervalUpper: -0.0760
                }
            });
        }

        // 7. Corridas MORL (Multi-Objective Reinforcement Learning)
        const existingPolicy = await prisma.morlPolicyRun.findFirst({ where: { tenantId } });
        if (!existingPolicy) {
            const policyRun = await prisma.morlPolicyRun.create({
                data: {
                    tenantId,
                    title: `Optimización de Política Salarial vs Retención Q3 (${tenant.name})`,
                    budgetLimit: 12000.0,
                    targetDepartment: 'ALL',
                    sampleSize: tenantEmployees.length,
                    hyperparametersJson: JSON.stringify({ alpha: 0.1, gamma: 0.99, epsilon: 0.05, episodes: 500 }),
                    paretoFrontierJson: JSON.stringify([
                        { retentionGain: 0.22, cost: 2340 },
                        { retentionGain: 0.28, cost: 4800 }
                    ]),
                    selectedPointIndex: 0
                }
            });

            await prisma.paretoFrontierPoint.createMany({
                data: [
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.0,
                        weightCost: 1.0,
                        totalCostEstimate: 0.0,
                        expectedRetentionRate: 0.756,
                        retainedEmployeeCount: 19,
                        policyActionsJson: JSON.stringify({ NO_ACTION: 1.0 })
                    },
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.15,
                        weightCost: 0.85,
                        totalCostEstimate: 2340.0,
                        expectedRetentionRate: 0.936,
                        retainedEmployeeCount: 23,
                        policyActionsJson: JSON.stringify({ REMOTE_WORK_2D: 0.85, SALARY_BOOST: 0.15 })
                    },
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.30,
                        weightCost: 0.70,
                        totalCostEstimate: 2340.0,
                        expectedRetentionRate: 0.936,
                        retainedEmployeeCount: 23,
                        policyActionsJson: JSON.stringify({ REMOTE_WORK_2D: 0.85, SALARY_BOOST: 0.15 })
                    },
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.45,
                        weightCost: 0.55,
                        totalCostEstimate: 2340.0,
                        expectedRetentionRate: 0.936,
                        retainedEmployeeCount: 23,
                        policyActionsJson: JSON.stringify({ REMOTE_WORK_2D: 0.85, SALARY_BOOST: 0.15 })
                    }
                ]
            });
        }

        console.log(`Motor IA y datos de investigación configurados para ${tenant.name}.`);
    }

    // 6. Sembrar respuestas de encuestas de investigación (N=75) si no existen
    const existingSurveysCount = await prisma.researchSurveyResponse.count();
    if (existingSurveysCount === 0) {
        console.log('[RESEARCH_DATA] Inicializando 75 encuestas de investigación (Pre, Post, Experto)...');
        const roles = ['Gerente General / Dueño', 'Director / Jefe de RRHH', 'Contador / Administrador Financiero', 'Analista de Personal / Operaciones'];
        const sizes = ['Microempresa (1 - 9 emp)', 'Pequeña empresa (10 - 49 emp)', 'Mediana empresa (50 - 199 emp)', 'Empresa grande (> 200 emp)'];
        const sectors = ['Tecnología / Servicios Profesionales', 'Comercio / Distribución', 'Manufactura / Producción', 'Salud / Educación', 'Servicios Financieros'];
        const expList = ['< 2 años', '2 - 5 años', '6 - 10 años', '> 10 años'];

        const getLikert = (mean, stdDev = 0.7) => {
            let u1 = Math.random();
            let u2 = Math.random();
            let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
            let val = Math.round(mean + stdDev * randStdNormal);
            return Math.max(1, Math.min(5, val));
        };

        const selectRandom = (items, weights) => {
            const rand = Math.random();
            let sum = 0;
            for (let i = 0; i < items.length; i++) {
                sum += weights[i];
                if (rand <= sum) return items[i];
            }
            return items[items.length - 1];
        };

        const surveyRecords = [];

        // Pre-Sistema N=25
        for (let i = 0; i < 25; i++) {
            surveyRecords.push({
                surveyType: 'PRE_SYSTEM',
                respondentRole: selectRandom(roles, [0.30, 0.35, 0.20, 0.15]),
                companySize: selectRandom(sizes, [0.35, 0.45, 0.15, 0.05]),
                economicSector: selectRandom(sectors, [0.30, 0.30, 0.20, 0.10, 0.10]),
                experienceYears: selectRandom(expList, [0.20, 0.40, 0.30, 0.10]),
                academicDegree: 'Licenciatura / Ingeniería',
                answers: {
                    pre_6_manual_attendance: getLikert(4.3),
                    pre_7_buddy_punching: getLikert(3.5),
                    pre_8_field_tracking_diff: getLikert(4.1),
                    pre_9_overtime_calc_hours: getLikert(4.4),
                    pre_10_fragmented_files: getLikert(4.2),
                    pre_11_subjective_performance: getLikert(3.9),
                    pre_12_lacks_5d_metric: getLikert(4.3),
                    pre_13_turnover_risk_blindness: getLikert(4.0),
                    pre_18_manual_severance_errors: getLikert(4.1),
                    pre_20_unencrypted_salaries: getLikert(4.5),
                    comments: 'Línea base pre-sistema: marcado manual en listas e inconsistencias en horas extra.'
                },
                isSynthetic: true,
                ipHash: 'seed-calibration',
                userAgent: 'Research-Seeder/1.0'
            });
        }

        // Post-Sistema N=35
        for (let i = 0; i < 35; i++) {
            surveyRecords.push({
                surveyType: 'POST_SYSTEM',
                respondentRole: selectRandom(roles, [0.25, 0.45, 0.15, 0.15]),
                companySize: selectRandom(sizes, [0.25, 0.50, 0.20, 0.05]),
                economicSector: selectRandom(sectors, [0.40, 0.20, 0.20, 0.10, 0.10]),
                experienceYears: selectRandom(expList, [0.10, 0.40, 0.40, 0.10]),
                academicDegree: 'Licenciatura / Ingeniería',
                answers: {
                    post_1_navigation_usability: getLikert(4.5),
                    post_2_5d_score_clarity: getLikert(4.6),
                    post_3_geofence_passkey_speed: getLikert(4.4),
                    post_4_recommend_system: getLikert(4.7),
                    post_6_weibull_survival_precision: getLikert(4.3),
                    post_7_rsi_self_improve_confidence: getLikert(4.4),
                    post_9_causal_simulator_whatif: getLikert(4.2),
                    post_10_ate_roi_budget_justification: getLikert(4.5),
                    post_12_pareto_frontier_tradeoff: getLikert(4.1),
                    post_14_aes256_privacy_confidence: getLikert(4.8),
                    post_16_ecuador_labor_law_compliance: getLikert(4.8),
                    comments: 'La automatización de finiquito y el Scoring 5D redujeron los tiempos de nómina significativamente.'
                },
                isSynthetic: true,
                ipHash: 'seed-calibration',
                userAgent: 'Research-Seeder/1.0'
            });
        }

        // Experto N=15
        for (let i = 0; i < 15; i++) {
            surveyRecords.push({
                surveyType: 'EXPERT_EVAL',
                respondentRole: 'Docente / Investigador Académico',
                companySize: selectRandom(sizes, [0.20, 0.40, 0.30, 0.10]),
                economicSector: 'Tecnología / Servicios Profesionales',
                experienceYears: selectRandom(['6 - 10 años', '> 10 años'], [0.40, 0.60]),
                academicDegree: selectRandom(['Maestría / MSc', 'Doctorado / PhD'], [0.60, 0.40]),
                answers: {
                    exp_1_weibull_theoretical_rigor: getLikert(4.7),
                    exp_2_causal_docalculus_validity: getLikert(4.8),
                    exp_3_dpsgd_privacy_guarantee: getLikert(4.5),
                    exp_4_morl_pareto_optimality: getLikert(4.6),
                    exp_5_rsi_gradient_descent_calibration: getLikert(4.5),
                    exp_7_haversine_passkey_security: getLikert(4.8),
                    exp_8_ecuador_labor_law_precision: getLikert(4.9),
                    exp_9_scientific_paper_contribution: getLikert(4.8),
                    comments: 'El marco desacoplado de Do-Calculus y DP-SGD posee rigor y valor académico relevante.'
                },
                isSynthetic: true,
                ipHash: 'seed-calibration',
                userAgent: 'Research-Seeder/1.0'
            });
        }

        await prisma.researchSurveyResponse.createMany({ data: surveyRecords });
        console.log('[RESEARCH_DATA] 75 encuestas del estudio sembradas con éxito en la BD.');
    }
}
