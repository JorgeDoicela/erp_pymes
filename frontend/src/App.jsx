/**
 * @file App.jsx
 * @description Enrutamiento principal, control de acceso por roles (RBAC) y vistas de la plataforma Emplifi.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
import Loading from './components/Loading.jsx';
import MaintenanceBanner from './components/common/MaintenanceBanner.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import PWAInstallPrompt from './components/pwa/PWAInstallPrompt.jsx';
import OfflineIndicator from './components/pwa/OfflineIndicator.jsx';
import PWAReloadPrompt from './components/pwa/PWAReloadPrompt.jsx';
import { ROLES, isSuperAdmin as checkIsSuperAdmin } from './constants/roles.js';

// Lazy Load Pages
// Eager Load Critical Pages
import Home from './pages/landing/Home.jsx';
import Login from './pages/auth/Login.jsx';
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx';
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

// Lazy Load Rest of the Pages

// Employees
const RegisterEmployee = lazy(() => import('./pages/employees/RegisterEmployee.jsx'));
const EmployeeList = lazy(() => import('./pages/employees/EmployeeList.jsx'));
const EmployeeProfile = lazy(() => import('./pages/employees/EmployeeProfile.jsx'));
const EmployeeExpedient = lazy(() => import('./pages/employees/EmployeeExpedient.jsx'));
const EmployeeAssetsManagement = lazy(() => import('./pages/employees/EmployeeAssetsManagement.jsx'));
const MyAssets = lazy(() => import('./pages/employees/MyAssets.jsx'));
const OffboardingManagement = lazy(() => import('./pages/employees/OffboardingManagement.jsx'));
const MobileEmployeePortal = lazy(() => import('./pages/dashboard/MobileEmployeePortal.jsx'));
const LegalComplianceDashboard = lazy(() => import('./pages/compliance/LegalComplianceDashboard.jsx'));
const AnnouncementsBoard = lazy(() => import('./pages/communication/AnnouncementsBoard.jsx'));

// Attendance
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage.jsx'));
const EmployeeAttendance = lazy(() => import('./pages/dashboard/views/EmployeeAttendance.jsx'));
const ShiftManagement = lazy(() => import('./pages/attendance/ShiftManagement.jsx'));
const EmployeeAbsences = lazy(() => import('./pages/dashboard/views/EmployeeAbsences.jsx'));
const AdminAbsences = lazy(() => import('./pages/attendance/AdminAbsences.jsx'));
const AttendanceReports = lazy(() => import('./pages/reports/AttendanceReports.jsx'));

// Payroll
const PayrollConfiguration = lazy(() => import('./pages/payroll/PayrollConfiguration.jsx'));
const PayrollGenerator = lazy(() => import('./pages/payroll/PayrollGenerator.jsx'));
const MyPayments = lazy(() => import('./pages/payroll/MyPayments.jsx'));
const BenefitsManagement = lazy(() => import('./pages/payroll/BenefitsManagement.jsx'));
const SalaryAdvancesManagement = lazy(() => import('./pages/payroll/SalaryAdvancesManagement.jsx'));
const MySalaryAdvances = lazy(() => import('./pages/payroll/MySalaryAdvances.jsx'));

// Performance
const EvaluationDashboard = lazy(() => import('./pages/performance/EvaluationDashboard.jsx'));
const CreateEvaluation = lazy(() => import('./pages/performance/CreateEvaluation.jsx'));
const AssignEvaluation = lazy(() => import('./pages/performance/AssignEvaluation.jsx'));
const MyEvaluations = lazy(() => import('./pages/performance/MyEvaluations.jsx'));
const TakeEvaluation = lazy(() => import('./pages/performance/TakeEvaluation.jsx'));
const EvaluationResults = lazy(() => import('./pages/performance/EvaluationResults.jsx'));
const MyGoals = lazy(() => import('./pages/performance/MyGoals.jsx'));

// Recruitment
const RecruitmentDashboard = lazy(() => import('./pages/recruitment/RecruitmentDashboard.jsx'));
const CreateJobVacancy = lazy(() => import('./pages/recruitment/CreateJobVacancy.jsx'));
const CareersPage = lazy(() => import('./pages/recruitment/CareersPage.jsx'));
const JobApplication = lazy(() => import('./pages/recruitment/JobApplication.jsx'));
const VacancyDetails = lazy(() => import('./pages/recruitment/VacancyDetails.jsx'));
const ApplicationDetails = lazy(() => import('./pages/recruitment/ApplicationDetails.jsx'));

// Analytics
const AnalyticsDashboard = lazy(() => import('./pages/analytics/AnalyticsDashboard.jsx'));
const RsiOptimizationDashboard = lazy(() => import('./pages/analytics/RsiOptimizationDashboard.jsx'));
const CausalInferenceDashboard = lazy(() => import('./pages/analytics/CausalInferenceDashboard.jsx'));
const FederatedLearningDashboard = lazy(() => import('./pages/analytics/FederatedLearningDashboard.jsx'));
const MorlParetoDashboard = lazy(() => import('./pages/analytics/MorlParetoDashboard.jsx'));
const TemporalAttentionDashboard = lazy(() => import('./pages/analytics/TemporalAttentionDashboard.jsx'));
const FTTransformerDashboard = lazy(() => import('./pages/analytics/FTTransformerDashboard.jsx'));
const TurnoverReport = lazy(() => import('./pages/reports/TurnoverReport.jsx'));
const PerformanceReport = lazy(() => import('./pages/reports/PerformanceReport.jsx'));
const PayrollCostReport = lazy(() => import('./pages/reports/PayrollCostReport.jsx'));
const SatisfactionReport = lazy(() => import('./pages/reports/SatisfactionReport.jsx'));
const CustomReport = lazy(() => import('./pages/reports/CustomReport.jsx'));

// Others
const ExpiringContracts = lazy(() => import('./pages/contracts/ExpiringContracts.jsx'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage.jsx'));
const NotificationSettings = lazy(() => import('./pages/notifications/NotificationSettings.jsx'));
const AuditLogsPage = lazy(() => import('./pages/audit/AuditLogsPage.jsx'));
const HelpCenter = lazy(() => import('./pages/help/HelpCenter.jsx'));
const IntelligentDashboard = lazy(() => import('./pages/dashboard/IntelligentDashboard.jsx'));
const AdminSettings = lazy(() => import('./pages/dashboard/AdminSettings.jsx'));

// Contabilidad (Aislado)
const AccountingDashboard = lazy(() => import('./pages/accounting/AccountingDashboard.jsx'));
const ChartOfAccounts = lazy(() => import('./pages/accounting/ChartOfAccounts.jsx'));
const JournalEntries = lazy(() => import('./pages/accounting/JournalEntries.jsx'));
const TrialBalance = lazy(() => import('./pages/accounting/TrialBalance.jsx'));
const PeriodsManagement = lazy(() => import('./pages/accounting/PeriodsManagement.jsx'));
const CostCenterManagement = lazy(() => import('./pages/accounting/CostCenterManagement.jsx'));

// Emprendimiento (Incubadora)
const EntrepreneurshipDashboard = lazy(() => import('./pages/entrepreneurship/Dashboard.jsx'));
const EntrepreneurshipForm = lazy(() => import('./pages/entrepreneurship/ProjectForm.jsx'));
const EntrepreneurshipDetails = lazy(() => import('./pages/entrepreneurship/ProjectDetails.jsx'));

const RegisterTenant = lazy(() => import('./pages/auth/RegisterTenant.jsx'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard.jsx'));

// Módulo Público de Investigación Científica (Emplifi Research)
const PublicResearchPage = lazy(() => import('./pages/PublicResearchPage.jsx'));
const PublicResearchResultsPage = lazy(() => import('./pages/PublicResearchResultsPage.jsx'));

function App() {
  const [auth, setAuth] = useState(() => {
    // Intentar recuperar sesión al cargar
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        return { user: JSON.parse(savedUser), token: savedToken };
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    return { user: null, token: null };
  });

  const handleLogin = ({ user, token }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setAuth({ user, token })
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuth({ user: null, token: null })
  }

  const RequireAuth = ({ children, role }) => {
    if (!auth.user) {
      return <Navigate to="/login" replace />
    }

    const userRole = (auth.user.role || '').toLowerCase();
    const superAdminUser = checkIsSuperAdmin(auth.user);

    if (role) {
      const allowedRoles = Array.isArray(role) ? role.map(r => r.toLowerCase()) : [role.toLowerCase()];

      // SuperAdmin supervisa funciones administrativas, pero no portales de autogestión personal de empleados
      const isEmployeeOnlyRoute = allowedRoles.length === 1 && allowedRoles[0] === ROLES.EMPLOYEE;
      const hasPermission = (superAdminUser && !isEmployeeOnlyRoute) || allowedRoles.includes(userRole);

      if (!hasPermission) {
        // Redirigir según el rol real del usuario a su "home"
        if (superAdminUser) return <Navigate to="/superadmin/dashboard" replace />;
        if (userRole === ROLES.ADMIN || userRole === ROLES.HR) return <Navigate to="/admin" replace />;
        if (userRole === ROLES.ACCOUNTING) return <Navigate to="/admin/accounting" replace />;
        if (userRole === ROLES.EMPLOYEE) return <Navigate to="/empleado" replace />;
        return <Navigate to="/login" replace />;
      }
    }

    return children
  }

  return (
    <Suspense fallback={<Loading />}>
      <Toaster position="top-right" />
      <MaintenanceBanner />
      <OfflineIndicator />
      <PWAInstallPrompt />
      <PWAReloadPrompt />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register-company" element={<RegisterTenant />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:id" element={<JobApplication />} />
        <Route path="/investigacion" element={<PublicResearchPage />} />
        <Route path="/investigacion/resultados" element={<PublicResearchResultsPage />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Panel compartido para roles administrativos/especializados */}
        <Route element={<RequireAuth role={['admin', 'hr', 'accounting', 'entrepreneur']}><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/admin" element={<AdminDashboard user={auth.user} />} />
          <Route path="/intelligence" element={<IntelligentDashboard user={auth.user} />} />
        </Route>

        {/* Solo SuperAdministrador (Backoffice SaaS) */}
        <Route element={<RequireAuth role="superadmin"><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/tenants" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/metrics" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/audit" element={<SuperAdminDashboard />} />
        </Route>

        {/* Administrador y Recursos Humanos (RRHH) */}
        <Route element={<RequireAuth role={['admin', 'hr']}><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/admin/shifts" element={<ShiftManagement />} />
          <Route path="/admin/reports" element={<AttendanceReports />} />
          <Route path="/admin/absences" element={<AdminAbsences />} />
          <Route path="/admin/register-employee" element={<RegisterEmployee token={auth.token} />} />
          <Route path="/admin/employees" element={<EmployeeList token={auth.token} />} />
          <Route path="/admin/employees/ficha" element={<EmployeeProfile token={auth.token} user={auth.user} />} />
          <Route path="/admin/employees/:id" element={<EmployeeProfile token={auth.token} user={auth.user} />} />
          <Route path="/attendance" element={<AttendancePage user={auth.user} />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/notifications/settings" element={<NotificationSettings />} />
          <Route path="/admin/audit" element={<AuditLogsPage />} />
          <Route path="/admin/contracts/expiring" element={<ExpiringContracts />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/expedientes" element={<EmployeeExpedient />} />
          <Route path="/admin/expedientes/:employeeId" element={<EmployeeExpedient />} />
          <Route path="/admin/assets" element={<EmployeeAssetsManagement />} />
          <Route path="/admin/offboarding" element={<OffboardingManagement />} />
          <Route path="/admin/compliance" element={<LegalComplianceDashboard />} />
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
        <Route element={<RequireAuth role={['admin', 'hr', 'accounting']}><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/admin/payroll/config" element={<PayrollConfiguration />} />
          <Route path="/admin/payroll/benefits" element={<BenefitsManagement />} />
          <Route path="/admin/payroll/advances" element={<SalaryAdvancesManagement />} />
          <Route path="/admin/payroll/generator" element={<PayrollGenerator />} />
        </Route>

        {/* Contabilidad (Compartido para Contabilidad y Admin) */}
        <Route element={<RequireAuth role={['accounting', 'admin']}><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/admin/accounting" element={<AccountingDashboard />} />
          <Route path="/admin/accounting/chart" element={<ChartOfAccounts />} />
          <Route path="/admin/accounting/journals" element={<JournalEntries />} />
          <Route path="/admin/accounting/reports/trial-balance" element={<TrialBalance />} />
          <Route path="/admin/accounting/periods" element={<PeriodsManagement />} />
          <Route path="/admin/accounting/cost-centers" element={<CostCenterManagement />} />
        </Route>

        {/* Emprendimiento (Compartido para Emprendedor y Admin) */}
        <Route element={<RequireAuth role={['entrepreneur', 'admin']}><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/admin/entrepreneurship" element={<EntrepreneurshipDashboard />} />
          <Route path="/admin/entrepreneurship/create" element={<EntrepreneurshipForm />} />
          <Route path="/admin/entrepreneurship/:id" element={<EntrepreneurshipDetails />} />
        </Route>

        {/* Employee Self-Service Routes - Solo para rol employee */}
        <Route element={<RequireAuth role="employee"><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
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

        <Route element={<RequireAuth><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/announcements" element={<AnnouncementsBoard user={auth.user} />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/notifications/settings" element={<NotificationSettings />} />
          <Route path="/performance/results/:id" element={<EvaluationResults />} />
          <Route path="/profile" element={<EmployeeProfile token={auth.token} user={auth.user} />} />
          <Route path="/help" element={<HelpCenter />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="mt-12 text-gray-600 text-sm text-center w-full pb-6">
        &copy; {new Date().getFullYear()} Emplifi · Plataforma ERP para PYMEs
      </footer>
    </Suspense>
  )
}

export default App