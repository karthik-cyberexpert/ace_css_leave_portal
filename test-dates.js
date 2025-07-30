// Test date calculations
const startDate = new Date('2025-07-21'); // July 21, 2025
const endDate = new Date('2025-07-30');   // July 30, 2025

console.log('Start date:', startDate.toDateString());
console.log('End date:', endDate.toDateString());

// Calculate days manually
const timeDiff = endDate.getTime() - startDate.getTime();
const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
console.log('Total days (including start and end):', totalDays);

// Calculate working days (excluding Sundays)
let workingDays = 0;
const currentDate = new Date(startDate);

while (currentDate <= endDate) {
  const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  if (dayOfWeek !== 0) { // Not Sunday
    workingDays++;
  }
  currentDate.setDate(currentDate.getDate() + 1);
}

console.log('Working days (excluding Sundays):', workingDays);

// Test the fallback calculation that's currently being used
const fallbackStart = new Date(2025, 5, 1); // June 1st, 2025
const fallbackEnd = new Date(); // Today
console.log('Fallback start date:', fallbackStart.toDateString());
console.log('Fallback end date (today):', fallbackEnd.toDateString());

// Calculate working days from fallback start to today
let fallbackWorkingDays = 0;
const fallbackCurrentDate = new Date(fallbackStart);

while (fallbackCurrentDate <= fallbackEnd) {
  const dayOfWeek = fallbackCurrentDate.getDay();
  if (dayOfWeek !== 0) { // Not Sunday
    fallbackWorkingDays++;
  }
  fallbackCurrentDate.setDate(fallbackCurrentDate.getDate() + 1);
}

console.log('Fallback working days (June 1 to today):', fallbackWorkingDays);
