/**
 * Test to demonstrate the date selection fix
 * This test shows how the old method (toISOString) would cause timezone issues
 * vs the new method (formatDateToLocalISO) which preserves the local date
 */

// Simulate the old problematic method
function oldDateFormat(date) {
  return date.toISOString().split('T')[0];
}

// New timezone-safe method
function formatDateToLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Test function
function testDateSelection() {
  console.log('='.repeat(60));
  console.log('DATE SELECTION TIMEZONE FIX TEST');
  console.log('='.repeat(60));
  
  // Create a date representing the 16th in local time
  const userSelectedDate = new Date(2024, 8, 16, 0, 0, 0, 0); // September 16th, 2024 00:00 local time
  
  console.log('\nUser selects: September 16th, 2024');
  console.log('Date object created:', userSelectedDate.toString());
  console.log('User timezone offset:', userSelectedDate.getTimezoneOffset(), 'minutes');
  
  // Test old method (problematic)
  const oldResult = oldDateFormat(userSelectedDate);
  console.log('\n--- OLD METHOD (PROBLEMATIC) ---');
  console.log('date.toISOString().split("T")[0]:', oldResult);
  console.log('UTC representation:', userSelectedDate.toISOString());
  
  // Test new method (fixed)
  const newResult = formatDateToLocalISO(userSelectedDate);
  console.log('\n--- NEW METHOD (FIXED) ---');
  console.log('formatDateToLocalISO(date):', newResult);
  
  // Show the difference
  console.log('\n--- COMPARISON ---');
  console.log('Old method result:', oldResult);
  console.log('New method result:', newResult);
  console.log('Same result?', oldResult === newResult ? 'YES ✅' : 'NO ❌');
  
  if (oldResult !== newResult) {
    console.log('\n❌ TIMEZONE ISSUE DETECTED:');
    console.log(`User selected 16th but old method returned ${oldResult.split('-')[2]}`);
    console.log(`New method correctly returns ${newResult.split('-')[2]}`);
  } else {
    console.log('\n✅ No timezone issue in this environment');
  }
  
  // Test with different timezones (simulated)
  console.log('\n--- SIMULATED TIMEZONE TESTS ---');
  
  // Simulate different UTC offsets
  const timezoneTests = [
    { name: 'UTC+5:30 (India)', offset: -330 },
    { name: 'UTC+8 (China)', offset: -480 },
    { name: 'UTC-5 (EST)', offset: 300 },
    { name: 'UTC+0 (GMT)', offset: 0 }
  ];
  
  timezoneTests.forEach(tz => {
    // Create a date that would be affected by timezone conversion
    const testDate = new Date(2024, 8, 16, 2, 30, 0, 0); // 2:30 AM local time
    
    console.log(`\n${tz.name}:`);
    console.log(`  Local date: ${testDate.getDate()}th`);
    console.log(`  formatDateToLocalISO: ${formatDateToLocalISO(testDate).split('-')[2]}`);
    
    // Simulate what toISOString would do with this timezone
    const utcDate = new Date(testDate.getTime() - (tz.offset * 60000));
    console.log(`  toISOString simulation: ${utcDate.toISOString().split('T')[0].split('-')[2]}`);
  });
  
  console.log('\n='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
  
  return {
    oldResult,
    newResult,
    isFixed: oldResult === newResult || newResult.endsWith('16')
  };
}

// Run the test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testDateSelection, formatDateToLocalISO };
} else {
  // Browser environment or direct execution
  testDateSelection();
}
