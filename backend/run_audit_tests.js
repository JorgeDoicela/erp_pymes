import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';

async function runTests() {
    console.log('🚀 Iniciando pruebas de Auditoría (RNF-14)...');

    try {
        // 1. Probar Login Fallido
        console.log('\n--- Test 1: Intento de Login Fallido ---');
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: 'test_audit@example.com',
                password: 'wrongpassword'
            });
        } catch (error) {
            console.log('✅ Intento de login fallido simulado');
        }

        // 2. Login Correcto para obtener Token (Admin)
        console.log('\n--- Test 2: Login Correcto (Admin) ---');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@emplifi.com',
            password: 'Admin12345'
        });
        const token = loginRes.data.token;
        const adminId = loginRes.data.user.id;
        console.log(`✅ Login exitoso. Admin ID: ${adminId}`);

        // 3. Actualizar un Empleado
        console.log('\n--- Test 3: Actualizar Empleado ---');
        // Buscamos el primer empleado que no sea el admin
        const employee = await prisma.employee.findFirst({
            where: { NOT: { id: adminId } }
        });

        if (employee) {
            const newPhone = '999999999';
            await axios.put(`${API_URL}/employees/${employee.id}`,
                { phone: newPhone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`✅ Empleado ${employee.id} actualizado.`);
        }

        // 4. Verificar Logs en DB
        console.log('\n--- Test 4: Verificando Logs Generados ---');
        // Esperamos un segundo para asegurar que se procesen las promesas asíncronas de auditoría si las hay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const recentLogs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 5
        });

        console.log('\nRegistros de Auditoría Encontrados:');
        recentLogs.forEach(log => {
            console.log(`[${log.timestamp.toISOString()}] ${log.entity} | ${log.action} | Por: ${log.performedBy}`);
            console.log(`Detalles: ${log.details.substring(0, 100)}...`);
            console.log('---');
        });

        const hasFailedLogin = recentLogs.some(l => l.action === 'FAILED_LOGIN');
        const hasEmployeeUpdate = recentLogs.some(l => l.entity === 'Employee' && l.action === 'UPDATE');

        if (hasFailedLogin && hasEmployeeUpdate) {
            console.log('\n🏆 ¡PRUEBAS COMPLETADAS CON ÉXITO!');
            console.log('El sistema está registrando correctamente las acciones críticas.');
        } else {
            console.log('\n⚠️ ADVERTENCIA: Algunos logs esperados no fueron encontrados.');
            if (!hasFailedLogin) console.log('- Falta log de FAILED_LOGIN');
            if (!hasEmployeeUpdate) console.log('- Falta log de Employee UPDATE');
        }

    } catch (error) {
        console.error('\n❌ ERROR DURANTE LAS PRUEBAS:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    } finally {
        await prisma.$disconnect();
    }
}

runTests();
