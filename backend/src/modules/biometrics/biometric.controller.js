/**
 * @file biometric.controller.js
 * @description Norma ERP - Controlador de Autenticación Biométrica WebAuthn / FIDO2
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import biometricService from './biometric.service.js';

export const getBiometricStatus = async (req, res) => {
  try {
    const result = await biometricService.getBiometricStatus(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[BIOMETRIC] Status Error:', error);
    res.status(error.statusCode || 500).json(
      error.payload || { message: 'Error al obtener estado biométrico' }
    );
  }
};

export const getRegistrationOptions = async (req, res) => {
  try {
    const options = await biometricService.getRegistrationOptions(req.user.id);
    res.json(options);
  } catch (error) {
    console.error('[BIOMETRIC] Registration Options Error:', error.message);
    res.status(error.statusCode || 500).json(
      error.payload || {
        success: false,
        message: 'Error al generar opciones de registro: ' + error.message,
        error: error.message,
      }
    );
  }
};

export const verifyRegistration = async (req, res) => {
  try {
    const result = await biometricService.verifyRegistration(
      req.user.id,
      req.body,
      req.headers['user-agent']
    );
    return res.json(result);
  } catch (error) {
    console.error('[BIOMETRIC] Verify Error:', error.message);
    res.status(error.statusCode || 500).json(
      error.payload || {
        success: false,
        message: 'Error al verificar registro biométrico: ' + error.message,
      }
    );
  }
};

export const getAuthenticationOptions = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const result = await biometricService.getAuthenticationOptions(employeeId);
    res.json(result);
  } catch (error) {
    console.error('[BIOMETRIC] Auth Options Error:', error.message);
    res.status(error.statusCode || 500).json(
      error.payload || { message: 'Error al generar opciones de autenticación' }
    );
  }
};

export const verifyAuthentication = async (req, res) => {
  try {
    const { body, internalUserId } = req.body;
    const result = await biometricService.verifyAuthentication(body, internalUserId);
    return res.json(result);
  } catch (error) {
    console.error('[BIOMETRIC] Auth Verify Error:', error.message);
    res.status(error.statusCode || 500).json(
      error.payload || { message: 'Error de verificación biométrica' }
    );
  }
};

