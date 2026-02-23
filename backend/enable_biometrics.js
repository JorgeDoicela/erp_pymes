import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: { biometricEnabled: true },
            create: { id: 'default', biometricEnabled: true }
        });
        console.log('✅ Biometría habilitada globalmente en el sistema.');
    } catch (e) {
        console.error('Error enabling biometrics:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
