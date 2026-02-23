import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import prisma from '../database/db.js';
import { isoUint8Array, isoBase64URL } from '@simplewebauthn/server/helpers';

const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = 'Emplifi RR.HH.';
const ORIGIN = process.env.ORIGIN || `http://${RP_ID}:5173`;

export const getRegistrationOptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.employee.findUnique({
            where: { id: userId },
            include: { biometricCredentials: true }
        });

        if (!user) return res.status(404).json({ message: 'Empleado no encontrado' });

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: user.id,
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

        // Guardar el challenge para verificar después
        await prisma.employee.update({
            where: { id: userId },
            data: { currentChallenge: options.challenge }
        });

        res.json(options);
    } catch (error) {
        console.error('Registration Options Error:', error);
        res.status(500).json({ message: 'Error al generar opciones de registro' });
    }
};

export const verifyRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const { body } = req;

        const user = await prisma.employee.findUnique({ where: { id: userId } });
        if (!user || !user.currentChallenge) {
            return res.status(400).json({ message: 'Desafío no encontrado o expirado' });
        }

        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
        });

        if (verification.verified) {
            const { registrationInfo } = verification;
            const { credentialPublicKey, credentialID, counter } = registrationInfo;

            await prisma.biometricCredential.create({
                data: {
                    employeeId: userId,
                    credentialId: isoBase64URL.fromBuffer(credentialID),
                    publicKey: isoBase64URL.fromBuffer(credentialPublicKey),
                    counter: counter,
                    transports: JSON.stringify(body.response.transports || []),
                    deviceInfo: req.headers['user-agent']
                }
            });

            // Limpiar challenge
            await prisma.employee.update({
                where: { id: userId },
                data: { currentChallenge: null }
            });

            return res.json({ verified: true });
        }

        res.status(400).json({ verified: false, message: 'La verificación falló' });
    } catch (error) {
        console.error('Verify Registration Error:', error);
        res.status(500).json({ message: 'Error al verificar registro biométrico' });
    }
};

export const getAuthenticationOptions = async (req, res) => {
    try {
        const { employeeId } = req.body; // Puede ser ID o Cédula
        // Resolver empleado (reutilizar lógica de resolveEmployeeId si es posible o manual)
        const user = await prisma.employee.findFirst({
            where: {
                OR: [{ id: employeeId }, { identityCard: employeeId }]
            },
            include: { biometricCredentials: true }
        });

        if (!user || user.biometricCredentials.length === 0) {
            return res.status(404).json({ message: 'El usuario no tiene biometría registrada' });
        }

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            allowCredentials: user.biometricCredentials.map(cred => ({
                id: cred.credentialId,
                type: 'public-key',
                transports: cred.transports ? JSON.parse(cred.transports) : [],
            })),
            userVerification: 'required',
        });

        await prisma.employee.update({
            where: { id: user.id },
            data: { currentChallenge: options.challenge }
        });

        res.json({ ...options, internalUserId: user.id });
    } catch (error) {
        console.error('Authentication Options Error:', error);
        res.status(500).json({ message: 'Error al generar opciones de autenticación' });
    }
};

export const verifyAuthentication = async (req, res) => {
    try {
        const { body, internalUserId } = req.body;
        const user = await prisma.employee.findUnique({
            where: { id: internalUserId },
            include: { biometricCredentials: true }
        });

        if (!user || !user.currentChallenge) {
            return res.status(400).json({ message: 'Desafío no encontrado' });
        }

        const dbCred = user.biometricCredentials.find(c => c.credentialId === body.id);
        if (!dbCred) return res.status(404).json({ message: 'Credencial no reconocida' });

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            authenticator: {
                credentialID: isoBase64URL.toBuffer(dbCred.credentialId),
                credentialPublicKey: isoBase64URL.toBuffer(dbCred.publicKey),
                counter: dbCred.counter,
            },
        });

        if (verification.verified) {
            // "Bank Style": Detect if counter hasn't increased if expected, 
            // though platform authenticators often return 0.
            await prisma.biometricCredential.update({
                where: { id: dbCred.id },
                data: { counter: verification.authenticationInfo.newCounter }
            });

            await prisma.employee.update({
                where: { id: user.id },
                data: { currentChallenge: null }
            });

            return res.json({ verified: true });
        }

        res.status(400).json({ verified: false });
    } catch (error) {
        console.error('Verify Auth Error:', error);
        res.status(500).json({ message: 'Error de verificación biométrica' });
    }
};
