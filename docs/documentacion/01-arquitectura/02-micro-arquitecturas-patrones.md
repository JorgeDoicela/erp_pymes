# 02. Micro-Arquitecturas y Patrones de Diseño

## 1. Patrones de Diseño Implementados en EMPLIFI

### 1.1. Repository Pattern (Patrón Repositorio)
El backend aísla el acceso a datos mediante repositorios dedicados por entidad (ej. `employeeRepository.js`, `payrollRepository.js`). Este patrón independiza a los servicios de los detalles de la base de datos y permite inyectar comportamientos transversales como la encriptación de datos en reposo.

```javascript
// Ejemplo de patrón Repositorio con cifrado en EMPLIFI
export const employeeRepository = {
    async create(data) {
        const encryptedData = {
            ...data,
            salary: encryptSalary(data.salary)
        };
        const record = await prisma.employee.create({ data: encryptedData });
        return { ...record, salary: decryptSalary(record.salary) };
    }
};
```

### 1.2. Middleware Interceptor Pattern
El pipeline de Express aplica interceptores desacoplados para propósitos transversales:
- `auth.middleware.js`: Verificación de tokens JWT y extracción de contexto de usuario.
- `role.middleware.js`: Guardias de control de acceso según RBAC (`admin`, `employee`, `accounting`).
- `performance.middleware.js`: Registro de latencias HTTP (RNF-13) y métricas de desempeño.
- `errorHandler.js`: Manejo global de excepciones no capturadas con formateo estandarizado de respuestas `500 Internal Server Error`.

---

## 2. Criterio de Encriptación de Datos Sensibles (AES-256-GCM)

Para cumplir con normativas de protección de datos personales (como la LOPDP e ISO 27001), los datos altamente confidenciales no se almacenan en texto plano en PostgreSQL.

```
Texto Plano ("2500.00") ──► [Salt Aleatorio 64B] + [IV Aleatorio 16B] ──► Cifrado AES-256-GCM ──► "salt:iv:authTag:ciphertext" (Hex en DB)
```

- **Algoritmo**: `aes-256-gcm` (Authenticated Encryption with Associated Data - AEAD).
- **Entradas**: `ENCRYPTION_KEY` de 64 caracteres hexadecimales (32 bytes).
- **Seguridad**: Autenticidad e integridad garantizadas mediante AuthTag. Cualquier alteración manual del registro en BD provocará un error explícito en la desencriptación.
