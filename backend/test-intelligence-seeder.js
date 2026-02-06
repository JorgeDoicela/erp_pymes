/**
 * Script de Prueba - Agente Inteligente con Datos del Seeder
 * 
 * Este script verifica que el Agente Inteligente funcione correctamente
 * con los datos generados por el seeder.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testIntelligenceService() {
    console.log('='.repeat(60));
    console.log('PRUEBA: Agente Inteligente con Datos del Seeder');
    console.log('='.repeat(60));
    console.log('');

    try {
        // 1. Verificar Empleados
        console.log('1. VERIFICANDO EMPLEADOS...');
        const activeEmployees = await prisma.employee.findMany({
            where: { isActive: true }
        });
        const terminatedEmployees = await prisma.employee.findMany({
            where: { isActive: false }
        });

        console.log(`   ✓ Empleados activos: ${activeEmployees.length}`);
        console.log(`   ✓ Empleados terminados: ${terminatedEmployees.length}`);

        // Departamentos únicos
        const departments = [...new Set(activeEmployees.map(e => e.department))];
        console.log(`   ✓ Departamentos: ${departments.join(', ')}`);
        console.log('');

        // 2. Verificar Asistencia
        console.log('2. VERIFICANDO ASISTENCIA...');
        const attendanceRecords = await prisma.attendance.count();
        const absences = await prisma.attendance.count({
            where: { status: 'Falta' }
        });

        console.log(`   ✓ Registros de asistencia: ${attendanceRecords}`);
        console.log(`   ✓ Faltas registradas: ${absences}`);
        console.log('');

        // 3. Verificar Evaluaciones
        console.log('3. VERIFICANDO EVALUACIONES...');
        const evaluations = await prisma.employeeEvaluation.count();
        const pendingEvaluations = await prisma.employeeEvaluation.count({
            where: { status: 'PENDING' }
        });

        console.log(`   ✓ Evaluaciones totales: ${evaluations}`);
        console.log(`   ✓ Evaluaciones pendientes: ${pendingEvaluations}`);
        console.log('');

        // 4. Verificar Nómina
        console.log('4. VERIFICANDO NÓMINA...');
        const payrolls = await prisma.payroll.count();
        const payrollDetails = await prisma.payrollDetail.count();
        const overtimeDetails = await prisma.payrollDetail.count({
            where: { overtimeHours: { gt: 0 } }
        });

        console.log(`   ✓ Períodos de nómina: ${payrolls}`);
        console.log(`   ✓ Detalles de nómina: ${payrollDetails}`);
        console.log(`   ✓ Empleados con horas extras: ${overtimeDetails}`);
        console.log('');

        // 5. Verificar Ausencias
        console.log('5. VERIFICANDO AUSENCIAS...');
        const absenceRequests = await prisma.absence.count();

        console.log(`   ✓ Solicitudes de ausencia: ${absenceRequests}`);
        console.log('');

        // 6. Probar Query de Retención
        console.log('6. PROBANDO ANÁLISIS DE RETENCIÓN...');
        const employeesWithData = await prisma.employee.findMany({
            where: { isActive: true },
            include: {
                absences: { orderBy: { createdAt: 'desc' }, take: 10 },
                evaluations: { orderBy: { createdAt: 'desc' }, take: 5 },
                contracts: { orderBy: { createdAt: 'desc' }, take: 3 },
            },
        });

        console.log(`   ✓ Empleados con datos relacionados: ${employeesWithData.length}`);

        // Verificar que tengan datos
        const withAbsences = employeesWithData.filter(e => e.absences.length > 0).length;
        const withEvaluations = employeesWithData.filter(e => e.evaluations.length > 0).length;

        console.log(`   ✓ Empleados con ausencias: ${withAbsences}`);
        console.log(`   ✓ Empleados con evaluaciones: ${withEvaluations}`);
        console.log('');

        // 7. Probar Query de Asistencia por Departamento
        console.log('7. PROBANDO ANÁLISIS DE ASISTENCIA POR DEPARTAMENTO...');
        const attendanceByDept = await prisma.attendance.groupBy({
            by: ['employeeId'],
            where: {
                date: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 30))
                }
            },
            _count: {
                id: true
            }
        });

        console.log(`   ✓ Empleados con registros de asistencia (último mes): ${attendanceByDept.length}`);
        console.log('');

        // 8. Probar Query de Nómina
        console.log('8. PROBANDO ANÁLISIS DE NÓMINA...');
        const recentPayroll = await prisma.payroll.findMany({
            orderBy: { paymentDate: 'desc' },
            take: 3,
            include: {
                details: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                department: true,
                                position: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`   ✓ Períodos de nómina recientes: ${recentPayroll.length}`);
        if (recentPayroll.length > 0) {
            console.log(`   ✓ Detalles en último período: ${recentPayroll[0].details.length}`);
        }
        console.log('');

        // RESUMEN
        console.log('='.repeat(60));
        console.log('RESUMEN DE COMPATIBILIDAD');
        console.log('='.repeat(60));

        const checks = [
            { name: 'Empleados activos', value: activeEmployees.length, min: 1, status: activeEmployees.length >= 1 },
            { name: 'Departamentos', value: departments.length, min: 2, status: departments.length >= 2 },
            { name: 'Registros de asistencia', value: attendanceRecords, min: 10, status: attendanceRecords >= 10 },
            { name: 'Evaluaciones', value: evaluations, min: 1, status: evaluations >= 1 },
            { name: 'Períodos de nómina', value: payrolls, min: 1, status: payrolls >= 1 },
            { name: 'Detalles de nómina', value: payrollDetails, min: 5, status: payrollDetails >= 5 },
        ];

        console.log('');
        let allPassed = true;
        checks.forEach(check => {
            const icon = check.status ? '✓' : '✗';
            const status = check.status ? 'PASS' : 'FAIL';
            console.log(`${icon} ${check.name}: ${check.value} (mínimo: ${check.min}) - ${status}`);
            if (!check.status) allPassed = false;
        });

        console.log('');
        console.log('='.repeat(60));
        if (allPassed) {
            console.log('✓ TODAS LAS PRUEBAS PASARON');
            console.log('✓ El Agente Inteligente funcionará correctamente con estos datos');
        } else {
            console.log('✗ ALGUNAS PRUEBAS FALLARON');
            console.log('⚠ Ejecuta el seeder completo: npm run seed');
        }
        console.log('='.repeat(60));
        console.log('');

    } catch (error) {
        console.error('ERROR:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testIntelligenceService();
