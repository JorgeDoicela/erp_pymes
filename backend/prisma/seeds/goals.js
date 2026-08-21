export async function seedGoals(prisma, employees) {
    console.log('[GOALS] Generando Objetivos (Goals)...');

    const currentYear = new Date().getFullYear();
    const goalsBatch = [];

    for (const emp of employees) {
        if (!emp.isActive) continue;

        const dept = emp.department || '';

        if (dept.includes('Tecnolog') || dept.includes('Desarrollo') || dept.includes('Infraestructura')) {
            goalsBatch.push(
                {
                    employeeId: emp.id,
                    title: 'Aumentar cobertura de pruebas unitarias',
                    description: 'Alcanzar el 85% de cobertura de código en endpoints críticos de la API',
                    metric: 'Coverage %',
                    targetValue: 85,
                    currentValue: 72,
                    unit: '%',
                    deadline: new Date(`${currentYear}-12-31`),
                    priority: 'HIGH',
                    status: 'IN_PROGRESS',
                    progress: 75
                },
                {
                    employeeId: emp.id,
                    title: 'Optimización de latencia en consultas PUG',
                    description: 'Reducir el tiempo de respuesta p95 a menos de 150ms',
                    metric: 'ms',
                    targetValue: 150,
                    currentValue: 180,
                    unit: 'ms',
                    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                    priority: 'HIGH',
                    status: 'IN_PROGRESS',
                    progress: 60
                }
            );
        } else if (dept.includes('Venta') || dept.includes('Comercial')) {
            goalsBatch.push(
                {
                    employeeId: emp.id,
                    title: 'Superar cuota trimestral de ventas B2B',
                    description: 'Alcanzar $45,000 en nuevas cuentas empresariales',
                    metric: 'Facturación USD',
                    targetValue: 45000,
                    currentValue: 38500,
                    unit: 'USD',
                    deadline: new Date(`${currentYear}-12-31`),
                    priority: 'HIGH',
                    status: 'IN_PROGRESS',
                    progress: 85
                },
                {
                    employeeId: emp.id,
                    title: 'Tasa de retención de clientes clave',
                    description: 'Mantener churn rate por debajo del 3% en cartera asignada',
                    metric: 'Retención %',
                    targetValue: 97,
                    currentValue: 96,
                    unit: '%',
                    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    priority: 'MEDIUM',
                    status: 'IN_PROGRESS',
                    progress: 90
                }
            );
        } else if (dept.includes('Recursos Humanos') || dept.includes('Talento')) {
            goalsBatch.push(
                {
                    employeeId: emp.id,
                    title: 'Reducción de Time-to-Hire',
                    description: 'Cerrar procesos de selección en un promedio de 15 días hábiles',
                    metric: 'Días',
                    targetValue: 15,
                    currentValue: 17,
                    unit: 'Días',
                    deadline: new Date(`${currentYear}-10-31`),
                    priority: 'HIGH',
                    status: 'IN_PROGRESS',
                    progress: 80
                },
                {
                    employeeId: emp.id,
                    title: 'Implementación del Plan de Capacitación 2026',
                    description: 'Lograr 90% de participación en talleres de liderazgo y seguridad',
                    metric: 'Asistencia %',
                    targetValue: 90,
                    currentValue: 78,
                    unit: '%',
                    deadline: new Date(`${currentYear}-12-15`),
                    priority: 'MEDIUM',
                    status: 'IN_PROGRESS',
                    progress: 70
                }
            );
        } else if (dept.includes('Finanza') || dept.includes('Contab')) {
            goalsBatch.push(
                {
                    employeeId: emp.id,
                    title: 'Cierre Contable y Tributario Mensual',
                    description: 'Entregar balances y formularios SRI dentro de los primeros 5 días hábiles',
                    metric: 'Días hábiles',
                    targetValue: 5,
                    currentValue: 4,
                    unit: 'Días',
                    deadline: new Date(`${currentYear}-12-31`),
                    priority: 'HIGH',
                    status: 'COMPLETED',
                    progress: 100
                },
                {
                    employeeId: emp.id,
                    title: 'Auditoría y Conciliación de Cuentas por Pagar',
                    description: 'Mantener saldo conciliado al 100% con proveedores',
                    metric: 'Conciliación %',
                    targetValue: 100,
                    currentValue: 98,
                    unit: '%',
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    priority: 'HIGH',
                    status: 'IN_PROGRESS',
                    progress: 95
                }
            );
        } else {
            goalsBatch.push(
                {
                    employeeId: emp.id,
                    title: 'Eficiencia en Operaciones y Entregables',
                    description: 'Cumplir el 95% de los acuerdos de nivel de servicio (SLA)',
                    metric: 'SLA %',
                    targetValue: 95,
                    currentValue: 92,
                    unit: '%',
                    deadline: new Date(`${currentYear}-12-31`),
                    priority: 'HIGH',
                    status: 'IN_PROGRESS',
                    progress: 88
                },
                {
                    employeeId: emp.id,
                    title: 'Optimización de Procesos Internos',
                    description: 'Digitalizar y automatizar 3 flujos manuales recurrentes',
                    metric: 'Procesos',
                    targetValue: 3,
                    currentValue: 2,
                    unit: 'Flujos',
                    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    priority: 'MEDIUM',
                    status: 'IN_PROGRESS',
                    progress: 66
                }
            );
        }
    }

    if (goalsBatch.length > 0) {
        await prisma.employeeGoal.createMany({ data: goalsBatch, skipDuplicates: true });
    }
}
