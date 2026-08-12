# 02 — Micro-Arquitecturas y Patrones de Diseño

## 1. Patrón Repository

El patrón Repository desacopla la lógica de negocio de los mecanismos de persistencia. Cada repositorio expone métodos de consulta específicos del dominio, ocultando los detalles de las consultas Prisma.

### 1.1 employeeRepository

Responsabilidades:
- **`create(data)`:** Crea un empleado. Encripta automáticamente los campos `salary`, `bankName` y `accountNumber` usando AES-256-GCM antes de persistir.
- **`findById(id)`:** Recupera un empleado con todos sus datos relacionados (contratos, habilidades, historial laboral).
- **`findByEmail(email)`:** Búsqueda por email para validación de unicidad.
- **`findByIdentityCard(identityCard)`:** Búsqueda por cédula para validación de unicidad y registro biométrico/asistencia.
- **`update(id, data)`:** Actualización parcial con re-encriptación de campos sensibles si cambian.

### 1.2 attendanceRepository

- **`findByEmployeeAndDate(employeeId, date)`:** Recupera el registro de asistencia de un empleado para una fecha específica. Usado para detectar duplicados al marcar entrada.
- **`createEntry(data)`:** Crea un nuevo registro de entrada con campos de latitud/longitud encriptados.
- **`updateExit(id, data)`:** Actualiza el registro con datos de salida, horas trabajadas y horas extra.

### 1.3 auditRepository

- **`createLog(data, tx?)`:** Registra una entrada de auditoría de forma no bloqueante (`.catch()` para no interrumpir el flujo principal). Acepta una transacción Prisma opcional para incluirse dentro de operaciones atómicas.

## 2. Patrón Singleton (PrismaClient)

`db.js` instancia `PrismaClient` una sola vez al cargar el módulo y lo exporta. Esta instancia única es compartida por todos los servicios y repositorios de la aplicación, garantizando un pool de conexiones eficiente y consistente con el contexto de tenant inyectado.

## 3. Patrón Middleware Chain (Express)

El stack de middleware se aplica en orden específico para garantizar seguridad y funcionalidad:

```
1. Helmet                    → Cabeceras de seguridad HTTP
2. CORS                      → Validación de origen
3. express.json()            → Parseo de body JSON (límite 20mb)
4. express.urlencoded()      → Parseo de URL-encoded
5. Static Files Handler      → Servir uploads con MIME-type correcto
6. requestLogger             → Log de cada petición entrante
7. performanceMiddleware      → Log de tiempo de respuesta
8. validateBodyNotEmpty       → Prevenir inyección por body vacío
9. Cache-Control headers      → No-store en todas las respuestas
10. maintenanceMiddleware     → Verificar modo mantenimiento programado
11. [Rutas de sistema /api/system] → Sin autenticación
12. [Rutas protegidas /api]
    12a. authenticate          → Verificar JWT
    12b. requireTenant         → Resolver tenant, verificar suscripción
    12c. Controller            → Lógica de controlador
13. errorHandler              → Captura errores no manejados
```

## 4. Patrón Service Layer con Transacciones

Para operaciones que modifican múltiples entidades de forma atómica, los servicios utilizan `prisma.$transaction()`:

```javascript
// Ejemplo: confirmPayroll en PayrollCalculationService
await prisma.$transaction(async (tx) => {
  // 1. Verificar estado actual
  // 2. Procesar beneficios one-time
  // 3. Actualizar cuotas de anticipos
  // 4. Cambiar estado de nómina a APPROVED
  // 5. Registrar auditoría dentro de la transacción
});
```

Los servicios que utilizan transacciones incluyen: `confirmPayroll`, `updatePayrollDetail`, `deletePayroll`, `updateChecklistStep` (offboarding).

## 5. Patrón Observer (Notificaciones)

Las notificaciones son enviadas de forma asíncrona y no bloqueante mediante el `notificationService`. Los cron jobs observan estados de entidades (contratos próximos a vencer, nóminas pendientes, evaluaciones vencidas) y emiten notificaciones a los destinatarios correspondientes.

## 6. Lazy Loading en el Frontend

El frontend implementa code splitting mediante `React.lazy()` para todas las páginas no críticas. Solamente las páginas de carga crítica (`Login`, `Home`, `AdminDashboard`, `EmployeeDashboard`) se cargan de forma eager. El resto se carga bajo demanda mediante dynamic import:

```javascript
const PayrollGenerator = lazy(() => import('./pages/payroll/PayrollGenerator.jsx'));
const IntelligentDashboard = lazy(() => import('./pages/dashboard/IntelligentDashboard.jsx'));
// ... 30+ páginas con lazy loading
```

El componente `<Suspense>` envuelve las rutas con un componente `<Loading />` como fallback durante la carga.

## 7. Batch Processing en el Motor de Nómina

El servicio de cálculo de nómina implementa un patrón de procesamiento batch para minimizar el número de consultas a la base de datos. En lugar de consultar asistencias, beneficios y anticipos para cada empleado de forma individual, realiza:

1. Una consulta para todos los empleados activos con contrato vigente.
2. Una consulta batch para todas las asistencias del período.
3. Una consulta batch para todos los horarios activos.
4. Una consulta batch para todos los beneficios activos.
5. Una consulta batch para todos los anticipos aprobados.

Los resultados se indexan en `Map` con clave `employeeId` para acceso O(1) durante el bucle de cálculo por empleado.

## 8. Financial Precision Pattern

Para evitar errores de punto flotante en cálculos monetarios, el sistema utiliza `Decimal.js` con 20 dígitos de precisión y redondeo `ROUND_HALF_UP`. Todas las operaciones aritméticas en el motor de nómina y liquidación legal utilizan el wrapper `financial` exportado por `financialUtils.js`:

```javascript
// financial.from()     → Crea Decimal desde número/string
// financial.round()    → Redondea a N decimales (default: 2)
// financial.percentage() → Calcula porcentaje
// financial.multiply() → Multiplicación precisa
// financial.divide()   → División precisa
```

El resultado final es convertido a `number` JavaScript mediante `.toNumber()` solo antes de persistir en la base de datos.
