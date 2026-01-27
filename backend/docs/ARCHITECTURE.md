# Arquitectura del Sistema - HR System

## Resumen de Arquitectura
El sistema sigue un patrón de arquitectura en capas (Layered Architecture) para asegurar la separación de responsabilidades y facilitar el mantenimiento.

### Capas del Backend
1.  **Controladores (src/controllers)**: Manejan las solicitudes HTTP, validan la entrada básica y devuelven respuestas estandarizadas.
2.  **Servicios (src/services)**: Contienen la lógica de negocio central (ej. cálculos de nómina, gestión de asistencia). Son independientes del protocolo de transporte.
3.  **Repositorios (src/repositories)**: Encapsulan el acceso a la base de datos a través de Prisma ORM.
4.  **Middleware**: Manejan autenticación, roles y registros de auditoría.

### Flujos Clave
- **Notificaciones**: Utiliza un patrón de evento-emisión; cuando se crea una notificación en DB, el `socketService` la emite inmediatamente al cliente conectado.
- **Nómina**: Proceso batch que recupera contratos activos, mide asistencias/ausencias y aplica fórmulas financieras utilizando `decimal.js` para evitar errores de precisión de punto flotante.

### Estándares de Codificación
- **Nomenclatura**: CamelCase para variables y funciones. PascalCase para Clases.
- **Seguridad**: Datos sensibles (Cuentas bancarias, Cédulas) se encriptan en reposo usando AES-256 a nivel de servicio antes de persistir en DB.
