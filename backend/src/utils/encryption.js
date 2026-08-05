import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM (NIST Recomendation)

/**
 * Deriva la clave maestra de 256 bits (32 bytes) una sola vez al cargar el módulo.
 * Garantiza alto rendimiento sin ejecutar PBKDF2 síncrono por cada consulta a la base de datos.
 */
function getMasterKey() {
    const rawKey = process.env.ENCRYPTION_KEY || 'default-secret-key-32-bytes-long!!';
    return crypto.createHash('sha256').update(rawKey).digest();
}

const MASTER_KEY = getMasterKey();

/**
 * Encripta un valor usando AES-256-GCM.
 * Formato resultante: iv:authTag:encryptedData (hex)
 * @param {string|number} value - Valor a encriptar
 * @returns {string} Valor encriptado
 */
export function encrypt(value) {
    if (value === null || value === undefined) return null;
    const text = String(value);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Desencripta un valor encriptado en formato AES-256-GCM (iv:authTag:encryptedData).
 * @param {string} encryptedValue - Valor encriptado
 * @returns {string|null} Valor desencriptado o null si es inválido
 */
export function decrypt(encryptedValue) {
    if (!encryptedValue || typeof encryptedValue !== 'string') {
        return null;
    }

    const parts = encryptedValue.split(':');

    // Formato estándar AES-256-GCM (iv:authTag:encryptedData)
    if (parts.length === 3) {
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Fallback: si es número en texto plano legado
    const parsedNumber = parseFloat(encryptedValue);
    if (!isNaN(parsedNumber)) {
        return String(parsedNumber);
    }

    return null;
}

/**
 * Desencripta de forma segura devolviendo null si falla la autenticación de datos.
 * @param {string} value - Valor encriptado
 * @returns {string|null}
 */
export function safeDecrypt(value) {
    if (!value) return null;
    try {
        return decrypt(value);
    } catch (e) {
        return null;
    }
}

/**
 * Encripta un salario numérico.
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
 * Desencripta un salario y lo retorna como número float redondeado a 2 decimales.
 * @param {string} encryptedSalary - Salario encriptado
 * @returns {number|null} Salario desencriptado
 */
export function decryptSalary(encryptedSalary) {
    if (!encryptedSalary) return null;
    try {
        const decrypted = safeDecrypt(encryptedSalary);
        if (decrypted === null) return null;

        const salary = parseFloat(decrypted);
        if (!isNaN(salary)) {
            return Math.round(salary * 100) / 100;
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Encripta una coordenada numérica (latitud o longitud) usando AES-256-GCM.
 * Trunca primero la coordenada a 4 decimales para mayor privacidad (~11 metros).
 * @param {number} coord - Coordenada a encriptar
 * @returns {string|null} Coordenada encriptada en formato iv:authTag:encryptedData
 */
export function encryptCoordinate(coord) {
    if (coord === null || coord === undefined || coord === '') return null;
    const num = typeof coord === 'number' ? coord : parseFloat(coord);
    if (isNaN(num)) return null;
    const sanitized = parseFloat(num.toFixed(4));
    return encrypt(sanitized);
}

/**
 * Desencripta una coordenada encriptada con AES-256-GCM y la retorna como número flotante.
 * @param {string|number} encryptedCoord - Coordenada encriptada o número legado en texto plano
 * @returns {number|null} Coordenada desencriptada o null si falla
 */
export function decryptCoordinate(encryptedCoord) {
    if (encryptedCoord === null || encryptedCoord === undefined || encryptedCoord === '') return null;
    if (typeof encryptedCoord === 'number') return parseFloat(encryptedCoord.toFixed(4));

    try {
        const decrypted = safeDecrypt(encryptedCoord);
        if (decrypted === null) {
            const parsed = parseFloat(encryptedCoord);
            return isNaN(parsed) ? null : parseFloat(parsed.toFixed(4));
        }

        const coord = parseFloat(decrypted);
        return isNaN(coord) ? null : parseFloat(coord.toFixed(4));
    } catch (e) {
        const parsed = parseFloat(encryptedCoord);
        return isNaN(parsed) ? null : parseFloat(parsed.toFixed(4));
    }
}

