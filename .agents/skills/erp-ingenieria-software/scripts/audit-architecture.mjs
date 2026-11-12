#!/usr/bin/env node
/**
 * @file audit-architecture.mjs
 * @description Auditoría arquitectónica estática de Norma ERP. Verifica límites de líneas por tipo de
 * archivo, imports profundos entre dominios (backend y frontend), uso de Prisma fuera de la capa de
 * persistencia, uso directo de axios/fetch en el frontend y console.log en código de backend.
 *
 * Uso:
 *   node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs
 *   node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs --files backend/src/x.js frontend/src/y.jsx
 *   node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs --strict   (exit 1 si hay errores)
 *   node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs --errors-only
 *
 * @author Jorge Doicela
 * @license Proprietary
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../../../..');
const BACKEND_SRC = path.join(REPO_ROOT, 'backend', 'src');
const FRONTEND_SRC = path.join(REPO_ROOT, 'frontend', 'src');

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'data', 'uploads', '__snapshots__']);

/** Excepción documentada en erp-ingenieria-software (ciclos ESM en rutas). */
const ALLOWED_CROSS_MODULE_TARGETS = new Set([
  'auth/auth.middleware.js',
  'tenants/organization/tenant.middleware.js',
  'tenants/superadmin/superAdmin.middleware.js',
]);

/** Límites [advertencia, bloqueante] por regla. El primer patrón que coincide se aplica. */
const LINE_LIMITS = [
  { scope: 'backend', test: /\.controller\.js$/, warn: 150, error: 200, label: 'controller' },
  { scope: 'backend', test: /\.routes\.js$/, warn: 80, error: 120, label: 'routes' },
  { scope: 'backend', test: /\.dto\.js$/, warn: 200, error: 250, label: 'dto' },
  { scope: 'backend', test: /\.js$/, warn: 300, error: 400, label: 'backend' },
  { scope: 'frontend', test: /(^|[\\/])use[A-Z][\w]*\.js$/, warn: 120, error: 200, label: 'hook' },
  { scope: 'frontend', test: /[\\/]services[\\/].*\.js$/, warn: 200, error: 250, label: 'client-service' },
  { scope: 'frontend', test: /\.jsx$/, warn: 250, error: 350, label: 'component' },
  { scope: 'frontend', test: /\.js$/, warn: 250, error: 350, label: 'frontend' },
];

