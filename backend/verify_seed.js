import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('🔍 Verificando integridad de datos...');

    try {
        // 1. Check Employees
        const employeeCount = await prisma.employee.count();
        console.log(`\n👥 Total Empleados: ${employeeCount} (Esperado: 11)`);

        const admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
        console.log(`   - Admin: ${admin ? '✅ Encontrado' : '❌ NO ENCONTRADO'}`);

        const testEmp = await prisma.employee.findUnique({ where: { email: 'andres.morales@emplifi.com' } });
        console.log(`   - Empleado Test (Andrés): ${testEmp ? '✅ Encontrado' : '❌ NO ENCONTRADO'}`);

        // 2. Check Attendance
        const attendanceCount = await prisma.attendance.count();
        console.log(`\n📅 Registros de Asistencia Totales: ${attendanceCount} (Esperado: > 400)`);

        // Verificar que NO haya asistencia de HOY
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayAttendance = await prisma.attendance.count({
            where: {
                date: {
                    gte: todayStart,
                    lte: todayEnd
                }
            }
        });
        console.log(`\n🚫 Asistencias de HOY: ${todayAttendance} (Esperado: 0) ${todayAttendance === 0 ? '✅ CORRECTO' : '❌ ERROR: Hay registros de hoy'}`);

        if (testEmp) {
            const empAttendance = await prisma.attendance.count({ where: { employeeId: testEmp.id } });
            console.log(`   - Asistencias de Andrés (Total): ${empAttendance}`);
        }

        // 3. Check Payroll
        const payrollCount = await prisma.payroll.count();
        console.log(`\n💰 Nóminas Generadas: ${payrollCount} (Esperado: > 0)`);

        // 4. Check Core Records
        const contracts = await prisma.contract.count();
        console.log(`\n📄 Contratos: ${contracts} (Esperado: 11)`);

        const schedules = await prisma.employeeSchedule.count();
        console.log(`⏰ Horarios: ${schedules} (Esperado: 11)`);

    } catch (e) {
        console.error('❌ Error verificando:', e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
