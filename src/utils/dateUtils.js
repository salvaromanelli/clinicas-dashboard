import { format, parseISO } from 'date-fns';

/**
 * Format a date for display in the UI
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format string (default: 'MMM d, yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatString = 'MMM d, yyyy') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
};

/**
 * Format a date for database queries
 * @param {Date} date - Date to format
 * @returns {string} ISO date string
 */
export const formatDateForDB = (date) => {
  if (!date) return '';
  return date.toISOString();
};

/**
 * Get date range options for analytics
 * @returns {Array} Array of date range options
 */
export const getDateRangeOptions = () => [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 }
];

/**
 * Create a date range object from days ago
 * @param {number} days - Number of days ago
 * @returns {Object} Date range object with startDate and endDate
 */
export const getDateRangeFromDays = (days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  return { startDate, endDate };
};