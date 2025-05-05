import React, { useState, useEffect } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import { getDateRangeFromDays } from '../utils/dateUtils';
import Loading from '../components/shared/Loading';
import { supabase } from '../services/supabase';
import { formatDateForDB } from '../utils/dateUtils';

// Importaciones para gráficos
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MobileAnalytics = () => {
  // Estados
  const [dateRange, setDateRange] = useState(getDateRangeFromDays(30));
  const [loading, setLoading] = useState(true);
  const [timeInterval, setTimeInterval] = useState('day');
  const [usageStats, setUsageStats] = useState({
    activeUsers: 0,
    anonymousUsers: 0,
    totalEvents: 0,
    averageEventsPerUser: '0',
    platformCounts: {
      iOS: 0,
      Android: 0,
      unknown: 0
    }
  });
  const [pageViewData, setPageViewData] = useState([]);
  const [interactionData, setInteractionData] = useState([]);
  const [deviceData, setDeviceData] = useState({
    topModels: [],
    osVersions: [],
    appVersions: []
  });
  const [timeSeriesData, setTimeSeriesData] = useState({
    labels: [],
    events: []
  });
  const [eventTypeData, setEventTypeData] = useState([]);

  // Función para obtener estadísticas de uso
  const fetchUsageStats = async () => {
    try {
      const startDate = formatDateForDB(dateRange.startDate);
      const endDate = formatDateForDB(dateRange.endDate);
      
      // Obtener todos los eventos para análisis completo
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('No se encontraron datos para el período seleccionado');
        return;
      }
      
      // Analizar los datos para obtener métricas
      const uniqueUsers = new Set();
      const anonymousUsers = new Set();
      const platformCounts = { iOS: 0, Android: 0, unknown: 0 };
      const eventTypes = new Map();
      
      data.forEach(event => {
        // Contar usuarios únicos
        if (event.user_id) {
          if (event.user_id === 'anonymous') {
            anonymousUsers.add(event.session_id || 'unknown-session');
          } else {
            uniqueUsers.add(event.user_id);
          }
        }
        
        // Contar plataformas
        if (event.device_info && typeof event.device_info === 'object') {
          const platform = event.device_info.platform;
          if (platform === 'iOS') platformCounts.iOS += 1;
          else if (platform === 'Android') platformCounts.Android += 1;
          else platformCounts.unknown += 1;
        } else {
          platformCounts.unknown += 1;
        }
        
        // Contar tipos de eventos
        const eventType = event.event_type || 'unknown';
        eventTypes.set(eventType, (eventTypes.get(eventType) || 0) + 1);
      });
      
      // Calcular métricas finales
      const activeUsers = uniqueUsers.size;
      const anonUsers = anonymousUsers.size;
      const totalUsers = activeUsers + anonUsers;
      const totalEvents = data.length;
      
      setUsageStats({
        activeUsers,
        anonymousUsers: anonUsers,
        totalEvents,
        averageEventsPerUser: totalUsers > 0 ? (totalEvents / totalUsers).toFixed(1) : '0',
        platformCounts
      });
      
      // Preparar datos de tipos de eventos
      const eventTypeArray = Array.from(eventTypes.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
      
      setEventTypeData(eventTypeArray);
    } catch (error) {
      console.error('Error al obtener datos de uso:', error);
    }
  };
  
  // Función para obtener datos de vistas de página
  const fetchPageViews = async () => {
    try {
      const startDate = formatDateForDB(dateRange.startDate);
      const endDate = formatDateForDB(dateRange.endDate);
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
        
      if (error) throw error;
      
      // Agrupar por nombre de página
      const pageViews = new Map();
      
      data.forEach(event => {
        const pageName = event.event_name || 'Desconocida';
        pageViews.set(pageName, (pageViews.get(pageName) || 0) + 1);
      });
      
      // Convertir a array y ordenar por cantidad
      const formattedData = Array.from(pageViews.entries())
        .map(([screen, views]) => ({ screen, views }))
        .sort((a, b) => b.views - a.views);
      
      setPageViewData(formattedData);
    } catch (error) {
      console.error('Error al obtener vistas de página:', error);
      setPageViewData([]);
    }
  };
  
  // Función para obtener datos de interacciones
  const fetchInteractions = async () => {
    try {
      const startDate = formatDateForDB(dateRange.startDate);
      const endDate = formatDateForDB(dateRange.endDate);
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'interaction')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
        
      if (error) throw error;
      
      // Agrupar por tipo de interacción
      const interactions = new Map();
      
      data.forEach(event => {
        const action = event.event_name || 'Desconocida';
        interactions.set(action, (interactions.get(action) || 0) + 1);
      });
      
      // Convertir a array y ordenar
      const formattedData = Array.from(interactions.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);
      
      setInteractionData(formattedData);
    } catch (error) {
      console.error('Error al obtener interacciones:', error);
      setInteractionData([]);
    }
  };
  
  // Función para obtener datos de dispositivos
  const fetchDeviceInfo = async () => {
    try {
      const startDate = formatDateForDB(dateRange.startDate);
      const endDate = formatDateForDB(dateRange.endDate);
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('device_info')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
        
      if (error) throw error;
      
      // Mapas para contar modelos, versiones de SO y versiones de la app
      const modelMap = new Map();
      const osVersionMap = new Map();
      const appVersionMap = new Map();
      
      data.forEach(item => {
        if (!item.device_info || typeof item.device_info !== 'object') return;
        
        // Contar modelos
        const model = item.device_info.model || 'Desconocido';
        modelMap.set(model, (modelMap.get(model) || 0) + 1);
        
        // Contar versiones de SO
        const osVersion = item.device_info.os_version || 'Desconocido';
        osVersionMap.set(osVersion, (osVersionMap.get(osVersion) || 0) + 1);
        
        // Contar versiones de app
        const appVersion = item.device_info.app_version || 'Desconocido';
        appVersionMap.set(appVersion, (appVersionMap.get(appVersion) || 0) + 1);
      });
      
      // Convertir a arrays y ordenar
      const topModels = Array.from(modelMap.entries())
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
      const osVersions = Array.from(osVersionMap.entries())
        .map(([version, count]) => ({ version, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
      const appVersions = Array.from(appVersionMap.entries())
        .map(([version, count]) => ({ version, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
      setDeviceData({ topModels, osVersions, appVersions });
    } catch (error) {
      console.error('Error al obtener información de dispositivos:', error);
      setDeviceData({ topModels: [], osVersions: [], appVersions: [] });
    }
  };
  
  // Función para obtener datos de series temporales
  const fetchTimeSeriesData = async () => {
    try {
      const startDate = formatDateForDB(dateRange.startDate);
      const endDate = formatDateForDB(dateRange.endDate);
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('timestamp')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp');
        
      if (error) throw error;
      
      // Agrupar por intervalo de tiempo
      const eventsByDate = new Map();
      
      data.forEach(item => {
        const date = new Date(item.timestamp);
        let timeKey;
        
        if (timeInterval === 'day') {
          timeKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (timeInterval === 'week') {
          // Número de semana
          const weekNum = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
          timeKey = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        } else { // month
          timeKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        
        // Incrementar conteo de eventos
        eventsByDate.set(timeKey, (eventsByDate.get(timeKey) || 0) + 1);
      });
      
      // Convertir a formato para gráfico
      const sortedDates = Array.from(eventsByDate.keys()).sort();
      
      setTimeSeriesData({
        labels: sortedDates,
        events: sortedDates.map(date => eventsByDate.get(date) || 0)
      });
    } catch (error) {
      console.error('Error al obtener datos de series temporales:', error);
      setTimeSeriesData({ labels: [], events: [] });
    }
  };
  
  // Cargar todos los datos
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsageStats(),
          fetchPageViews(),
          fetchInteractions(),
          fetchDeviceInfo(),
          fetchTimeSeriesData()
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [dateRange, timeInterval]);
  
  const handleDateRangeChange = (days) => {
    setDateRange(getDateRangeFromDays(days));
  };

  // Datos para el gráfico de línea
  const lineChartData = {
    labels: timeSeriesData.labels || [],
    datasets: [
      {
        label: 'Eventos',
        data: timeSeriesData.events || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      }
    ],
  };

  // Opciones para el gráfico de línea
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  // Datos para el gráfico de pastel de plataformas
  const pieChartData = {
    labels: ['iOS', 'Android', 'Otro'],
    datasets: [
      {
        label: 'Usuarios por plataforma',
        data: [
          usageStats.platformCounts.iOS, 
          usageStats.platformCounts.Android, 
          usageStats.platformCounts.unknown
        ].filter(count => count > 0),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(201, 203, 207, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(201, 203, 207, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Opciones para el gráfico de pastel
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header y selector de fechas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Análisis de App Móvil</h1>
        
        <div className="mt-3 sm:mt-0 flex space-x-2">
          <Button 
            onClick={() => handleDateRangeChange(7)} 
            variant={dateRange.days === 7 ? 'primary' : 'secondary'}
            size="sm"
          >
            Últimos 7 días
          </Button>
          <Button 
            onClick={() => handleDateRangeChange(30)} 
            variant={dateRange.days === 30 ? 'primary' : 'secondary'}
            size="sm"
          >
            Últimos 30 días
          </Button>
          <Button 
            onClick={() => handleDateRangeChange(90)} 
            variant={dateRange.days === 90 ? 'primary' : 'secondary'}
            size="sm"
          >
            Últimos 90 días
          </Button>
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Usuarios Activos</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats.activeUsers}
            </dd>
            <dd className="mt-1 text-sm text-gray-500">
              {usageStats.anonymousUsers} anónimos
            </dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Eventos</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats.totalEvents}
            </dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Prom. Eventos/Usuario</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats.averageEventsPerUser}
            </dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Páginas Vistas</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {pageViewData.reduce((sum, item) => sum + item.views, 0)}
            </dd>
          </div>
        </div>
      </div>

      {/* Uso a lo largo del tiempo - GRÁFICO DE LÍNEA */}
      <Card title="Uso de la App a lo Largo del Tiempo">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Muestra el patrón de uso de la aplicación a lo largo del tiempo
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setTimeInterval('day')} 
              variant={timeInterval === 'day' ? 'primary' : 'secondary'}
              size="xs"
            >
              Diario
            </Button>
            <Button 
              onClick={() => setTimeInterval('week')} 
              variant={timeInterval === 'week' ? 'primary' : 'secondary'}
              size="xs"
            >
              Semanal
            </Button>
            <Button 
              onClick={() => setTimeInterval('month')} 
              variant={timeInterval === 'month' ? 'primary' : 'secondary'}
              size="xs"
            >
              Mensual
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loading size="md" message="Cargando datos de uso..." />
          </div>
        ) : timeSeriesData.labels?.length > 0 ? (
          <div className="h-64">
            <Line options={lineChartOptions} data={lineChartData} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No hay datos disponibles para este período</p>
          </div>
        )}
      </Card>

      {/* Distribución por plataforma y páginas más visitadas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Distribución por Plataforma">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loading size="md" message="Cargando datos..." />
            </div>
          ) : (usageStats.platformCounts.iOS > 0 || 
                usageStats.platformCounts.Android > 0 || 
                usageStats.platformCounts.unknown > 0) ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-full h-full max-w-xs mx-auto">
                <Pie options={pieChartOptions} data={pieChartData} />
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No hay datos de plataforma disponibles</p>
            </div>
          )}
        </Card>
        
        <Card title="Páginas Más Visitadas">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loading size="md" message="Cargando datos..." />
            </div>
          ) : pageViewData.length > 0 ? (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {pageViewData.slice(0, 8).map((screen, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-700">{screen.screen}</div>
                    <div className="text-sm font-medium text-gray-700">{screen.views} vistas</div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${(screen.views / (pageViewData[0]?.views || 1)) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No hay datos de páginas visitadas disponibles</p>
            </div>
          )}
        </Card>
      </div>

      {/* Interacciones de usuario y eventos de conversión */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Interacciones Más Comunes">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loading size="md" message="Cargando datos..." />
            </div>
          ) : interactionData.length > 0 ? (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {interactionData.slice(0, 8).map((interaction, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-700">{interaction.action}</div>
                    <div className="text-sm font-medium text-gray-700">{interaction.count}</div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${(interaction.count / (interactionData[0]?.count || 1)) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No hay datos de interacciones disponibles</p>
            </div>
          )}
        </Card>
        
        <Card title="Distribución de Tipos de Eventos">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loading size="md" message="Cargando datos..." />
            </div>
          ) : eventTypeData.length > 0 ? (
            <div className="overflow-x-auto max-h-64">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % del Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eventTypeData.map((event, index) => {
                    const total = eventTypeData.reduce((sum, e) => sum + e.count, 0);
                    const percentage = total > 0 ? (event.count / total) * 100 : 0;
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {event.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No hay datos de eventos disponibles</p>
            </div>
          )}
        </Card>
      </div>

      {/* Información de dispositivos */}
      <Card title="Información de Dispositivos">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loading size="md" message="Cargando datos de dispositivos..." />
          </div>
        ) : deviceData.topModels.length > 0 || deviceData.osVersions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Modelos Principales</h3>
              <div className="space-y-4">
                {deviceData.topModels.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-gray-700">{item.model}</div>
                      <div className="text-sm font-medium text-gray-700">{item.count}</div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${(item.count / (deviceData.topModels[0]?.count || 1)) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-600"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Versiones de SO</h3>
              <div className="space-y-4">
                {deviceData.osVersions.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-gray-700">{item.version}</div>
                      <div className="text-sm font-medium text-gray-700">{item.count}</div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${(item.count / (deviceData.osVersions[0]?.count || 1)) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Versiones de App</h3>
              <div className="space-y-4">
                {deviceData.appVersions.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-gray-700">{item.version}</div>
                      <div className="text-sm font-medium text-gray-700">{item.count}</div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${(item.count / (deviceData.appVersions[0]?.count || 1)) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No hay datos de dispositivos disponibles</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MobileAnalytics;