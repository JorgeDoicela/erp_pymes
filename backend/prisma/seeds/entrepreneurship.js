export async function seedEntrepreneurship(prisma, employees, admin) {
    console.log('🚀 Iniciando seeder de Emprendimiento (Incubadora)...');

    if (!employees || employees.length === 0) {
        console.warn('⚠️ No hay empleados para vincular proyectos. Usando admin.');
    }

    const projects = [
        {
            title: 'EcoLogistics AI',
            description: 'Plataforma de optimización de rutas para reducir la huella de carbono en la última milla utilizando redes neuronales.',
            industry: 'GreenTech',
            stage: 'MVP',
            valuation: 150000,
            equityAvailable: 85,
            ownerId: employees[0]?.id || admin.id,
            pitchNarrative: 'Nuestra plataforma utiliza inteligencia artificial para encontrar las rutas más eficientes para camiones eléctricos, reduciendo costos operativos en un 30% y eliminando el desperdicio de combustible. Tenemos un mercado claro de empresas de logística en Latam.',
            growthMRR: 2500,
            growthUsers: 120,
            growthCAC: 45,
            growthLTV: 1500,
            milestones: {
                create: [
                    { title: 'Validación de algoritmo v1', dueDate: new Date('2026-04-20'), status: 'COMPLETED', kanbanColumn: 'DONE' },
                    { title: 'Lanzamiento de piloto con 5 camiones', dueDate: new Date('2026-06-15'), status: 'IN_PROGRESS', kanbanColumn: 'IN_PROGRESS' },
                    { title: 'Ronda Semilla de $50k', dueDate: new Date('2026-09-01'), status: 'PENDING', kanbanColumn: 'BACKLOG' }
                ]
            },
            equities: {
                create: [
                    { holderName: 'Admin Inc.', percentage: 10, role: 'INVESTOR' },
                    { holderName: 'Juan Perez', percentage: 5, role: 'ADVISOR' }
                ]
            },
            fundingRounds: {
                create: [
                    { roundName: 'Pre-Seed', amountRaised: 25000, date: new Date('2025-12-10'), valuation: 100000 }
                ]
            },
            interviews: {
                create: [
                    { customerName: 'Logistics Manager @ DHL', feedback: 'Muy interesados en la reducción de huella de carbono. El costo es secundario si cumplimos KPIs de sostenibilidad.', sentiment: 'POSITIVE', insights: 'Centrarse en el reporte de ESG.' }
                ]
            },
            targetMarket: {
                create: { tam: 500000000, sam: 120000000, som: 15000000 }
            },
            updates: {
                create: [
                    { title: 'MVP Liberado', content: 'Hemos desplegado la primera versión de la plataforma en AWS.', type: 'MILESTONE' }
                ]
            }
        },
        {
            title: 'HealthSync Wearables',
            description: 'Dispositivos inteligentes integrados con el sistema de salud para monitoreo preventivo de pacientes crónicos.',
            industry: 'HealthTech',
            stage: 'VALIDATION',
            valuation: 320000,
            equityAvailable: 90,
            ownerId: employees[1]?.id || admin.id,
            pitchNarrative: 'Salvamos vidas detectando arritmias antes de que ocurran mediante hardware propietario de bajo costo y una red de telemedicina instantánea.',
            growthMRR: 0,
            growthUsers: 85,
            growthCAC: 60,
            growthLTV: 2400,
            milestones: {
                create: [
                    { title: 'Certificación médica básica', dueDate: new Date('2026-05-30'), status: 'IN_PROGRESS', kanbanColumn: 'IN_PROGRESS' },
                    { title: 'Pruebas de campo en clínica regional', dueDate: new Date('2026-08-10'), status: 'PENDING', kanbanColumn: 'BACKLOG' }
                ]
            },
            mentors: {
                create: [
                    { mentorName: 'Dr. Roberto Gomez', specialty: 'Cardiología / IoT', employeeId: employees[5]?.id }
                ]
            },
            interviews: {
                create: [
                    { customerName: 'Dr. Ana Soto', feedback: 'El dispositivo es cómodo. Necesitamos integración con software de hospitales locales.', sentiment: 'NEUTRAL', insights: 'Priorizar APIs de interoperabilidad.' }
                ]
            }
        },
        {
            title: 'FinEd for Kids',
            description: 'Aplicación gamificada para enseñar educación financiera real a niños mediante micro-inversiones simuladas.',
            industry: 'EdTech / Fintech',
            stage: 'IDEATION',
            valuation: 50000,
            equityAvailable: 100,
            ownerId: employees[2]?.id || admin.id,
            pitchNarrative: 'Hacemos que los niños aprendan a ahorrar e invertir jugando. Cada logro educativo se convierte en una simulación real de cómo funciona el mercado financiero.',
            growthMRR: 0,
            growthUsers: 0,
            growthCAC: 0,
            growthLTV: 0,
            milestones: {
                create: [
                    { title: 'Diseño de prototipo en Figma', dueDate: new Date('2026-03-30'), status: 'COMPLETED', kanbanColumn: 'DONE' },
                    { title: 'Focus group con padres y educadores', dueDate: new Date('2026-05-15'), status: 'PENDING', kanbanColumn: 'BACKLOG' }
                ]
            }
        },
        {
            title: 'AgroScanner Pro',
            description: 'Software de análisis de cultivos mediante drones e IA para detección temprana de plagas y estrés hídrico.',
            industry: 'AgriTech',
            stage: 'SCALING',
            valuation: 850000,
            equityAvailable: 70,
            ownerId: employees[3]?.id || admin.id,
            pitchNarrative: 'Revolucionamos la agricultura de precisión con drones que detectan el estrés hídrico antes de que sea visible al ojo humano. Nuestra tecnología ahorra millones en pérdidas de cosechas y optimiza el uso de agua en un 40%.',
            growthMRR: 12500,
            growthUsers: 450,
            growthCAC: 120,
            growthLTV: 4500,
            milestones: {
                create: [
                    { title: 'Alianza con Federación de Agricultores', dueDate: new Date('2026-02-15'), status: 'COMPLETED', kanbanColumn: 'DONE' },
                    { title: 'Expansión al mercado colombiano', dueDate: new Date('2026-11-20'), status: 'PENDING', kanbanColumn: 'IN_PROGRESS' }
                ]
            },
            equities: {
                create: [
                    { holderName: 'AgroVentures LP', percentage: 20, role: 'INVESTOR' },
                    { holderName: 'CTO Founder', percentage: 10, role: 'FOUNDER' }
                ]
            },
            fundingRounds: {
                create: [
                    { roundName: 'Seed A', amountRaised: 150000, date: new Date('2025-05-20'), valuation: 750000 },
                    { roundName: 'Bridge Round', amountRaised: 50000, date: new Date('2026-01-10'), valuation: 850000 }
                ]
            },
            updates: {
                create: [
                    { title: 'Expansión Regional', content: 'Iniciamos operaciones en 3 nuevas provincias.', type: 'GENERAL' },
                    { title: 'Nuevo Sensor de Humedad', content: 'Integración de Hardware v2 completada.', type: 'TECH' }
                ]
            }
        }
    ];

    for (const projectData of projects) {
        await prisma.entrepreneurship.create({
            data: projectData
        });
    }

    console.log(`✅ ${projects.length} proyectos de emprendimiento creados.`);
}
