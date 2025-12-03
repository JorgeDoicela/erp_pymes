# DIAGRAMA DE ARQUITECTURA

## Flujo de Solicitud HTTP

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Frontend)                       │
│               http://localhost:5173 (Vite React)                │
└────────────────────────────┬──────────────────────────────────┘
                             │
                  POST /employees (JSON)
                             │
                             ↓
         ┌───────────────────────────────────────┐
         │      HELMET (Headers de Seguridad)    │
         │  ✓ CSP  ✓ HSTS  ✓ X-Frame-Options   │
         └────────────────┬──────────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │      CORS (Validar Origen)        │
         │  Origen: localhost:5173 ✓         │
         └────────────────┬──────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │    EXPRESS (express.json())       │
         │  Parse body a JSON                │
         └────────────────┬──────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │   MIDDLEWARE (Validación Body)    │
         │  ✓ Body no vacío                  │
         └────────────────┬──────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │    ROUTER (index.routes.js)       │
         │  POST /employees                  │
         │  → employeeController.create()    │
         └────────────────┬──────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │   CONTROLLER (HTTP Handler)       │
         │  • Recibe request                 │
         │  • Parsea parámetros              │
         │  • Llama a servicio               │
         └────────────────┬──────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │  SERVICE (Lógica de Negocio)      │
         │  • Valida datos                   │
         │  • Verifica email único           │
         │  • Llama repositorio              │
         └────────────────┬──────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │  REPOSITORY (Acceso a BD)         │
         │  • encryptSalary(50000)           │
         │  • prisma.employee.create()       │
         │  • Devuelve salario desencriptado │
         └────────────────┬──────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │   ENCRYPTION (AES-256-GCM)        │
         │  Entrada: 50000 (número)          │
         │  Salt aleatorio: 64 bytes         │
         │  IV aleatorio: 16 bytes           │
         │  Salida: hex:hex:hex:hex          │
         │  Guardado en BD como TEXT         │
         └────────────────┬──────────────────┘
                          │
         ┌────────────────▼──────────────────┐
         │   PostgreSQL DATABASE             │
         │  employees (salary encriptado)    │
         └─────────────────────────────────┘
```

---

## Estructura de Carpetas

```
backend/
│
├── .env                        ← Variables de entorno (ENCRYPTION_KEY)
├── .env.example                ← Template documentado
│
├── ENCRYPTION_SETUP.md         ← Guía detallada
├── IMPLEMENTACION_COMPLETA.md  ← Checklist de features
├── RESUMEN_EJECUTIVO.md        ← Este resumen
│
├── prisma/
│   ├── schema.prisma           ← Modelo Employee (salary encriptado)
│   └── migrations/             ← Migraciones de BD
│
├── src/
│   ├── app.js                  ← Express app (Helmet, CORS, middlewares)
│   ├── server.js               ← Servidor (port 4000)
│   ├── test-encryption.js      ← Tests de encriptación
│   │
│   ├── controllers/
│   │   └── employeeController.js
│   │       ├── create()
│   │       ├── getAll()
│   │       ├── getById()
│   │       ├── getByDepartment()
│   │       ├── update()
│   │       ├── delete()
│   │       └── getSalaryStats()
│   │
│   ├── services/
│   │   └── employeeService.js
│   │       ├── createEmployee()
│   │       ├── getEmployee()
│   │       ├── getAllEmployees()
│   │       ├── updateEmployee()
│   │       ├── deleteEmployee()
│   │       ├── getSalaryStatistics()
│   │       └── validateEmployeeData()
│   │
│   ├── repositories/
│   │   └── employeeRepository.js
│   │       ├── create()
│   │       ├── findById()
│   │       ├── findAll()
│   │       ├── findByEmail()
│   │       ├── findByDepartment()
│   │       ├── update()
│   │       ├── delete()
│   │       └── getSalaryStats()
│   │
│   ├── middleware/
│   │   └── errorHandler.js
│   │       ├── errorHandler()      ← Manejo centralizado de errores
│   │       ├── requestLogger()     ← Logging de solicitudes
│   │       └── validateBodyNotEmpty()
│   │
│   ├── routes/
│   │   └── index.routes.js
│   │       ├── POST   /employees
│   │       ├── GET    /employees
│   │       ├── GET    /employees/:id
│   │       ├── GET    /employees/department/:department
│   │       ├── GET    /employees/stats/salary
│   │       ├── PUT    /employees/:id
│   │       └── DELETE /employees/:id
│   │
│   ├── utils/
│   │   └── encryption.js
│   │       ├── encrypt()
│   │       ├── decrypt()
│   │       ├── encryptSalary()
│   │       ├── decryptSalary()
│   │       └── deriveKey()
│   │
│   ├── database/
│   │   └── db.js
│   │
│   └── middleware/
│       └── errorHandler.js
│
└── package.json                ← Dependencias (Prisma, Express, Helmet, CORS)
```

---

## Flujo de Encriptación Detallado

### Encriptando un Salario

```
ENTRADA: salary = 50000

