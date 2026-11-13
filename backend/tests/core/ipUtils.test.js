import { describe, it, expect } from 'vitest';
import {
  normalizeIp,
  extractClientIp,
  validateAllowedIps,
  isIpAllowed,
} from '../../src/core/utils/ipUtils.js';

describe('ipUtils — Normalización, validación y coincidencia CIDR/IP', () => {
  it('normaliza IPv6 mapeado, loopback y cabeceras x-forwarded-for con múltiples IPs', () => {
    expect(normalizeIp('::ffff:192.168.1.25')).toBe('192.168.1.25');
    expect(normalizeIp('::1')).toBe('127.0.0.1');
    expect(normalizeIp('201.12.3.4, 10.0.0.1')).toBe('201.12.3.4');

    const extracted = extractClientIp({
      headers: { 'x-forwarded-for': '186.4.12.9, 10.0.0.2' },
      socket: { remoteAddress: '10.0.0.2' },
    });
    expect(extracted).toBe('186.4.12.9');
  });

  it('valida, deduplica y normaliza listas de IPs y rangos CIDR', () => {
    expect(validateAllowedIps('  192.168.1.10 , 192.168.1.0/24 , 192.168.1.10 ')).toBe(
      '192.168.1.10, 192.168.1.0/24'
    );
    expect(validateAllowedIps('   ')).toBeNull();
    expect(() => validateAllowedIps('999.168.1.1')).toThrow('Formato de IP o rango CIDR inválido');
  });

  it('verifica coincidencia exacta, por subred CIDR y por comodín', () => {
    const rules = '200.10.20.5, 192.168.10.0/24, 10.20.*.*';

    expect(isIpAllowed('200.10.20.5', rules)).toBe(true);
    expect(isIpAllowed('::ffff:192.168.10.88', rules)).toBe(true);
    expect(isIpAllowed('10.20.4.15', rules)).toBe(true);
    expect(isIpAllowed('192.168.11.5', rules)).toBe(false);
    expect(isIpAllowed('', rules)).toBe(false);
  });
});
