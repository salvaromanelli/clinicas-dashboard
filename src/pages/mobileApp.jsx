import React, { useState, useEffect } from 'react';
import { getDateRangeFromDays } from '../utils/dateUtils';
import mobileAnalyticsService from '../services/mobileAnalyticsService';

// Components
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import Loading from '../components/shared/Loading';

const MobileAnalytics = () => {
  const [dateRange, setDateRange] = useState(getDateRangeFromDays(30));
  const [usageStats, setUsageStats] = useState(null);
  const [eventDistribution, setEventDistribution] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [pageViewData, setPageViewData] = useState([]);
  const [interactionData, setInteractionData] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [deviceData, setDeviceData] = useState(null);
  const [timeInterval, setTimeInterval] = useState('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMobileAnalytics = async () => {
      setLoading(true);
      try {
        // Fetch all necessary data
        const [
          usageStatsData,
          eventDistData,
          engagementTimeData,
          pageViews,
          interactions,
          conversions,
          devices
        ] = await Promise.all([
          mobileAnalyticsService.getMobileUsageStats(dateRange.startDate, dateRange.endDate),
          mobileAnalyticsService.getEventTypeDistribution(dateRange.startDate, dateRange.endDate),
          mobileAnalyticsService.getUserEngagementTimeSeries(
            dateRange.startDate, 
            dateRange.endDate,
            timeInterval
          ),
          mobileAnalyticsService.getPageViewStats(dateRange.startDate, dateRange.endDate),
          mobileAnalyticsService.getUserInteractions(dateRange.startDate, dateRange.endDate),
          mobileAnalyticsService.getConversionEvents(dateRange.startDate, dateRange.endDate),
          mobileAnalyticsService.getDeviceDistribution(dateRange.startDate, dateRange.endDate)
        ]);
        
        setUsageStats(usageStatsData);
        setEventDistribution(eventDistData);
        setEngagementData(engagementTimeData);
        setPageViewData(pageViews);
        setInteractionData(interactions);
        setConversionData(conversions);
        setDeviceData(devices);
      } catch (error) {
        console.error('Error fetching mobile analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMobileAnalytics();
  }, [dateRange, timeInterval]);

  const handleDateRangeChange = (days) => {
    setDateRange(getDateRangeFromDays(days));
  };

  if (loading) {
    return <Loading size="lg" message="Cargando datos de la app móvil..." />;
  }

  // Prepare platform data for pie chart
  const platformData = usageStats ? [
    { label: 'iOS', value: usageStats.platformCounts.iOS },
    { label: 'Android', value: usageStats.platformCounts.Android },
    { label: 'Desconocido', value: usageStats.platformCounts.unknown }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Análisis de App Móvil</h1>
        
        <div className="mt-3 sm:mt-0 flex space-x-2">
          <Button 
            onClick={() => handleDateRangeChange(7)} 
            variant={dateRange.endDate - dateRange.startDate === 7 * 24 * 60 * 60 * 1000 ? 'primary' : 'secondary'}
            size="sm"
          >
            Últimos 7 días
          </Button>
          <Button 
            onClick={() => handleDateRangeChange(30)} 
            variant={dateRange.endDate - dateRange.startDate === 30 * 24 * 60 * 60 * 1000 ? 'primary' : 'secondary'}
            size="sm"
          >
            Últimos 30 días
          </Button>
          <Button 
            onClick={() => handleDateRangeChange(90)} 
            variant={dateRange.endDate - dateRange.startDate === 90 * 24 * 60 * 60 * 1000 ? 'primary' : 'secondary'}
            size="sm"
          >
            Últimos 90 días
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Usuarios Activos</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats?.activeUsers || 0}
            </dd>
            <dd className="mt-1 text-sm text-gray-500">
              {usageStats?.anonymousUsers || 0} anónimos
            </dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Eventos</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats?.totalEvents || 0}
            </dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Promedio Eventos/Usuario</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats?.averageEventsPerUser || 0}
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

      {/* User Engagement Over Time */}
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
        
        {engagementData.length > 0 ? (
          <LineChart
            data={engagementData}
            xKey="date"
            yKey="value"
            xLabel="Fecha"
            yLabel="Eventos"
          />
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No hay datos de uso disponibles</p>
          </div>
        )}
      </Card>

      {/* Platform distribution and Page Views - side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Distribución por Plataforma">
          {platformData.length > 0 && platformData.some(item => item.value > 0) ? (
            <PieChart
              data={platformData}
              labelKey="label"
              valueKey="value"
              title=""
            />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No hay datos de plataforma disponibles</p>
            </div>
          )}
        </Card>
        
        <Card title="Páginas Más Visitadas">
          {pageViewData.length > 0 ? (
            <div className="space-y-4">
              {pageViewData.slice(0, 8).map((screen, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-700">{screen.screen}</div>
                    <div className="text-sm font-medium text-gray-700">{screen.views} vistas</div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${(screen.views / pageViewData[0].views) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-600"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No hay datos de vistas de página disponibles</p>
            </div>
          )}
        </Card>
      </div>

      {/* User Interactions and Conversion Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Interacciones Más Comunes">
          {interactionData.length > 0 ? (
            <div className="space-y-4">
              {interactionData.slice(0, 8).map((interaction, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-700">{interaction.action}</div>
                    <div className="text-sm font-medium text-gray-700">{interaction.count}</div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${(interaction.count / interactionData[0].count) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No hay datos de interacción disponibles</p>
            </div>
          )}
        </Card>
        
        <Card title="Eventos de Conversión">
          {conversionData.length > 0 ? (
            <div className="space-y-4">
              {conversionData.slice(0, 8).map((conversion, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-700">{conversion.conversion}</div>
                    <div className="text-sm font-medium text-gray-700">{conversion.count}</div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${(conversion.count / conversionData[0].count) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No hay datos de conversión disponibles</p>
            </div>
          )}
        </Card>
      </div>

      {/* Device Information */}
      <Card title="Información de Dispositivos">
        {deviceData && (deviceData.topModels.length > 0 || deviceData.osVersions.length > 0) ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Modelos Principales</h3>
              <div className="space-y-4">
                {deviceData.topModels.slice(0, 5).map((item, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-gray-700">{item.model}</div>
                      <div className="text-sm font-medium text-gray-700">{item.count}</div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${(item.count / deviceData.topModels[0].count) * 100}%` }}
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
                {deviceData.osVersions.slice(0, 5).map((item, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-gray-700">{item.version}</div>
                      <div className="text-sm font-medium text-gray-700">{item.count}</div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${(item.count / deviceData.osVersions[0].count) * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600"
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

      {/* Event Type Distribution */}
      <Card title="Distribución de Tipos de Eventos">
        {eventDistribution.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contador
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % del Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventDistribution.map((event, index) => {
                  const total = eventDistribution.reduce((sum, e) => sum + e.count, 0);
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
  );
};

export default MobileAnalytics;