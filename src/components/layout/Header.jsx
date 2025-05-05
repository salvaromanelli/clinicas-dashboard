import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

const Header = ({ setSidebarOpen, handleSignOut }) => {
  return (
    <header className="bg-white bg-opacity-80 border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden text-gray-500 hover:text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Title - only visible on mobile */}
          <div className="md:hidden font-semibold text-lg">
            Dashboard App Móvil
          </div>
          
          {/* Right side buttons */}
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="ml-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-500 focus:outline-none"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;