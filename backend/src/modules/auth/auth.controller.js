/**
 * @file auth.controller.js
 * @description Norma ERP - Controlador de Autenticación
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import authService from './auth.service.js';

export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json(error.payload);
    }
    console.error('[AUTH ERROR] Login Exception:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor: ' + error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const origin =
      req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
    const result = await authService.forgotPassword(req.body.email, origin);
    res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json(error.payload);
    }
    console.error('[AUTH ERROR] Forgot Password:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json(error.payload);
    }
    console.error('[AUTH ERROR] Reset Password:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
  }
};
