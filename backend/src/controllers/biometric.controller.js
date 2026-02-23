import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import prisma from '../database/db.js';
import { isoUint8Array, isoBase64URL } from '@simplewebauthn/server/helpers';
import jwt from 'jsonwebtoken';

const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = 'Emplifi RR.HH.';
// En producción (Vercel), ORIGIN debe ser HTTPS. En local con Vite, suele ser http://localhost:5173
const ORIGIN = process.env.ORIGIN || (RP_ID === 'localhost' ? 'http://localhost:5173' : `https://${RP_ID}`);

export const getRegistrationOptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.employee.findUnique({
            where: { id: userId },
            include: { biometricCredentials: true }
        });

        if (!user) return res.status(404).json({ message: 'Empleado no encontrado' });

        // SimpleWebAuthn requiere que el userID sea un Uint8Array
        const userIdentifier = isoUint8Array.fromUTF8String(user.id);

        const excludeCredentials = [];
        for (const cred of user.biometricCredentials) {
            try {
                console.log(`[BIOMETRIC] Processing exclusion for cred: ${cred.id}`);
                if (!cred.credentialId) {
                    console.error(`[BIOMETRIC] Credential ${cred.id} has NO credentialId`);
                    continue;
                }
                excludeCredentials.push({
                    id: isoBase64URL.toBuffer(cred.credentialId),
                    type: 'public-key',
                    transports: cred.transports ? JSON.parse(cred.transports) : [],
                });
            } catch (innerErr) {
                console.error(`[BIOMETRIC] Failed to process cred ${cred.id}:`, innerErr.message);
                // Continue with others
            }
        }

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: userIdentifier,
            userName: user.email,
            userDisplayName: `${user.firstName} ${user.lastName}`,
            attestationType: 'none',
            excludeCredentials,
            authenticatorSelection: {
                residentKey: 'required',
                userVerification: 'required',
                authenticatorAttachment: 'platform',
            },
        });

        console.log('[BIOMETRIC] Options generated. Saving challenge to user:', userId);

        // Guardar el challenge para verificar después
        await prisma.employee.update({
            where: { id: userId },
            data: { currentChallenge: options.challenge }
        });

        console.log('[BIOMETRIC] Challenge saved successfully.');
        res.json(options);
    } catch (error) {
        console.error('[BIOMETRIC] Registration Options Error DETAILS:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Error al generar opciones de registro: ' + error.message,
            error: error.message
        });
    }
};

export const verifyRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const { body } = req;

        console.log(`[BIOMETRIC] Verify Registration Step 1: UserID ${userId}`);

        const user = await prisma.employee.findUnique({ where: { id: userId } });
        if (!user) {
            console.error(`[BIOMETRIC] User ${userId} not found in DB`);
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (!user.currentChallenge) {
            console.error(`[BIOMETRIC] No challenge found for user ${userId}`);
            return res.status(400).json({ message: 'Desafío no encontrado o expirado' });
        }

        console.log(`[BIOMETRIC] Verify Registration Step 2: Challenge found: ${user.currentChallenge}`);
        console.log(`[BIOMETRIC] Origin: ${ORIGIN}, RP_ID: ${RP_ID}`);

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge: user.currentChallenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
            });
        } catch (vErr) {
            console.error('[BIOMETRIC] verifyRegistrationResponse THREW ERROR:', vErr);
            return res.status(400).json({
                verified: false,
                message: 'Fallo crítico en verificación: ' + vErr.message,
                error: vErr.message
            });
        }

        console.log('[BIOMETRIC] Verify Registration Step 3: Verification result:', verification.verified);

        if (verification.verified) {
            const { registrationInfo } = verification;
            const { credentialPublicKey, credentialID, counter } = registrationInfo;

            const credIdStr = isoBase64URL.fromBuffer(credentialID);
            console.log(`[BIOMETRIC] Verify Registration Step 4: Saving credential ${credIdStr}...`);

            // Manejar constraint único: si ya existe, lo eliminamos para registrar el nuevo (limpieza de basura)
            const existingCred = await prisma.biometricCredential.findUnique({
                where: { credentialId: credIdStr }
            });

            if (existingCred) {
                console.log(`[BIOMETRIC] Credential ${credIdStr} already exists. Deleting old record before re-creating.`);
                await prisma.biometricCredential.delete({ where: { id: existingCred.id } });
            }

            await prisma.biometricCredential.create({
                data: {
                    employeeId: userId,
                    credentialId: credIdStr,
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

            console.log('[BIOMETRIC] Verify Registration Step 5: SUCCESS');
            return res.json({ verified: true });
        }

        console.error('[BIOMETRIC] Verification failed according to library');
        res.status(400).json({ verified: false, message: 'La verificación falló' });
    } catch (error) {
        console.error('[BIOMETRIC] verifyRegistration CATCH-ALL ERROR:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error al verificar registro biométrico: ' + error.message,
            error: error.message
        });
    }
};

export const getAuthenticationOptions = async (req, res) => {
    try {
        const { employeeId } = req.body; // Puede ser ID o Cédula
        console.log(`[BIOMETRIC] Get Auth Options for: "${employeeId}"`);

        const user = await prisma.employee.findFirst({
            where: {
                OR: [
                    { id: employeeId },
                    { identityCard: employeeId },
                    { email: employeeId }
                ]
            },
            include: { biometricCredentials: true }
        });

        if (!user) {
            console.warn(`[BIOMETRIC] User not found for: "${employeeId}"`);
            return res.status(404).json({ message: 'El usuario no tiene biometría registrada' });
        }

        if (user.biometricCredentials.length === 0) {
            console.warn(`[BIOMETRIC] User found (${user.email}) but NO biometrics registered.`);
            return res.status(404).json({ message: 'El usuario no tiene biometría registrada' });
        }

        console.log(`[BIOMETRIC] Found user: ${user.email} with ${user.biometricCredentials.length} credentials.`);

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
        res.status(500).json({
            message: 'Error al generar opciones de autenticación',
            error: error.message
        });
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

        console.log(`[BIOMETRIC] Verifying authentication for user ${internalUserId}. Challenge: ${user.currentChallenge}, Origin: ${ORIGIN}, RP_ID: ${RP_ID}`);

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

        console.log('[BIOMETRIC] Authentication verification result:', verification.verified);

        if (verification.verified) {
            await prisma.biometricCredential.update({
                where: { id: dbCred.id },
                data: { counter: verification.authenticationInfo.newCounter }
            });

            await prisma.employee.update({
                where: { id: user.id },
                data: { currentChallenge: null }
            });

            // Generar Token para inicio de sesión real
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'secret_key_change_me',
                { expiresIn: '1d' }
            );

            return res.json({
                verified: true,
                success: true,
                token,
                data: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                }
            });
        }

        res.status(400).json({ verified: false });
    } catch (error) {
        console.error('Verify Auth Error:', error);
        res.status(500).json({
            message: 'Error de verificación biométrica',
            error: error.message
        });
    }
};
