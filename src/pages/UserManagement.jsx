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
    role: 'admin',
    clinic_id: '',
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
    setError(null);
    setSuccess(null);
    
    try {
      // Verificar que todos los campos obligatorios estén completos
      if (!newUser.email || !newUser.password || (newUser.role === 'admin' && !newUser.clinic_id)) {
        setError('Por favor completa todos los campos requeridos');
        return;
      }
  
      setLoading(true);
      
      // Generar un nombre por defecto a partir del email
      const defaultName = newUser.email.split('@')[0];
      
      // Solo actualizar UI en modo desarrollo, pero TAMBIÉN crear usuario real
      const isDevMode = localStorage.getItem('dev_mode') === 'true';
      
      // Guarda en simulación local para UI inmediata en dev mode
      if (isDevMode) {
        const clinic = clinics.find(c => c.id === parseInt(newUser.clinic_id));
        const newUserObj = {
          id: `temp-${Date.now()}`, // ID temporal
          email: newUser.email,
          role: newUser.role,
          name: defaultName, // Añadir nombre
          clinic_name: clinic ? clinic.name : 'Sin clínica'
        };
        
        // Actualizar UI localmente para feedback inmediato
        setUsers(prev => [...prev, newUserObj]);
      }
      
      // SIEMPRE intentar crear el usuario real en Supabase
      try {
        // En producción, usar la función RPC para crear usuarios
        const { data, error: createError } = await supabase.rpc('create_dashboard_user', {
          p_email: newUser.email,
          p_password: newUser.password,
          p_role: newUser.role,
          p_clinic_id: newUser.role === 'admin' ? parseInt(newUser.clinic_id) : null,
          p_name: defaultName  // Pasar el nombre generado
        });
        
        if (createError) throw createError;
        
        setSuccess(`Usuario ${newUser.email} creado exitosamente en Supabase`);
        
        // Recargar la lista de usuarios
        const { data: updatedUsers, error: fetchError } = await supabase
          .from('dashboard_users')
          .select('*, clinics(name)');
          
        if (fetchError) throw fetchError;
        
        // Procesar los datos para tener clinic_name accesible directamente
        const processedUsers = updatedUsers?.map(user => ({
          ...user,
          clinic_name: user.clinics?.name || null
        }));
        
        setUsers(processedUsers || []);
      } catch (supabaseError) {
        console.error('Error en creación de usuario Supabase:', supabaseError);
        
        // Si estamos en modo dev, mostrar mensaje distinto
        if (isDevMode) {
          setSuccess(`Usuario ${newUser.email} simulado en UI (modo desarrollo), pero NO creado en Supabase: ${supabaseError.message}`);
        } else {
          setError(`Error al crear usuario: ${supabaseError.message}`);
          // Si no es dev mode, quitarlo de la UI también
          setUsers(prev => prev.filter(u => u.email !== newUser.email));
        }
      }
      
      // Limpiar formulario
      setNewUser({
        email: '',
        password: '',
        role: 'admin',
        clinic_id: '',
      });
      
    } catch (error) {
      console.error('Error en proceso de creación:', error);
      setError(error.message || 'Error al crear usuario');
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
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                name="role"
                id="role"
                value={newUser.role}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              >
                <option value="admin">Administrador</option>
                <option value="user">Usuario</option>
                <option value="developer">Desarrollador</option>
              </select>
            </div>
            
            {newUser.role === 'admin' && (
              <div>
                <label htmlFor="clinic_id" className="block text-sm font-medium text-gray-700">
                  Clínica
                </label>
                <select
                  name="clinic_id"
                  id="clinic_id"
                  value={newUser.clinic_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                >
                  <option value="">Seleccionar Clínica</option>
                  {clinics.map(clinic => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <Button type="submit" variant="primary" className="w-full">
              Crear Usuario
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