import { supabase } from './supabase';
import { formatDateForDB } from '../utils/dateUtils';
import analyticsService from './analyticsService';

/**
 * Service for generating and managing reports
 */
const reportService = {
  /**
   * Generate an overview report with key metrics
   * @param {Date} startDate - Start date for report period
   * @param {Date} endDate - End date for report period
   * @returns {Promise<Object>} Report data
   */
  generateOverviewReport: async (startDate, endDate) => {
    try {
      // Get basic usage statistics
      const stats = await analyticsService.getUsageStatistics(startDate, endDate);
      
      // Get previous period stats for comparison
      const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(startDate);
      const prevEndDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
      
      const prevStats = await analyticsService.getUsageStatistics(prevStartDate, prevEndDate);
      
      // Calculate changes
      const calculateChange = (current, previous) => {
        if (!previous) return 0;
        return Math.round(((current - previous) / previous) * 100);
      };
      
      return {
        title: 'Application Overview Report',
        period: { startDate, endDate },
        generatedAt: new Date(),
        metrics: [
          { 
            name: 'Active Users',
            value: stats.activeUsers,
            previousValue: prevStats.activeUsers,
            change: calculateChange(stats.activeUsers, prevStats.activeUsers)
          },
          { 
            name: 'Total Appointments',
            value: stats.totalAppointments,
            previousValue: prevStats.totalAppointments,
            change: calculateChange(stats.totalAppointments, prevStats.totalAppointments)
          },
          { 
            name: 'Completed Appointments',
            value: stats.completedAppointments,
            previousValue: prevStats.completedAppointments,
            change: calculateChange(stats.completedAppointments, prevStats.completedAppointments)
          },
          { 
            name: 'New Users',
            value: stats.newUsers,
            previousValue: prevStats.newUsers,
            change: calculateChange(stats.newUsers, prevStats.newUsers)
          },
        ]
      };
    } catch (error) {
      console.error('Error generating overview report:', error);
      throw error;
    }
  },
  
  /**
   * Generate a clinic performance report
   * @param {Date} startDate - Start date for report period
   * @param {Date} endDate - End date for report period
   * @returns {Promise<Object>} Report data
   */
  generateClinicReport: async (startDate, endDate) => {
    try {
      // Fetch data for all clinics
      const [appointments, satisfaction, revenue] = await Promise.all([
        analyticsService.getClinicComparison('appointments', startDate, endDate),
        analyticsService.getClinicComparison('satisfaction', startDate, endDate),
        analyticsService.getClinicComparison('revenue', startDate, endDate)
      ]);
      
      // Calculate totals for averages
      const totalAppointments = appointments.reduce((sum, clinic) => sum + clinic.value, 0);
      const totalRevenue = revenue.reduce((sum, clinic) => sum + clinic.value, 0);
      
      // Find average satisfaction
      const avgSatisfaction = satisfaction.length > 0
        ? satisfaction.reduce((sum, clinic) => sum + clinic.value, 0) / satisfaction.length
        : 0;
      
      // Combine data for each clinic
      const clinicData = appointments.map(clinic => {
        const satisfactionData = satisfaction.find(s => s.clinic === clinic.clinic);
        const revenueData = revenue.find(r => r.clinic === clinic.clinic);
        
        return {
          name: clinic.clinic,
          appointments: clinic.value,
          appointmentsPercent: totalAppointments > 0
            ? Math.round((clinic.value / totalAppointments) * 100)
            : 0,
          satisfaction: satisfactionData?.value.toFixed(1) || 'N/A',
          satisfactionDiff: satisfactionData
            ? (satisfactionData.value - avgSatisfaction).toFixed(1)
            : 0,
          revenue: revenueData?.value || 0,
          revenuePercent: totalRevenue > 0
            ? Math.round((revenueData?.value || 0) / totalRevenue * 100)
            : 0
        };
      });
      
      return {
        title: 'Clinic Performance Report',
        period: { startDate, endDate },
        generatedAt: new Date(),
        summary: {
          totalAppointments,
          avgSatisfaction: avgSatisfaction.toFixed(1),
          totalRevenue
        },
        clinicData
      };
    } catch (error) {
      console.error('Error generating clinic report:', error);
      throw error;
    }
  },
  
  /**
   * Generate a user activity report
   * @param {Date} startDate - Start date for report period
   * @param {Date} endDate - End date for report period
   * @returns {Promise<Object>} Report data
   */
  generateUserActivityReport: async (startDate, endDate) => {
    try {
      // Get user statistics
      const stats = await analyticsService.getUsageStatistics(startDate, endDate);
      
      // Get previous period stats for comparison
      const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(startDate);
      const prevEndDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
      
      const prevStats = await analyticsService.getUsageStatistics(prevStartDate, prevEndDate);
      
      // Calculate percent changes
      const calculateChange = (current, previous) => {
        if (!previous) return 0;
        return Math.round(((current - previous) / previous) * 100);
      };
      
      // Get user interactions for feature usage
      const interactions = await analyticsService.getUserInteractions(startDate, endDate);
      
      // Count interactions by type
      const featureUsage = {};
      interactions.forEach(interaction => {
        const feature = interaction.event_name;
        if (!featureUsage[feature]) {
          featureUsage[feature] = 0;
        }
        featureUsage[feature]++;
      });
      
      // Convert to array and sort by usage
      const totalInteractions = interactions.length;
      const topFeatures = Object.entries(featureUsage)
        .map(([feature, count]) => ({
          feature,
          count,
          usage: totalInteractions > 0 
            ? Math.round((count / totalInteractions) * 100) 
            : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        title: 'User Activity Report',
        period: { startDate, endDate },
        generatedAt: new Date(),
        userSegments: [
          { 
            segment: 'Active Users', 
            count: stats.activeUsers,
            percentChange: calculateChange(stats.activeUsers, prevStats.activeUsers)
          },
          { 
            segment: 'New Users', 
            count: stats.newUsers,
            percentChange: calculateChange(stats.newUsers, prevStats.newUsers)
          },
          { 
            segment: 'Returning Users', 
            count: stats.activeUsers - stats.newUsers,
            percentChange: calculateChange(
              (stats.activeUsers - stats.newUsers),
              (prevStats.activeUsers - prevStats.newUsers)
            )
          }
        ],
        topFeatures
      };
    } catch (error) {
      console.error('Error generating user activity report:', error);
      throw error;
    }
  },
  
  /**
   * Generate a report based on type
   * @param {string} reportType - Type of report to generate
   * @param {Date} startDate - Start date for report period
   * @param {Date} endDate - End date for report period
   * @returns {Promise<Object>} Report data
   */
  generateReport: async (reportType, startDate, endDate) => {
    switch (reportType) {
      case 'overview':
        return reportService.generateOverviewReport(startDate, endDate);
      case 'clinic':
        return reportService.generateClinicReport(startDate, endDate);
      case 'users':
        return reportService.generateUserActivityReport(startDate, endDate);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  },
  
  /**
   * Export report as downloadable format
   * @param {Object} reportData - Report data object
   * @param {string} format - Export format (pdf or csv)
   * @returns {Promise<Blob>} Blob of exported report
   */
  exportReport: async (reportData, format = 'pdf') => {
    // In a real implementation, this would generate a PDF or CSV file
    // For now, we'll just return a mock implementation
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockBlob = new Blob(['Report data'], { type: 'application/pdf' });
        resolve(mockBlob);
      }, 1000);
    });
  },
  
  /**
   * Schedule a report for recurring delivery
   * @param {string} reportType - Type of report to schedule
   * @param {string} frequency - Frequency of delivery (daily, weekly, monthly)
   * @param {Array<string>} recipients - Email addresses to send report to
   * @returns {Promise<Object>} Scheduled report details
   */
  scheduleReport: async (reportType, frequency, recipients) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert([
          { 
            report_type: reportType,
            frequency,
            recipients,
            created_by: (await supabase.auth.getUser()).data?.user?.id,
            status: 'active'
          }
        ])
        .select();
        
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  }
};

export default reportService;