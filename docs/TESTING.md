# GUÍA DE TESTING - Encriptación & Seguridad

## TESTING LOCAL (Antes de DB)

### Test de Encriptación en Memoria

```bash
cd backend
node src/test-encryption.js
```

**Salida esperada:**

```
Encriptación de valor: [valor encriptado]
Desencriptación: [valor original]
Encriptación de salario: [valor encriptado]
Desencriptación de salario: [valor numérico]
```

---

## SETUP DE BASE DE DATOS

### Crear BD PostgreSQL

```bash
# Windows (PowerShell)
createdb db_recursos_humanos

# O usar pgAdmin
```

### Verificar conexión

```bash
psql -U postgres -d db_recursos_humanos -c "SELECT 1;"
```

### Ejecutar migraciones

```bash
npm run prisma:dev
```

**Salida esperada:**

```
Prisma schema loaded from prisma/schema.prisma
Your database is now in sync with your schema.
Generated Prisma Client
```

---

## TESTING DE API

### Opción A: cURL (Línea de comandos)

#### Crear Empleado

```bash
curl -X POST http://localhost:4000/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@ejemplo.com",
    "department": "IT",
    "position": "Developer",
    "salary": 50000
  }'
```

**Respuesta esperada (201):**

```json
{
  "success": true,
  "message": "Empleado creado exitosamente",
  "data": {
    "id": "clp...",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@ejemplo.com",
    "department": "IT",
    "position": "Developer",
    "salary": 50000,
    "createdAt": "2025-12-03T...",
    "updatedAt": "2025-12-03T..."
  }
}
```

#### Listar Empleados

```bash
curl http://localhost:4000/employees?page=1&limit=10
```

#### Obtener un Empleado

```bash
curl http://localhost:4000/employees/{ID}
```

#### Actualizar Salario

```bash
curl -X PUT http://localhost:4000/employees/{ID} \
  -H "Content-Type: application/json" \
  -d '{"salary": 55000}'
```

#### Obtener Estadísticas

```bash
curl http://localhost:4000/employees/stats/salary
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Estadísticas de salarios obtenidas",
  "data": {
    "total": 1,
    "sum": 50000,
    "average": 50000,
    "min": 50000,
    "max": 50000
  }
}
```

#### Eliminar Empleado

```bash
curl -X DELETE http://localhost:4000/employees/{ID}
```

---

### Opción B: Postman

1. **Crear colección:** "EMPLIFI API"
2. **Agregar requests:**

#### POST - Crear Empleado

- **URL:** `{{BASE_URL}}/employees`
- **Method:** POST
- **Body (raw JSON):**

```json
{
  "firstName": "María",
  "lastName": "García",
  "email": "maria@ejemplo.com",
  "department": "RH",
  "position": "Manager",
  "salary": 60000
}
```

#### GET - Listar Empleados

- **URL:** `{{BASE_URL}}/employees?page=1&limit=10`
- **Method:** GET

#### GET - Obtener por ID

- **URL:** `{{BASE_URL}}/employees/{{EMPLOYEE_ID}}`
- **Method:** GET

#### PUT - Actualizar

- **URL:** `{{BASE_URL}}/employees/{{EMPLOYEE_ID}}`
- **Method:** PUT
- **Body:**

```json
{
  "position": "Senior Manager",
  "salary": 70000
}
```

#### GET - Por Departamento

- **URL:** `{{BASE_URL}}/employees/department/IT`
- **Method:** GET

#### GET - Estadísticas

- **URL:** `{{BASE_URL}}/employees/stats/salary`
- **Method:** GET

#### DELETE - Eliminar

- **URL:** `{{BASE_URL}}/employees/{{EMPLOYEE_ID}}`
- **Method:** DELETE

---

## VERIFICACIÓN DE ENCRIPTACIÓN EN BD

### Conectar a PostgreSQL

```bash
psql -U postgres -d db_recursos_humanos
```

### Ver datos encriptados en BD

```sql
SELECT id, firstName, lastName, salary FROM employees;
```

**Resultado esperado:**

```
 id  | firstName | lastName |                              salary
-----+-----------+----------+---------------------------------------------------------------------
 abc | Juan      | Pérez    | 6a3f8e2d...:a1b2c3d4...:f1f2f3f4...:x9y8z7w6... (encriptado)
```

**NOTA:** El salario se ve encriptado (formato hex) en la BD, pero la API lo devuelve desencriptado

### Verificar estructura

```sql
\d employees

-- Debe mostrar:
-- id           | character varying
-- firstName    | character varying
-- lastName     | character varying
-- email        | character varying (unique)
-- department   | character varying
-- position     | character varying
-- salary       | text (ENCRIPTADO)
-- createdAt    | timestamp
-- updatedAt    | timestamp
```

---

## TESTING DE SEGURIDAD

### Test de CORS

**Desde origen no permitido:**

```bash
curl -H "Origin: http://malicious.com" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:4000/employees -v
```

**Resultado esperado:** Error CORS (403)

### Test de Helmet Headers

```bash
curl -i http://localhost:4000/employees
```

