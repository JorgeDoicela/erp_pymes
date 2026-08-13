export async function seedResearchData(prisma) {
    console.log('[RESEARCH_DATA] Inicializando módulos de IA (RSI, Causal AI, MORL, Privacidad Diferencial) para ambas empresas...');

    const tenants = await prisma.tenant.findMany({
        where: { slug: { in: ['empresa-demo', 'tech-solutions'] } }
    });

    for (const tenant of tenants) {
        const tenantId = tenant.id;

        // 1. Presupuesto de Privacidad Diferencial (DP-FL)
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

        // 2. Calibración RSI (Retention Risk Index)
        const existingCalibration = await prisma.rsiCalibration.findFirst({ where: { tenantId } });
        if (!existingCalibration) {
            await prisma.rsiCalibration.create({
                data: {
                    tenantId,
                    epoch: 1,
                    brierScore: 0.0450,  // Baseline calibrado del modelo Weibull propuesto
                    logLoss: 0.1560,
                    improvementPercentage: 0,
                    weightsJson: JSON.stringify({
                        beta_salary: -0.85, beta_absence: 0.35, beta_perf: 1.10,
                        beta_no_promo: 0.25, k_weibull: 1.25, lambda_weibull: 48,
                        weight_retention: 0.25, weight_performance: 0.25,
                        weight_attendance: 0.20, weight_growth: 0.15, weight_engagement: 0.15
                    }),
                    sampleCount: 0,
                    triggerReason: 'INITIALIZATION'
                }
            });
        }

        // 3. Auditorías Predictivas RSI y Resultados Resueltos
        const tenantEmployees = await prisma.employee.findMany({
            where: { tenantId, isActive: true },
            take: 5
        });

        for (let idx = 0; idx < tenantEmployees.length; idx++) {
            const emp = tenantEmployees[idx];
            const predictedScore = 35 + idx * 10;

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
                        actualOutcome: idx % 2 === 0 ? 0 : 1,
                        resolvedAt: new Date(Date.now() - (idx + 1) * 7 * 24 * 60 * 60 * 1000)
                    }
                });
            }
        }

        // 4. Intervenciones Causales (Causal AI Engine)
        const existingIntervention = await prisma.causalIntervention.findFirst({ where: { tenantId } });
        if (!existingIntervention) {
            await prisma.causalIntervention.create({
                data: {
                    tenantId,
                    title: 'Ajuste Salarial Preventivo del 10% (Experimento Inicial)',
                    treatmentType: 'SALARY_INCREASE',
                    treatmentValue: 10.0,
                    targetDepartment: 'ALL',
                    sampleSize: Math.max(tenantEmployees.length, 1),
                    ate: -0.0271,          // ATE de -2.71% (reducción de rotación)
                    baselineTurnoverRate: 0.216,
                    counterfactualTurnoverRate: 0.189,
                    costEstimate: 32820.0,
                    savingsEstimate: 2594.15,
                    netRoi: -30225.85,
                    confidenceIntervalLower: -0.0316,
                    confidenceIntervalUpper: -0.0226
                }
            });
        }

        // 5. Corridas MORL (Multi-Objective Reinforcement Learning)
        const existingPolicy = await prisma.morlPolicyRun.findFirst({ where: { tenantId } });
        if (!existingPolicy) {
            const policyRun = await prisma.morlPolicyRun.create({
                data: {
                    tenantId,
                    title: 'Optimización de Política Salarial vs Retención Q3',
                    budgetLimit: 5000.0,
                    targetDepartment: 'Tecnología',
                    sampleSize: tenantEmployees.length,
                    hyperparametersJson: JSON.stringify({ alpha: 0.1, gamma: 0.99, epsilon: 0.05, episodes: 500 }),
                    paretoFrontierJson: JSON.stringify([
                        { retentionGain: 0.22, cost: 1500 },
                        { retentionGain: 0.28, cost: 2800 }
                    ]),
                    selectedPointIndex: 0
                }
            });

            await prisma.paretoFrontierPoint.createMany({
                data: [
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.7,
                        weightCost: 0.3,
                        totalCostEstimate: 1500.0,
                        expectedRetentionRate: 0.88,
                        retainedEmployeeCount: 4,
                        policyActionsJson: JSON.stringify({ action: 'SALARY_BOOST', amount: 150 })
                    },
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.5,
                        weightCost: 0.5,
                        totalCostEstimate: 2800.0,
                        expectedRetentionRate: 0.92,
                        retainedEmployeeCount: 5,
                        policyActionsJson: JSON.stringify({ action: 'SALARY_BOOST', amount: 250 })
                    }
                ]
            });
        }

        console.log(`✅ Motor IA y datos de investigación configurados para ${tenant.name}.`);
    }
}
