# 02 — Autenticación, SSO y Control de Acceso Basado en Roles (RBAC)

## 1. Autenticación mediante JWT

El sistema utiliza JSON Web Tokens (JWT) como mecanismo de autenticación stateless. Al autenticarse correctamente, el backend emite un token firmado con `JWT_SECRET` que el cliente incluye en el header `Authorization: Bearer <token>` en todas las peticiones subsiguientes.

### 1.1 Estructura del Payload JWT

```json
{
  "id": "clx...",          // ID del empleado
  "email": "user@co.com",
  "role": "admin",
  "tenantId": "clx...",    // ID de la empresa
  "firstName": "Jorge",
  "lastName": "Doicela",
  "iat": 1723456789,
  "exp": 1723543189        // Expiración configurada en .env
}
```

### 1.2 Flujo de Autenticación

```
1. POST /api/auth/login
   → Validar email y contraseña (bcryptjs.compare)
   → Si válido: jwt.sign({ id, email, role, tenantId, ... }, JWT_SECRET, { expiresIn })
   → Devolver token + datos del empleado

2. Petición a endpoint protegido
   → authenticate middleware: jwt.verify(token, JWT_SECRET)
   → req.user = { id, email, role, tenantId, ... }
   → next()

3. requireTenant middleware
   → Leer req.user.tenantId
   → Buscar tenant en BD y validar estado de suscripción
   → runWithTenant(tenantId, next)
```

### 1.3 Middleware `authenticate`

```javascript
// auth.middleware.js
export const authenticate = (req, res, next) => {
    // Acepta token en Authorization header O en query param ?token=
    // jwt.verify lanza excepción si el token es inválido o expirado
    // req.user = decoded payload
};
```

El middleware `optionalAuth` es una variante que no rechaza peticiones sin token, sino que simplemente deja `req.user` como `undefined`. Se usa en rutas mixtas (públicas + autenticadas) como las de reclutamiento.

## 2. Restablecimiento de Contraseña

El flujo de recuperación de contraseña opera en dos pasos:

1. **POST `/api/auth/forgot-password`:** Genera un token de restablecimiento (`resetPasswordToken`) usando `crypto.randomBytes`, establece `resetPasswordExpires` (1 hora) y envía un correo electrónico con el enlace de restablecimiento usando Nodemailer.

2. **POST `/api/auth/reset-password`:** Verifica que el token no haya expirado, hace hash de la nueva contraseña con bcryptjs y limpia los campos `resetPasswordToken` y `resetPasswordExpires`.

## 3. Control de Acceso Basado en Roles (RBAC)

### 3.1 Roles Definidos

Los roles están centralizados en `config/roles.js`:

```javascript
export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  HR: 'hr',
  EMPLOYEE: 'employee'
};

export const isSuperAdminRole = (role) => role === 'superadmin';
```

### 3.2 Middleware `authorize(roles[])`

Verifica que el rol del usuario autenticado esté incluido en el arreglo de roles permitidos. El SuperAdmin (`superadmin`) siempre pasa esta verificación independientemente de los roles requeridos.

```javascript
// Ejemplo de uso en una ruta
router.post('/generate', authenticate, authorize(['admin']), generatePayroll);
router.get('/', authenticate, authorize(['admin', 'hr']), listPayrolls);
router.get('/my', authenticate, getMyPayrolls); // Cualquier rol autenticado
```

### 3.3 Matriz de Permisos por Módulo

| Módulo / Acción | SuperAdmin | Admin | HR | Employee |
|----------------|-----------|-------|-----|----------|
| Crear empleado | Lectura | ✓ | ✓ | ✗ |
| Ver todos los empleados | Lectura | ✓ | ✓ | Solo propio |
| Generar nómina | Lectura | ✓ | ✗ | ✗ |
| Ver nómina | Lectura | ✓ | ✓ | Solo propia |
| Aprobar ausencias | Lectura | ✓ | ✓ | ✗ |
| Ver auditoría | Lectura | ✓ | ✓ | ✗ |
| Dashboard de inteligencia | Lectura | ✓ | ✓ | ✗ |
| Gestión de tenants | ✓ | ✗ | ✗ | ✗ |
| Configuración del sistema | Lectura | ✓ | ✗ | ✗ |
| Registrar asistencia | — | — | — | ✓ (propio) |

## 4. Restricciones del SuperAdmin

El SuperAdmin opera en **modo supervisión**: tiene acceso de **lectura** sobre todos los módulos de cualquier empresa, pero no puede realizar operaciones de escritura (POST, PUT, DELETE) sobre endpoints protegidos por `requireTenant`.

Esta restricción está implementada directamente en `tenant.middleware.js`:

```javascript
// SuperAdmin + operación de escritura → 403
if (isSuperAdmin && req.method !== 'GET') {
    return res.status(403).json({
        code: 'SUPERADMIN_READ_ONLY_SUPERVISION',
        message: '...'
    });
}
```

Las únicas operaciones de escritura del SuperAdmin se realizan a través del módulo `/api/superadmin` (gestión de tenants, configuración de planes, suspensiones).

## 5. Autenticación Biométrica WebAuthn

El sistema implementa autenticación biométrica mediante el estándar WebAuthn (FIDO2) usando la librería `@simplewebauthn`. Esta modalidad permite a los empleados autenticarse con sensores biométricos del dispositivo (huella, Face ID) sin ingresar contraseña.

### 5.1 Registro de Credencial Biométrica

```
1. GET /api/biometric/registration/options  (autenticado con JWT)
   → Backend genera challenge único con generateRegistrationOptions()
   → Almacena challenge en archivo temporal (./challenges/<userId>.json)
   → Devuelve PublicKeyCredentialCreationOptions al frontend

2. POST /api/biometric/registration/verify
   → Frontend envía la respuesta del autenticador
   → Backend verifica con verifyRegistrationResponse()
   → Persiste BiometricCredential: { credentialId, publicKey, aaguid, counter, transports }
```

### 5.2 Autenticación Biométrica (Login sin contraseña)

```
1. POST /api/biometric/login/options  (PÚBLICO — solo requiere email)
   → Backend genera challenge con generateAuthenticationOptions()
   → Devuelve PublicKeyCredentialRequestOptions

2. POST /api/biometric/login/verify  (PÚBLICO)
   → Frontend envía aserción del autenticador
   → Backend verifica con verifyAuthenticationResponse()
   → Incrementa counter de la credencial (previene ataques de replay)
   → Emite JWT idéntico al del login por contraseña
```

### 5.3 Seguridad WebAuthn

- **Relying Party ID (RP_ID):** Configurable via `process.env.RP_ID`. En producción: `erp.jorgedoicela.com`.
- **Orígenes permitidos (ALLOWED_ORIGINS):** Lista explícita de dominios HTTPS autorizados.
- **Counter:** Cada uso incrementa el `counter` almacenado. Si el counter recibido no es mayor al almacenado, la autenticación se rechaza (protección contra clonación de credencial).
- **AAGUID:** Se almacena el identificador del hardware autenticador para auditoría.
