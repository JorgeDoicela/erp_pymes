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
        console.log(`[BIOMETRIC] Starting Registration Options for User: ${userId}`);

        const user = await prisma.employee.findUnique({
            where: { id: userId },
            include: { biometricCredentials: true }
        });

        if (!user) {
            console.error(`[BIOMETRIC] User ${userId} not found`);
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        // --- HARD TYPE SAFETY ---
        const rawUserId = String(user.id || '');
        const userIdentifier = isoUint8Array.fromUTF8String(rawUserId);

        const excludeCredentials = [];
        console.log(`[BIOMETRIC] Existing creds count: ${user.biometricCredentials.length}`);

        for (const cred of user.biometricCredentials) {
            try {
                if (!cred.credentialId) continue;

                // Force to string and clean
                const cid = String(cred.credentialId).trim().replace(/\s/g, '');
                if (!cid) continue;

                console.log(`[BIOMETRIC] Adding to exclude (string): ${cid.substring(0, 10)}...`);

                excludeCredentials.push({
                    id: cid,
                    type: 'public-key',
                    transports: Array.isArray(cred.transports)
                        ? cred.transports
                        : (typeof cred.transports === 'string' ? JSON.parse(cred.transports || '[]') : []),
                });
            } catch (innerErr) {
                console.warn(`[BIOMETRIC] Skipping malformed cred ${cred.id}:`, innerErr.message);
            }
        }

        const safeRpName = String(RP_NAME || 'Emplifi RR.HH.').trim();
        const safeRpId = String(RP_ID || 'localhost').trim();
        const safeEmail = String(user.email || 'user@example.com').trim();
        const safeDisplayName = String(`${user.firstName || ''} ${user.lastName || ''}`).trim() || 'Usuario';

        console.log('[BIOMETRIC] Final Options Payload Preparation...');

        const registrationOptions = {
            rpName: safeRpName,
            rpID: safeRpId,
            userID: userIdentifier,
            userName: safeEmail,
            userDisplayName: safeDisplayName,
            attestationType: 'none',
            excludeCredentials,
            authenticatorSelection: {
                residentKey: 'required',
                userVerification: 'required',
                authenticatorAttachment: 'platform',
            },
        };

        console.log('[BIOMETRIC] Calling generateRegistrationOptions with:', {
            rpID: registrationOptions.rpID,
            userName: registrationOptions.userName,
            display: registrationOptions.userDisplayName,
            excludeCount: excludeCredentials.length
        });

        // The actual call that might be failing
        let options;
        try {
            options = await generateRegistrationOptions(registrationOptions);
        } catch (libErr) {
            console.error('[BIOMETRIC] SimpleWebAuthn Library Error:', libErr.message);
            console.error('[BIOMETRIC] Stack:', libErr.stack);
            throw new Error(`Error interno en motor biométrico: ${libErr.message}`);
        }

        console.log('[BIOMETRIC] Options generated successfully. Challenge:', options.challenge.substring(0, 10) + '...');

        await prisma.employee.update({
            where: { id: userId },
            data: { currentChallenge: options.challenge }
        });

        res.json(options);
    } catch (error) {
        console.error('[BIOMETRIC] CRITICAL CATCH:', error.message);
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

        console.log(`[BIOMETRIC] Verify Registration for User: ${userId}`);

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
            const credential = registrationInfo.credential || {};

            const credentialID = registrationInfo.credentialID || credential.id;
            const credentialPublicKey = registrationInfo.credentialPublicKey || credential.publicKey;
            const counter = registrationInfo.counter ?? credential.counter;
            const aaguid = registrationInfo.aaguid; // Capture unique hardware ID

            let credIdStr = '';
            if (typeof credentialID === 'string') {
                credIdStr = credentialID;
            } else if (credentialID) {
                credIdStr = isoBase64URL.fromBuffer(credentialID);
            }

            let pubKeyStr = '';
            if (credentialPublicKey) {
                const pubKeyUint8 = (credentialPublicKey instanceof Uint8Array)
                    ? credentialPublicKey
                    : new Uint8Array(Object.values(credentialPublicKey));
                pubKeyStr = isoBase64URL.fromBuffer(pubKeyUint8);
            }

            if (!credIdStr || !pubKeyStr) {
                throw new Error('No se pudieron extraer los datos de la credencial');
            }

            // Cleanup old creds if conflict (unlikely but safe)
            await prisma.biometricCredential.deleteMany({
                where: { credentialId: credIdStr }
            });

            await prisma.biometricCredential.create({
                data: {
                    employeeId: userId,
                    credentialId: credIdStr,
                    publicKey: pubKeyStr,
                    aaguid: aaguid,
                    counter: counter,
                    transports: JSON.stringify(body.response.transports || []),
                    deviceInfo: req.headers['user-agent'],
                    lastVerified: new Date()
                }
            });

            await prisma.employee.update({
                where: { id: userId },
                data: { currentChallenge: null }
            });

            return res.json({ verified: true });
        }

        res.status(400).json({ verified: false, message: 'La verificación falló' });
    } catch (error) {
        console.error('[BIOMETRIC] Verify Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error al verificar registro biométrico: ' + error.message
        });
    }
};

export const getAuthenticationOptions = async (req, res) => {
    try {
        const { employeeId } = req.body;
        console.log(`[BIOMETRIC] Auth Options for: ${employeeId}`);

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

        if (!user || user.biometricCredentials.length === 0) {
            return res.status(404).json({ message: 'El usuario no tiene biometría registrada' });
        }

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            allowCredentials: user.biometricCredentials.map(cred => ({
                id: String(cred.credentialId).trim().replace(/\s/g, ''),
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
        console.error('[BIOMETRIC] Auth Options Error:', error.message);
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

        const cid = isoBase64URL.toBuffer(String(dbCred.credentialId).trim());
        const pub = isoBase64URL.toBuffer(String(dbCred.publicKey).trim());

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: cid,
                publicKey: pub,
                counter: dbCred.counter,
            },
        });

        if (verification.verified) {
            await prisma.biometricCredential.update({
                where: { id: dbCred.id },
                data: { counter: verification.authenticationInfo.newCounter }
            });

            await prisma.employee.update({
                where: { id: user.id },
                data: { currentChallenge: null }
            });

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
        console.error('[BIOMETRIC] Auth Verify Error:', error.message);
        res.status(500).json({ message: 'Error de verificación biométrica' });
    }
};