**Verificar headers:**

```
Strict-Transport-Security: max-age=31536000...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Test de Validación

**Salario negativo:**

```bash
curl -X POST http://localhost:4000/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@test.com",
    "department": "IT",
    "position": "Dev",
    "salary": -1000
  }'
```

**Resultado esperado (400):**

```json
{
  "success": false,
  "message": "Salario debe ser un número positivo",
  "type": "ValidationError"
}
```

**Email inválido:**

```bash
curl -X POST http://localhost:4000/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "invalid-email",
    "department": "IT",
    "position": "Dev",
    "salary": 50000
  }'
```

**Resultado esperado (400):**

```json
{
  "success": false,
  "message": "Email inválido"
}
```

**Email duplicado:**

```bash
curl -X POST http://localhost:4000/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Another",
    "lastName": "User",
    "email": "juan@ejemplo.com",  # Email que ya existe
    "department": "IT",
    "position": "Dev",
    "salary": 50000
  }'
```

**Resultado esperado (400):**

```json
{
  "success": false,
  "message": "El email ya está registrado"
}
```

---

## TESTING CON NODE.JS

### Script de Testing

```javascript
// tests/integration.test.js
const fetch = require("node-fetch");

const BASE_URL = "http://localhost:4000";

async function runTests() {
  console.log("Iniciando tests...\n");

  try {
    // Test 1: Crear empleado
    console.log("Crear empleado...");
    const createRes = await fetch(`${BASE_URL}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        department: "IT",
        position: "Developer",
        salary: 50000,
      }),
    });
    const created = await createRes.json();
    console.log(`Empleado creado: ${created.data.id}\n`);

    // Test 2: Listar empleados
    console.log("Listar empleados...");
    const listRes = await fetch(`${BASE_URL}/employees`);
    const list = await listRes.json();
    console.log(`✓ ${list.data.length} empleados encontrados\n`);

    // Test 3: Obtener por ID
    console.log("Obtener por ID...");
    const getRes = await fetch(`${BASE_URL}/employees/${created.data.id}`);
    const gotten = await getRes.json();
    console.log(`Salario: $${gotten.data.salary}\n`);

    // Test 4: Actualizar
    console.log("Actualizar salario...");
    const updateRes = await fetch(`${BASE_URL}/employees/${created.data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salary: 60000 }),
    });
    const updated = await updateRes.json();
    console.log(`Nuevo salario: $${updated.data.salary}\n`);

    // Test 5: Estadísticas
    console.log("Obtener estadísticas...");
    const statsRes = await fetch(`${BASE_URL}/employees/stats/salary`);
    const stats = await statsRes.json();
    console.log(`✓ Promedio de salarios: $${stats.data.average}\n`);

    // Test 6: Eliminar
    console.log("Eliminar empleado...");
    const delRes = await fetch(`${BASE_URL}/employees/${created.data.id}`, {
      method: "DELETE",
    });
    const deleted = await delRes.json();
    console.log(`Empleado eliminado\n`);

    console.log("Todos los tests pasaron!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

runTests();
```

**Ejecutar:**

```bash
node tests/integration.test.js
```

---

## TESTING CON PRISMA STUDIO

Visualizar datos en tiempo real:

```bash
npm run prisma:studio
```

Se abre automáticamente en `http://localhost:5555`

---

## TESTING DE PERFORMANCE

### Load Test (prueba de carga)

```bash
# Instalar Artillery
npm install -g artillery

# Crear config: artillery-config.yml
```

```yaml
config:
  target: "http://localhost:4000"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "GET /employees"
    flow:
      - get:
          url: "/employees"
```

```bash
artillery run artillery-config.yml
```

---

## CHECKLIST DE TESTING

- [ ] Test de encriptación (`node src/test-encryption.js`)
- [ ] BD creada y migraciones ejecutadas
- [ ] Crear empleado → 201 Created
- [ ] Listar empleados → 200 OK
- [ ] Obtener por ID → 200 OK
- [ ] Salario se devuelve desencriptado
- [ ] Salario en BD está encriptado
- [ ] Actualizar empleado → 200 OK
- [ ] Eliminar empleado → 200 OK
- [ ] Email duplicado → 400 Error
- [ ] Salario negativo → 400 Error
- [ ] Email inválido → 400 Error
- [ ] CORS headers presentes
- [ ] Helmet headers presentes
- [ ] Estadísticas correctas
- [ ] Filtrar por departamento funciona

---

## Troubleshooting

### "connect ECONNREFUSED"

- Verificar que PostgreSQL está corriendo
- Verificar DATABASE_URL en .env

### "ENCRYPTION_KEY no configurada"

- Revisar que .env existe
- Reiniciar servidor

### "Formato de valor encriptado inválido"

- Datos antiguos sin encriptación
- Ejecutar migraciones: `npm run prisma:dev`

### CORS Error

- Verificar FRONTEND_URL en .env
- Agregar origen a whitelist en app.js

---

**Última actualización:** 3 de diciembre de 2025  
**Status:** Lista para Testing
