import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/landing/Home.jsx'
import Login from './pages/auth/Login.jsx'
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx'
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard.jsx'
import RegisterEmployee from './pages/employees/RegisterEmployee.jsx'
import EmployeeList from './pages/employees/EmployeeList.jsx'
import EmployeeProfile from './pages/employees/EmployeeProfile.jsx'
import AttendancePage from './pages/attendance/AttendancePage.jsx'
import EmployeeAttendance from './pages/dashboard/views/EmployeeAttendance.jsx'
import ShiftManagement from './pages/attendance/ShiftManagement.jsx'
import EmployeeAbsences from './pages/dashboard/views/EmployeeAbsences.jsx'
import AdminAbsences from './pages/attendance/AdminAbsences.jsx'
import AttendanceReports from './pages/reports/AttendanceReports.jsx'
import PayrollConfiguration from './pages/payroll/PayrollConfiguration.jsx'
import PayrollGenerator from './pages/payroll/PayrollGenerator.jsx'
import MyPayments from './pages/payroll/MyPayments.jsx'
import BenefitsManagement from './pages/payroll/BenefitsManagement.jsx'
import EvaluationDashboard from './pages/performance/EvaluationDashboard.jsx'
import CreateEvaluation from './pages/performance/CreateEvaluation.jsx'
import AssignEvaluation from './pages/performance/AssignEvaluation.jsx'
import MyEvaluations from './pages/performance/MyEvaluations.jsx'
import TakeEvaluation from './pages/performance/TakeEvaluation.jsx'

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
    <Routes>
      <Route path="/" element={<Home />} />
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
            <EmployeeProfile token={auth.token} />
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
        path="/recruitment"
        element={
          <RequireAuth role="admin">
            <div className="p-8 text-white"><h1>Módulo de Reclutamiento - Próximamente</h1></div>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App