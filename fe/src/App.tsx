import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginView } from './components/LoginView'
import { AdminDashboard } from './components/AdminDashboard'
import { PMDashboard } from './components/PMDashboard'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pm/dashboard"
        element={
          <ProtectedRoute allowedRole="USER">
            <PMDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
