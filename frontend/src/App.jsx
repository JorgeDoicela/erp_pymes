import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/landing/Home.jsx'
import Login from './pages/auth/Login.jsx'
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx'
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard.jsx'
import RegisterEmployee from './pages/employees/RegisterEmployee.jsx'
import EmployeeList from './pages/employees/EmployeeList.jsx'
import EmployeeProfile from './pages/employees/EmployeeProfile.jsx'

function App() {
  const [auth, setAuth] = useState({ user: null, token: null })

  const handleLogin = ({ user, token }) => {
    setAuth({ user, token })
  }

  const handleLogout = () => {
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
        path="/empleado"
        element={
          <RequireAuth role="employee">
            <EmployeeDashboard user={auth.user} onLogout={handleLogout} />
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
        path="/profile"
        element={
          <RequireAuth>
            {/* Si es admin o empleado, puede ver su propio perfil (usando su ID del token/estado) */}
            <div className="p-4 text-center">Redireccionando a tu perfil...</div>
            {/* Nota: Idealmente redirigir a /admin/employees/:myId o mostrar el componente directo */}
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App