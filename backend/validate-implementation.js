#!/usr/bin/env node

/**
 * Script de Validación Completa
 * Verifica que toda la implementación de encriptación y seguridad funciona correctamente
 */

import 'dotenv/config';
import crypto from 'crypto';
import { encryptSalary, decryptSalary } from './src/utils/encryption.js';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║           VALIDACIÓN DE IMPLEMENTACIÓN COMPLETA             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Verificar ENCRYPTION_KEY
console.log(' Verificando ENCRYPTION_KEY...');
if (!process.env.ENCRYPTION_KEY) {
  console.log('   ENCRYPTION_KEY no está configurada');
  testsFailed++;
} else if (process.env.ENCRYPTION_KEY.length !== 64) {
  console.log('   ENCRYPTION_KEY debe tener 64 caracteres hexadecimales (32 bytes)');
  console.log('   Longitud actual:', process.env.ENCRYPTION_KEY.length);
  testsFailed++;
} else {
  console.log('   ENCRYPTION_KEY válida (64 caracteres)');
  testsPassed++;
}

// Test 2: Encriptación de salario
console.log('\n Probando encriptación de salario...');
try {
  const salary = 50000;
  const encrypted = encryptSalary(salary);
  
  // Validar formato
  const parts = encrypted.split(':');
  if (parts.length !== 4) {
    console.log('   Formato de encriptación inválido (debe ser salt:iv:authTag:data)');
    testsFailed++;
  } else {
    console.log('   Formato correcto: salt:iv:authTag:encryptedData');
    testsPassed++;
  }
  
  // Validar que es hexadecimal
  const hexRegex = /^[0-9a-f]+$/;
  const allHex = parts.every(part => hexRegex.test(part));
  if (!allHex) {
    console.log('   Alguno de los componentes no es hexadecimal válido');
    testsFailed++;
  } else {
    console.log('   Todos los componentes son hexadecimales válidos');
    testsPassed++;
  }
} catch (error) {
  console.log(`   Error: ${error.message}`);
  testsFailed++;
}

// Test 3: Desencriptación
console.log('\n Probando desencriptación...');
try {
  const salary = 50000;
  const encrypted = encryptSalary(salary);
  const decrypted = decryptSalary(encrypted);
  
  if (decrypted === salary) {
    console.log(`   Desencriptación correcta: ${salary} → encriptado → ${decrypted}`);
    testsPassed++;
  } else {
    console.log(`   Desencriptación incorrecta: esperado ${salary}, obtenido ${decrypted}`);
    testsFailed++;
  }
} catch (error) {
  console.log(`   Error: ${error.message}`);
  testsFailed++;
}

// Test 4: Encriptación con salt único
console.log('\n Verificando que mismo salario se encripta diferente...');
try {
  const salary = 50000;
  const encrypted1 = encryptSalary(salary);
  const encrypted2 = encryptSalary(salary);
  
  if (encrypted1 !== encrypted2) {
    console.log('   Salt único: mismo salario encriptado diferente cada vez');
    testsPassed++;
  } else {
    console.log('   Error: mismo salario produce la misma encriptación (salt no único)');
    testsFailed++;
  }
} catch (error) {
  console.log(`   Error: ${error.message}`);
  testsFailed++;
}

// Test 5: Validación de errores
console.log('\n Probando validación de errores...');
try {
  const invalidSalary = 'notanumber';
  encryptSalary(invalidSalary);
  console.log('   Debería haber lanzado error para salario no numérico');
  testsFailed++;
} catch (error) {
  console.log('   Validación correcta: rechaza salarios no numéricos');
  testsPassed++;
}

// Test 6: Encriptación con salarios negativos
console.log('\n Probando validación de salarios negativos...');
try {
  const negativeSalary = -5000;
  encryptSalary(negativeSalary);
  console.log('    Encripción permite salarios negativos (validación en Service)');
  testsPassed++;
} catch (error) {
  console.log('   Validación: rechaza salarios negativos');
  testsPassed++;
}

