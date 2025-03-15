/**
 * Format a number as Indian Rupees
 * @param amount Amount in paisa (1/100 of a rupee)
 * @returns Formatted string with ₹ symbol
 */
export const formatCurrency = (amount: number): string => {
  const rupees = amount / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
};

/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Format a time string to a readable format
 * @param timeString ISO date string
 * @returns Formatted time string
 */
export const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Format a percentage value
 * @param value - The percentage value to format
 * @returns Formatted string with % symbol
 */
export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`
} 