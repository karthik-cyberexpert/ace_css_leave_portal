import { calculateWorkingDaysFromSemesterStart } from '@/utils/dateUtils';

// Sample test cases to run in the test framework
function testCalculateWorkingDays() {
  // Define test scenarios
  const testCases = [
    {
      description: 'Simple range with no Sundays',
      startDate: new Date('2025-07-21'),
      endDate: new Date('2025-07-25'),
      expected: 5,
    },
    {
      description: 'Range with one Sunday',
      startDate: new Date('2025-07-21'),
      endDate: new Date('2025-07-27'),
      expected: 6,
    },
    {
      description: 'End date before start date',
      startDate: new Date('2025-07-25'),
      endDate: new Date('2025-07-20'),
      expected: 0,
    },
    {
      description: 'Whole week in semester with 2 Sundays',
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-07-28'),
      expected: 12,
    },
  ];

  // Execute the test cases
  console.group('Testing calculateWorkingDaysFromSemesterStart');
  
  testCases.forEach(({ description, startDate, endDate, expected }, index) => {
    const result = calculateWorkingDaysFromSemesterStart(startDate);
    console.log(`Test ${index + 1}: ${description}`);
    console.log(`  Start Date: ${startDate}`);
    console.log(`  End Date: ${endDate}`);
    console.log(`  Expected: ${expected}, Received: ${result}`);
    if (result === expected) {
      console.log('  ✅ Test passed!');
    } else {
      console.log('  ❌ Test failed.');
    }
  });
  console.groupEnd();
}

// Run the tests
testCalculateWorkingDays();
