import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Header from './components/Layout/Header';
import LoginPage from './pages/LoginPage';
import FixturePage from './pages/FixturePage';
import RankingPage from './pages/RankingPage';
import ProfilePage from './pages/ProfilePage';
import SimulacionPage from './pages/SimulacionPage';
import PrivateTournamentPage from './pages/PrivateTournamentPage';

function AppLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />

          {/* Protected */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><FixturePage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/ranking" element={
            <ProtectedRoute>
              <AppLayout><RankingPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/simulacion" element={
            <ProtectedRoute>
              <AppLayout><SimulacionPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/torneo-privado" element={
            <ProtectedRoute>
              <AppLayout><PrivateTournamentPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/perfil" element={
            <ProtectedRoute>
              <AppLayout><ProfilePage /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