↓ encryptSalary()
├─ Validar que es número positivo
├─ Convertir a string: "50000"
│
├─ Generar Salt aleatorio
│  └─ crypto.randomBytes(64) → 64 bytes hex
│
├─ Generar IV aleatorio
│  └─ crypto.randomBytes(16) → 16 bytes hex
│
├─ Derivar clave
│  └─ PBKDF2Sync(
│      ENCRYPTION_KEY + salt,
│      100,000 iteraciones,
│      sha256
│    ) → 32 bytes (256 bits)
│
├─ Crear cipher AES-256-GCM
│  └─ createCipheriv(aes-256-gcm, key, iv)
│
├─ Encriptar
│  └─ cipher.update("50000") + cipher.final()
│
├─ Obtener Auth Tag
│  └─ cipher.getAuthTag() → 16 bytes
│
└─ SALIDA: "salt:iv:authTag:encrypted"
   (guardado en BD como TEXT)

EJEMPLO REAL:
6a3f8e2d...64bytes:a1b2c3d4...16bytes:f1f2f3f4...16bytes:x9y8z7w6...

```

### Desencriptando un Salario

```
ENTRADA: encryptedValue = "salt:iv:authTag:encrypted"

↓ decryptSalary()
├─ Separar por ':' → [salt, iv, authTag, encrypted]
│
├─ Convertir de hex a Buffer
│  ├─ salt → Buffer
│  ├─ iv → Buffer
│  └─ authTag → Buffer
│
├─ Derivar clave (MISMO PROCESO)
│  └─ PBKDF2Sync(ENCRYPTION_KEY + salt)
│  └─ NOTA: Salt igual = Clave igual
│
├─ Crear decipher
│  └─ createDecipheriv(aes-256-gcm, key, iv)
│
├─ Verificar autenticidad
│  └─ decipher.setAuthTag(authTag)
│  └─ Si fue modificado → ERROR
│
├─ Desencriptar
│  └─ decipher.update(encrypted) + decipher.final()
│
├─ Validar que es número
│  └─ parseFloat() → 50000
│
└─ SALIDA: salary = 50000

