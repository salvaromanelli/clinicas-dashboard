import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  XMarkIcon,
  HomeIcon, 
  UsersIcon,
  ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen, userRole }) => {
  // Lista de navegación simplificada
  const navigation = [
    { name: 'Dashboard App Móvil', path: '/', icon: HomeIcon },
    { name: 'Monitoreo Chatbot', path: '/chatbot', icon: ChatBubbleLeftRightIcon }, 
    { name: 'Gestión de Usuarios', path: '/users', icon: UsersIcon, role: 'developer' },
  ];

  return (
    <div className={`md:w-64 bg-white bg-opacity-80 border-r border-gray-200 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
      <div className="flex flex-col h-full">
        {/* Mobile close button */}
        <div className="md:hidden absolute top-0 right-0 p-4">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Logo */}
        <div className="flex items-center justify-center h-20 flex-shrink-0">
          <img src="/LOGO.png" alt="Clínicas Love" className="h-14" />
        </div>
        
        {/* Navigation */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <nav className="space-y-1">
            {navigation
              .filter(item => !item.role || item.role === userRole)
              .map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-2 text-sm rounded-md ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ))}
          </nav>
        </div>
        
        {/* Footer con versión */}
        <div className="p-4 text-xs text-gray-500 border-t border-gray-200">
          App Clínicas Love v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;