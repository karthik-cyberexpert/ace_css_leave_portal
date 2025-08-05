// Test script for working days calculation
// Run this in the browser console to test the date calculation logic

function testWorkingDaysCalculation() {
  console.group('🧪 Working Days Calculation Tests');
  
  // Helper function to calculate working days (excluding Sundays)
  function calculateWorkingDays(startDate, endDate) {
    if (!startDate || !endDate || startDate > endDate) {
      return 0;
    }
    
    let workingDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      // If it's not Sunday (0), count it as a working day
      if (current.getDay() !== 0) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  }
  
  // Test cases
  const testCases = [
    {
      name: 'July 21, 2025 to August 5, 2025 (Today)',
      start: new Date('2025-07-21'),
      end: new Date('2025-08-05'),
      expectedDays: 'Should exclude Sundays: July 27, Aug 3'
    },
    {
      name: 'July 21, 2025 to July 27, 2025 (One week)',
      start: new Date('2025-07-21'),
      end: new Date('2025-07-27'),
      expectedDays: 'Should be 6 days (excluding Sunday July 27)'
    },
    {
      name: 'July 21, 2025 to July 26, 2025 (One week minus Sunday)',
      start: new Date('2025-07-21'),
      end: new Date('2025-07-26'),
      expectedDays: 'Should be 6 days (no Sunday included)'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const result = calculateWorkingDays(testCase.start, testCase.end);
    console.log(`\n📊 Test ${index + 1}: ${testCase.name}`);
    console.log(`   Start: ${testCase.start.toDateString()}`);
    console.log(`   End: ${testCase.end.toDateString()}`);
    console.log(`   Result: ${result} working days`);
    console.log(`   Expected: ${testCase.expectedDays}`);
  });
  
  // Test the actual semester dates
  console.log('\n🎯 Actual Semester Test:');
  const semesterStart = new Date('2025-07-21');
  const today = new Date();
  const actualDays = calculateWorkingDays(semesterStart, today);
  
  console.log(`   Semester Start: ${semesterStart.toDateString()}`);
  console.log(`   Today: ${today.toDateString()}`);
  console.log(`   Working Days: ${actualDays}`);
  console.log(`   Expected: Should be less than 56 if calculated correctly`);
  
  // Check if semester date exists in localStorage
  console.log('\n💾 LocalStorage Check:');
  const storedData = localStorage.getItem('batchSemesterDates');
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      console.log(`   Found ${parsed.length} semester date entries:`, parsed);
    } catch (e) {
      console.error('   Error parsing stored data:', e);
    }
  } else {
    console.log('   No semester dates found in localStorage');
  }
  
  console.groupEnd();
  
  return {
    actualWorkingDays: actualDays,
    shouldBeCorrect: actualDays < 56,
    testPassed: actualDays > 0 && actualDays < 56
  };
}

// Function to create and verify semester date
function createCorrectSemesterDate() {
  console.group('🔧 Creating Correct Semester Date');
  
  // This would need to be adapted based on actual user data
  const semesterDate = {
    id: '2024-3',
    batch: '2024',
    semester: 3,
    startDate: new Date('2025-07-21'),
    endDate: new Date('2025-12-31')
  };
  
  console.log('Creating semester date:', semesterDate);
  
  // Save to localStorage
  const dataToSave = JSON.stringify([semesterDate], (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
  
  localStorage.setItem('batchSemesterDates', dataToSave);
  console.log('Saved to localStorage:', dataToSave);
  
  console.log('✅ Semester date created! Reload the page to see changes.');
  console.groupEnd();
}

// Make functions globally available
window.testWorkingDays = testWorkingDaysCalculation;
window.createSemesterDate = createCorrectSemesterDate;

console.log('🚀 Test functions loaded!');
console.log('Run testWorkingDays() to test the calculation');
console.log('Run createSemesterDate() to create a correct semester date');
