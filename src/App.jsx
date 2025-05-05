import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './services/supabase';

// Layout
import Layout from './components/layout/Layout';

// Pages
import MobileAnalytics from './pages/MobileAnalytics';
import UserManagement from './pages/UserManagement';
import ChatbotMonitoring from './pages/ChatbotMonitoring';
import Login from './pages/Login';
import NotFound from './pages/NotFound';


// Protected route component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await isAuthenticated();
      const role = await getUserRole();
      
      setAuthenticated(isAuth);
      setUserRole(role);
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Página principal: MobileAnalytics */}
          <Route index element={<MobileAnalytics />} />
          
          {/* Nueva ruta para monitoreo del chatbot */}
          <Route path="chatbot" element={<ChatbotMonitoring />} />
          
          {/* Mantener la gestión de usuarios */}
          <Route path="users" element={
            <ProtectedRoute requiredRole="developer">
              <UserManagement />
            </ProtectedRoute>
          } />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;