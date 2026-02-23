import prisma from './src/database/db.js';

async function diagnose() {
    try {
        const creds = await prisma.biometricCredential.findMany({
            include: { employee: true }
        });
        console.log(`Found ${creds.length} credentials.`);
        creds.forEach((c, index) => {
            console.log(`\n--- CREDENTIAL ${index} ---`);
            console.log(`ID: ${c.id}`);
            console.log(`Employee: ${c.employee.email}`);
            console.log(`Type: ${typeof c.credentialId}`);
            console.log(`Value (Hex): ${Buffer.from(c.credentialId, 'utf8').toString('hex')}`);
            console.log(`Value (JSON): ${JSON.stringify(c.credentialId)}`);
            console.log(`Length: ${c.credentialId?.length}`);
        });
    } catch (err) {
        console.error('Diagnosis failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
