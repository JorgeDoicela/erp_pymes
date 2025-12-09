# ENCRIPTACIÓN DE SALARIOS

## Descripción General

Este sistema implementa:

- **Encriptación AES-256-GCM** para salarios en la base de datos
- **Helmet** para headers de seguridad HTTP
- **CORS** con lista blanca de orígenes permitidos
- **Validación** de datos en servicios
- **Manejo de errores** centralizado

## Configuración de Seguridad

### Variables de Entorno (.env)

```env
PORT=4000
DATABASE_URL="postgresql://usuario:password@localhost:5432/db_recursos_humanos"
ENCRYPTION_KEY="a23b47bdb7cc79d3497cf1c5538c55dc5ce6c05bacb632654e677bce265635c0"
FRONTEND_URL="http://localhost:5173"
```

### Generar una Nueva ENCRYPTION_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Requisitos:**

- 64 caracteres hexadecimales (32 bytes)
- Generada de forma aleatoria
- Diferente para cada ambiente
- NUNCA commitear en git (usa .env.example)

## Arquitectura

```
src/
├── controllers/
│   └── employeeController.js    # Manejadores de HTTP
├── services/
│   └── employeeService.js       # Lógica de negocio
├── repositories/
│   └── employeeRepository.js    # Acceso a base de datos
├── middleware/
│   └── errorHandler.js          # Manejo de errores y validación
├── routes/
│   └── index.routes.js          # Definición de rutas
├── utils/
│   └── encryption.js            # Funciones de encriptación
└── app.js                       # Configuración de Express
```

## Flujo de Encriptación

### Al Guardar (POST/PUT):

```
Salario (número)
    ↓
encryptSalary()
    ↓
Salt aleatorio + IV aleatorio + derivación de clave
    ↓
AES-256-GCM
    ↓
salt:iv:authTag:encryptedData (hexadecimal)
    ↓
Base de datos
```

### Al Recuperar (GET):

```
Base de datos (salt:iv:authTag:encryptedData)
    ↓
decryptSalary()
    ↓
Recuperar salt + IV + AuthTag
    ↓
Derivar clave de la ENCRYPTION_KEY
    ↓
AES-256-GCM
    ↓
Salario (número)
    ↓
API Response
```

## API Endpoints

### Empleados

#### 1. Crear Empleado

```http
POST /employees
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "department": "IT",
  "position": "Developer",
  "salary": 50000
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Empleado creado exitosamente",
  "data": {
    "id": "clp1a2b3c4d5e6f7g8h9i0j",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "department": "IT",
    "position": "Developer",
    "salary": 50000,
    "createdAt": "2025-12-03T10:30:00Z",
    "updatedAt": "2025-12-03T10:30:00Z"
  }
}
```

#### 2. Obtener Todos los Empleados

```http
GET /employees?page=1&limit=10
```

**Response (200):**

```json
{
  "success": true,
  "message": "Empleados obtenidos exitosamente",
  "data": [
    {
      "id": "clp1a2b3c4d5e6f7g8h9i0j",
      "firstName": "Juan",
      "salary": 50000,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

#### 3. Obtener Empleado por ID

```http
GET /employees/:id
```

#### 4. Obtener Empleados por Departamento

```http
GET /employees/department/IT
```

#### 5. Actualizar Empleado

```http
PUT /employees/:id
Content-Type: application/json

