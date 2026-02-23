import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import prisma from '../database/db.js';
import { isoUint8Array, isoBase64URL } from '@simplewebauthn/server/helpers';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = 'Emplifi RR.HH.';
// En producción (Vercel), ORIGIN debe ser HTTPS. En local con Vite, suele ser http://localhost:5173
const ORIGIN = process.env.ORIGIN || (RP_ID === 'localhost' ? 'http://localhost:5173' : `https://${RP_ID}`);

export const getBiometricStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const credentialsCount = await prisma.biometricCredential.count({
            where: { employeeId: userId }
        });

        res.json({
            isRegistered: credentialsCount > 0,
            count: credentialsCount
        });
    } catch (error) {
        console.error('[BIOMETRIC] Status Error:', error);
        res.status(500).json({ message: 'Error al obtener estado biométrico' });
    }
};

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
                // Ensure credentialId is a clean string
                let cleanId = cred.credentialId;
                if (typeof cleanId !== 'string') {
                    console.error(`[BIOMETRIC] Credential ${cred.id} has NON-STRING credentialId:`, typeof cleanId);
                    cleanId = String(cleanId);
                }

                cleanId = cleanId.trim().replace(/\s/g, ''); // Remove ANY whitespace/newlines

                if (!cleanId) {
                    console.error(`[BIOMETRIC] Credential ${cred.id} has empty/invalid credentialId`);
                    continue;
                }

                excludeCredentials.push({
                    id: isoBase64URL.toBuffer(cleanId),
                    type: 'public-key',
                    transports: cred.transports ? JSON.parse(cred.transports) : [],
                });
            } catch (innerErr) {
                console.error(`[BIOMETRIC] Failed to process cred ${cred.id}:`, innerErr.message);
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

            // Extract from nested 'credential' object if it exists (SimpleWebAuthn v12+)
            const credential = registrationInfo.credential || {};
            const credentialID = registrationInfo.credentialID || credential.id;
            const credentialPublicKey = registrationInfo.credentialPublicKey || credential.publicKey;
            const counter = registrationInfo.counter ?? credential.counter;

            // SimpleWebAuthn v13: credentialID and credentialPublicKey are often Uint8Arrays
            // Fallback to native Buffer if isoBase64URL returns empty
            let credIdStr = '';
            if (typeof credentialID === 'string') {
                credIdStr = credentialID; // Already base64url string
            } else if (credentialID) {
                credIdStr = isoBase64URL.fromBuffer(credentialID);
                if (!credIdStr) credIdStr = Buffer.from(credentialID).toString('base64url');
            }

            let pubKeyStr = '';
            if (credentialPublicKey) {
                // Si es un objeto serializado (como se vio en el debug log), lo convertimos a Uint8Array primero
                const pubKeyUint8 = (credentialPublicKey instanceof Uint8Array)
                    ? credentialPublicKey
                    : new Uint8Array(Object.values(credentialPublicKey));

                pubKeyStr = isoBase64URL.fromBuffer(pubKeyUint8);
                if (!pubKeyStr) pubKeyStr = Buffer.from(pubKeyUint8).toString('base64url');
            }

            console.log(`[BIOMETRIC] Verify Registration Step 4: Saving credential ${credIdStr?.substring(0, 10)}...`);

            if (!credIdStr || !pubKeyStr) {
                console.error('[BIOMETRIC] Critical: Generated empty strings from buffers', { credIdStr, pubKeyStr });
                try {
                    const errorLogPath = path.resolve(__dirname, '../../biometric_errors.log');
                    fs.appendFileSync(errorLogPath, `[${new Date().toISOString()}] EMPTY STRINGS: credIdStr="${credIdStr}", pubKeyStr="${pubKeyStr}"\n`);
                } catch (e) { }
                return res.status(500).json({ message: 'Error interno en la generación de credenciales' });
            }

            // Manejar constraint único: si ya existe, lo eliminamos para registrar el nuevo (limpieza de basura)
            const existingCred = await prisma.biometricCredential.findUnique({
                where: { credentialId: credIdStr }
            });

            if (existingCred) {
                console.log(`[BIOMETRIC] Credential ${credIdStr.substring(0, 10)}... already exists. Deleting old record.`);
                await prisma.biometricCredential.delete({ where: { id: existingCred.id } });
            }

            await prisma.biometricCredential.create({
                data: {
                    employeeId: userId,
                    credentialId: credIdStr,
                    publicKey: pubKeyStr,
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
        const errorDetail = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        console.error('[BIOMETRIC] verifyRegistration CATCH-ALL ERROR:', errorDetail);

        try {
            fs.appendFileSync('biometric_errors.log', JSON.stringify(errorDetail, null, 2) + '\n---\n');
        } catch (e) {
            console.error('[BIOMETRIC] Failed to write to log file:', e.message);
        }

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
        console.log(`[BIOMETRIC] Verify Auth Step 1: UserID ${internalUserId}`);

        const user = await prisma.employee.findUnique({
            where: { id: internalUserId },
            include: { biometricCredentials: true }
        });

        if (!user || !user.currentChallenge) {
            console.error(`[BIOMETRIC] No challenge or user found for ${internalUserId}`);
            return res.status(400).json({ message: 'Desafío no encontrado' });
        }

        const dbCred = user.biometricCredentials.find(c => c.credentialId === body.id);
        if (!dbCred) {
            console.error(`[BIOMETRIC] Credential ID mismatch: ${body.id} not in [${user.biometricCredentials.map(c => c.credentialId).join(', ')}]`);
            return res.status(404).json({ message: 'Credencial no reconocida' });
        }

        console.log(`[BIOMETRIC] Verifying authentication for user ${internalUserId}. Challenge: ${user.currentChallenge}, Origin: ${ORIGIN}, RP_ID: ${RP_ID}`);

        const authCredentialId = isoBase64URL.toBuffer(dbCred.credentialId);
        const authPublicKey = isoBase64URL.toBuffer(dbCred.publicKey);

        if (!authCredentialId || !authPublicKey) {
            console.error('[BIOMETRIC] Failed to convert base64 strings back to buffers');
            return res.status(500).json({ message: 'Error en la conversión de llaves almacenadas' });
        }

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response: body,
                expectedChallenge: user.currentChallenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
                credential: {
                    id: authCredentialId,
                    publicKey: authPublicKey,
                    counter: dbCred.counter,
                },
            });
        } catch (vErr) {
            console.error('[BIOMETRIC] verifyAuthenticationResponse THREW ERROR:', vErr);
            throw vErr;
        }

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
        const errorDetail = {
            context: 'verifyAuthentication',
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        console.error('[BIOMETRIC] verifyAuthentication CATCH-ALL ERROR:', errorDetail);

        try {
            const errorLogPath = path.resolve(__dirname, '../../biometric_errors.log');
            fs.appendFileSync(errorLogPath, JSON.stringify(errorDetail, null, 2) + '\n---\n');
        } catch (e) { }

        res.status(500).json({
            message: 'Error de verificación biométrica: ' + error.message,
            error: error.message
        });
    }
};
