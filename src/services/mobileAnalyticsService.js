import { supabase } from './supabase';
import { formatDateForDB } from '../utils/dateUtils';

const mobileAnalyticsService = {
  // Get core usage statistics
  getMobileUsageStats: async (startDate, endDate) => {
    try {
      const startDateStr = formatDateForDB(startDate);
      const endDateStr = formatDateForDB(endDate);
      
      // Parallel requests for efficiency
      const [usersCount, eventsCount, platformData] = await Promise.all([
        // Active users (non-anonymous)
        supabase
          .from('analytics_events')
          .select('user_id', { count: 'exact', head: true })
          .gte('timestamp', startDateStr)
          .lte('timestamp', endDateStr)
          .not('user_id', 'eq', 'anonymous'),
          
        // Total events count
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .gte('timestamp', startDateStr)
          .lte('timestamp', endDateStr),
          
        // Platform data for iOS vs Android breakdown
        supabase
          .from('analytics_events')
          .select('device_info')
          .gte('timestamp', startDateStr)
          .lte('timestamp', endDateStr)
      ]);
      
      // Process platform data
      const platformCounts = { iOS: 0, Android: 0, unknown: 0 };
      platformData.data?.forEach(item => {
        const platform = item.device_info?.platform;
        if (platform === 'iOS') platformCounts.iOS += 1;
        else if (platform === 'Android') platformCounts.Android += 1;
        else platformCounts.unknown += 1;
      });
      
      // Get anonymous users
      const { data: anonymousUsers } = await supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .gte('timestamp', startDateStr)
        .lte('timestamp', endDateStr)
        .eq('user_id', 'anonymous');
      
      const activeUsers = usersCount.count || 0;
      const anonUsers = anonymousUsers?.count || 0;
      const totalUsers = activeUsers + anonUsers;
      
      return {
        activeUsers,
        anonymousUsers: anonUsers,
        totalUsers,
        totalEvents: eventsCount.count || 0,
        platformCounts,
        averageEventsPerUser: totalUsers > 0 ? 
          ((eventsCount.count || 0) / totalUsers).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error fetching mobile usage stats:', error);
      return {
        activeUsers: 0, anonymousUsers: 0, totalUsers: 0,
        totalEvents: 0, platformCounts: { iOS: 0, Android: 0, unknown: 0 },
        averageEventsPerUser: 0
      };
    }
  },
  
  // Get screen views with counts
  getPageViewStats: async (startDate, endDate) => {
    try {
      const startDateStr = formatDateForDB(startDate);
      const endDateStr = formatDateForDB(endDate);
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_name, count')
        .eq('event_type', 'page_view')
        .gte('timestamp', startDateStr)
        .lte('timestamp', endDateStr)
        .group('event_name')
        .order('count', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        screen: item.event_name,
        views: parseInt(item.count)
      }));
    } catch (error) {
      console.error('Error fetching page view stats:', error);
      return [];
    }
  },
  
  // Get user engagement over time (daily/weekly/monthly)
  getUserEngagementTimeSeries: async (startDate, endDate, interval = 'day') => {
    try {
      const startDateStr = formatDateForDB(startDate);
      const endDateStr = formatDateForDB(endDate);
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('timestamp')
        .gte('timestamp', startDateStr)
        .lte('timestamp', endDateStr)
        .order('timestamp');
      
      if (error) throw error;
      
      // Group by date interval
      const timeSeriesMap = new Map();
      
      (data || []).forEach(item => {
        const date = new Date(item.timestamp);
        let timeKey;
        
        if (interval === 'week') {
          const weekNum = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
          timeKey = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        } else if (interval === 'month') {
          timeKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else {
          timeKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
        
        if (!timeSeriesMap.has(timeKey)) {
          timeSeriesMap.set(timeKey, 0);
        }
        
        timeSeriesMap.set(timeKey, timeSeriesMap.get(timeKey) + 1);
      });
      
      // Convert to array format for charts
      return Array.from(timeSeriesMap.entries()).map(([date, count]) => ({
        date,
        value: count
      }));
    } catch (error) {
      console.error('Error fetching engagement time series:', error);
      return [];
    }
  },
  
  // Get device information (models and OS versions)
  getDeviceDistribution: async (startDate, endDate) => {
    try {
      const startDateStr = formatDateForDB(startDate);
      const endDateStr = formatDateForDB(endDate);
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('device_info')
        .gte('timestamp', startDateStr)
        .lte('timestamp', endDateStr);
      
      if (error) throw error;
      
      // Extract and count models and OS versions
      const modelMap = new Map();
      const osVersionMap = new Map();
      const appVersionMap = new Map();
      
      data?.forEach(item => {
        if (!item.device_info) return;
        
        // Handle models
        const model = item.device_info.model || 'Unknown';
        modelMap.set(model, (modelMap.get(model) || 0) + 1);
        
        // Handle OS versions
        const osVersion = item.device_info.os_version || 'Unknown';
        osVersionMap.set(osVersion, (osVersionMap.get(osVersion) || 0) + 1);
        
        // Handle app versions
        const appVersion = item.device_info.app_version || 'Unknown';
        appVersionMap.set(appVersion, (appVersionMap.get(appVersion) || 0) + 1);
      });
      
      // Convert to arrays and sort by count
      const topModels = Array.from(modelMap.entries())
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      const osVersions = Array.from(osVersionMap.entries())
        .map(([version, count]) => ({ version, count }))
        .sort((a, b) => b.count - a.count);
      
      const appVersions = Array.from(appVersionMap.entries())
        .map(([version, count]) => ({ version, count }))
        .sort((a, b) => b.count - a.count);
      
      return { topModels, osVersions, appVersions };
    } catch (error) {
      console.error('Error fetching device distribution:', error);
      return { topModels: [], osVersions: [], appVersions: [] };
    }
  }
};

export default mobileAnalyticsService;