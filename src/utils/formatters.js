/**
 * Format a number as currency
 * @param {number} value - Number to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD') => {
    if (value === null || value === undefined) return '-';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  /**
   * Format a number with thousands separator
   * @param {number} value - Number to format
   * @returns {string} Formatted number string
   */
  export const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  /**
   * Format a percentage value
   * @param {number} value - Number to format as percentage
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {string} Formatted percentage string
   */
  export const formatPercent = (value, decimals = 1) => {
    if (value === null || value === undefined) return '-';
    
    return `${value.toFixed(decimals)}%`;
  };
  
  /**
   * Convert a raw value to a formatted string based on type
   * @param {any} value - Value to format
   * @param {string} type - Type of formatting to apply
   * @returns {string} Formatted string
   */
  export const formatValue = (value, type) => {
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      case 'number':
        return formatNumber(value);
      default:
        return value?.toString() || '-';
    }
  };