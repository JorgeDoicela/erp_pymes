# Catálogo Técnico de Vistas y Componentes UI (Design System)

## 1. Estructura Modular del Cliente Frontend

El frontend está estructurado bajo una arquitectura modular desacoplada en dos capas principales: el núcleo transversal (`src/core/`) y los dominios funcionales (`src/modules/`):

```
frontend/src/
├── core/                                   # Capa transversal y Design System atómico
│   ├── api/                                # Cliente Axios con interceptores de autenticación y tenant (httpClient.js)
│   ├── constants/                          # Constantes globales, roles y definición de módulos
│   ├── feedback/                           # Estados de carga y error (Loading, ErrorState, ErrorBoundary, MaintenanceBanner)
│   ├── hooks/                              # Hooks transversales de sincronización (useAutoSync)
│   ├── layout/                             # Shells de navegación (MainLayout, DashboardLayout, Header, Sidebar, Footer)
│   ├── pwa/                                # Componentes de ciclo de vida PWA (PWAInstallPrompt, PWAReloadPrompt, OfflineIndicator)
│   ├── ui/                                 # Design System Atómico (Holded / Xero / Linear)
│   │   ├── Button.jsx                      # Botón estándar con variantes primaria, secundaria, peligro y outline
│   │   ├── Input.jsx                       # Input atómico con soporte de label, error, helperText, help tooltip e icono
│   │   ├── InputField.jsx                  # Alias retrocompatible de Input.jsx
│   │   ├── Select.jsx                      # Select atómico con soporte de label, options, help tooltip y placeholder
│   │   ├── SelectField.jsx                 # Alias retrocompatible de Select.jsx
│   │   ├── Table.jsx                       # Primitivas de tabla (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
│   │   ├── Modal.jsx                       # Diálogo modal accesible con backdrop y escape
│   │   ├── Tabs.jsx                        # Pestañas de navegación de contexto interno
│   │   ├── EmptyState.jsx                  # Estado vacío sobrio con soporte de título, descripción y acción
│   │   ├── Skeleton.jsx                    # Esqueletos de carga para tarjetas y tablas
│   │   ├── MaskedText.jsx                  # Ocultamiento de información sensible con botón de revelación
│   │   ├── LiveSyncBadge.jsx               # Indicador de estado de sincronización en tiempo real
│   │   ├── LocationPickerMap.jsx           # Selector interactivo de geolocalización sobre Leaflet
│   │   ├── ExportButtons.jsx               # Barra de botones para exportación tabular a CSV y PDF
│   │   └── index.js                        # Barril central del Design System
│   └── utils/                              # Utilidades (formatCurrency, formatDate, validateCedula, moduleTracker)
│
└── modules/                                # Bounded Contexts de la aplicación
    ├── analytics/                          # Dashboards ejecutivos, simuladores What-If y exportaciones académicas
    ├── attendance/                         # Marcación GPS, turnos y administración de ausencias
    ├── auth/                               # Login, recuperación de contraseña y autenticación biométrica
    ├── compliance/                         # Tablero de cumplimiento legal y provisiones patronales
    ├── contracts/                          # Gestión de contratos y alertas de expiración
    ├── employees/                          # Directorio, expedientes digitales, inventario de activos y offboarding
    ├── entrepreneurship/                   # Simulación y valoración de proyectos de innovación
    ├── notifications/                      # Centro de avisos y preferencias multicanal
    ├── payroll/                            # Configuración de nómina, cálculo batch, recibos y anticipos
    ├── performance/                        # Evaluaciones 360°, plantillas y tableros de OKRs
    ├── portal/                             # Portal móvil de autoservicio para el colaborador
    ├── recruitment/                        # Vacantes, portal de empleos público y seguimiento de candidatos
    ├── reports/                            # Reportes de rotación, ausentismo y costes
    ├── superadmin/                         # Panel de supervisión global de tenants e infraestructura
    └── sustainability/                     # Dashboard de indicadores ODS 8 y asistente IA legal
```

---

## 2. Sistema de Formularios y Design System Atómico

El sistema visual sigue estrictamente el estándar de diseño empresarial de referencia (estilo Holded / Linear / Xero):

- **Superficies:** Fondos `#ffffff` con bordes finos de `1px solid #e5e7eb` y esquinas controladas (`rounded` a `rounded-md`).
- **Tipografía Financiera:** Todo valor monetario, RUC, cédula y fecha utiliza `font-mono tabular-nums`.
- **Cero Emojis y Cero Falsos Affordances:** Iconografía exclusivamente técnica provista por `react-icons` (Feather Icons `Fi*` y Heroicons Outline `Hi*` vía `react-icons/hi2`).
- **Componentes de Entrada Unificados:**
  - `Input.jsx`: Componente de entrada de texto, número y contraseña. Soporta propiedades `label`, `error`, `helperText`, tooltip explicativo `help` (con icono `FiInfo` flotante) e icono decorativo a la izquierda.
  - `Select.jsx`: Componente de selección desplegable. Soporta `options` estructuradas (`[{ value, label }]`), `children` nativos, `placeholder` desactivado inicial y tooltip `help`.
  - `InputField.jsx` y `SelectField.jsx`: Operan como alias retrocompatibles que reenvían props directamente a los componentes atómicos principales sin duplicación de lógica ni dependencias.
  - `EmptyState.jsx`: Componente unificado para estados sin datos que acepta tanto mensajes simples (`message`) como estructuras compuestas (`title`, `description`, `action`).

