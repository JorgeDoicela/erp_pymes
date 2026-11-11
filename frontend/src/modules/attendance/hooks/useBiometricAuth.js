/**
 * @file useBiometricAuth.js
 * @description Hook especializado para autenticación biométrica y WebAuthn (FIDO2 / Passkeys).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { systemService } from '@modules/superadmin';
import { detectDeviceBiometrics } from '@core/utils';

export function useBiometricAuth() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [deviceBiometrics, setDeviceBiometrics] = useState({
    available: false,
    type: 'none',
    label: '',
    platformName: 'Desconocido',
  });
  const [hasBiometricRegistered, setHasBiometricRegistered] = useState(null);
  const [registeringBiometric, setRegisteringBiometric] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBiometricSetting = async () => {
      try {
        const res = await systemService.getBiometricSetting();
        if (isMounted) setBiometricEnabled(res.biometricEnabled ?? false);
      } catch {
        if (isMounted) setBiometricEnabled(false);
      }
    };

    const fetchBiometricStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/biometric/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && isMounted) {
          setHasBiometricRegistered(Boolean(res.data.isRegistered));
        }
      } catch {
        // Silently catch
      }
    };

    const checkSupport = async () => {
      try {
        const bioInfo = await detectDeviceBiometrics();
        if (isMounted) {
          setDeviceBiometrics(bioInfo);
          setBiometricSupported(bioInfo.available);
        }
      } catch {
        if (isMounted) {
          setBiometricSupported(false);
          setDeviceBiometrics({
            available: false,
            type: 'none',
            label: '',
            platformName: 'No soportado',
          });
        }
      }
    };

    fetchBiometricSetting();
    fetchBiometricStatus();
    checkSupport();

    return () => {
      isMounted = false;
    };
  }, []);

  const registerBiometric = useCallback(async () => {
    setRegisteringBiometric(true);
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const optionsRes = await axios.get(
        `${import.meta.env.VITE_API_URL || '/api'}/biometric/register/options`,
        config
      );
      const options = optionsRes.data;

      const { startRegistration } = await import('@simplewebauthn/browser');
      const regResp = await startRegistration({ optionsJSON: options });

      const verifyRes = await axios.post(
        `${import.meta.env.VITE_API_URL || '/api'}/biometric/register/verify`,
        regResp,
        config
      );

      if (verifyRes.data.verified) {
        setHasBiometricRegistered(true);
        return { success: true };
      } else {
        return { success: false, message: 'No se pudo verificar la credencial biométrica.' };
      }
    } catch (err) {
      console.error('Biometric registration error:', err);
      let msg = err.response?.data?.message || err.message || 'Error al registrar biometría.';
      if (err.name === 'NotAllowedError') {
        msg =
          'La operación fue cancelada por el usuario o expiró el tiempo de espera del lector biométrico.';
      } else if (err.name === 'InvalidStateError') {
        msg = 'Esta credencial biométrica ya se encuentra registrada en este dispositivo.';
        setHasBiometricRegistered(true);
      } else if (err.name === 'NotSupportedError') {
        msg = 'Este navegador o dispositivo no soporta autenticación biométrica WebAuthn.';
      }
      return { success: false, message: msg };
    } finally {
      setRegisteringBiometric(false);
    }
  }, []);

  const triggerBiometric = useCallback(
    async (userId) => {
      if (!biometricSupported) {
        return {
          passed: false,
          reason: 'Este dispositivo no tiene seguridad biométrica configurada.',
        };
      }

      try {
        const optionsRes = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/biometric/login/options`,
          { employeeId: userId }
        );

        const options = optionsRes.data;
        const { startAuthentication } = await import('@simplewebauthn/browser');
        const { internalUserId, ...webauthnOptions } = options;
        const asseResp = await startAuthentication({ optionsJSON: webauthnOptions });

        const verifyRes = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/biometric/login/verify`,
          {
            body: asseResp,
            internalUserId: options.internalUserId,
          }
        );

        if (verifyRes.data.verified) {
          return { passed: true };
        } else {
          return { passed: false, reason: 'Error de verificación biométrica.' };
        }
      } catch (err) {
        console.error('Biometric verification error:', err);
        const data = err.response?.data;
        if (data?.requiresReRegistration) {
          return {
            passed: false,
            reason:
              data.message ||
              'Tu biometría ha cambiado. Ve a tu perfil y vuelve a configurar tu huella para continuar.',
          };
        }
        const msg = data?.message || 'Error al verificar identidad.';
        return { passed: false, reason: msg };
      }
    },
    [biometricSupported]
  );

  return {
    biometricEnabled,
    setBiometricEnabled,
    biometricSupported,
    deviceBiometrics,
    hasBiometricRegistered,
    setHasBiometricRegistered,
    registeringBiometric,
    registerBiometric,
    triggerBiometric,
  };
}

export default useBiometricAuth;
