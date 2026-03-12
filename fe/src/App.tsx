import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginView } from './components/LoginView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/Spinner';

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const PMDashboard = lazy(() =>
  import('./components/PMDashboard').then((m) => ({ default: m.PMDashboard })),
);

/** Suspense fallback: centered spinner for lazy-loaded route chunks. */
function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
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
    </Suspense>
  );
}

export default App;
