/**
 * Format a number as Indian Rupees
 * @param amount Amount in paisa (1/100 of a rupee)
 * @returns Formatted string with ₹ symbol
 */
export const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0.00';
    
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};
/**
 * Format a date string to a readable format
 * @param date ISO date string
 * @returns Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
};
/**
 * Format a time string to a readable format
 * @param date ISO date string
 * @returns Formatted time string
 */
export const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(d);
};
/**
 * Format a percentage value
 * @param value - The percentage value to format
 * @returns Formatted string with % symbol
 */
export const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
};
/**
 * Format a date and time
 * @param date ISO date string
 * @returns Formatted date and time string
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${formatDate(d)} ${formatTime(d)}`;
};
/**
 * Format appointment time range (preserving minutes)
 * @param startTime ISO date string
 * @param endTime ISO date string
 * @returns Formatted appointment time range string
 */
export const formatAppointmentTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Format with correct hours and minutes
    const startHour = start.getHours();
    const startMinutes = start.getMinutes();
    const endHour = end.getHours();
    const endMinutes = end.getMinutes();
    
    // Convert to 12-hour format
    const startHour12 = startHour % 12 || 12;
    const endHour12 = endHour % 12 || 12;
    
    // Get AM/PM
    const startPeriod = startHour >= 12 ? 'PM' : 'AM';
    const endPeriod = endHour >= 12 ? 'PM' : 'AM';
    
    // Format the times with the correct minutes
    const formattedStart = `${startHour12}:${startMinutes === 0 ? '00' : startMinutes} ${startPeriod}`;
    const formattedEnd = `${endHour12}:${endMinutes === 0 ? '00' : endMinutes} ${endPeriod}`;
    
    return `${formattedStart} - ${formattedEnd}`;
};
