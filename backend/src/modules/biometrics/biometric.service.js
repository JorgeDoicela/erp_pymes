/**
 * @file biometric.service.js
 * @description Norma ERP - Servicio de Autenticación Biométrica WebAuthn / FIDO2
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array, isoBase64URL } from '@simplewebauthn/server/helpers';
import jwt from 'jsonwebtoken';
import biometricRepository from './biometric.repository.js';

const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = 'Norma ERP';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : process.env.ORIGIN
    ? [process.env.ORIGIN]
    : RP_ID === 'localhost'
      ? ['http://localhost:5173', 'http://localhost:5174']
      : [`https://${RP_ID}`];

class BiometricHttpError extends Error {
  constructor(statusCode, payload) {
    super(payload.message || 'Error biométrico');
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export class BiometricService {
  async getBiometricStatus(userId) {
    const credentialsCount = await biometricRepository.countCredentialsByEmployee(userId);
    return {
      isRegistered: credentialsCount > 0,
      count: credentialsCount,
    };
  }

  async getRegistrationOptions(userId) {
    const user = await biometricRepository.findEmployeeWithCredentialsById(userId);
    if (!user) {
      throw new BiometricHttpError(404, { message: 'Empleado no encontrado' });
    }

    const rawUserId = String(user.id || '');
    const userIdentifier = isoUint8Array.fromUTF8String(rawUserId);

    const excludeCredentials = [];
    for (const cred of user.biometricCredentials) {
      try {
        if (!cred.credentialId) continue;
        const cid = String(cred.credentialId).trim().replace(/\s/g, '');
        if (!cid) continue;

        excludeCredentials.push({
          id: cid,
          type: 'public-key',
          transports: Array.isArray(cred.transports)
            ? cred.transports
            : typeof cred.transports === 'string'
              ? JSON.parse(cred.transports || '[]')
              : [],
        });
      } catch (innerErr) {
        console.warn(`[BIOMETRIC] Skipping malformed cred ${cred.id}:`, innerErr.message);
      }
    }

    const registrationOptions = {
      rpName: String(RP_NAME || 'Norma ERP').trim(),
      rpID: String(RP_ID || 'localhost').trim(),
      userID: userIdentifier,
      userName: String(user.email || 'user@example.com').trim(),
      userDisplayName:
        String(`${user.firstName || ''} ${user.lastName || ''}`).trim() || 'Usuario',
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
    };

    let options;
    try {
      options = await generateRegistrationOptions(registrationOptions);
    } catch (libErr) {
      console.error('[BIOMETRIC] SimpleWebAuthn Library Error:', libErr.message);
      throw new Error(`Error interno en motor biométrico: ${libErr.message}`);
    }

    await biometricRepository.updateChallenge(userId, options.challenge);
    return options;
  }

  async verifyRegistration(userId, body, deviceInfo) {
    const user = await biometricRepository.findEmployeeById(userId);
    if (!user || !user.currentChallenge) {
      throw new BiometricHttpError(400, { message: 'Desafío no encontrado o expirado' });
    }

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: ALLOWED_ORIGINS,
      expectedRPID: RP_ID,
    });

    if (!verification.verified) {
      throw new BiometricHttpError(400, { verified: false, message: 'La verificación falló' });
    }

    const { registrationInfo } = verification;
    const credential = registrationInfo.credential || {};

    const credentialID = registrationInfo.credentialID || credential.id;
    const credentialPublicKey = registrationInfo.credentialPublicKey || credential.publicKey;
    const counter = registrationInfo.counter ?? credential.counter;
    const aaguid = registrationInfo.aaguid;

    let credIdStr = '';
    if (typeof credentialID === 'string') {
      credIdStr = credentialID;
    } else if (credentialID) {
      credIdStr = isoBase64URL.fromBuffer(credentialID);
    }

    let pubKeyStr = '';
    if (credentialPublicKey) {
      const pubKeyUint8 =
        credentialPublicKey instanceof Uint8Array
          ? credentialPublicKey
          : new Uint8Array(Object.values(credentialPublicKey));
      pubKeyStr = isoBase64URL.fromBuffer(pubKeyUint8);
    }

    if (!credIdStr || !pubKeyStr) {
      throw new Error('No se pudieron extraer los datos de la credencial');
    }

    await biometricRepository.deleteCredentialsByCredentialId(credIdStr);
    await biometricRepository.createCredential({
      employeeId: userId,
      credentialId: credIdStr,
      publicKey: pubKeyStr,
      aaguid,
      counter,
      transports: JSON.stringify(body.response?.transports || []),
      deviceInfo,
      lastVerified: new Date(),
    });
    await biometricRepository.updateChallenge(userId, null);

    return { verified: true };
  }

  async getAuthenticationOptions(employeeId) {
    const user = await biometricRepository.findEmployeeWithCredentialsByIdentifier(employeeId);
    if (!user || user.biometricCredentials.length === 0) {
      throw new BiometricHttpError(404, { message: 'El usuario no tiene biometría registrada' });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: user.biometricCredentials.map((cred) => ({
        id: String(cred.credentialId).trim().replace(/\s/g, ''),
        type: 'public-key',
        transports: cred.transports ? JSON.parse(cred.transports) : [],
      })),
      userVerification: 'required',
    });

    await biometricRepository.updateChallenge(user.id, options.challenge);
    return { ...options, internalUserId: user.id };
  }

  async verifyAuthentication(body, internalUserId) {
    const user = await biometricRepository.findEmployeeWithCredentialsById(internalUserId);
    if (!user || !user.currentChallenge) {
      throw new BiometricHttpError(400, { message: 'Desafío no encontrado' });
    }

    const dbCred = user.biometricCredentials.find((c) => c.credentialId === body.id);
    if (!dbCred) {
      throw new BiometricHttpError(404, { message: 'Credencial no reconocida' });
    }

    const cid = isoBase64URL.toBuffer(String(dbCred.credentialId).trim());
    const pub = isoBase64URL.toBuffer(String(dbCred.publicKey).trim());

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: ALLOWED_ORIGINS,
      expectedRPID: RP_ID,
      credential: {
        id: cid,
        publicKey: pub,
        counter: dbCred.counter,
      },
    });

    if (!verification.verified) {
      throw new BiometricHttpError(400, { verified: false });
    }

    const { newCounter } = verification.authenticationInfo;

    if (newCounter > 0 && newCounter <= dbCred.counter) {
      await biometricRepository.deleteCredentialsByEmployee(user.id);
      throw new BiometricHttpError(401, {
        verified: false,
        requiresReRegistration: true,
        message: 'Se detectó un problema de seguridad. Regístrate nuevamente para continuar.',
      });
    }

    const MAX_DAYS = parseInt(process.env.BIOMETRIC_MAX_AGE_DAYS || '90', 10);
    const credAgeMs = Date.now() - new Date(dbCred.createdAt).getTime();
    const credAgeDays = credAgeMs / (1000 * 60 * 60 * 24);
    if (credAgeDays > MAX_DAYS) {
      await biometricRepository.deleteCredentialsByEmployee(user.id);
      throw new BiometricHttpError(401, {
        verified: false,
        requiresReRegistration: true,
        message: `Tu registro biométrico expiró (${MAX_DAYS} días). Por seguridad, debes volver a configurarlo.`,
      });
    }

    await biometricRepository.updateCredentialVerification(dbCred.id, newCounter);
    await biometricRepository.updateChallenge(user.id, null);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      process.env.JWT_SECRET || 'secret_key_change_me',
      { expiresIn: '1d' }
    );

    return {
      verified: true,
      success: true,
      token,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export default new BiometricService();

