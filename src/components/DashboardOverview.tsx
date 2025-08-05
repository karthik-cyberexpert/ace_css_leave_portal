import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarCheck, CalendarDays } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { calculateWorkingDaysFromSemesterStart, getCurrentSemesterActualStartDate } from '@/utils/dateUtils';

const DashboardOverview = () => {
  const { leaveRequests, currentUser } = useAppContext();
  const { getSemesterDateRange, getCurrentActiveSemester, semesterDates, setSemesterDates, saveSemesterDates } = useBatchContext();
  
  // Force create and use correct semester dates
  const ensureSemesterDateExists = React.useCallback(async () => {
    if (!currentUser?.batch || !currentUser?.semester) {
      return null;
    }
    
    console.log('Ensuring semester date exists for:', { batch: currentUser.batch, semester: currentUser.semester });
    
    // Check if semester date already exists
    const existingSemesterDate = semesterDates.find(sd => 
      sd.batch === currentUser.batch && sd.semester === currentUser.semester
    );
    
    if (existingSemesterDate && existingSemesterDate.startDate) {
      console.log('Found existing semester date:', existingSemesterDate);
      return existingSemesterDate.startDate;
    }
    
    // Create semester date with proper start date (July 21, 2025)
    const actualStartDate = new Date('2025-07-21');
    const actualEndDate = new Date('2025-12-31');
    
    const newSemesterDate = {
      id: `${currentUser.batch}-${currentUser.semester}`,
      batch: currentUser.batch,
      semester: currentUser.semester,
      startDate: actualStartDate,
      endDate: actualEndDate
    };
    
    console.log('Creating new semester date:', newSemesterDate);
    
    // Update context state immediately
    setSemesterDates(prev => {
      const filtered = prev.filter(sd => 
        !(sd.batch === currentUser.batch && sd.semester === currentUser.semester)
      );
      return [...filtered, newSemesterDate];
    });
    
    // Save to localStorage
    try {
      const existingData = localStorage.getItem('batchSemesterDates');
      let semesterDatesArray = [];
      
      if (existingData) {
        try {
          semesterDatesArray = JSON.parse(existingData, (key, value) => {
            if ((key === 'startDate' || key === 'endDate') && value) {
              return new Date(value);
            }
            return value;
          });
        } catch (e) {
          console.error('Error parsing existing data, starting fresh');
          semesterDatesArray = [];
        }
      }
      
      // Remove existing entry for same batch/semester
      semesterDatesArray = semesterDatesArray.filter(sd => 
        !(sd.batch === currentUser.batch && sd.semester === currentUser.semester)
      );
      
      // Add new entry
      semesterDatesArray.push(newSemesterDate);
      
      // Save to localStorage with proper date serialization
      const dataToSave = JSON.stringify(semesterDatesArray, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      
      localStorage.setItem('batchSemesterDates', dataToSave);
      console.log('Semester date saved to localStorage:', dataToSave);
      
    } catch (error) {
      console.error('Error saving semester date:', error);
    }
    
    return actualStartDate;
  }, [currentUser?.batch, currentUser?.semester, semesterDates, setSemesterDates]);
  
  // Test function accessible from console
  const createTestSemesterDate = React.useCallback(async () => {
    return await ensureSemesterDateExists();
  }, [ensureSemesterDateExists]);
  
  // Debug function for examining localStorage
  const debugLocalStorage = React.useCallback(() => {
    const storedData = localStorage.getItem('batchSemesterDates');
    console.group('LocalStorage Debug');
    console.log('Raw localStorage data:', storedData);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log('Parsed data:', parsed);
        console.log('Data type:', typeof parsed);
        console.log('Is array:', Array.isArray(parsed));
        console.log('Length:', parsed.length);
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
    console.log('Current semesterDates from context:', semesterDates);
    console.log('semesterDates length:', semesterDates?.length || 0);
    console.groupEnd();
  }, [semesterDates]);
  
  // Run on mount and when user changes
  React.useEffect(() => {
    if (currentUser?.batch && currentUser?.semester) {
      console.log('DashboardOverview mounted, ensuring semester date exists...');
      ensureSemesterDateExists();
    }
    
    // Add global functions for debugging
    (window as any).debugLS = debugLocalStorage;
    (window as any).createTest = createTestSemesterDate;
    (window as any).ensureSemester = ensureSemesterDateExists;
  }, [currentUser?.batch, currentUser?.semester, debugLocalStorage, createTestSemesterDate, ensureSemesterDateExists]);
  
  // Handle case when currentUser is not loaded yet
  if (!currentUser) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="text-center py-8 text-muted-foreground">Loading user data...</div>
      </div>
    );
  }
  
  const leavesTaken = currentUser.leave_taken || 0;
  
  const leavesApplied = leaveRequests.filter(r => 
    r.student_id === currentUser.id && (r.status === 'Pending' || r.status === 'Forwarded')
  ).length;

  // Calculate total working days from semester start to current date
  const totalWorkingDays = useMemo(() => {
    if (!currentUser?.batch || !currentUser?.semester) {
      console.log('No batch or semester for current user');
      return 0;
    }

    console.log('Calculating working days for:', {
      batch: currentUser.batch,
      semester: currentUser.semester,
      semesterDatesLength: semesterDates?.length || 0
    });

    // First, try to find the semester date directly from context
    const directSemesterDate = semesterDates.find(sd => 
      sd.batch === currentUser.batch && sd.semester === currentUser.semester
    );
    
    let semesterStartDate = null;
    
    if (directSemesterDate && directSemesterDate.startDate) {
      semesterStartDate = directSemesterDate.startDate;
      console.log('Using direct semester date from context:', semesterStartDate);
    } else {
      // Fallback to getSemesterDateRange
      const semesterRange = getSemesterDateRange(currentUser.batch, currentUser.semester);
      console.log('Semester range from getSemesterDateRange:', semesterRange);
      semesterStartDate = semesterRange?.start;
    }
    
    if (!semesterStartDate) {
      console.log('No semester start date found, using July 21, 2025 as default');
      semesterStartDate = new Date('2025-07-21');
    }

    console.log('Using semester start date:', semesterStartDate);
    const workingDays = calculateWorkingDaysFromSemesterStart(semesterStartDate);
    console.log('Total working days calculated:', workingDays);
    return workingDays;
  }, [currentUser?.batch, currentUser?.semester, getSemesterDateRange, semesterDates]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leaves Taken</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leavesTaken}</div>
          <p className="text-xs text-muted-foreground">
            out of {totalWorkingDays > 0 ? totalWorkingDays : '0'} days
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leaves Applied</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leavesApplied}</div>
          <p className="text-xs text-muted-foreground">pending approval</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;