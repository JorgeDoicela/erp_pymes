# 03 — Motor de Asistencia y Geocerca

## 1. Descripción General

El `attendanceService.js` gestiona el registro de asistencia de empleados con validaciones de:
- **Geocerca:** Verificación geoespacial de la ubicación usando la fórmula de Haversine.
- **Anti-VPN:** Detección de proxies, VPNs y hosting mediante IP de origen.
- **IP permitida:** Lista blanca de IPs configurada por la empresa.
- **Consentimiento:** Verificación de consentimiento de geolocalización (LOPDP).
- **Turnos:** Determinación de tardanza y horas extra respecto al turno asignado.

## 2. Resolución de Empleado

El empleado puede ser identificado por:
1. `identifier` que coincide exactamente con `employee.identityCard`.
2. `identifier` que coincide con `employee.id`.
3. Correo electrónico del usuario autenticado (`req.user.email`).

Si no se encuentra al empleado, el registro es rechazado con HTTP 404.

## 3. Validación de Geocerca (Fórmula de Haversine)

### 3.1 Implementación de Haversine

```javascript
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;  // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;  // Distancia en metros
}
```

La fórmula de Haversine calcula la distancia del gran círculo entre dos puntos en la superficie de una esfera, considerando la curvatura de la Tierra. Es apropiada para distancias cortas (radio de geocerca típico: 200-500 metros).

### 3.2 Fuentes de Geocerca

El sistema verifica **en cascada** hasta encontrar una geocerca válida:

1. **Geocerca del empleado:** Coordenadas individuales almacenadas en `employee.workLatitude` y `employee.workLongitude` (encriptadas, radio en `employee.workRadius` metros).
2. **Geocerca global de la empresa:** Coordenadas en `SystemSetting.globalLatitude` y `SystemSetting.globalLongitude` (encriptadas, radio en `SystemSetting.globalRadius` metros).

### 3.3 Activación de Geocerca

La geocerca se valida si se cumple alguna de estas condiciones:
- El empleado tiene `enforceGeofence = true` en su registro.
- `SystemSetting.globalLatitude` y `SystemSetting.globalLongitude` están configuradas.

Si el empleado tiene `trackingConsent = false` y la geocerca está activa, el registro es rechazado con un mensaje solicitando aceptar los términos de privacidad.

### 3.4 Aplicación

```javascript
const distance = getDistance(
    requestLat, requestLon,     // Coordenadas del cliente (enviadas en la petición)
    decryptCoordinate(workLat), decryptCoordinate(workLon)  // Geocerca (desencriptada)
);

if (distance > workRadius) {
    return res.status(400).json({
        message: `Estás a ${distance.toFixed(0)}m del lugar de trabajo. Debes estar a menos de ${workRadius}m.`
    });
}
```

## 4. Detección de VPN

Antes de registrar la entrada o salida, el servicio consulta el API de ip-api.com con la IP del cliente:

```javascript
const response = await axios.get(
    `http://ip-api.com/json/${ip}?fields=status,message,proxy,hosting`,
    { timeout: 3000 }
);
```

| Campo | Significado |
|-------|-------------|
| `proxy` | `true` si la IP es un proxy/VPN conocido |
| `hosting` | `true` si la IP pertenece a un datacenter o proveedor cloud |

Si alguno es `true`, el registro se rechaza:
```json
{ "message": "Acceso bloqueado: Se ha detectado el uso de VPN o Proxy." }
```

El timeout de 3 segundos garantiza que si ip-api.com no responde, el sistema no bloquea el registro. En caso de error de red, la detección se omite silenciosamente (fail-open).

### 4.1 Validación de IP Permitida

Si `SystemSetting.allowedIPs` está configurada (lista de IPs separadas por coma), el sistema verifica que la IP del cliente esté en la lista. Las IPs locales (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) siempre son permitidas.

La extracción de IP del cliente considera el header `X-Forwarded-For` (para casos con proxy/load balancer) antes de usar `req.socket.remoteAddress`.

## 5. Detección de Tardanza

Cuando un empleado marca entrada (`type = 'ENTRY'`), el sistema determina si llega tarde comparando la hora de entrada con el horario del turno asignado:

```javascript
// Obtener turno activo del empleado para la fecha actual
const schedule = await prisma.employeeSchedule.findFirst({
    where: {
        employeeId: employee.id,
        status: 'ACTIVE',
        startDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: today } }]
    },
    include: { shift: true }
});

if (schedule) {
    // shift.startTime: hora de inicio del turno (ej: "08:00")
    const [startHour, startMinute] = schedule.shift.startTime.split(':').map(Number);
    const shiftStart = new Date(today);
    shiftStart.setHours(startHour, startMinute, 0, 0);

    // shift.lateTolerance: minutos de gracia (ej: 10)
    const lateThreshold = new Date(shiftStart.getTime() + (schedule.shift.lateTolerance * 60 * 1000));

    const isLate = entryTime > lateThreshold;
    const minutesLate = isLate ? Math.floor((entryTime - shiftStart) / 60000) : 0;
}
```

El campo `isLate` (boolean) y `minutesLate` (entero) se almacenan en el registro de `Attendance`.

## 6. Cálculo de Horas Trabajadas al Marcar Salida

Al registrar la salida (`type = 'EXIT'`):

```javascript
const hoursWorked = (exitTime - entryTime) / (1000 * 60 * 60);

// Calcular horas esperadas del turno asignado
const shiftDuration = /* Duración del turno incluyendo descanso */;
const expectedHours = shiftDuration - (shift.breakMinutes / 60);

// Horas extra del día (si las hay)
const overtimeHours = Math.max(0, hoursWorked - expectedHours);
```

Los valores `hoursWorked` y `overtimeHours` se almacenan en el registro de `Attendance` y son consumidos por el motor de nómina para el cálculo del período.

## 7. Tipos de Registro de Asistencia

| Tipo | Descripción |
|------|-------------|
| `ENTRY` | Marcación de entrada (inicio de jornada). Crea un nuevo registro de `Attendance`. |
| `EXIT` | Marcación de salida (fin de jornada). Actualiza el registro existente del día. |
| `BREAK_START` | Inicio de descanso. Actualiza `breakStartTime`. |
| `BREAK_END` | Fin de descanso. Actualiza `breakEndTime`, calcula duración del descanso. |

## 8. Estados del Empleado

| Estado | Descripción |
|--------|-------------|
| `NOT_STARTED` | Sin registro de asistencia en el día actual |
| `WORKING` | Con entrada registrada, sin salida |
| `ON_BREAK` | Con `breakStartTime` registrado y sin `breakEndTime` |
| `COMPLETED` | Con entrada y salida registradas |

## 9. Consentimiento Explícito de Geolocalización

El campo `Employee.trackingConsent` (boolean) controla si el sistema puede almacenar coordenadas GPS del empleado. La lógica de aplicación:

- **Sin consentimiento + geocerca desactivada:** El registro procede normalmente, las coordenadas simplemente se omiten.
- **Sin consentimiento + geocerca activada:** El registro es rechazado. Se informa al empleado que debe aceptar los términos de privacidad en su perfil.
- **Con consentimiento:** Las coordenadas GPS enviadas en la petición son encriptadas y almacenadas en `Attendance.entryLatitude` / `entryLongitude`.
