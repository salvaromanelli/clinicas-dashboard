import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Loading from '../components/shared/Loading';
import { getDateRangeFromDays } from '../utils/dateUtils';
import { formatDateForDB } from '../utils/dateUtils';

const ChatbotMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [chatInteractions, setChatInteractions] = useState([]);
  const [filteredInteractions, setFilteredInteractions] = useState([]);
  const [dateRange, setDateRange] = useState(getDateRangeFromDays(7));
  const [searchQuery, setSearchQuery] = useState('');
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [commonQuestions, setCommonQuestions] = useState([]);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [sessionMetrics, setSessionMetrics] = useState({ total: 0, avgMessages: 0 });

  useEffect(() => {
    fetchChatbotInteractions();
  }, [dateRange]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredInteractions(chatInteractions);
    } else {
      const filtered = chatInteractions.filter(
        interaction => 
          interaction.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          interaction.response.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredInteractions(filtered);
    }
  }, [searchQuery, chatInteractions]);

  const fetchChatbotInteractions = async () => {
    setLoading(true);
    try {
      const startDate = formatDateForDB(dateRange.startDate);
      const endDate = formatDateForDB(dateRange.endDate);
      
      // Obtener todas las conversaciones
      const { data, error } = await supabase.rpc('get_all_chatbot_conversations', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: 100
      });
      
      if (error) {
        console.error('Error al obtener conversaciones:', error);
        throw error;
      }
      
      console.log('Conversaciones obtenidas:', data?.length || 0);
      
      // Obtener estadísticas generales
      const { data: analytics, error: analyticsError } = await supabase.rpc('get_chatbot_analytics', {
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      if (analyticsError) {
        console.error('Error al obtener estadísticas:', analyticsError);
      } else if (analytics) {
        // Actualizar métricas generales
        setTotalInteractions(analytics.total_messages || 0);
        setSessionMetrics({
          total: analytics.sessions_count || 0,
          avgMessages: analytics.avg_messages_per_session || '0'
        });
      }
      
      // Obtener preguntas frecuentes
      const { data: commonQs, error: qsError } = await supabase.rpc('get_chatbot_common_questions', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: 5
      });
      
      if (qsError) {
        console.error('Error al obtener preguntas frecuentes:', qsError);
      } else if (commonQs) {
        setCommonQuestions(commonQs);
      }
      
      // Procesar las conversaciones
      if (!data || data.length === 0) {
        console.log('No se encontraron conversaciones');
        setChatInteractions([]);
        setFilteredInteractions([]);
        setLoading(false);
        return;
      }
      
      // Transformar datos para la UI
      const processedData = data.map(item => ({
        id: item.conversation_id || String(Math.random()),
        timestamp: new Date(item.timestamp || item.created_at),
        userId: item.user_id,
        question: item.message_text || 'Sin pregunta registrada',
        response: item.response_text || 'Sin respuesta registrada',
        device: (item.device_info && typeof item.device_info === 'object') ? 
                (item.device_info.model || 'Desconocido') : 'Desconocido',
        sessionId: item.session_id || 'sin-sesion',
        metadata: (item.message_metadata && typeof item.message_metadata === 'object') ? 
                  item.message_metadata : {}
      }));
      
      setChatInteractions(processedData);
      setFilteredInteractions(processedData);
      setTotalInteractions(processedData.length);
      
      // Analizar los datos para estadísticas locales
      analyzeCommonQuestions(processedData);
      analyzeSessionMetrics(processedData);
      
    } catch (error) {
      console.error('Error al obtener datos:', error);
      setChatInteractions([]);
      setFilteredInteractions([]);
      setTotalInteractions(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredInteractions(chatInteractions);
      return;
    }
    
    setLoading(true);
    try {
      const startDate = formatDateForDB(dateRange.startDate);
      const endDate = formatDateForDB(dateRange.endDate);
      
      const { data, error } = await supabase.rpc('search_chatbot_conversations', {
        p_search_term: searchQuery,
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: 50
      });
      
      if (error) throw error;
      
      // Transformar resultados como antes
      const processedResults = data.map(item => ({
        id: item.conversation_id || String(Math.random()),
        timestamp: new Date(item.timestamp || item.created_at),
        userId: item.user_id,
        question: item.message_text || 'Sin pregunta registrada',
        response: item.response_text || 'Sin respuesta registrada',
        device: (item.device_info && typeof item.device_info === 'object') ? 
                (item.device_info.model || 'Desconocido') : 'Desconocido',
        sessionId: item.session_id || 'sin-sesion',
        metadata: (item.message_metadata && typeof item.message_metadata === 'object') ? 
                  item.message_metadata : {}
      }));
      
      setFilteredInteractions(processedResults);
      
    } catch (error) {
      console.error('Error en búsqueda:', error);
      // Mantener los datos filtrados anteriores
    } finally {
      setLoading(false);
    }
  };
  
  const analyzeCommonQuestions = (interactions) => {
    const questionMap = new Map();
    
    interactions.forEach(interaction => {
      const question = interaction.question.toLowerCase().trim();
      if (question && question !== 'sin pregunta registrada') {
        questionMap.set(question, (questionMap.get(question) || 0) + 1);
      }
    });
    
    // Convertir y ordenar
    const sortedQuestions = Array.from(questionMap.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
      
    setCommonQuestions(sortedQuestions);
  };

  const analyzeSessionMetrics = (interactions) => {
    // Agrupar por sessionId
    const sessionMap = new Map();
    
    interactions.forEach(interaction => {
      if (!interaction.sessionId) return;
      
      if (!sessionMap.has(interaction.sessionId)) {
        sessionMap.set(interaction.sessionId, []);
      }
      
      sessionMap.get(interaction.sessionId).push(interaction);
    });
    
    // Calcular métricas
    const totalSessions = sessionMap.size;
    let totalMessages = 0;
    
    sessionMap.forEach(messages => {
      totalMessages += messages.length;
    });
    
    const avgMessagesPerSession = totalSessions > 0 ? 
      (totalMessages / totalSessions).toFixed(1) : '0';
    
    setSessionMetrics({
      total: totalSessions,
      avgMessages: avgMessagesPerSession
    });
  };

  const handleDateRangeChange = (days) => {
    setDateRange(getDateRangeFromDays(days));
  };
  
  const handleInteractionSelect = (interaction) => {
    setSelectedInteraction(interaction);
  };

  // Resto del componente sin cambios...
  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Monitoreo del Chatbot</h1>
        
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

      {/* Dashboard de chatbot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Estadísticas principales */}
        <Card title="Estadísticas del Chatbot">
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-sm font-medium text-gray-500">Total interacciones:</span>
              <span className="text-lg font-semibold text-gray-900">{totalInteractions}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-sm font-medium text-gray-500">Total sesiones:</span>
              <span className="text-lg font-semibold text-gray-900">{sessionMetrics.total}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-sm font-medium text-gray-500">Mensajes por sesión:</span>
              <span className="text-lg font-semibold text-gray-900">{sessionMetrics.avgMessages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Promedio diario:</span>
              <span className="text-lg font-semibold text-gray-900">
                {Math.round(totalInteractions / (dateRange.days || 1))}
              </span>
            </div>
          </div>
        </Card>
        
        {/* Preguntas más comunes */}
        <Card title="Preguntas Más Frecuentes">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loading size="md" message="Cargando datos..." />
            </div>
          ) : commonQuestions.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {commonQuestions.map((item, index) => (
                <li key={index} className="p-4">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-800">"{item.question}"</div>
                    <div className="text-sm font-medium text-gray-500">{item.count} veces</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No hay datos suficientes
            </div>
          )}
        </Card>
        
        {/* Filtro de búsqueda */}
        <Card title="Búsqueda de Conversaciones">
          <div className="p-4">
            <div className="mb-3">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar en preguntas y respuestas
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Ingrese texto para buscar..."
                />
                <button 
                  onClick={handleSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-brand-600 hover:text-brand-800"
                >
                  Buscar
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredInteractions.length} resultados encontrados
            </div>
          </div>
        </Card>
      </div>

      {/* Sección principal: Lista de conversaciones y detalle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista de conversaciones */}
        <div className="lg:col-span-1">
          <Card title="Historial de Conversaciones">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <Loading size="lg" message="Cargando conversaciones..." />
              </div>
            ) : filteredInteractions.length > 0 ? (
              <div className="overflow-y-auto max-h-96">
                <ul className="divide-y divide-gray-200">
                  {filteredInteractions.map((interaction) => (
                    <li 
                      key={interaction.id}
                      onClick={() => handleInteractionSelect(interaction)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedInteraction?.id === interaction.id ? 'bg-brand-50' : ''}`}
                    >
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-gray-500">
                          {interaction.timestamp.toLocaleString()}
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {interaction.question.length > 60 ? interaction.question.substring(0, 60) + '...' : interaction.question}
                        </span>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">
                            Usuario: {interaction.userId}
                          </span>
                          <span className="text-xs text-gray-500">
                            Sesión: {interaction.sessionId?.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No se encontraron interacciones con el chatbot
              </div>
            )}
          </Card>
        </div>
        
        {/* Detalle de conversación */}
        <div className="lg:col-span-2">
          <Card title="Detalle de Conversación">
            {selectedInteraction ? (
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Pregunta del usuario</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-800">{selectedInteraction.question}</p>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Usuario: {selectedInteraction.userId}</span>
                    <span>Dispositivo: {selectedInteraction.device}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Respuesta del asistente</h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-800">{selectedInteraction.response}</p>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Fecha: {selectedInteraction.timestamp.toLocaleString()}</span>
                    <span>Sesión: {selectedInteraction.sessionId}</span>
                  </div>
                </div>

                {/* Información adicional de metadata si existe */}
                {Object.keys(selectedInteraction.metadata).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Metadatos adicionales</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedInteraction.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-20 flex flex-col items-center justify-center">
                <div className="text-brand-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-gray-500">Seleccione una conversación para ver los detalles</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Nueva sección para análisis por sesión */}
      <Card title="Análisis de Sesiones">
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loading size="md" message="Cargando análisis..." />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>La visualización detallada de sesiones está en desarrollo</p>
              <p className="mt-2 text-sm">El panel mostrará gráficos de duración de sesiones y satisfacción de usuarios</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatbotMonitoring;