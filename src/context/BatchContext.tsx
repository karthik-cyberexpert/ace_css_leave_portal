import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { addDays, isAfter, isSameDay } from 'date-fns';

export interface SemesterDates {
  id: string;
  batch: string;
  semester: number;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface BatchContextType {
  semesterDates: SemesterDates[];
  setSemesterDates: React.Dispatch<React.SetStateAction<SemesterDates[]>>;
  getSemesterDateRange: (batch: string, semester: number) => { start: Date; end: Date } | null;
  getCurrentActiveSemester: (batch: string) => number;
  isDateWithinSemester: (date: Date, batch: string, semester: number) => boolean;
  saveSemesterDates: () => Promise<void>;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export const useBatchContext = () => {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error('useBatchContext must be used within a BatchProvider');
  }
  return context;
};

export const BatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [semesterDates, setSemesterDates] = useState<SemesterDates[]>([]);

  // Load semester dates from localStorage on mount
  useEffect(() => {
    const savedDates = localStorage.getItem('batchSemesterDates');
    if (savedDates) {
      try {
        const parsed = JSON.parse(savedDates);
        // Convert date strings back to Date objects
        const datesWithDateObjects = parsed.map((item: any) => ({
          ...item,
          startDate: item.startDate ? new Date(item.startDate) : undefined,
          endDate: item.endDate ? new Date(item.endDate) : undefined,
        }));
        setSemesterDates(datesWithDateObjects);
      } catch (error) {
        console.error('Error loading semester dates:', error);
      }
    }
  }, []);

  const getSemesterDateRange = (batch: string, semester: number) => {
    const semesterData = semesterDates.find(s => s.batch === batch && s.semester === semester);
    if (semesterData?.startDate) {
      return {
        start: semesterData.startDate,
        end: semesterData.endDate || new Date(8640000000000000) // Far future date if no end date
      };
    }
    
    // Fallback to default date calculation if no custom dates are set
    const batchYear = parseInt(batch);
    if (isNaN(batchYear)) return null;
    
    const semesterIndex = Math.floor((semester - 1) / 2);
    const isOddSemester = semester % 2 === 1;
    const year = batchYear + semesterIndex;
    
    if (isOddSemester) {
      return {
        start: new Date(year, 5, 1), // June 1st
        end: new Date(year, 11, 31) // December 31st
      };
    } else {
      return {
        start: new Date(year + 1, 0, 1), // January 1st
        end: new Date(year + 1, 4, 31) // May 31st
      };
    }
  };

  // Function to determine the current active semester for a batch based on dates
  const getCurrentActiveSemester = (batch: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const allSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
    let activeSemester = 1; // Default to semester 1
    
    for (const semester of allSemesters) {
      const semesterData = semesterDates.find(s => s.batch === batch && s.semester === semester);
      
      if (semesterData?.startDate && semesterData?.endDate) {
        const startDate = new Date(semesterData.startDate);
        const endDate = new Date(semesterData.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // If today is within this semester, this is the active semester
        if (today >= startDate && today <= endDate) {
          return semester;
        }
        
        // If today is the day after the semester ended or later, and there's a next semester
        const dayAfterEnd = addDays(endDate, 1);
        if ((isSameDay(today, dayAfterEnd) || isAfter(today, dayAfterEnd)) && semester < 8) {
          activeSemester = semester + 1;
        }
      }
    }
    
    // Ensure we don't exceed semester 8
    return Math.min(activeSemester, 8);
  };

  // Function to check if a date is within a specific semester
  const isDateWithinSemester = (date: Date, batch: string, semester: number): boolean => {
    const semesterData = semesterDates.find(s => s.batch === batch && s.semester === semester);
    
    if (!semesterData?.startDate) {
      return false; // Can't validate without start date
    }
    
    const checkDate = new Date(date);
    const startDate = new Date(semesterData.startDate);
    checkDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    // Date must be on or after the semester start date
    if (checkDate < startDate) {
      return false;
    }
    
    // If there's an end date, date must be on or before it
    if (semesterData.endDate) {
      const endDate = new Date(semesterData.endDate);
      endDate.setHours(0, 0, 0, 0);
      return checkDate <= endDate;
    }
    
    // If no end date, any date on or after start date is valid
    return true;
  };

  const saveSemesterDates = async () => {
    try {
      localStorage.setItem('batchSemesterDates', JSON.stringify(semesterDates));
      // Here you would typically also save to your backend API
      console.log('Semester dates saved:', semesterDates);
    } catch (error) {
      console.error('Error saving semester dates:', error);
      throw error; // Re-throw to allow the component to handle the error
    }
  };

  const value = {
    semesterDates,
    setSemesterDates,
    getSemesterDateRange,
    getCurrentActiveSemester,
    isDateWithinSemester,
    saveSemesterDates,
  };

  return (
    <BatchContext.Provider value={value}>
      {children}
    </BatchContext.Provider>
  );
};
