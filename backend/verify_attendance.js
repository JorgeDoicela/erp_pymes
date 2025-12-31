import prisma from './src/database/db.js';
import { attendanceService } from './src/services/attendance/attendanceService.js';

async function main() {
    console.log('--- Iniciando Verificación de Asistencia ---');

    // 1. Crear un empleado de prueba
    console.log('1. Creando empleado de prueba...');
    const employee = await prisma.employee.create({
        data: {
            firstName: 'Test',
            lastName: 'User',
            email: `test.attendance.${Date.now()}@example.com`,
            department: 'IT',
            position: 'Developer',
            identityCard: `ID-${Date.now()}`,
            birthDate: new Date(),
            address: 'Test Address',
            phone: '1234567890',
            hireDate: new Date(),
            contractType: 'Indefinido',
            civilStatus: 'Single',
            salary: 'encrypted_salary',
            password: 'hashed_password',
        }
    });
    console.log('   Empleado creado:', employee.id);

    // 2. Registrar Entrada
    console.log('\n2. Registrando Entrada...');
    try {
        const entry = await attendanceService.registerAttendance(employee.id, 'ENTRY');
        console.log('   Entrada Exitosa:', entry.message);
        if (!entry.record.checkIn) throw new Error('No se guardó el checkIn');
    } catch (error) {
        console.error('   Error en Entrada:', error.message);
    }

    // 3. Intentar Entrada Duplicada (debe fallar)
    console.log('\n3. Verificando prevención de doble entrada...');
    try {
        await attendanceService.registerAttendance(employee.id, 'ENTRY');
        console.error('   FALLO: Permitió doble entrada');
    } catch (error) {
        console.log('   Éxito: Bloqueó doble entrada -', error.message);
    }

    // 4. Registrar Salida (simulando paso del tiempo si fuera necesario, pero aquí será inmediato)
    console.log('\n4. Registrando Salida...');
    // Simular que la entrada fue hace 1 hora para ver cálculo
    // Hack: update checkIn in DB manually
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    await prisma.attendance.updateMany({
        where: { employeeId: employee.id },
        data: { checkIn: oneHourAgo }
    });
    console.log('   (Simulando que entró hace 1 hora...)');

    try {
        const exit = await attendanceService.registerAttendance(employee.id, 'EXIT');
        console.log('   Salida Exitosa:', exit.message);
        console.log(`   Horas Trabajadas: ${exit.workedHours} (Esperado: ~1.0)`);
    } catch (error) {
        console.error('   Error en Salida:', error.message);
    }

    // 5. Verificar Estado Final
    const status = await attendanceService.getStatus(employee.id);
    console.log('\n5. Estado Final:', status.status); // Debería ser COMPLETED

    // Limpieza
    console.log('\nLimpiando datos de prueba...');
    await prisma.employee.delete({ where: { id: employee.id } });
    console.log('--- Verificación Completada ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
