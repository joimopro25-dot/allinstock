/**
 * Safely format a number with a fixed number of decimal places
 * @param {number|undefined|null} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number or '0.00'
 */
export const safeToFixed = (value, decimals = 2) => {
  const num = Number(value);
  return (isNaN(num) ? 0 : num).toFixed(decimals);
};

/**
 * Format currency value safely
 * @param {number|undefined|null} value - The value to format
 * @param {string} currency - Currency symbol (default: '€')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = '€', decimals = 2) => {
  return `${currency}${safeToFixed(value, decimals)}`;
};

/**
 * Safely get a numeric value with fallback
 * @param {number|undefined|null} value - The value
 * @param {number} fallback - Fallback value (default: 0)
 * @returns {number} The value or fallback
 */
export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};