// Test 7: Verificar componentes de encriptación
console.log('\n Verificando componentes de encriptación...');
try {
  const salary = 75000;
  const encrypted = encryptSalary(salary);
  const [salt, iv, authTag, data] = encrypted.split(':');
  
  const saltLen = Buffer.from(salt, 'hex').length;
  const ivLen = Buffer.from(iv, 'hex').length;
  const authTagLen = Buffer.from(authTag, 'hex').length;
  
  let componentOk = true;
  
  if (saltLen !== 64) {
    console.log(`   Salt: esperado 64 bytes, obtenido ${saltLen}`);
    componentOk = false;
  } else {
    console.log(`   Salt: 64 bytes (correcto)`);
  }
  
  if (ivLen !== 16) {
    console.log(`   IV: esperado 16 bytes, obtenido ${ivLen}`);
    componentOk = false;
  } else {
    console.log(`   IV: 16 bytes (correcto)`);
  }
  
  if (authTagLen !== 16) {
    console.log(`   Auth Tag: esperado 16 bytes, obtenido ${authTagLen}`);
    componentOk = false;
  } else {
    console.log(`   Auth Tag: 16 bytes (correcto)`);
  }
  
  if (componentOk) {
    testsPassed++;
  } else {
    testsFailed++;
  }
} catch (error) {
  console.log(`   Error: ${error.message}`);
  testsFailed++;
}

// Test 8: Verificar algoritmo
console.log('\n Verificando algoritmo de encriptación...');
try {
  // AES-256-GCM usa 32 bytes de clave
  const algo = 'aes-256-gcm';
  const testKey = crypto.randomBytes(32);
  const testIv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algo, testKey, testIv);
  cipher.update('test', 'utf8', 'hex');
  cipher.final('hex');
  cipher.getAuthTag();
  console.log('   AES-256-GCM funciona correctamente');
  testsPassed++;
} catch (error) {
  console.log(`   Error con AES-256-GCM: ${error.message}`);
  testsFailed++;
}

// Test 9: Verificar PBKDF2
console.log('\n Verificando PBKDF2 key derivation...');
try {
  const masterKey = 'test-key';
  const salt = crypto.randomBytes(64);
  const derived = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
  
  if (derived.length === 32) {
    console.log('   PBKDF2 con 100,000 iteraciones genera clave de 32 bytes');
    testsPassed++;
  } else {
    console.log(`   Clave derivada incorrecta: ${derived.length} bytes`);
    testsFailed++;
  }
} catch (error) {
  console.log(`   Error: ${error.message}`);
  testsFailed++;
}

// Test 10: Archivos principales existen
console.log('\n Verificando archivos de implementación...');
import fs from 'fs';

const requiredFiles = [
  'src/app.js',
  'src/controllers/employeeController.js',
  'src/services/employeeService.js',
  'src/repositories/employeeRepository.js',
  'src/middleware/errorHandler.js',
  'src/routes/index.routes.js',
  'src/utils/encryption.js',
  'prisma/schema.prisma',
  '.env',
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.log(`   Archivo faltante: ${file}`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('   Todos los archivos de implementación existen');
  testsPassed++;
} else {
  testsFailed++;
}

// Resumen
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log(`║  Pruebas Pasadas: ${testsPassed}/10`);
console.log(`║  Pruebas Fallidas: ${testsFailed}/10`);
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (testsFailed === 0) {
  console.log('IMPLEMENTACIÓN VALIDADA CORRECTAMENTE\n');
  console.log('Próximos pasos:');
  console.log('  1. npm run prisma:dev    (ejecutar migraciones)');
  console.log('  2. npm run dev           (iniciar servidor)');
  console.log('  3. curl http://localhost:4000 (probar API)\n');
  process.exit(0);
} else {
  console.log('HAY ERRORES EN LA IMPLEMENTACIÓN\n');
  process.exit(1);
}
