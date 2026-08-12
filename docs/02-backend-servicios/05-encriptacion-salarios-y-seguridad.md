# 05 — Encriptación de Datos Sensibles y Seguridad

## 1. Esquema de Encriptación

El sistema aplica encriptación simétrica AES-256-GCM a los campos que contienen datos personales financieros y de ubicación. La implementación utiliza el módulo `crypto` nativo de Node.js.

### 1.1 Algoritmo

- **Algoritmo:** AES-256-GCM (Advanced Encryption Standard, 256 bits, Galois/Counter Mode)
- **IV (Vector de Inicialización):** 96 bits (12 bytes) generado aleatoriamente por operación mediante `crypto.randomBytes(12)`. Este tamaño es el recomendado por NIST para AES-GCM.
- **Auth Tag:** 128 bits (16 bytes) generado automáticamente por GCM. Garantiza **autenticación de datos** (integridad + autenticidad). Si los datos fueron alterados, la desencriptación falla con un error de autenticación.
- **Formato de almacenamiento:** `iv:authTag:encryptedData` (todo en hexadecimal, separado por `:`)
- **Clave maestra:** Derivada una sola vez al cargar el módulo desde `process.env.ENCRYPTION_KEY` mediante SHA-256, produciendo 32 bytes (256 bits).

### 1.2 Flujo de Encriptación

```javascript
// encryption.js — función encrypt(value)
const iv = crypto.randomBytes(12);                            // IV aleatorio por operación
const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
let encrypted = cipher.update(String(value), 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag().toString('hex');
return `${iv.toString('hex')}:${authTag}:${encrypted}`;
```

### 1.3 Flujo de Desencriptación

```javascript
// encryption.js — función decrypt(encryptedValue)
const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
decipher.setAuthTag(authTag);                                 // Verifica autenticidad
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');                          // Lanza error si authTag inválido
```

## 2. Campos Encriptados

| Modelo | Campo | Función | Descripción |
|--------|-------|---------|-------------|
| `Employee` | `salary` | `encryptSalary` | Salario mensual en USD |
| `Employee` | `bankName` | `encrypt` | Nombre del banco |
| `Employee` | `accountNumber` | `encrypt` | Número de cuenta bancaria |
| `Attendance` | `entryLatitude` | `encryptCoordinate` | Latitud del registro de entrada |
| `Attendance` | `entryLongitude` | `encryptCoordinate` | Longitud del registro de entrada |
| `Attendance` | `exitLatitude` | `encryptCoordinate` | Latitud del registro de salida |
| `Attendance` | `exitLongitude` | `encryptCoordinate` | Longitud del registro de salida |
| `Employee` | `workLatitude` | `encryptCoordinate` | Latitud del lugar de trabajo configurado |
| `Employee` | `workLongitude` | `encryptCoordinate` | Longitud del lugar de trabajo configurado |
| `SystemSetting` | `globalLatitude` | `encryptCoordinate` | Latitud geocerca global de la empresa |
| `SystemSetting` | `globalLongitude` | `encryptCoordinate` | Longitud geocerca global de la empresa |

### 2.1 Encriptación de Coordenadas GPS

Las coordenadas se sanitizan a **4 decimales** (~11 metros de precisión) antes de encriptarse. Este truncamiento reduce la información de ubicación precisa mientras mantiene la capacidad de validar la geocerca con una tolerancia mayor al margen de redondeo:

```javascript
// encryptCoordinate(coord)
const sanitized = parseFloat(num.toFixed(4));  // 4 decimales ≈ 11m precisión
return encrypt(sanitized);
```

Esta decisión de diseño equilibra privacidad (no almacenar ubicación exacta) con funcionalidad (validar presencia dentro de un radio de 200m).

### 2.2 Encriptación de Salarios

```javascript
// decryptSalary(encryptedSalary)
// Retorna: number | null
// Redondea a 2 decimales para eliminar artefactos de punto flotante
return Math.round(salary * 100) / 100;
```

