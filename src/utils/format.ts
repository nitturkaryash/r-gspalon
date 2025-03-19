/**
 * Format a number as Indian Rupees
 * @param amount - The amount to format
 * @returns Formatted string with ₹ symbol
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0, // Force no decimal places
  }).format(amount)
}

/**
 * Format a percentage value
 * @param value - The percentage value to format
 * @returns Formatted string with % symbol
 */
export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`
} 