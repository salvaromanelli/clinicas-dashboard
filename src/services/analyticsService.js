
import { supabase } from './supabase';
import { formatDateForDB } from '../utils/dateUtils';

class AnalyticsService {
  // Fetch page view statistics
  async getPageViewStats() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Using proper Supabase syntax for aggregation
      const { data, error } = await supabase
        .from('analytics_events')
        .select(`
          event_name,
          count:count(*)
        `)
        .eq('event_type', 'page_view')
        .gte('timestamp', thirtyDaysAgo)
        .lte('timestamp', new Date().toISOString())
        .groupBy('event_name')  // Use groupBy instead of group
        .order('count', { ascending: false });
      
      if (error) throw error;
      
      // Process data to a more usable format if needed
      return data.map(item => ({
        page: item.event_name,
        count: item.count
      }));
      
    } catch (error) {
      console.error("Error fetching page view stats:", error);
      throw error;
    }
  }

  // Fetch user interaction data
  async getUserInteractions(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'interaction')
        .gte('timestamp', formatDateForDB(startDate))
        .lte('timestamp', formatDateForDB(endDate))
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      throw error;
    }
  }

  // Fetch conversion data
  async getConversionData(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'conversion')
        .gte('timestamp', formatDateForDB(startDate))
        .lte('timestamp', formatDateForDB(endDate))
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching conversion data:', error);
      throw error;
    }
  }

  // Fetch clinic metrics for comparison
  async getClinicMetrics(metricName, clinicIds, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('clinic_metrics')
        .select('*')
        .eq('metric_name', metricName)
        .in('clinic_id', clinicIds)
        .gte('timestamp', formatDateForDB(startDate))
        .lte('timestamp', formatDateForDB(endDate))
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching clinic metrics:', error);
      throw error;
    }
  }

  // Fetch list of all clinics
  async getClinics() {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, location')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching clinics:', error);
      throw error;
    }
  }

  // Fetch KPI data
  async getKPIs(category, startDate, endDate) {
    try {
      let query = supabase
        .from('performance_kpis')
        .select('*')
        .gte('timestamp', formatDateForDB(startDate))
        .lte('timestamp', formatDateForDB(endDate))
        .order('timestamp', { ascending: false });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();