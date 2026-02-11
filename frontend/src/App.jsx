import { useState, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
import Loading from './components/Loading.jsx';
import MaintenanceBanner from './components/common/MaintenanceBanner.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

// Lazy Load Pages
// Eager Load Critical Pages
import Home from './pages/landing/Home.jsx';
import Login from './pages/auth/Login.jsx';
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx';
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard.jsx';

// Lazy Load Rest of the Pages

// Employees
const RegisterEmployee = lazy(() => import('./pages/employees/RegisterEmployee.jsx'));
const EmployeeList = lazy(() => import('./pages/employees/EmployeeList.jsx'));
const EmployeeProfile = lazy(() => import('./pages/employees/EmployeeProfile.jsx'));

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

    if (role && auth.user.role !== role) {
      if (auth.user.role === 'admin') return <Navigate to="/admin" replace />
      if (auth.user.role === 'employee') return <Navigate to="/empleado" replace />
    }

    return children
  }

  return (
    <Suspense fallback={<Loading />}>
      <Toaster position="top-right" />
      <MaintenanceBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:id" element={<JobApplication />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route element={<RequireAuth role="admin"><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/admin" element={<AdminDashboard user={auth.user} />} />
          <Route path="/admin/shifts" element={<ShiftManagement />} />
          <Route path="/admin/reports" element={<AttendanceReports />} />
          <Route path="/admin/absences" element={<AdminAbsences />} />
          <Route path="/admin/register-employee" element={<RegisterEmployee token={auth.token} />} />
          <Route path="/admin/employees" element={<EmployeeList token={auth.token} />} />
          <Route path="/admin/employees/:id" element={<EmployeeProfile token={auth.token} user={auth.user} />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/notifications/settings" element={<NotificationSettings />} />
          <Route path="/admin/audit" element={<AuditLogsPage />} />
          <Route path="/admin/contracts/expiring" element={<ExpiringContracts />} />
          <Route path="/intelligence" element={<IntelligentDashboard user={auth.user} />} />
          <Route path="/admin/payroll/config" element={<PayrollConfiguration />} />
          <Route path="/admin/payroll/benefits" element={<BenefitsManagement />} />
          <Route path="/admin/payroll/generator" element={<PayrollGenerator />} />
          <Route path="/performance" element={<EvaluationDashboard />} />
          <Route path="/performance/create" element={<CreateEvaluation />} />
          <Route path="/performance/assign" element={<AssignEvaluation />} />
          <Route path="/recruitment" element={<RecruitmentDashboard />} />
          <Route path="/recruitment/create" element={<CreateJobVacancy />} />
          <Route path="/recruitment/:id" element={<VacancyDetails />} />
          <Route path="/recruitment/applications/:id" element={<ApplicationDetails />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/analytics/turnover" element={<TurnoverReport />} />
          <Route path="/analytics/performance" element={<PerformanceReport />} />
          <Route path="/analytics/payroll-costs" element={<PayrollCostReport />} />
          <Route path="/analytics/satisfaction" element={<SatisfactionReport />} />
          <Route path="/analytics/custom" element={<CustomReport />} />
        </Route>

        <Route element={<RequireAuth><MainLayout user={auth.user} onLogout={handleLogout} /></RequireAuth>}>
          <Route path="/my-payments" element={<MyPayments user={auth.user} />} />
          <Route path="/performance/results/:id" element={<EvaluationResults />} />
          <Route path="/performance/goals" element={<MyGoals />} />
          <Route path="/performance/my-evaluations" element={<MyEvaluations />} />
          <Route path="/performance/take/:id" element={<TakeEvaluation />} />
          <Route path="/profile" element={<EmployeeProfile token={auth.token} user={auth.user} />} />
          <Route path="/help" element={<HelpCenter />} />
        </Route>
        {/* Employee Routes - Keep specialized layout or wrap if needed */}
        {/* For now keeping them separate as verified in requirement */}
        <Route path="/empleado" element={<RequireAuth role="employee"><EmployeeDashboard user={auth.user} onLogout={handleLogout} /></RequireAuth>} />
        <Route path="/empleado/asistencia" element={<RequireAuth role="employee"><EmployeeAttendance user={auth.user} /></RequireAuth>} />
        <Route path="/empleado/ausencias" element={<RequireAuth role="employee"><EmployeeAbsences /></RequireAuth>} />
        <Route
          path="/help"
          element={
            <RequireAuth>
              <HelpCenter />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="mt-12 text-gray-600 text-sm text-center w-full pb-6">
        &copy; {new Date().getFullYear()} - Sistema de Recursos Humanos - Mendoza y Doicela
      </footer>
    </Suspense>
  )
}

export default App