import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const user = await prisma.employee.findFirst({
            where: { firstName: 'Diego' },
            include: { biometricCredentials: true }
        });
        if (user) {
            console.log(`Diego Credentials (${user.biometricCredentials.length}):`);
            user.biometricCredentials.forEach(c => {
                console.log(`- ID: ${c.credentialId}, Transports: ${c.transports}`);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
