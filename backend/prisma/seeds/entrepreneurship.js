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
            milestones: {
                create: [
                    { title: 'Validación de algoritmov1', dueDate: new Date('2026-04-20'), status: 'COMPLETED' },
                    { title: 'Lanzamiento de piloto con 5 camiones', dueDate: new Date('2026-06-15'), status: 'IN_PROGRESS' },
                    { title: 'Ronda Semilla de $50k', dueDate: new Date('2026-09-01'), status: 'PENDING' }
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
            milestones: {
                create: [
                    { title: 'Certificación médica básica', dueDate: new Date('2026-05-30'), status: 'IN_PROGRESS' },
                    { title: 'Pruebas de campo en clínica regional', dueDate: new Date('2026-08-10'), status: 'PENDING' }
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
            milestones: {
                create: [
                    { title: 'Diseño de prototipo en Figma', dueDate: new Date('2026-03-30'), status: 'COMPLETED' },
                    { title: 'Focus group con padres y educadores', dueDate: new Date('2026-05-15'), status: 'PENDING' }
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
            milestones: {
                create: [
                    { title: 'Alianza con Federación de Agricultores', dueDate: new Date('2026-02-15'), status: 'COMPLETED' },
                    { title: 'Expansión al mercado colombiano', dueDate: new Date('2026-11-20'), status: 'PENDING' }
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
