/**
 * Format a number as Indian Rupees
 * @param amount Amount in paisa (1/100 of a rupee)
 * @returns Formatted string with ₹ symbol
 */
export declare const formatCurrency: (amount: number) => string;
/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export declare const formatDate: (dateString: string) => string;
/**
 * Format a time string to a readable format
 * @param timeString ISO date string
 * @returns Formatted time string
 */
export declare const formatTime: (timeString: string) => string;
/**
 * Format a percentage value
 * @param value - The percentage value to format
 * @returns Formatted string with % symbol
 */
export declare const formatPercentage: (value: number) => string;
