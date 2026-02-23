import prisma from './src/database/db.js';

async function main() {
    const creds = await prisma.biometricCredential.findMany({
        include: { employee: true }
    });
    console.log(`Total Credentials: ${creds.length}`);
    creds.forEach(c => {
        console.log(`--- CREDENTIAL ---`);
        console.log(`User: ${c.employee.email}`);
        console.log(`credentialId type: ${typeof c.credentialId}`);
        console.log(`credentialId value: ${c.credentialId}`);
        console.log(JSON.stringify(c, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
