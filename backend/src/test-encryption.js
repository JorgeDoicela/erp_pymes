import 'dotenv/config';
import { encryptSalary, decryptSalary } from './utils/encryption.js';

// Test de encriptación de salarios
console.log('=== Test de Encriptación de Salarios ===\n');

const testSalaries = [1500.50, 2000, 3500.75, 5000];

testSalaries.forEach(salary => {
    console.log(`Salario original: $${salary}`);

    // Encriptar
    const encrypted = encryptSalary(salary);
    console.log(`Encriptado: ${encrypted.substring(0, 50)}...`);

    // Desencriptar
    const decrypted = decryptSalary(encrypted);
    console.log(`Desencriptado: $${decrypted}`);

    // Verificar
    const isValid = salary === decrypted;
    console.log(`✓ Verificación: ${isValid ? 'EXITOSO' : 'FALLIDO'}\n`);
});

console.log('=== Test completado ===');
