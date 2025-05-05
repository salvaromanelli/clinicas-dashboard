import { createClient } from '@supabase/supabase-js';

// Inicializar el cliente de Supabase con manejo de errores
let supabase;
try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase initialized successfully');
  } else {
    console.warn('Supabase credentials missing, fallback to development mode');
  }
} catch (error) {
  console.error('Failed to initialize Supabase:', error);
}

// Exportar el cliente de Supabase
export { supabase };

// Verificar si el usuario está autenticado
export const isAuthenticated = async () => {
  try {
    // Modo desarrollo - siempre autenticado si está activado
    if (localStorage.getItem('dev_mode') === 'true') {
      console.log('Using development authentication mode');
      return true;
    }
    
    // Verificar con Supabase si está disponible
    if (supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return !!data.session;
    }
    
    console.warn('Supabase not available and dev mode not enabled');
    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    // Fallback a modo desarrollo en caso de error
    return localStorage.getItem('dev_mode') === 'true';
  }
};

// Obtener el rol del usuario actual
export const getUserRole = async () => {
  try {
    // Si es modo desarrollador
    if (localStorage.getItem('dev_mode') === 'true') {
      return localStorage.getItem('user_role') || 'developer';
    }
    
    // Verificar rol en Supabase si está disponible
    if (supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) return null;
      
      // Obtener datos del usuario desde una tabla de usuarios
      const { data: userData, error: userError } = await supabase
        .from('dashboard_users')
        .select('role')
        .eq('id', data.session.user.id)
        .single();
        
      if (userError) {
        console.warn('Error fetching user role:', userError);
        return 'user'; // Rol por defecto
      }
      
      return userData?.role || 'user';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    // Fallback a localStorage en caso de error
    return localStorage.getItem('user_role') || 'user';
  }
};

// Cerrar sesión
export const signOut = async () => {
  try {
    // Limpiar modo desarrollador
    localStorage.removeItem('dev_mode');
    localStorage.removeItem('user_role');
    
    // Cerrar sesión en Supabase si está disponible
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
};

// Registrar un nuevo usuario (para admin que crea usuarios)
export const createUser = async (email, password, role, clinic_id = null, name = '') => {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    
    // Verificar si el usuario actual es desarrollador
    const currentRole = await getUserRole();
    if (currentRole !== 'developer') {
      throw new Error('Only developers can create users');
    }
    
    // Llamar a una función RPC en Supabase para crear el usuario
    const { data, error } = await supabase.rpc('create_dashboard_user', {
      p_email: email,
      p_password: password,
      p_role: role,
      p_clinic_id: clinic_id,
      p_name: name
    });
    
    if (error) throw error;
    
    return { success: true, user: data };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

// Obtener lista de clínicas (para admin/developer)
export const getClinics = async () => {
  try {
    if (!supabase) {
      // En modo desarrollo, devolver datos ficticios
      if (localStorage.getItem('dev_mode') === 'true') {
        return [
          { id: 1, name: 'Clínica Central', location: 'Ciudad Principal' },
          { id: 2, name: 'Clínica Norte', location: 'Zona Norte' },
          { id: 3, name: 'Clínica Sur', location: 'Zona Sur' }
        ];
      }
      throw new Error('Supabase not initialized');
    }
    
    const { data, error } = await supabase
      .from('clinics')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return [];
  }
};

// Obtener lista de usuarios (para developer)

export const getUsers = async () => {
  try {
    if (!supabase) {
      // En modo desarrollo, devolver datos ficticios
      if (localStorage.getItem('dev_mode') === 'true') {
        return [
          { id: 1, email: 'admin@clinica.com', role: 'admin', clinic_name: 'Clínica Central' },
          { id: 2, email: 'user@clinica.com', role: 'user', clinic_name: 'Clínica Norte' }
        ];
      }
      throw new Error('Supabase not initialized');
    }
    
    // Cambiado de 'users' a 'dashboard_users'
    const { data, error } = await supabase
      .from('dashboard_users')
      .select('*, clinics(name)');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Modificar la función getCurrentUser()
export const getCurrentUser = async () => {
  try {
    // Si es modo desarrollador, devolver un usuario de prueba
    if (localStorage.getItem('dev_mode') === 'true') {
      const role = localStorage.getItem('user_role') || 'developer';
      return {
        id: 'dev-user-id',
        email: 'developer@example.com',
        role: role,
        name: 'Usuario Desarrollador',
        avatar_url: null
      };
    }
    
    // Verificar con Supabase si está disponible
    if (supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) return null;
      
      // Cambiado de 'users' a 'dashboard_users'
      const { data: userData, error: userError } = await supabase
        .from('dashboard_users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
        
      if (userError) {
        console.warn('Error fetching user data:', userError);
        // Devolver datos básicos del usuario de autenticación
        return {
          id: data.session.user.id,
          email: data.session.user.email,
          role: 'user',
          name: data.session.user.email.split('@')[0],
          avatar_url: null
        };
      }
      
      return {
        ...userData,
        email: data.session.user.email
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Verificar si el modo desarrollo está activo
export const isDevelopmentMode = () => {
  return localStorage.getItem('dev_mode') === 'true';
};