---

## 3. Descripción Técnica de Vistas por Módulo

### 3.1. Autenticación y Administración de Plataforma

- **`Login.jsx` (`modules/auth/pages/`):** Formulario de autenticación con soporte para credenciales tradicionales y Passkeys WebAuthn/FIDO2.
- **`SuperAdminDashboard.jsx` (`modules/superadmin/pages/`):** Consola de supervisión global para la creación de empresas, control de suscripciones y asignación de licencias.

### 3.2. Gestión de Talento Humano (`modules/employees/pages/`)

- **`RegisterEmployee.jsx`:** Formulario integral de alta de colaboradores con validación de cédula ecuatoriana (Módulo 10).
- **`EmployeeProfile.jsx`:** Ficha integral del colaborador organizada en pestañas de Datos Personales, Habilidades, Contratos y Expediente.
- **`OffboardingManagement.jsx`:** Panel de desvinculación asistida con simulación y liquidación legal oficial conforme a los Arts. 185 y 188 del Código de Trabajo.

### 3.3. Asistencia y Control Horario (`modules/attendance/pages/`)

- **`AttendancePage.jsx`:** Marcación en tiempo real con validación geocercada y detección anti-spoofing / anti-VPN.
- **`ShiftManagement.jsx`:** Matriz de asignación de turnos rotativos, minutos de receso y tolerancias de entrada.
- **`AdminAbsences.jsx`:** Bandeja de resolución de solicitudes de vacaciones y permisos médicos con adjuntos.

### 3.4. Nómina Legal y Remuneraciones (`modules/payroll/pages/`)

- **`PayrollConfiguration.jsx`:** Ajuste de parámetros impositivos, aportes patronales/personales al IESS y rubros corporativos.
- **`PayrollGenerator.jsx`:** Procesamiento masivo de nómina mensual con cálculo de horas extras, fondos de reserva y generación de rol de pagos.
- **`MyPayments.jsx`:** Portal individual para consulta y descarga de comprobantes de pago en PDF.
- **`MySalaryAdvances.jsx`:** Autoservicio de solicitud de anticipos de nómina con cálculo automático de amortización en cuotas.

### 3.5. Analítica e Inteligencia Artificial (`modules/analytics/pages/` y `modules/intelligence/`)

- **`IntelligentDashboard.jsx`:** Tablero analítico con motor Weibull de riesgo de rotación, scoring multidimensional y ROI proyectado.
- **`ExecutiveKPIBanner.jsx`:** Banner ejecutivo de oportunidad de ahorro financiero formateado con precisión de moneda centralizada.
- **`MonteCarloSimulator.jsx`:** Simulación estocástica de escenarios financieros y sensibilidad de retención.

### 3.6. Sostenibilidad ODS 8 y Asistente Legal Contextual Multi-Módulo (`modules/sustainability/`)

- **`SustainabilityDashboard.jsx` (`modules/sustainability/pages/`):** Panel de gobernanza laboral que consolida el índice ponderado de cumplimiento ODS 8, la matriz tabular de los 5 KPIs oficiales y la consola central del asistente jurídico.
- **`GlobalLegalAssistantWidget.jsx` (`modules/sustainability/components/`):** Asistente flotante contextual montado transversalmente en `MainLayout.jsx`. Detecta la ruta activa del usuario (`/payroll`, `/contracts`, `/offboarding`, `/attendance`, `/accounting`, `/employees`, `/performance`, `/admin/sustainability`), adapta las sugerencias al módulo en pantalla, permite configurar en caliente el proveedor de inferencia (DeepSeek API o Modelo Local `.gguf`) y muestra el puntaje de fidelidad del Modelo Evaluador (`evaluationAudit.groundednessScore`).
- **`SustainabilityAIAdvisor.jsx` (`modules/sustainability/components/`):** Consola interactiva principal del asistente RAG con escenarios preconfigurados, auditoría anti-alucinación y acceso a exportación de datasets `.jsonl`.
- **`LegalCitationDrawer.jsx` (`modules/sustainability/components/`):** Panel lateral de lectura íntegra para inspeccionar el texto oficial de cualquiera de los 1,880 artículos recuperados de los 4 PDFs normativos.
- **`FineTuningExportModal.jsx` (`modules/sustainability/components/`):** Diálogo modal para configurar y descargar el dataset de Fine-Tuning en formato `.jsonl`.
