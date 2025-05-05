import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devModeHint, setDevModeHint] = useState(false);
  const [secretKeys, setSecretKeys] = useState([]);
  const navigate = useNavigate();

  // Registrar la combinación de teclas para el modo desarrollador
  useEffect(() => {
    // Conjunto para almacenar teclas presionadas actualmente
    const pressedKeys = new Set();
    
    const handleKeyDown = (e) => {
      // Agregamos la tecla al conjunto
      pressedKeys.add(e.key.toLowerCase());
      setSecretKeys([...pressedKeys]);
      
      // Combinación secreta: Ctrl + Shift + D
      if (
        pressedKeys.has('control') && 
        pressedKeys.has('shift') && 
        pressedKeys.has('d')
      ) {
        e.preventDefault();
        handleDevLogin();
        
        // Mostrar indicador temporal
        setDevModeHint(true);
        setTimeout(() => setDevModeHint(false), 2000);
      }
    };

    const handleKeyUp = (e) => {
      // Eliminamos la tecla del conjunto cuando se libera
      pressedKeys.delete(e.key.toLowerCase());
      setSecretKeys([...pressedKeys]);
    };

    // Agregar event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Limpiar event listeners al desmontar
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Intentar iniciar sesión con Supabase
      let success = false;
      
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!error) {
          success = true;
        } else {
          setError(error.message);
        }
      } else {
        setError("Supabase no está configurado. Use el modo desarrollo.");
      }
      
      if (success) {
        navigate('/');
      }
    } catch (error) {
      setError("Error al iniciar sesión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Modo desarrollador - Acceso rápido (ahora solo accesible con combinación de teclas)
  const handleDevLogin = () => {
    localStorage.setItem('dev_mode', 'true');
    localStorage.setItem('user_role', 'developer');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Imagen de fondo */}
      <div 
        className="fixed inset-0 z-0" 
        style={{ 
          backgroundImage: 'url(/Clinicas_love_fondo.jpg)', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      ></div>
      
      {/* Overlay para mejorar legibilidad */}
      <div 
        className="fixed inset-0 z-1 bg-black opacity-40"
        aria-hidden="true"
      ></div>
      
      {/* Contenedor del formulario */}
      <div className="max-w-md w-full space-y-8 z-10 p-10 bg-white bg-opacity-95 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Clínicas Love App 
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tus credenciales para acceder
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error de autenticación</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Indicador temporal de modo desarrollador activado */}
        {devModeHint && (
          <div className="rounded-md bg-green-50 p-4 animate-pulse">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Modo desarrollador activado</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
        
        {/* Sutil indicación para desarrolladores (opcional) */}
        <div className="pt-4 text-center">
          <div className="text-xs text-gray-400">
            {import.meta.env.DEV && 'Ctrl+Shift+D para modo desarrollador'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;