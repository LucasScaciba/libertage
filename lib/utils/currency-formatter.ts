/**
 * Currency Formatter Utility
 * 
 * Provides functions to format and parse Brazilian Real (BRL) currency values.
 * Used for pricing inputs in the profile page.
 */

/**
 * Format numeric value as Brazilian Real currency
 * 
 * @param value - Numeric value to format
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parse Brazilian Real currency string to numeric value
 * 
 * @param formatted - Formatted currency string (e.g., "R$ 1.234,56")
 * @returns Numeric value (e.g., 1234.56)
 */
export function parseBRL(formatted: string): number {
  // Remove currency symbol, spaces, and convert comma to dot
  const cleaned = formatted
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remove thousands separator
    .replace(',', '.'); // Convert decimal separator
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate currency input string
 * 
 * @param input - Input string to validate
 * @returns True if input contains only valid characters (numbers, comma, dot)
 */
export function validateCurrencyInput(input: string): boolean {
  // Allow only numbers, comma, and dot
  return /^[\d.,]*$/.test(input);
}

/**
 * Format currency input as user types
 * 
 * @param input - Raw input string
 * @returns Formatted currency string
 */
export function formatCurrencyInput(input: string): string {
  // Remove non-numeric characters except comma and dot
  const cleaned = input.replace(/[^\d,]/g, '');
  
  // If empty, return empty
  if (!cleaned) return '';
  
  // Convert comma to dot for parsing
  const numericValue = parseFloat(cleaned.replace(',', '.'));
  
  // If invalid number, return cleaned input
  if (isNaN(numericValue)) return cleaned;
  
  // Format as currency
  return formatBRL(numericValue);
}

/**
 * Mask currency input for real-time formatting
 * 
 * @param value - Current input value
 * @returns Masked value with currency formatting
 */
export function maskCurrency(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // If empty, return empty
  if (!numbers) return '';
  
  // Convert to cents (last 2 digits are cents)
  const cents = parseInt(numbers, 10);
  const reais = cents / 100;
  
  // Format as currency
  return formatBRL(reais);
}

/**
 * Unmask currency value to get numeric value
 * 
 * @param masked - Masked currency string
 * @returns Numeric value in cents
 */
export function unmaskCurrency(masked: string): number {
  return parseBRL(masked);
}
