import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;

/**
 * Deriva una clave de encriptación desde la clave maestra
 * @param {string} masterKey - Clave maestra desde env
 * @param {Buffer} salt - Salt para derivación
 * @returns {Buffer} Clave derivada
 */
function deriveKey(masterKey, salt) {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encripta un valor (ej: salario)
 * @param {string|number} value - Valor a encriptar
 * @returns {string} Valor encriptado en formato: salt:iv:authTag:encryptedData (hex)
 */
export function encrypt(value) {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY no está configurada en las variables de entorno');
    }

    // Convertir valor a string
    const text = String(value);

    // Generar salt e IV aleatorios
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derivar clave desde la clave maestra
    const key = deriveKey(process.env.ENCRYPTION_KEY, salt);

    // Crear cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encriptar
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Obtener auth tag
    const authTag = cipher.getAuthTag();

    // Retornar: salt:iv:authTag:encryptedData
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta un valor encriptado
 * @param {string} encryptedValue - Valor encriptado en formato: salt:iv:authTag:encryptedData
 * @returns {string} Valor desencriptado
 */
export function decrypt(encryptedValue) {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY no está configurada en las variables de entorno');
    }

    if (!encryptedValue || typeof encryptedValue !== 'string') {
        throw new Error('Valor encriptado inválido');
    }

    // Separar componentes
    const parts = encryptedValue.split(':');
    if (parts.length !== 4) {
        throw new Error('Formato de valor encriptado inválido');
    }

    const [saltHex, ivHex, authTagHex, encrypted] = parts;

    // Convertir de hex a Buffer
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Derivar clave
    const key = deriveKey(process.env.ENCRYPTION_KEY, salt);

    // Crear decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Desencriptar
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Desencripta de forma segura (si falla, retorna el valor original)
 * Útil para migración de datos de texto plano a encriptado.
 * @param {string} value - Valor posiblemente encriptado
 * @returns {string} Valor desencriptado o el original
 */
export function safeDecrypt(value) {
    if (!value) return value;
    try {
        // Si no tiene el formato de 3 separadores ':', probablemente no está encriptado
        if (typeof value === 'string' && value.split(':').length === 4) {
            return decrypt(value);
        }
        return value;
    } catch (e) {
        console.warn('Silent decryption failure, returning original value:', e.message);
        return value;
    }
}

/**
 * Encripta un salario (convierte a número después de desencriptar)
 * @param {number} salary - Salario a encriptar
 * @returns {string} Salario encriptado
 */
export function encryptSalary(salary) {
    if (typeof salary !== 'number' || isNaN(salary)) {
        throw new Error('El salario debe ser un número válido');
    }
    return encrypt(salary);
}

/**
 * Desencripta un salario
 * @param {string} encryptedSalary - Salario encriptado
 * @returns {number} Salario desencriptado como número
 */
export function decryptSalary(encryptedSalary) {
    const decrypted = safeDecrypt(encryptedSalary);
    const salary = parseFloat(decrypted);

    if (isNaN(salary)) {
        throw new Error('El valor desencriptado no es un número válido');
    }

    return salary;
}
