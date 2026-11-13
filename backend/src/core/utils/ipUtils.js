/**
 * @file ipUtils.js
 * @description Norma ERP - Utilidades canónicas de extracción, normalización, validación y coincidencia CIDR/IP
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV4_CIDR_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\/([0-9]|[12]\d|3[0-2])$/;
const IPV4_WILDCARD_REGEX =
  /^(\*|(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))(\.(\*|(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))){3}$/;

export function normalizeIp(rawIp) {
  if (!rawIp || typeof rawIp !== 'string') return '';
  let ip = rawIp.trim();
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  if (ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
}

export function extractClientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  const raw = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded || req?.ip || req?.socket?.remoteAddress || '';
  return normalizeIp(raw);
}

function ipv4ToInt(ip) {
  const parts = ip.split('.').map(Number);
  return (
    ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0)
  );
}

export function isValidIpRule(rule) {
  const clean = normalizeIp(rule);
  if (!clean) return false;
  return (
    IPV4_REGEX.test(clean) ||
    IPV4_CIDR_REGEX.test(clean) ||
    IPV4_WILDCARD_REGEX.test(clean) ||
    clean.includes(':')
  );
}

export function parseAllowedIps(allowedIPsRaw) {
  if (!allowedIPsRaw || typeof allowedIPsRaw !== 'string') return [];
  return allowedIPsRaw
    .split(',')
    .map((entry) => normalizeIp(entry))
    .filter(Boolean);
}

export function validateAllowedIps(allowedIPsRaw) {
  const entries = parseAllowedIps(allowedIPsRaw);
  const invalid = entries.filter((entry) => !isValidIpRule(entry));
  if (invalid.length > 0) {
    throw new Error(`Formato de IP o rango CIDR inválido: ${invalid.join(', ')}`);
  }
  return entries.length > 0 ? [...new Set(entries)].join(', ') : null;
}

function matchesCidr(clientIp, cidrRule) {
  if (!IPV4_REGEX.test(clientIp)) return false;
  const [networkIp, prefixRaw] = cidrRule.split('/');
  const prefix = Number(prefixRaw);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipv4ToInt(clientIp) & mask) === (ipv4ToInt(networkIp) & mask);
}

function matchesWildcard(clientIp, wildcardRule) {
  if (!IPV4_REGEX.test(clientIp)) return false;
  const clientParts = clientIp.split('.');
  const ruleParts = wildcardRule.split('.');
  return ruleParts.every((part, index) => part === '*' || part === clientParts[index]);
}

export function isIpAllowed(clientIpRaw, allowedIPsRaw) {
  const clientIp = normalizeIp(clientIpRaw);
  if (!clientIp) return false;
  const rules = parseAllowedIps(allowedIPsRaw);
  if (rules.length === 0) return true;

  return rules.some((rule) => {
    if (rule === clientIp) return true;
    if (IPV4_CIDR_REGEX.test(rule)) return matchesCidr(clientIp, rule);
    if (rule.includes('*') && IPV4_WILDCARD_REGEX.test(rule)) {
      return matchesWildcard(clientIp, rule);
    }
    return false;
  });
}
