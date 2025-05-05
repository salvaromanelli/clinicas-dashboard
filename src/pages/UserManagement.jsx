import React, { useState, useEffect } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import { supabase } from '../services/supabase';
import { getUserRole } from '../services/supabase';
import Loading from '../components/shared/Loading';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [clinics, setClinics] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Comprobar si el usuario actual es desarrollador
  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole();
      setUserRole(role);
    };
    
    checkRole();
  }, []);

  // Cargar usuarios y clínicas
  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // En modo desarrollo, cargamos datos simulados
      if (localStorage.getItem('dev_mode') === 'true') {
        setClinics([
          { id: 1, name: 'Clínicas Love Madrid' },
          { id: 2, name: 'Clínicas Love Barcelona' },
          { id: 3, name: 'Clínicas Love Málaga' },
          { id: 4, name: 'Clínicas Love Tenerife' },
          { id: 5, name: 'Clínicas Love Sevilla' },
        ]);
        
        setUsers([
          { id: 1, email: 'admin@clinica.com', role: 'admin', clinic_name: 'Clínicas Love Madrid' },
          { id: 2, email: 'doctor@clinica.com', role: 'user', clinic_name: 'Clínicas Love Barcelona' },
        ]);
        
        setLoading(false);
        return;
      }
      
      // En modo producción, cargar datos reales
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('*');
        
      if (clinicsError) throw clinicsError;
      
      const { data: usersData, error: usersError } = await supabase
        .from('dashboard_users')
        .select('*, clinics(name)')
        .order('email');
        
      if (usersError) throw usersError;
        
      setClinics(clinicsData || []);
      
      // Procesar usuarios para tener clinic_name accesible directamente
      const processedUsers = usersData.map(user => ({
        ...user,
        clinic_name: user.clinics?.name || null
      }));
      
      setUsers(processedUsers || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
    
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // Añade esta función para eliminar usuarios
  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario ${userEmail}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      if (localStorage.getItem('dev_mode') === 'true') {
        // En modo desarrollo, solo eliminamos del estado
        setUsers(users.filter(u => u.id !== userId));
        setSuccess(`Usuario ${userEmail} eliminado (modo desarrollo)`);
        return;
      }
      
      // En producción, usar una función RPC para eliminar usuarios
      const { error } = await supabase.rpc('delete_dashboard_user', {
        p_user_id: userId
      });
      
      if (error) throw error;
      
      // Actualizar la lista de usuarios
      const { data: updatedUsers } = await supabase
        .from('dashboard_users')
        .select('*, clinics(name)');
        
      const processedUsers = updatedUsers.map(user => ({
        ...user,
        clinic_name: user.clinics?.name || null
      }));
      
      setUsers(processedUsers || []);
      setSuccess(`Usuario ${userEmail} eliminado exitosamente`);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(`Error al eliminar usuario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!newUser.email || !newUser.password) {
        setError('Email y contraseña son obligatorios');
        return;
      }
      
      const displayName = newUser.name || newUser.email.split('@')[0];
      
      // 1. Crear el usuario usando la API de autenticación nativa
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            is_dashboard_user: true,
            role: 'monitor',
            name: displayName
          }
        }
      });
      
      if (authError) throw authError;
      
      // 2. Usuario creado correctamente en auth.users, ahora añadirlo a dashboard_users
      const { error: insertError } = await supabase
      .from('dashboard_users')
      .upsert({
        id: authData.user.id,
        email: newUser.email,
        role: 'monitor',
        name: displayName,
        updated_at: new Date()
      }, {
        onConflict: 'id'
      });
      
      if (insertError) throw insertError;
      
      // 3. Confirmar el email para que pueda iniciar sesión de inmediato
      const { error: adminError } = await supabase.auth.admin.updateUserById(
        authData.user.id, 
        { email_confirm: true }
      );
      
      // Si hay error al confirmar email, lo registramos pero no bloqueamos
      if (adminError) {
        console.warn('No se pudo confirmar el email automáticamente:', adminError);
      }
      
      setSuccess(`Usuario ${newUser.email} creado exitosamente`);
      
      // Limpiar el formulario
      setNewUser({
        email: '',
        password: '',
        name: ''
      });
      
      // Recargar la lista de usuarios
      fetchUsers();
    } catch (error) {
      console.error('Error creando usuario:', error);
      setError(`Error al crear usuario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario no es desarrollador, mostrar mensaje
  if (userRole !== 'developer') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card title="Acceso Restringido">
          <p className="text-center">Esta función solo está disponible para desarrolladores.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Gestión de Usuarios</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Crear Nuevo Usuario" className="lg:col-span-1">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={newUser.email}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={newUser.password}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre (opcional)
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={newUser.name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              />
            </div>
            
            <Button type="submit" variant="primary" className="w-full">
              Crear Usuario Monitor
            </Button>
          </form>
        </Card>
        
        <Card title="Usuarios Existentes" className="lg:col-span-2">
          {loading ? (
            <Loading message="Cargando usuarios..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clínica
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 
                            user.role === 'developer' ? 'bg-purple-100 text-purple-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {user.role === 'admin' ? 'Administrador' : 
                           user.role === 'developer' ? 'Desarrollador' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.clinic_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => alert('Funcionalidad de edición en desarrollo')}
                        >
                          Editar
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;