La función `safeDecrypt` envuelve `decrypt` en un try-catch, retornando `null` en caso de fallo en lugar de propagar la excepción. Esto permite manejar datos legados (ej: salarios en texto plano migrados) con un fallback `parseFloat`.

## 3. Hashing de Contraseñas

Las contraseñas de los empleados se almacenan en la base de datos como hashes bcrypt usando la librería `bcryptjs`. El factor de trabajo (salt rounds) por defecto de bcryptjs es 10.

```javascript
// Al crear empleado
const hashedPassword = await bcrypt.hash(password, 10);

// Al verificar login
const isValid = await bcrypt.compare(plainPassword, storedHash);
```

bcrypt incorpora automáticamente un salt aleatorio en cada hash, garantizando que dos empleados con la misma contraseña produzcan hashes distintos.

## 4. Seguridad de Headers HTTP (Helmet)

La configuración de Helmet en `app.js` establece:

| Header | Valor | Propósito |
|--------|-------|-----------|
| `Content-Security-Policy` | `default-src 'self'` | Previene XSS y carga de recursos externos no autorizados |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Fuerza HTTPS por 1 año, incluye subdominios |
| `X-Frame-Options` | `SAMEORIGIN` | Permite iframes solo desde el mismo dominio (para visualizar PDFs en modales) |
| `X-Content-Type-Options` | `nosniff` | Previene MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla información enviada en el header Referer |
| `Cache-Control` | `no-store, no-cache, must-revalidate` | Previene caché de datos sensibles en el navegador |

## 5. Rate Limiting

El middleware `rateLimit.middleware.js` implementa un contador en memoria por IP de origen. Configuraciones aplicadas:

| Endpoint | Ventana | Máx. Peticiones |
|---------|---------|-----------------|
| `POST /api/auth/login` | 15 minutos | 10 |
| `POST /api/auth/forgot-password` | 15 minutos | 5 |

Al superarse el límite, responde con HTTP 429 (Too Many Requests).

## 6. Validación Anti-VPN en Asistencia

Al registrar asistencia, el servicio verifica la dirección IP del cliente contra el servicio ip-api.com:

```javascript
const response = await axios.get(
  `http://ip-api.com/json/${ip}?fields=status,message,proxy,hosting`,
  { timeout: 3000 }
);
const isVPN = response.data.proxy === true || response.data.hosting === true;
```

- `proxy: true` → IP de proxy / VPN.
- `hosting: true` → IP de datacenter / servidor en la nube.

Si alguno es `true`, el registro de asistencia se rechaza con error. El timeout de 3 segundos garantiza que una falla de la API externa no bloquee el registro de asistencia de usuarios legítimos (el fallo por defecto es `false`, permitiendo la operación).

## 7. Protección de Archivos Estáticos

Los archivos subidos al sistema (contratos, documentos de identidad, CVs, firmas) se almacenan en `backend/uploads/`. El acceso a estos archivos requiere autenticación JWT. El servidor Express:

1. Intercepta todas las peticiones a `/uploads` o `/api/uploads`.
2. Verifica que el archivo exista en el sistema de archivos.
3. Establece el `Content-Type` correcto según la extensión.
4. Establece `Content-Disposition: inline` para visualización en el navegador.

Los PDFs de nómina y contratos se marcan con `X-Frame-Options: SAMEORIGIN` para permitir su visualización dentro de modales iframe de la aplicación.

## 8. Consentimiento de Geolocalización

El campo `Employee.trackingConsent` (boolean) debe estar activo para que el sistema almacene coordenadas GPS del empleado. Si el consentimiento no fue otorgado:

- Si la geocerca está activa (`enforceGeofence = true` o hay geocerca global configurada) y no hay override de supervisor: la petición de asistencia es **rechazada** con un mensaje que indica la necesidad de aceptar los términos de privacidad.
- Si la geocerca no está activa: la ubicación es simplemente **ignorada** sin impedir el registro.

Este diseño cumple con los principios de minimización de datos de la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador.
