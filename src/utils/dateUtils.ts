import { eachDayOfInterval, getDay } from 'date-fns';

/**
 * Calculate the number of working days (excluding Sundays) between two dates
 * @param startDate - The start date
 * @param endDate - The end date (inclusive)
 * @returns Number of working days (Monday to Saturday)
 */
export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  try {
    // Ensure the dates are valid
    if (!startDate || !endDate || startDate > endDate) {
      return 0;
    }

    // Get all days in the interval
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Filter out Sundays (day 0)
    const workingDays = allDays.filter(day => getDay(day) !== 0);
    
    return workingDays.length;
  } catch (error) {
    console.error('Error calculating working days:', error);
    return 0;
  }
};

/**
 * Calculate working days from semester start to current date
 * @param semesterStartDate - The semester start date
 * @returns Number of working days from semester start to today
 */
export const calculateWorkingDaysFromSemesterStart = (semesterStartDate: Date): number => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  // Debug logging
  console.log('Date calculation debug:', {
    semesterStartDate: semesterStartDate.toDateString(),
    today: today.toDateString(),
    semesterStartDateFull: semesterStartDate,
    todayFull: today
  });
  
  const result = calculateWorkingDays(semesterStartDate, today);
  console.log('Working days calculated:', result);
  
  return result;
};