```

---

## Seguridad en Capas

```
┌─────────────────────────────────────┐
│  NIVEL 1: TRANSPORTE                │
│    HTTPS en producción              │
│    CORS whitelist                   │
│    Helmet headers                   │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  NIVEL 2: APLICACIÓN                │
│    Validación en Controller         │
│    Validación en Service            │
│    Manejo de errores centralizado   │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  NIVEL 3: LÓGICA DE NEGOCIO         │
│    Emails únicos                    │
│    Salarios validados               │
│    Autorización futura (JWT)        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  NIVEL 4: DATOS                     │
│    AES-256-GCM encriptación         │
│    Salt único por valor             │
│    Auth Tag verifica integridad     │
│    PBKDF2 key derivation            │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  NIVEL 5: BASE DE DATOS             │
│    Valores encriptados (TEXT)       │
│    Índices en campos públicos       │
│    Backups encriptados (futuro)     │
└─────────────────────────────────────┘
```

---

## Endpoints y Métodos HTTP

```
┌──────────────────────────────────────────────────┐
│  POST /employees                                 │
│  Crear nuevo empleado                            │
├──────────────────────────────────────────────────┤
│  Request:  { firstName, lastName, email,        │
│             department, position, salary }      │
│  Response: 201 Created                          │
│  Encriptación: ✓ (salary encriptado antes BD)   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  GET /employees?page=1&limit=10                  │
│  Listar empleados (paginado)                     │
├──────────────────────────────────────────────────┤
│  Request:  query params (page, limit)           │
│  Response: 200 OK con salarios desencriptados   │
│  Desencriptación: ✓ (salarios visibles)         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  GET /employees/:id                              │
│  Obtener un empleado por ID                      │
├──────────────────────────────────────────────────┤
│  Request:  URL param :id                         │
│  Response: 200 OK (salario desencriptado)       │
│  Error:    404 Not Found                         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  GET /employees/department/:department           │
│  Filtrar empleados por departamento              │
├──────────────────────────────────────────────────┤
│  Request:  URL param :department                │
│  Response: 200 OK con empleados filtrados       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  PUT /employees/:id                              │
│  Actualizar un empleado                          │
├──────────────────────────────────────────────────┤
│  Request:  { campo: nuevo_valor } (parcial)     │
│  Response: 200 OK (actualizado)                 │
│  Encriptación: ✓ (si se actualiza salary)       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  DELETE /employees/:id                           │
│  Eliminar un empleado                            │
├──────────────────────────────────────────────────┤
│  Request:  URL param :id                         │
│  Response: 200 OK (empleado eliminado)          │
│  Error:    404 Not Found                         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  GET /employees/stats/salary                     │
│  Estadísticas de salarios                        │
├──────────────────────────────────────────────────┤
│  Request:  (sin parámetros)                      │
│  Response: { total, sum, average, min, max }    │
│  Seguridad: ✓ (salarios desencriptados solo)    │
└──────────────────────────────────────────────────┘
```

---

## Respuestas Estándar

### Éxito (2XX)

```json
{
  "success": true,
  "message": "Descripción de qué pasó",
  "data": {
    "id": "...",
    "firstName": "Juan",
    ...
    "salary": 50000
  }
}
```

### Error de Validación (400)

```json
{
  "success": false,
  "message": "Nombre requerido y debe ser texto",
  "type": "ValidationError"
}
```

### No Encontrado (404)

```json
{
  "success": false,
  "message": "Empleado no encontrado",
  "type": "NotFoundError"
}
```

### Error Servidor (500)

```json
{
  "success": false,
  "message": "Error interno del servidor"
}
```

---

## 🎯 Puntos Clave de Seguridad

| Aspecto          | Implementación | Fortaleza                        |
| ---------------- | -------------- | -------------------------------- |
| **Salarios**     | AES-256-GCM    | Última generación criptográfica  |
| **Headers**      | Helmet         | 6 políticas de seguridad HTTP    |
| **CORS**         | Whitelist      | Solo orígenes autorizados        |
| **Validación**   | 3 niveles      | Controller, Service, Repository  |
| **Encriptación** | Salt único     | Mismo valor encriptado diferente |
| **Autenticidad** | Auth Tag       | Detecta modificaciones           |
| **Derivación**   | PBKDF2         | 100,000 iteraciones              |
| **Errores**      | Centralizados  | Respuestas consistentes          |

---

**Última actualización:** 3 de diciembre de 2025  
**Status:** ✅ 100% Implementado
