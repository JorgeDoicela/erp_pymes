# Guía de Testing Automatizado y Calidad CI/CD

## 1. Estrategia de Pruebas Automatizadas

El sistema implementa una arquitectura integral de pruebas automatizadas con **Vitest**, **Supertest** y **React Testing Library** para auditar el backend (API REST, motores matemáticos y encriptación AES-256-GCM) y el frontend (componentes React SPA, hooks de integración y formateadores):

```
┌─────────────────────────────────────────────────────────────┐
│ PIPELINE DE PRUEBAS AUTOMATIZADAS (Vitest — 189 Tests)      │
├──────────────────────────────┬──────────────────────────────┤
│ BACKEND (159 Tests / 26 Su)  │ FRONTEND (30 Tests / 9 Su)   │
│ • Arquitectura Monolítica    │ • Utilidades y Validadores   │
│ • Transversales y Core       │ • Estados de Carga y Error   │
│ • Integración y Regresión    │ • Formateo Financiero        │
│ • Bounded Contexts Modulares │ • Componentes Analíticos     │
│ • Cargas Estocásticas        │ • Servicios de API           │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Pruebas Backend (`backend/tests/`)

### 2.1. Configuración y Taxonomía Jerárquica

La suite de pruebas del backend se organiza en 5 categorías jerárquicas en `backend/tests/`:

```
backend/tests/
├── architecture/                   # Integridad estructural de monolito modular y contratos de persistencia
│   ├── modularMonolith.test.js     # Valida exportación cohesiva de módulos y jerarquía AppError
│   └── repositories.test.js        # Valida contratos desacoplados de persistencia sin fuga de Prisma
│
├── core/                           # Pruebas unitarias de componentes transversales
│   ├── encryption.test.js          # Integridad bidireccional AES-256-GCM y vectores IV
│   ├── financialUtils.test.js      # Precisión arbitraria Decimal.js y redondeo bancario ROUND_HALF_UP
│   ├── health.test.js              # Endpoint raíz de disponibilidad y saludo del sistema
│   ├── middleware.test.js          # Captura centralizada de excepciones operacionales y ZodError
│   ├── security.test.js            # Inyección de encabezados Helmet y validación de payload JSON
│   └── validationDto.test.js       # Validación estricta en los bordes mediante esquemas Zod
│
├── integration/                    # Pruebas multimodulares de integración y regresión
│   ├── integrationRegression.test.js # Aislamiento multi-tenant concurrente y partida doble contable
│   └── systemCalculationsAudit.test.js # Auditoría cruzada de cálculos laborales y fórmulas patronales
│
├── modules/                        # Pruebas unitarias agrupadas por Bounded Context
│   ├── attendance/                 # attendanceService.test.js (geocerca Haversine, VPN, tolerancia)
│   ├── compliance/                 # complianceService.test.js (alertas normativas, provisiones)
│   ├── employees/                  # employeeService.test.js, offboardingService.test.js (finiquito)
│   ├── intelligence/               # causalInferenceService, federatedLearning, intelligenceService,
│   │                               # morlOptimization, rdpAccountant, rsiEngine
│   ├── payroll/                    # payrollCalculationService, salaryAdvanceService, statutoryBenefits
│   ├── recruitment/                # recruitmentMultiTenant.test.js
│   └── signatures/                 # ecuadorianElectronicSignatureService, qrSignatureService
│
└── stress/                         # Scripts de carga y convergencia estocástica
    └── aiFrameworkStress.js        # Carga intensiva de Monte Carlo ($2,000$ iteraciones) y ANOVA
```

### 2.2. Comandos de Ejecución

```bash
# Desde la raíz del proyecto
npm run test:backend       # Ejecuta las 26 suites (159 tests) en Vitest
npm --prefix backend run typecheck # Verificación estricta de tipos (tsc --noEmit)
npm --prefix backend run lint      # Auditoría de código limpio con ESLint
```

---

## 3. Pruebas Frontend (`frontend/src/`)

### 3.1. Configuración de Entorno

- **Framework**: `Vitest` + `@testing-library/react` + `jsdom`
- **Ubicación**: Co-ubicadas en subdirectorios `__tests__/` dentro de cada módulo.
- **Módulos Evaluados**:
  1. `validationUtils.test.js`: Algoritmo Módulo 10 de Cédula Ecuatoriana y formato de correos.
  2. `formatters.test.js`: Moneda con formato bancario USD y fechas localizadas en español.
  3. `Loading.test.jsx` y `ErrorState.test.jsx`: Componentes atómicos de feedback.
  4. `ExecutiveKPIBanner.test.jsx`, `RiskScoreIndicator.test.jsx`, `HealthMeter.test.jsx`, `IntelligentInsightCard.test.jsx`: Renderizado de tarjetas analíticas.
  5. `apiServices.test.js`: Mapeo de llamadas HTTP y contratos del cliente API.

### 3.2. Comandos de Ejecución

```bash
# Desde la raíz del proyecto
npm run test:frontend      # Ejecuta las 9 suites (30 tests) en Vitest
npm --prefix frontend run build   # Compilación de producción con Vite
npm --prefix frontend run lint    # Auditoría de componentes con ESLint
```

---

## 4. Pipeline de CI/CD en GitHub Actions

El repositorio implementa dos workflows automatizados complementarios:

1. **`ci.yml` (CI Enterprise Quality Gate & Automated Testing):**
   - Se ejecuta en cada `push` o `pull_request` sobre `main` o `develop`.
   - **Job `security-audit`**: Escaneo riguroso de secretos y credenciales mediante `secretlint`.
   - **Job `backend-qa`**: `npm ci`, linting y suite completa de 159 tests con Vitest.
   - **Job `frontend-qa`**: `npm ci`, suite de 30 tests de interfaz y build de producción de Vite.
2. **`deploy.yml` (CI/CD Multi-Stage DAG & AWS EC2 Deploy):**
   - Se ejecuta en `push` a `main` o mediante `workflow_dispatch`.
   - Evalúa filtrado inteligente de rutas (`paths-filter`).
   - Compila imágenes Docker y las publica en GitHub Packages (GHCR).
   - Despliega en AWS EC2 vía SSH ejecutando migraciones de Prisma y reinicio de contenedores.
   - Ejecuta verificación de salud en vivo (`curl https://norma.doicela.dev`) emitiendo un reporte ejecutivo.
