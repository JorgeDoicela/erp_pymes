/**
 * @file App.jsx
 * @description Enrutamiento principal, control de acceso por roles (RBAC) y vistas de la plataforma Norma ERP.
 * Arquitectura Modular por Dominio (Feature / Domain-Driven Architecture).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Core Transversal
import { Loading, MaintenanceBanner } from '@core/feedback';
import { MainLayout } from '@core/layout';
import { PWAProvider, PWAInstallPrompt, OfflineIndicator, PWAReloadPrompt } from '@core/pwa';
import { ROLES, isSuperAdmin as checkIsSuperAdmin } from '@core/constants';

// Módulos de Dominio (Carga Inmediata para Rutas Críticas)
import { Home, AdminDashboard, EmployeeDashboard } from '@modules/portal';
import { Login, ResetPassword } from '@modules/auth';

// Módulos de Dominio (Lazy Loading)

// Portal & Landing
const MobileEmployeePortal = lazy(() => import('@modules/portal/pages/MobileEmployeePortal.jsx'));
const AdminSettings = lazy(() => import('@modules/portal/pages/AdminSettings.jsx'));

// Auth
const RegisterTenant = lazy(() => import('@modules/auth/pages/RegisterTenant.jsx'));

// Employees
const RegisterEmployee = lazy(() => import('@modules/employees/pages/RegisterEmployee.jsx'));
const EmployeeList = lazy(() => import('@modules/employees/pages/EmployeeList.jsx'));
const EmployeeProfile = lazy(() => import('@modules/employees/pages/EmployeeProfile.jsx'));
const EmployeeExpedient = lazy(() => import('@modules/employees/pages/EmployeeExpedient.jsx'));
const EmployeeAssetsManagement = lazy(
  () => import('@modules/employees/pages/EmployeeAssetsManagement.jsx')
);
const MyAssets = lazy(() => import('@modules/employees/pages/MyAssets.jsx'));
const OffboardingManagement = lazy(
  () => import('@modules/employees/pages/OffboardingManagement.jsx')
);

// Attendance
const AttendancePage = lazy(() => import('@modules/attendance/pages/AttendancePage.jsx'));
const EmployeeAttendance = lazy(() => import('@modules/attendance/pages/EmployeeAttendance.jsx'));
const ShiftManagement = lazy(() => import('@modules/attendance/pages/ShiftManagement.jsx'));
const EmployeeAbsences = lazy(() => import('@modules/attendance/pages/EmployeeAbsences.jsx'));
const AdminAbsences = lazy(() => import('@modules/attendance/pages/AdminAbsences.jsx'));

// Payroll
const PayrollConfiguration = lazy(() => import('@modules/payroll/pages/PayrollConfiguration.jsx'));
const PayrollGenerator = lazy(() => import('@modules/payroll/pages/PayrollGenerator.jsx'));
const MyPayments = lazy(() => import('@modules/payroll/pages/MyPayments.jsx'));
const BenefitsManagement = lazy(() => import('@modules/payroll/pages/BenefitsManagement.jsx'));
const SalaryAdvancesManagement = lazy(
  () => import('@modules/payroll/pages/SalaryAdvancesManagement.jsx')
);
const MySalaryAdvances = lazy(() => import('@modules/payroll/pages/MySalaryAdvances.jsx'));

// Performance
const EvaluationDashboard = lazy(
  () => import('@modules/performance/pages/EvaluationDashboard.jsx')
);
const CreateEvaluation = lazy(() => import('@modules/performance/pages/CreateEvaluation.jsx'));
const AssignEvaluation = lazy(() => import('@modules/performance/pages/AssignEvaluation.jsx'));
const MyEvaluations = lazy(() => import('@modules/performance/pages/MyEvaluations.jsx'));
const TakeEvaluation = lazy(() => import('@modules/performance/pages/TakeEvaluation.jsx'));
const EvaluationResults = lazy(() => import('@modules/performance/pages/EvaluationResults.jsx'));
const MyGoals = lazy(() => import('@modules/performance/pages/MyGoals.jsx'));

// Recruitment
const RecruitmentDashboard = lazy(
  () => import('@modules/recruitment/pages/RecruitmentDashboard.jsx')
);
const CreateJobVacancy = lazy(() => import('@modules/recruitment/pages/CreateJobVacancy.jsx'));
const CareersPage = lazy(() => import('@modules/recruitment/pages/CareersPage.jsx'));
const JobApplication = lazy(() => import('@modules/recruitment/pages/JobApplication.jsx'));
const VacancyDetails = lazy(() => import('@modules/recruitment/pages/VacancyDetails.jsx'));
const ApplicationDetails = lazy(() => import('@modules/recruitment/pages/ApplicationDetails.jsx'));

// Analytics & Intelligence
const AnalyticsDashboard = lazy(() => import('@modules/analytics/pages/AnalyticsDashboard.jsx'));
const RsiOptimizationDashboard = lazy(
  () => import('@modules/analytics/pages/RsiOptimizationDashboard.jsx')
);
const CausalInferenceDashboard = lazy(
  () => import('@modules/analytics/pages/CausalInferenceDashboard.jsx')
);
const FederatedLearningDashboard = lazy(
  () => import('@modules/analytics/pages/FederatedLearningDashboard.jsx')
);
const MorlParetoDashboard = lazy(() => import('@modules/analytics/pages/MorlParetoDashboard.jsx'));
const TemporalAttentionDashboard = lazy(
  () => import('@modules/analytics/pages/TemporalAttentionDashboard.jsx')
);
const FTTransformerDashboard = lazy(
  () => import('@modules/analytics/pages/FTTransformerDashboard.jsx')
);
const IntelligentDashboard = lazy(
  () => import('@modules/analytics/pages/IntelligentDashboard.jsx')
);

// Reports
const TurnoverReport = lazy(() => import('@modules/reports/pages/TurnoverReport.jsx'));
const PerformanceReport = lazy(() => import('@modules/reports/pages/PerformanceReport.jsx'));
const PayrollCostReport = lazy(() => import('@modules/reports/pages/PayrollCostReport.jsx'));
const SatisfactionReport = lazy(() => import('@modules/reports/pages/SatisfactionReport.jsx'));
const CustomReport = lazy(() => import('@modules/reports/pages/CustomReport.jsx'));
const AttendanceReports = lazy(() => import('@modules/reports/pages/AttendanceReports.jsx'));

// Accounting
const AccountingDashboard = lazy(() => import('@modules/accounting/pages/AccountingDashboard.jsx'));
const ChartOfAccounts = lazy(() => import('@modules/accounting/pages/ChartOfAccounts.jsx'));
const JournalEntries = lazy(() => import('@modules/accounting/pages/JournalEntries.jsx'));
const TrialBalance = lazy(() => import('@modules/accounting/pages/TrialBalance.jsx'));
const PeriodsManagement = lazy(() => import('@modules/accounting/pages/PeriodsManagement.jsx'));
const CostCenterManagement = lazy(
  () => import('@modules/accounting/pages/CostCenterManagement.jsx')
);

// Communication & Compliance & Contracts
const SustainabilityDashboard = lazy(
  () => import('@modules/sustainability/pages/SustainabilityDashboard.jsx')
);
const AnnouncementsBoard = lazy(
  () => import('@modules/communication/pages/AnnouncementsBoard.jsx')
);
const LegalComplianceDashboard = lazy(
  () => import('@modules/compliance/pages/LegalComplianceDashboard.jsx')
);
const PrivacyPolicy = lazy(() => import('@modules/compliance/pages/PrivacyPolicy.jsx'));
const ExpiringContracts = lazy(() => import('@modules/contracts/pages/ExpiringContracts.jsx'));

// Notifications, Audit & Help
const NotificationsPage = lazy(() => import('@modules/notifications/pages/NotificationsPage.jsx'));
const NotificationSettings = lazy(
  () => import('@modules/notifications/pages/NotificationSettings.jsx')
);
const AuditLogsPage = lazy(() => import('@modules/audit/pages/AuditLogsPage.jsx'));
const HelpCenter = lazy(() => import('@modules/help/pages/HelpCenter.jsx'));

// Signatures & SuperAdmin
const DigitalSignatureCenter = lazy(
  () => import('@modules/signatures/pages/DigitalSignatureCenter.jsx')
);
const PublicSignatureVerification = lazy(
  () => import('@modules/signatures/pages/PublicSignatureVerification.jsx')
);
const SuperAdminDashboard = lazy(() => import('@modules/superadmin/pages/SuperAdminDashboard.jsx'));

// Entrepreneurship
const EntrepreneurshipDashboard = lazy(
  () => import('@modules/entrepreneurship/pages/Dashboard.jsx')
);
const EntrepreneurshipForm = lazy(() => import('@modules/entrepreneurship/pages/ProjectForm.jsx'));
const EntrepreneurshipDetails = lazy(
  () => import('@modules/entrepreneurship/pages/ProjectDetails.jsx')
);

const RequireAuth = ({ children, role, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const superAdminUser = checkIsSuperAdmin(user);

  if (role) {
    const allowedRoles = Array.isArray(role)
      ? role.map((r) => r.toLowerCase())
      : [role.toLowerCase()];

    // Por ley de protección de datos (LOPDP / GDPR) y principio de menor privilegio:
    // El rol SuperAdmin administra la plataforma SaaS, pero NO tiene acceso a datos privados u operativos de tenants.
    // Solo puede acceder a rutas que explícitamente incluyan 'superadmin'.
    const isSuperAdminAllowed = allowedRoles.includes(ROLES.SUPERADMIN);
    const hasPermission = superAdminUser ? isSuperAdminAllowed : allowedRoles.includes(userRole);

    if (!hasPermission) {
      // Redirigir según el rol real del usuario a su "home"
      if (superAdminUser) return <Navigate to="/superadmin/dashboard" replace />;
      if (userRole === ROLES.ADMIN || userRole === ROLES.HR)
        return <Navigate to="/admin" replace />;
      if (userRole === ROLES.ACCOUNTING) return <Navigate to="/admin/accounting" replace />;
      if (userRole === ROLES.MANAGER) return <Navigate to="/admin/absences" replace />;
      if (userRole === ROLES.EMPLOYEE) return <Navigate to="/empleado" replace />;
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

function App() {
  const [auth, setAuth] = useState(() => {
    // Intentar recuperar sesión al cargar
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        return { user: JSON.parse(savedUser), token: savedToken };
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    return { user: null, token: null };
  });

  const handleLogin = ({ user, token }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setAuth({ user, token });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuth({ user: null, token: null });
  };

  useEffect(() => {
    const handleUserUpdated = () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      if (savedUser && savedToken) {
        try {
          setAuth({ user: JSON.parse(savedUser), token: savedToken });
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('norma:user-updated', handleUserUpdated);
    window.addEventListener('emplifi:user-updated', handleUserUpdated);
    window.addEventListener('storage', handleUserUpdated);
    return () => {
      window.removeEventListener('norma:user-updated', handleUserUpdated);
      window.removeEventListener('emplifi:user-updated', handleUserUpdated);
      window.removeEventListener('storage', handleUserUpdated);
    };
  }, []);

  return (
    <PWAProvider>
      <Suspense fallback={<Loading />}>
        <Toaster position="top-right" />
        <MaintenanceBanner />
        <OfflineIndicator />
        <PWAInstallPrompt />
        <PWAReloadPrompt />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<PrivacyPolicy mode="privacy" />} />
          <Route path="/terms" element={<PrivacyPolicy mode="terms" />} />
          <Route path="/register-company" element={<RegisterTenant />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/careers/:id" element={<JobApplication />} />
          <Route path="/signatures/verify/:token" element={<PublicSignatureVerification />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Panel compartido para roles administrativos/especializados */}
          <Route
            element={
              <RequireAuth user={auth.user} role={['admin', 'hr', 'accounting', 'entrepreneur']}>
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route path="/admin" element={<AdminDashboard user={auth.user} />} />
            <Route path="/intelligence" element={<IntelligentDashboard user={auth.user} />} />
          </Route>

          {/* Solo SuperAdministrador (Backoffice SaaS) */}
          <Route
            element={
              <RequireAuth user={auth.user} role="superadmin">
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/tenants" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/metrics" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/audit" element={<SuperAdminDashboard />} />
          </Route>

          {/* Tiempo y Asistencia Departamental / Equipo (Admin, HR y Manager) */}
          <Route
            element={
              <RequireAuth user={auth.user} role={['admin', 'hr', 'manager']}>
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route path="/admin/shifts" element={<ShiftManagement user={auth.user} />} />
            <Route path="/admin/reports" element={<AttendanceReports />} />
            <Route path="/admin/absences" element={<AdminAbsences user={auth.user} />} />
            <Route path="/attendance" element={<AttendancePage user={auth.user} />} />
          </Route>

          {/* Administrador y Recursos Humanos (RRHH) */}
          <Route
            element={
              <RequireAuth user={auth.user} role={['admin', 'hr']}>
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route
              path="/admin/register-employee"
              element={<RegisterEmployee token={auth.token} />}
            />
            <Route
              path="/admin/employees"
              element={<EmployeeList token={auth.token} user={auth.user} />}
            />
            <Route
              path="/admin/employees/ficha"
              element={<EmployeeProfile token={auth.token} user={auth.user} />}
            />
            <Route
              path="/admin/employees/:id"
              element={<EmployeeProfile token={auth.token} user={auth.user} />}
            />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/admin/notifications/settings" element={<NotificationSettings />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />
            <Route path="/admin/contracts/expiring" element={<ExpiringContracts />} />
            <Route path="/admin/settings" element={<AdminSettings user={auth.user} />} />
            <Route path="/admin/expedientes" element={<EmployeeExpedient />} />
            <Route path="/admin/expedientes/:employeeId" element={<EmployeeExpedient />} />
            <Route path="/admin/assets" element={<EmployeeAssetsManagement />} />
            <Route path="/admin/signatures" element={<DigitalSignatureCenter />} />
            <Route path="/admin/offboarding" element={<OffboardingManagement />} />
            <Route path="/admin/compliance" element={<LegalComplianceDashboard />} />
            <Route path="/admin/sustainability" element={<SustainabilityDashboard />} />
            <Route path="/performance" element={<EvaluationDashboard />} />
            <Route path="/performance/create" element={<CreateEvaluation />} />
            <Route path="/performance/assign" element={<AssignEvaluation />} />
            <Route path="/recruitment" element={<RecruitmentDashboard />} />
            <Route path="/recruitment/create" element={<CreateJobVacancy />} />
            <Route path="/recruitment/:id" element={<VacancyDetails />} />
            <Route path="/recruitment/applications/:id" element={<ApplicationDetails />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/analytics/rsi-optimization" element={<RsiOptimizationDashboard />} />
            <Route path="/analytics/causal-inference" element={<CausalInferenceDashboard />} />
            <Route path="/analytics/federated-learning" element={<FederatedLearningDashboard />} />
            <Route path="/analytics/morl-pareto" element={<MorlParetoDashboard />} />
            <Route path="/analytics/temporal-attention" element={<TemporalAttentionDashboard />} />
            <Route path="/analytics/ft-transformer" element={<FTTransformerDashboard />} />
            <Route path="/analytics/turnover" element={<TurnoverReport />} />
            <Route path="/analytics/performance" element={<PerformanceReport />} />
            <Route path="/analytics/payroll-costs" element={<PayrollCostReport />} />
            <Route path="/analytics/satisfaction" element={<SatisfactionReport />} />
            <Route path="/analytics/custom" element={<CustomReport />} />
          </Route>

          {/* Nómina (Compartido para Admin, HR y Contabilidad) */}
          <Route
            element={
              <RequireAuth user={auth.user} role={['admin', 'hr', 'accounting']}>
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route path="/admin/payroll/config" element={<PayrollConfiguration />} />
            <Route path="/admin/payroll/benefits" element={<BenefitsManagement />} />
            <Route
              path="/admin/payroll/advances"
              element={<SalaryAdvancesManagement user={auth.user} />}
            />
            <Route
              path="/admin/payroll/generator"
              element={<PayrollGenerator user={auth.user} />}
            />
          </Route>

          {/* Contabilidad (Compartido para Contabilidad y Admin) */}
          <Route
            element={
              <RequireAuth user={auth.user} role={['accounting', 'admin']}>
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route path="/admin/accounting" element={<AccountingDashboard />} />
            <Route path="/admin/accounting/chart" element={<ChartOfAccounts />} />
            <Route
              path="/admin/accounting/journals"
              element={<JournalEntries user={auth.user} />}
            />
            <Route path="/admin/accounting/reports/trial-balance" element={<TrialBalance />} />
            <Route path="/admin/accounting/periods" element={<PeriodsManagement />} />
            <Route path="/admin/accounting/cost-centers" element={<CostCenterManagement />} />
          </Route>

          {/* Emprendimiento (Compartido para Emprendedor y Admin) */}
          <Route
            element={
              <RequireAuth user={auth.user} role={['entrepreneur', 'admin']}>
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route path="/admin/entrepreneurship" element={<EntrepreneurshipDashboard />} />
            <Route path="/admin/entrepreneurship/create" element={<EntrepreneurshipForm />} />
            <Route path="/admin/entrepreneurship/:id" element={<EntrepreneurshipDetails />} />
          </Route>

          {/* Employee Self-Service Routes - Portal y Autogestión (Employee y Manager) */}
          <Route
            element={
              <RequireAuth user={auth.user} role={['employee', 'manager']}>
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route path="/empleado" element={<EmployeeDashboard user={auth.user} />} />
            <Route path="/empleado/portal" element={<MobileEmployeePortal user={auth.user} />} />
            <Route path="/empleado/asistencia" element={<EmployeeAttendance user={auth.user} />} />
            <Route path="/empleado/ausencias" element={<EmployeeAbsences />} />
            <Route path="/my-payments" element={<MyPayments user={auth.user} />} />
            <Route path="/my-advances" element={<MySalaryAdvances />} />
            <Route path="/my-assets" element={<MyAssets />} />
            <Route path="/my-expedient" element={<EmployeeExpedient />} />
            <Route path="/performance/goals" element={<MyGoals />} />
            <Route path="/performance/my-evaluations" element={<MyEvaluations />} />
            <Route path="/performance/take/:id" element={<TakeEvaluation />} />
            <Route path="/entrepreneurship" element={<EntrepreneurshipDashboard />} />
            <Route path="/entrepreneurship/create" element={<EntrepreneurshipForm />} />
            <Route path="/entrepreneurship/:id" element={<EntrepreneurshipDetails />} />
          </Route>

          <Route
            element={
              <RequireAuth user={auth.user}>
                <MainLayout user={auth.user} onLogout={handleLogout} />
              </RequireAuth>
            }
          >
            <Route path="/announcements" element={<AnnouncementsBoard user={auth.user} />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/notifications/settings" element={<NotificationSettings />} />
            <Route path="/performance/results/:id" element={<EvaluationResults />} />
            <Route
              path="/profile"
              element={<EmployeeProfile token={auth.token} user={auth.user} />}
            />
            <Route path="/signatures" element={<DigitalSignatureCenter />} />
            <Route path="/help" element={<HelpCenter />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PWAProvider>
  );
}

export default App;
