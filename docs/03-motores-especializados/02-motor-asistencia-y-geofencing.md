# Motor de Asistencia y Validaciones GPS con Geofencing

## 1. Algoritmo de Geofencing y Marcación Asistida por GPS

El motor de asistencia evalúa las marcaciones de entrada (`checkIn`) y salida (`checkOut`) mediante geolocalización GPS cuando el perfil del empleado tiene habilitada la regla `enforceGeofence = true`.

```mermaid
graph TD
    CheckIn[Petición /api/attendance/check-in { lat, lng }] --> CheckConsent{¿trackingConsent == true?}
    CheckConsent -- No --> RejectConsent[Error 403: Consentimiento de Rastreo Requerido]
    CheckConsent -- Si --> CheckGeofence{¿enforceGeofence == true?}
    CheckGeofence -- No --> ProcessCheckIn[Registrar Marcación Directa]
    CheckGeofence -- Si --> ComputeHaversine[Calcular Distancia d con Fórmula de Haversine]
    ComputeHaversine --> CheckRadius{¿d <= geofenceRadius?}
    CheckRadius -- No --> RejectOutRange[Error 400: Ubicación Fuera de Geocerca Permitida]
    CheckRadius -- Si --> ProcessCheckIn
    ProcessCheckIn --> EvaluateShift[Evaluar Atrasos contra Shift Activo]
    EvaluateShift --> SaveAttendance[(Guardar Registro Attendance)]
```

---

## 2. Formulativa de Distancia Ortodrómica de Haversine

Para determinar si las coordenadas ingresadas por el dispositivo del empleado $(\phi_1, \lambda_1)$ se encuentran dentro del radio permitido respecto a la sede de trabajo $(\phi_2, \lambda_2)$, el sistema aplica la ecuación de Haversine:

$$\Delta \phi = \phi_2 - \phi_1 \quad (\text{en radianes})$$
$$\Delta \lambda = \lambda_2 - \lambda_1 \quad (\text{en radianes})$$

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \cdot \arctan2\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$

Donde $R = 6,371,000\text{ metros}$ (radio medio terrestre). Si $d > \text{geofenceRadius}$ (por defecto $200\text{ metros}$), la solicitud es rechazada.

---

## 3. Clasificación Temporal y Computo de Horas

1. **Minutos de Tolerancia (`toleranceMinutes`)**: Margen configurable en la entidad `Shift` (por ejemplo, 15 minutos). Si $\text{Hora CheckIn} \le \text{StartTime} + \text{toleranceMinutes}$, se considera un ingreso a tiempo.
2. **Atraso (`isLate`)**: Si el horario de entrada excede la tolerancia, la bandera `isLate` se establece en `true`.
3. **Salida Anticipada (`isEarlyDeparture`)**: Se activa si $\text{Hora CheckOut} < \text{EndTime}$.
4. **Horas Efectivas Laboradas (`workedHours`)**:
$$\text{workedHours} = \frac{(\text{checkOut} - \text{checkIn})_{\text{minutos}} - \text{breakMinutes}}{60}$$
5. **Horas Extras (`overtimeHours`)**: Computa el tiempo excedente laborado posterior a la finalización oficial de la jornada reglamentaria.
