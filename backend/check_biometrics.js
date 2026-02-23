import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function check() {
    try {
        const credentials = await prisma.biometricCredential.findMany({
            include: { employee: true }
        });
        let output = `Encontradas ${credentials.length} credenciales biométricas.\n`;
        credentials.forEach(c => {
            output += `- Empleado: ${c.employee.email}, Rol: ${c.employee.role}, Posición: ${c.employee.position}\n`;
        });
        fs.writeFileSync('biometric_status.log', output);
        console.log('Resultados guardados en biometric_status.log');
    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
