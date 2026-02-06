import { useState, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
import Loading from './components/Loading.jsx';
import MaintenanceBanner from './components/common/MaintenanceBanner.jsx';

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
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminDashboard user={auth.user} onLogout={handleLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/shifts"
          element={
            <RequireAuth role="admin">
              <ShiftManagement />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAuth role="admin">
              <AttendanceReports />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/absences"
          element={
            <RequireAuth role="admin">
              <AdminAbsences />
            </RequireAuth>
          }
        />
        <Route
          path="/empleado"
          element={
            <RequireAuth role="employee">
              <EmployeeDashboard user={auth.user} onLogout={handleLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/empleado/asistencia"
          element={
            <RequireAuth role="employee">
              <EmployeeAttendance user={auth.user} />
            </RequireAuth>
          }
        />
        <Route
          path="/empleado/ausencias"
          element={
            <RequireAuth role="employee">
              <EmployeeAbsences />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <EmployeeProfile token={auth.token} user={auth.user} />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/register-employee"
          element={
            <RequireAuth role="admin">
              <RegisterEmployee token={auth.token} />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <RequireAuth role="admin">
              <EmployeeList token={auth.token} />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/employees/:id"
          element={
            <RequireAuth role="admin">
              <EmployeeProfile token={auth.token} user={auth.user} />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <RequireAuth role="admin">
              <NotificationsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/notifications/settings"
          element={
            <RequireAuth role="admin">
              <NotificationSettings />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RequireAuth role="admin">
              <AuditLogsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/contracts/expiring"
          element={
            <RequireAuth role="admin">
              <ExpiringContracts />
            </RequireAuth>
          }
        />
        <Route
          path="/intelligence"
          element={
            <RequireAuth role="admin">
              <IntelligentDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/payroll/config"
          element={
            <RequireAuth role="admin">
              <PayrollConfiguration />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/payroll/benefits"
          element={
            <RequireAuth role="admin">
              <BenefitsManagement />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/payroll/generator"
          element={
            <RequireAuth role="admin">
              <PayrollGenerator />
            </RequireAuth>
          }
        />
        <Route
          path="/my-payments"
          element={
            <RequireAuth allowedRoles={['admin', 'hr', 'employee']}>
              <MyPayments user={auth.user} />
            </RequireAuth>
          }
        />

        <Route
          path="/performance"
          element={
            <RequireAuth role="admin">
              <EvaluationDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/performance/create"
          element={
            <RequireAuth role="admin">
              <CreateEvaluation />
            </RequireAuth>
          }
        />
        <Route
          path="/performance/assign"
          element={
            <RequireAuth role="admin">
              <AssignEvaluation />
            </RequireAuth>
          }
        />
        <Route
          path="/performance/results/:id"
          element={
            <RequireAuth>
              <EvaluationResults />
            </RequireAuth>
          }
        />
        <Route
          path="/performance/goals"
          element={
            <RequireAuth>
              <MyGoals />
            </RequireAuth>
          }
        />
        <Route
          path="/recruitment"
          element={
            <RequireAuth role="admin">
              <RecruitmentDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/recruitment/create"
          element={
            <RequireAuth role="admin">
              <CreateJobVacancy />
            </RequireAuth>
          }
        />
        <Route
          path="/recruitment/:id"
          element={
            <RequireAuth role="admin">
              <VacancyDetails />
            </RequireAuth>
          }
        />
        <Route
          path="/recruitment/applications/:id"
          element={
            <RequireAuth role="admin">
              <ApplicationDetails />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireAuth role="admin">
              <AnalyticsDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics/turnover"
          element={
            <RequireAuth role="admin">
              <TurnoverReport />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics/performance"
          element={
            <RequireAuth role="admin">
              <PerformanceReport />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics/payroll-costs"
          element={
            <RequireAuth role="admin">
              <PayrollCostReport />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics/satisfaction"
          element={
            <RequireAuth role="admin">
              <SatisfactionReport />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics/custom"
          element={
            <RequireAuth role="admin">
              <CustomReport />
            </RequireAuth>
          }
        />
        <Route
          path="/performance/my-evaluations"
          element={
            <RequireAuth>
              <MyEvaluations />
            </RequireAuth>
          }
        />
        <Route
          path="/performance/take/:id"
          element={
            <RequireAuth>
              <TakeEvaluation />
            </RequireAuth>
          }
        />
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