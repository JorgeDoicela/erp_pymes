/**
 * @file biometricDetector.js
 * @description Detección inteligente de capacidades biométricas y autenticador de plataforma (WebAuthn / Passkeys).
 * Identifica si el dispositivo cuenta con autenticador de plataforma activo y adapta la interfaz
 * según el hardware real disponible (Touch ID, Face ID, Windows Hello, huella Android o clave FIDO2).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

/**
 * Detecta si el dispositivo actual cuenta con un autenticador de plataforma disponible
 * y clasifica inteligentemente el tipo de hardware (Face ID, Touch ID, Windows Hello, etc.).
 *
 * @returns {Promise<{
 *   available: boolean,
 *   type: 'faceId' | 'touchId' | 'windowsHello' | 'fingerprint' | 'generic' | 'none',
 *   label: string,
 *   subtitle: string,
 *   platformName: string
 * }>}
 */
export async function detectDeviceBiometrics() {
  if (typeof window === 'undefined') {
    return { available: false, type: 'none', label: '', subtitle: '', platformName: 'Desconocido' };
  }

  // 1. Comprobar soporte de la API WebAuthn y el método de comprobación de plataforma
  const hasWebAuthn =
    Boolean(window.PublicKeyCredential) &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

  if (!hasWebAuthn) {
    return {
      available: false,
      type: 'none',
      label: '',
      subtitle: '',
      platformName: 'No soportado',
    };
  }

  try {
    // 2. Comprobar si el dispositivo cuenta con autenticador de plataforma activo
    const isPlatformAvailable =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    if (!isPlatformAvailable) {
      return {
        available: false,
        type: 'none',
        label: '',
        subtitle: '',
        platformName: 'Sin autenticador disponible',
      };
    }

    // 3. Inspección del entorno y hardware del dispositivo
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
    const isIPhone = /iPhone/.test(ua);
    const isIPad = /iPad/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
    const isMac =
      (/Macintosh|MacIntel|MacPPC|Mac68K/.test(platform) || /Mac OS X/.test(ua)) && !isIOS;
    const isWindows = /Win32|Win64|Windows|WinCE/.test(platform) || /Windows/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    // Dispositivos Apple iPhone (Face ID para pantallas alargadas sin botón físico / Touch ID para SE y modelos anteriores)
    if (isIPhone) {
      const screenRatio = window.screen.height / window.screen.width;
      if (screenRatio > 2.0) {
        return {
          available: true,
          type: 'faceId',
          label: 'Ingresar con Face ID',
          subtitle: 'Reconocimiento facial de Apple',
          platformName: 'Face ID',
        };
      }
      return {
        available: true,
        type: 'touchId',
        label: 'Ingresar con Touch ID',
        subtitle: 'Sensor dactilar de Apple',
        platformName: 'Touch ID',
      };
    }

    // Apple iPad
    if (isIPad) {
      return {
        available: true,
        type: 'touchId',
        label: 'Ingresar con Face ID o Touch ID',
        subtitle: 'Biometría de iPadOS',
        platformName: 'Biometría Apple',
      };
    }

    // Apple macOS (MacBooks con sensor Touch ID en teclado o Magic Keyboard)
    if (isMac) {
      return {
        available: true,
        type: 'touchId',
        label: 'Ingresar con Touch ID',
        subtitle: 'Sensor dactilar de Mac',
        platformName: 'Touch ID',
      };
    }

    // Equipos Windows 10/11 con Windows Hello
    if (isWindows) {
      return {
        available: true,
        type: 'windowsHello',
        label: 'Ingresar con Windows Hello',
        subtitle: 'Huella digital, reconocimiento facial o PIN',
        platformName: 'Windows Hello',
      };
    }

    // Dispositivos móviles Android
    if (isAndroid) {
      return {
        available: true,
        type: 'fingerprint',
        label: 'Ingresar con huella digital',
        subtitle: 'Sensor biométrico de Android',
        platformName: 'Huella Android',
      };
    }

    // Linux / ChromeOS y otros entornos estándar con autenticador de plataforma FIDO2
    return {
      available: true,
      type: 'generic',
      label: 'Ingresar con huella digital o rostro',
      subtitle: 'Autenticador de plataforma seguro',
      platformName: 'Autenticador de Plataforma',
    };
  } catch (error) {
    console.warn('[BiometricDetector] Verificación no disponible:', error);
    return {
      available: false,
      type: 'none',
      label: '',
      subtitle: '',
      platformName: 'Error de detección',
    };
  }
}
