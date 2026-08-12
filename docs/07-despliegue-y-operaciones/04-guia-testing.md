# Guía de Testing Automatizado y Integración CI/CD

## 1. Estrategia de Pruebas Automatizadas

El sistema implementa una arquitectura de pruebas automatizadas con **Vitest**, **Supertest** y **React Testing Library** para verificar la integridad del backend (API REST, servicios de inteligencia y encriptación AES-256-GCM) y del frontend (componentes React SPA).

```
┌─────────────────────────────────────────────────────────────┐
│ PIPELINE DE PRUEBAS AUTOMATIZADAS (Vitest)                  │
├──────────────────────────────┬──────────────────────────────┤
│ BACKEND TESTING              │ FRONTEND TESTING             │
│ • Unit Tests de Servicios    │ • Renderizado de Componentes │
│ • Pruebas de Inteligencia    │ • Eventos de Interfaz        │
│ • Endpoints API (Supertest)  │ • Interceptores Axios        │
│ • Verificación AES-256-GCM   │ • Guards de Enrutamiento     │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Pruebas Backend (Vitest & Supertest)

### 2.1. Configuración de Entorno
- **Framework**: `Vitest`
- **Librería HTTP**: `Supertest`
- **Ubicación de Tests**: `backend/tests/`
- **Comando de Ejecución**:
  ```bash
  cd backend
  npm test
  ```

### 2.2. Módulos Evaluados
1. **Healthcheck & Status (`health.test.js`)**: Verifica la disponibilidad del servidor HTTP con respuesta `200 OK`.
2. **Seguridad & Perímetro (`security.test.js`)**: Comprueba que la middleware Helmet inyecte los encabezados `X-Frame-Options: DENY` y `Strict-Transport-Security`.
3. **Cifrado AES-256-GCM (`test-encryption.js`)**: Valida que la encriptación y desencriptación salarial mantengan la integridad del valor numérico original.
4. **Servicios de Inteligencia Analítica (`intelligence.test.js`)**:
   - Comprueba la convergencia de $2,000$ iteraciones en el simulador Monte Carlo.
   - Verifica el cálculo del Score de Riesgo de Rotación mediante el modelo Weibull.
   - Valida el cómputo del estadístico $F$ y $p\text{-value}$ en la prueba ANOVA interdepartamental.

---

## 3. Pruebas Frontend (React Testing Library)

### 3.1. Configuración de Entorno
- **Framework**: `Vitest` + `@testing-library/react` + `jsdom`
- **Ubicación de Tests**: `frontend/src/**/__tests__/`
- **Comando de Ejecución**:
  ```bash
  cd frontend
  npm test
  ```

### 3.2. Módulos Evaluados
1. **Renderizado de Componentes (`ErrorState.test.jsx`)**: Comprueba la visualización de mensajes de error, botones de reintento y captura de props.
2. **Navegación & Guards (`RequireAuth.test.jsx`)**: Garantiza la redirección de usuarios sin token hacia `/login`.

---

## 4. Pipeline de CI/CD en GitHub Actions

El flujo de integración continua (`.github/workflows/deploy.yml`) ejecuta de forma automática los siguientes pasos en cada `push` o `pull_request`:

1. **Job `backend-qa`**:
   - Instala dependencias con `npm ci`.
   - Ejecuta la suite de pruebas unitarias `npm test`.
   - Realiza la auditoría de vulnerabilidades con `npm audit --audit-level=high`.
2. **Job `frontend-qa`**:
   - Instala dependencias del cliente React.
   - Ejecuta linter y pruebas de componentes `npm test`.
   - Valida el proceso de empaquetado `npm run build`.
3. **Job `build-and-deploy`**:
   - Compila la imagen Docker y realiza el despliegue automático en el servidor AWS EC2 si las pruebas de QA resultaron exitosas.
