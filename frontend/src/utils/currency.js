/**
 * Utility functions for currency formatting
 */

/**
 * Format number to Vietnamese Dong currency
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
export const formatVND = (amount) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }

  // Remove decimal places and format with Vietnamese locale
  const integerAmount = Math.round(amount);
  return `${integerAmount.toLocaleString('vi-VN')} VND`;
};

/**
 * Format number to Vietnamese Dong currency without VND suffix
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (amount) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }

  // Remove decimal places and format with Vietnamese locale
  const integerAmount = Math.round(amount);
  return integerAmount.toLocaleString('vi-VN');
};

/**
 * Currency constants for Vietnam
 */
export const CURRENCY = {
  SYMBOL: 'VND',
  LOCALE: 'vi-VN',
  // Shipping thresholds in VND
  FREE_SHIPPING_THRESHOLD: 2000000, // 2 million VND
  REDUCED_SHIPPING_THRESHOLD: 1000000, // 1 million VND
  // Shipping costs in VND
  STANDARD_SHIPPING: 0, // 250k VND
  REDUCED_SHIPPING: 100000,  // 100k VND
  FREE_SHIPPING: 0
};
