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
  
  // Ensure we don't start counting from a future date
  const effectiveStartDate = semesterStartDate > today ? today : semesterStartDate;
  
  // Debug logging
  console.log('Date calculation debug:', {
    originalSemesterStartDate: semesterStartDate.toDateString(),
    effectiveStartDate: effectiveStartDate.toDateString(),
    today: today.toDateString(),
    semesterStartDateFull: semesterStartDate,
    todayFull: today
  });
  
  const result = calculateWorkingDays(effectiveStartDate, today);
  console.log('Working days calculated:', result);
  
  return result;
};

/**
 * Get the actual start date for the current academic period
 * This function determines when the current semester/academic period actually began
 * rather than using hardcoded dates
 * @param batch - The batch ID (year)
 * @param semester - The semester number
 * @returns The actual start date for working days calculation
 */
export const getCurrentSemesterActualStartDate = (batch: string, semester: number): Date => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (0 = January, 11 = December)
  const batchYear = parseInt(batch);
  
  if (isNaN(batchYear)) {
    // Fallback to current academic year start
    return currentMonth >= 5 ? new Date(currentYear, 5, 1) : new Date(currentYear - 1, 5, 1);
  }
  
  const semesterIndex = Math.floor((semester - 1) / 2);
  const isOddSemester = semester % 2 === 1;
  const academicYear = batchYear + semesterIndex;
  
  let actualStartDate: Date;
  
  if (isOddSemester) {
    // Odd semesters typically start in June
    actualStartDate = new Date(academicYear, 5, 1); // June 1st
    
    // If we're currently in this academic year and past the semester start
    if (academicYear === currentYear && currentMonth >= 5) {
      // Use June 1st of current year
      actualStartDate = new Date(currentYear, 5, 1);
    } else if (academicYear === currentYear - 1 && currentMonth < 6) {
      // We're in the continuation of a semester that started last June
      actualStartDate = new Date(currentYear - 1, 5, 1);
    }
  } else {
    // Even semesters typically start in January
    actualStartDate = new Date(academicYear + 1, 0, 1); // January 1st
  }
  
  // If the calculated start date is in the future, use current date
  if (actualStartDate > now) {
    console.log('Calculated start date is in future, using current date');
    return now;
  }
  
  console.log('Current semester actual start date:', {
    batch,
    semester,
    batchYear,
    academicYear,
    isOddSemester,
    currentYear,
    currentMonth,
    actualStartDate: actualStartDate.toDateString()
  });
  
  return actualStartDate;
};
