import { PrismaClient } from '@prisma/client';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';

const prisma = new PrismaClient();

async function testOptions() {
    try {
        console.log('Testing getRegistrationOptions logic...');
        // Use Diego as test subject
        const user = await prisma.employee.findFirst({
            where: { firstName: 'Diego' },
            include: { biometricCredentials: true }
        });

        if (!user) {
            console.error('User Diego not found');
            return;
        }

        console.log(`Found user: ${user.email}`);

        const userIdentifier = isoUint8Array.fromUTF8String(user.id);
        console.log('User identifier converted to Uint8Array');

        const options = await generateRegistrationOptions({
            rpName: 'Emplifi RR.HH.',
            rpID: 'localhost',
            userID: userIdentifier,
            userName: user.email,
            userDisplayName: `${user.firstName} ${user.lastName}`,
            attestationType: 'none',
            excludeCredentials: user.biometricCredentials.map(cred => ({
                id: cred.credentialId,
                type: 'public-key',
                transports: cred.transports ? JSON.parse(cred.transports) : [],
            })),
            authenticatorSelection: {
                residentKey: 'required',
                userVerification: 'required',
                authenticatorAttachment: 'platform',
            },
        });

        console.log('Registration options generated successfully');

        // Test update to DB
        console.log('Testing DB update for challenge...');
        await prisma.employee.update({
            where: { id: user.id },
            data: { currentChallenge: options.challenge }
        });
        console.log('DB update successful');

        console.log(JSON.stringify(options, null, 2));

    } catch (error) {
        console.error('DIAGNOSTIC FAILED:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testOptions();
