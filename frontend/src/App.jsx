import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import EmployeeDashboard from './pages/EmployeeDashboard.jsx'

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App