const IMPORT_REGEX = /(?:import\s+(?:[\s\S]*?\s+from\s+)?|export\s+[\s\S]*?\s+from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const errorsOnly = args.includes('--errors-only');
const filesFlagIndex = args.indexOf('--files');
const explicitFiles =
  filesFlagIndex >= 0
    ? args.slice(filesFlagIndex + 1).filter((a) => !a.startsWith('--'))
    : [];

/** @type {{ level: 'error'|'warn', rule: string, file: string, detail: string }[]} */
const findings = [];

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function rel(p) {
  return toPosix(path.relative(REPO_ROOT, p));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function scopeOf(file) {
  if (file.startsWith(BACKEND_SRC + path.sep)) return 'backend';
  if (file.startsWith(FRONTEND_SRC + path.sep)) return 'frontend';
  return null;
}

function isTestFile(file) {
  return /\.test\.(js|jsx)$/.test(file) || file.includes(`${path.sep}__tests__${path.sep}`);
}

/** Devuelve el dominio dentro de `<src>/modules/<dominio>/...` o null. */
function moduleOf(file, srcRoot) {
  const modulesRoot = path.join(srcRoot, 'modules') + path.sep;
  if (!file.startsWith(modulesRoot)) return null;
  return file.slice(modulesRoot.length).split(path.sep)[0] || null;
}

function report(level, rule, file, detail) {
  if (errorsOnly && level !== 'error') return;
  findings.push({ level, rule, file: rel(file), detail });
}

function checkLineLimits(file, scope, lines) {
  const limit = LINE_LIMITS.find((l) => l.scope === scope && l.test.test(file));
  if (!limit) return;
  if (lines > limit.error) {
    report('error', 'line-limit', file, `${lines} líneas (${limit.label}: bloqueante > ${limit.error})`);
  } else if (lines > limit.warn) {
    report('warn', 'line-limit', file, `${lines} líneas (${limit.label}: advertencia > ${limit.warn})`);
  }
}

function checkBackendImports(file, source) {
  const ownModule = moduleOf(file, BACKEND_SRC);
  const isRepositoryLayer =
    /\.repository\.js$/.test(file) || file.startsWith(path.join(BACKEND_SRC, 'database') + path.sep);

  for (const match of source.matchAll(IMPORT_REGEX)) {
    const spec = match[1];
    if (!spec.startsWith('.')) {
      if (spec === '@prisma/client' && !isRepositoryLayer) {
        report('error', 'prisma-outside-repository', file, `importa '${spec}' fuera de la capa de persistencia`);
      }
      continue;
    }
    const target = path.resolve(path.dirname(file), spec);

    if (toPosix(target).endsWith('/database/db.js') && !isRepositoryLayer) {
      report('error', 'prisma-outside-repository', file, `importa cliente Prisma '${spec}' fuera de *.repository.js`);
    }

    const targetModule = moduleOf(target, BACKEND_SRC);
    if (!ownModule || !targetModule || ownModule === targetModule) continue;

    const insideTarget = toPosix(path.relative(path.join(BACKEND_SRC, 'modules', targetModule), target));
    const isPublicContract = insideTarget === 'index.js';
    const isAllowedException = ALLOWED_CROSS_MODULE_TARGETS.has(`${targetModule}/${insideTarget}`);
    if (!isPublicContract && !isAllowedException) {
      report(
        'error',
        'cross-module-deep-import',
        file,
        `'${ownModule}' importa '${targetModule}/${insideTarget}'; usar '../${targetModule}/index.js'`
      );
    }
  }
}

function checkFrontendImports(file, source) {
  const ownModule = moduleOf(file, FRONTEND_SRC);
  const isHttpCore = file.startsWith(path.join(FRONTEND_SRC, 'core', 'api') + path.sep);

  for (const match of source.matchAll(IMPORT_REGEX)) {
    const spec = match[1];

    if (spec === 'axios' && !isHttpCore) {
      report('error', 'axios-outside-http-core', file, "importa 'axios' directamente; usar '@core/api/httpClient'");
    }

    let targetModule = null;
    let insideTarget = null;
    const aliasMatch = spec.match(/^@modules\/([^/]+)(?:\/(.+))?$/);
    if (aliasMatch) {
      targetModule = aliasMatch[1];
      insideTarget = aliasMatch[2] || '';
    } else if (spec.startsWith('.')) {
      const target = path.resolve(path.dirname(file), spec);
      targetModule = moduleOf(target, FRONTEND_SRC);
      if (targetModule) {
        insideTarget = toPosix(path.relative(path.join(FRONTEND_SRC, 'modules', targetModule), target));
      }
    }

    if (!ownModule || !targetModule || ownModule === targetModule) continue;
    const isPublicContract = insideTarget === '' || /^index(\.js)?$/.test(insideTarget);
    if (!isPublicContract) {
      report(
        'warn',
        'cross-module-deep-import',
        file,
        `'${ownModule}' importa '${targetModule}/${insideTarget}'; usar '@modules/${targetModule}'`
      );
    }
  }

  const isUiLayer = /[\\/](pages|components)[\\/]/.test(file);
  if (isUiLayer && /\bfetch\s*\(/.test(source)) {
    report('error', 'fetch-in-ui', file, 'usa fetch() en un componente; delegar a services/ del dominio');
  }
  if (isUiLayer && /from\s+['"]@core\/api\/httpClient['"]/.test(source)) {
    report('warn', 'http-in-ui', file, 'componente importa httpClient; delegar a services/ del dominio');
  }
}

function checkBackendHygiene(file, source) {
  const debugLogs = source.match(/console\.log\(/g);
  if (debugLogs) {
    report('warn', 'console-log', file, `${debugLogs.length} console.log; usar logging estructurado sin PII`);
  }
  if (/process\.env\.[A-Z_]*(SECRET|KEY|TOKEN)[A-Z_]*\s*\|\|\s*['"]/.test(source)) {
    report('error', 'secret-default', file, 'secreto con valor por defecto en código');
  }
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(source)) {
    report('error', 'empty-catch', file, 'bloque catch vacío');
  }
}

function auditFile(file) {
  const scope = scopeOf(file);
  if (!scope || isTestFile(file) || !fs.existsSync(file)) return;
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/).length;

  checkLineLimits(file, scope, lines);
  if (scope === 'backend') {
    checkBackendImports(file, source);
    checkBackendHygiene(file, source);
  } else {
    checkFrontendImports(file, source);
  }
}

const targets = explicitFiles.length
  ? explicitFiles.map((f) => path.resolve(REPO_ROOT, f))
  : [...walk(BACKEND_SRC), ...walk(FRONTEND_SRC)];

targets.forEach(auditFile);

const byRule = new Map();
for (const f of findings) {
  const key = `${f.level}:${f.rule}`;
  byRule.set(key, (byRule.get(key) || 0) + 1);
}

findings
  .sort((a, b) => (a.level === b.level ? a.file.localeCompare(b.file) : a.level === 'error' ? -1 : 1))
  .forEach((f) => console.log(`[${f.level.toUpperCase()}] ${f.rule.padEnd(28)} ${f.file} — ${f.detail}`));

const errors = findings.filter((f) => f.level === 'error').length;
const warnings = findings.length - errors;
console.log('\nResumen por regla:');
[...byRule.entries()].sort().forEach(([k, v]) => console.log(`  ${k.padEnd(40)} ${v}`));
console.log(`\nArchivos auditados: ${targets.length} | Errores: ${errors} | Advertencias: ${warnings}`);

if (strict && errors > 0) process.exit(1);