{
  "salary": 55000,
  "position": "Senior Developer"
}
```

#### 6. Eliminar Empleado

```http
DELETE /employees/:id
```

#### 7. Estadísticas de Salarios

```http
GET /employees/stats/salary
```

**Response (200):**

```json
{
  "success": true,
  "message": "Estadísticas de salarios obtenidas",
  "data": {
    "total": 5,
    "sum": 250000,
    "average": 50000,
    "min": 40000,
    "max": 60000
  }
}
```

## Seguridad Implementada

### Helmet (Headers de Seguridad)

```javascript
- Content Security Policy (CSP)
- HSTS (HTTP Strict Transport Security)
- Frameguard (X-Frame-Options)
- Referrer Policy
- X-Content-Type-Options
- X-XSS-Protection
```

### CORS

```javascript
- Whitelist de orígenes permitidos
- Métodos permitidos: GET, POST, PUT, DELETE, PATCH
- Headers permitidos: Content-Type, Authorization
- Credenciales habilitadas
```

### Encriptación

```javascript
- Algoritmo: AES-256-GCM
- Salt: 64 bytes (aleatorio por cada encriptación)
- IV: 16 bytes (aleatorio por cada encriptación)
- Auth Tag: 16 bytes (validación de integridad)
- Key Derivation: PBKDF2 con 100,000 iteraciones
```

## Validaciones

### En EmployeeService:

- Nombre: requerido, texto no vacío
- Apellido: requerido, texto no vacío
- Email: requerido, formato válido, único
- Departamento: requerido, texto no vacío
- Puesto: requerido, texto no vacío
- Salario: requerido, número positivo

### En EmployeeRepository:

- Encriptación automática de salarios
- Desencriptación automática en respuestas
- Manejo de errores de Prisma

## Setup Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Crear base de datos

```bash
createdb db_recursos_humanos
```

### 4. Ejecutar migraciones de Prisma

```bash
npm run prisma:dev
```

### 5. Iniciar servidor

```bash
npm run dev
```

## Pruebas

### Usar el archivo test-encryption.js

```bash
node src/test-encryption.js
```

### Probando con curl

```bash
# Crear empleado
curl -X POST http://localhost:4000/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "department": "IT",
    "position": "Developer",
    "salary": 50000
  }'

# Obtener todos los empleados
curl http://localhost:4000/employees
```

## Estructura de Base de Datos

### Tabla: employees

```sql
CREATE TABLE employees (
  id           VARCHAR(255) PRIMARY KEY,
  firstName    VARCHAR(255) NOT NULL,
  lastName     VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  department   VARCHAR(255) NOT NULL,
  position     VARCHAR(255) NOT NULL,
  salary       TEXT NOT NULL,  -- Almacenado como encriptado
  createdAt    TIMESTAMP DEFAULT now(),
  updatedAt    TIMESTAMP DEFAULT now(),

  INDEX (email),
  INDEX (department)
);
```

## Consideraciones de Producción

1. **ENCRYPTION_KEY**

   - Usar un gestor de secretos (AWS Secrets Manager, HashiCorp Vault)
   - Rotar claves regularmente
   - Nunca hardcodear en el código

2. **Base de Datos**

   - Usar SSL/TLS para conexiones
   - Backups encriptados
   - Acceso restringido

3. **API**

   - Rate limiting
   - Autenticación/Autorización
   - Logging y monitoreo
   - HTTPS obligatorio

4. **Datos Sensibles**
   - No loguear salarios desencriptados
   - Usar variables de entorno
   - Validar y sanitizar inputs

## Cambio de ENCRYPTION_KEY

Si necesitas cambiar la clave:

```javascript
// 1. Crear archivo de migración
// 2. Leer todos los salarios con clave antigua
// 3. Desencriptar con clave antigua
// 4. Encriptar con clave nueva
// 5. Actualizar en base de datos
// 6. Cambiar ENCRYPTION_KEY en .env
```

## Troubleshooting

### "ENCRYPTION_KEY no está configurada"

- Verificar que .env existe y tiene ENCRYPTION_KEY
- Reiniciar el servidor después de cambiar .env

### "Formato de valor encriptado inválido"

- Salario guardado sin encriptación
- Ejecutar migraciones de Prisma

### Error CORS

- Verificar que FRONTEND_URL está en .env
- Whitelist de orígenes incluye tu frontend

## Contacto y Soporte

Para problemas o preguntas, revisar:

1. Variables de entorno (.env)
2. Migraciones de Prisma
3. Logs del servidor
4. Este documento

---

**Última actualización:** 3 de diciembre de 2025
**Versión:** 1.0.0
