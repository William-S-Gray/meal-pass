/**
 * Format a date string to a human-readable format
 * @param dateStr - Date string in ISO format
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date and time string
 * @param dateStr - Date string in ISO format
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid Date';
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get date range for the past N days
 * @param days - Number of days
 * @returns Object with startDate and endDate
 */
export const getDateRange = (days: number): { startDate: string; endDate: string } => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};