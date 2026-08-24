import { getRandomElement } from './utils.js';
import { decryptSalary } from '../../src/utils/encryption.js';

export async function seedCoreRecords(prisma, employees) {
    console.log('[CORE] Generando Registros Core en Lote (Contratos, Skills, Horarios)...');

    let shiftMorning = await prisma.shift.findFirst({ where: { name: 'Matutino' } });
    if (!shiftMorning) {
        shiftMorning = await prisma.shift.create({ data: { name: 'Matutino', startTime: '08:00', endTime: '17:00' } });
    }

    const contractsBatch = [];
    const schedulesBatch = [];
    const skillsBatch = [];
    const historyBatch = [];
    const assetsBatch = [];

    const techAssetsPool = [
        { name: 'Laptop Lenovo ThinkPad T14 Gen 4 Core i7 32GB', category: 'EQUIPMENT', prefix: 'LEN-T14' },
        { name: 'Monitor Dell UltraSharp 27" 4K USB-C Hub', category: 'EQUIPMENT', prefix: 'DEL-U27' },
        { name: 'Kit Teclado y Mouse Ergonómico Logitech MX', category: 'TOOL', prefix: 'LOG-MX' },
        { name: 'Tarjeta de Acceso RFID Piso Tecnológico', category: 'ACCESS_CARD', prefix: 'RFID-TEC' }
    ];

    const opsAssetsPool = [
        { name: 'Casco de Seguridad Dieléctrico 3M Clase E', category: 'UNIFORM_PPE', prefix: '3M-CSC' },
        { name: 'Chaleco de Alta Visibilidad Norma INEN', category: 'UNIFORM_PPE', prefix: 'PPE-CHL' },
        { name: 'Botas de Seguridad Industrial con Puntera', category: 'UNIFORM_PPE', prefix: 'PPE-BOT' },
        { name: 'Lector Handheld Zebra TC21 Barcode/QR', category: 'TOOL', prefix: 'ZEB-TC' },
        { name: 'Tarjeta RFID Puerta Acceso Bodega y Planta', category: 'ACCESS_CARD', prefix: 'RFID-OPS' }
    ];

    const corpAssetsPool = [
        { name: 'Laptop HP EliteBook 840 G9 Core i5 16GB', category: 'EQUIPMENT', prefix: 'HP-840' },
        { name: 'Smartphone Corporativo Samsung Galaxy A54', category: 'EQUIPMENT', prefix: 'SAM-A54' },
        { name: 'Mochila Ejecutiva Porta-Laptop Impermeable', category: 'TOOL', prefix: 'DOT-MCH' },
        { name: 'Credencial Magnética Acceso Edificio Corporativo', category: 'ACCESS_CARD', prefix: 'RFID-CORP' }
    ];

    for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const decSal = decryptSalary(emp.salary) || 1500;
        
        let contractEndDate = null;
        if (!emp.isActive) {
            contractEndDate = emp.exitDate || new Date();
        } else if (emp.contractType === 'Temporal' || emp.contractType === 'Plazo Fijo' || emp.contractType === 'Eventual') {
            if (emp.email === 'kevin.arismendi@emplifi.com') {
                contractEndDate = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000); // 12 días restantes (urgente)
            } else if (emp.email === 'esteban.suarez@emplifi.com') {
                contractEndDate = new Date(Date.now() + 27 * 24 * 60 * 60 * 1000); // 27 días restantes (moderado)
            } else {
                const daysRemaining = 35 + ((emp.id.charCodeAt(0) * 7) % 20);
                contractEndDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
            }
        }
        
        contractsBatch.push({
            employeeId: emp.id,
            type: emp.contractType || 'Indefinido',
            startDate: emp.hireDate || new Date('2020-01-01'),
            endDate: contractEndDate,
            salary: decSal,
            status: emp.isActive ? 'Active' : 'Terminated'
        });

        // Activos asignados según departamento
        let pool = corpAssetsPool;
        if (emp.department === 'Tecnología') pool = techAssetsPool;
        else if (emp.department === 'Operaciones' || emp.department === 'Logística' || emp.department === 'Producción') pool = opsAssetsPool;

        // Asignar entre 2 y 3 activos por colaborador
        const assetCount = 2 + (i % 2);
        for (let a = 0; a < assetCount; a++) {
            const template = pool[a % pool.length];
            const serialNumber = `SN-${template.prefix}-${(1000 + i * 10 + a)}`;
            
            // Variar estados para poblar todas las pestañas de la vista (Custodia, Devuelto, Dañado)
            let status = 'DELIVERED';
            let condition = 'GOOD';
            let returnDate = null;
            let returnNotes = null;

            if (!emp.isActive) {
                status = 'RETURNED';
                condition = 'GOOD';
                returnDate = emp.exitDate || new Date('2026-07-01');
                returnNotes = 'Devolución completa de activos por proceso de offboarding/finiquito.';
            } else if (i === 3 && a === 1) {
                status = 'RETURNED';
                condition = 'GOOD';
                returnDate = new Date('2026-06-10');
                returnNotes = 'Devolución por recambio tecnológico programado.';
            } else if (i === 7 && a === 0) {
                status = 'LOST_DAMAGED';
                condition = 'FAIR';
                returnNotes = 'Fisura en pantalla por impacto accidental durante traslado. Derivado a soporte técnico.';
            } else if (i === 12 && a === 1) {
                status = 'LOST_DAMAGED';
                condition = 'FAIR';
                returnNotes = 'Deterioro de costura por uso continuo en planta. Pendiente reposición de EPP.';
            }

            assetsBatch.push({
                employeeId: emp.id,
                name: template.name,
                serialNumber,
                category: template.category,
                deliveryDate: emp.hireDate || new Date('2023-01-15'),
                condition,
                status,
                returnDate,
                returnNotes,
                receiptSignatureUrl: null
            });
        }

        if (!emp.isActive) continue;

        schedulesBatch.push({
            employeeId: emp.id,
            shiftId: shiftMorning.id,
            startDate: emp.hireDate || new Date('2020-01-01'),
            daysOfWeek: JSON.stringify(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"])
        });

        skillsBatch.push(
            { employeeId: emp.id, name: 'Trabajo en Equipo', level: 'Advanced' },
            { employeeId: emp.id, name: 'Comunicación Efectiva', level: 'Intermediate' },
            { employeeId: emp.id, name: 'Resolución de Problemas', level: getRandomElement(['Intermediate', 'Advanced']) }
        );

        historyBatch.push({
            employeeId: emp.id,
            company: 'Experiencia Previa Corporativa',
            position: emp.position || 'Especialista',
            startDate: new Date('2018-01-01'),
            endDate: new Date('2020-01-01'),
            description: 'Desempeño en proyectos previos del sector.'
        });
    }

    if (contractsBatch.length > 0) {
        await prisma.contract.createMany({ data: contractsBatch, skipDuplicates: true });
    }
    if (assetsBatch.length > 0) {
        await prisma.employeeAsset.createMany({ data: assetsBatch, skipDuplicates: true });
    }
    if (schedulesBatch.length > 0) {
        await prisma.employeeSchedule.createMany({ data: schedulesBatch, skipDuplicates: true });
    }
    if (skillsBatch.length > 0) {
        await prisma.skill.createMany({ data: skillsBatch, skipDuplicates: true });
    }
    if (historyBatch.length > 0) {
        await prisma.workHistory.createMany({ data: historyBatch, skipDuplicates: true });
    }

    console.log(`Registros core optimizados creados (${assetsBatch.length} activos/EPPs sembrados).`);
}
