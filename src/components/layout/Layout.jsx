import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getUserRole, signOut } from '../../services/supabase';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getUserRole();
        setUserRole(role);
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    
    fetchUserRole();
  }, []);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* CAMBIO 1: Imagen de fondo con mayor opacidad y z-index separado */}
      <div 
        className="fixed inset-0 z-0" // Cambiado de absolute a fixed
        style={{ 
          backgroundImage: 'url(/Clinicas_love_fondo.jpg)', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.4, // Aumentado de 0.2 a 0.4
        }}
        aria-hidden="true"
      ></div>
      
      {/* CAMBIO 2: Overlay más transparente */}
      <div 
        className="fixed inset-0 z-1 bg-white opacity-30" // Cambiado a z-1 y reducido opacidad
        aria-hidden="true"
      ></div>
      
      {/* Sidebar - sin cambios */}
      <div className="relative z-20 md:flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userRole={userRole} />
      </div>
      
      {/* Main content - sin cambios importantes */}
      <div className="flex-1 flex flex-col w-full overflow-hidden relative z-10">
        <Header 
          setSidebarOpen={setSidebarOpen} 
          userRole={userRole} 
          handleSignOut={handleSignOut}
        />
        
        {/* CAMBIO 3: Contenedor más transparente */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-full mx-auto lg:max-w-7xl w-full">
            <div className="bg-white bg-opacity-70 rounded-lg shadow-sm p-4 sm:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;