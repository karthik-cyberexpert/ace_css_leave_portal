import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { addDays, isAfter, isSameDay } from 'date-fns';
import { useAppContext } from './AppContext';

export interface SemesterDates {
  id: string;
  batch: string;
  semester: number;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export interface Batch {
  id: string;
  startYear: number;
  endYear: number;
  name: string;
  isActive: boolean;
}

interface BatchContextType {
  semesterDates: SemesterDates[];
  setSemesterDates: React.Dispatch<React.SetStateAction<SemesterDates[]>>;
  batches: Batch[];
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>;
  getSemesterDateRange: (batch: string, semester: number) => { start: Date; end: Date } | null;
  getCurrentActiveSemester: (batch: string) => number;
  isDateWithinSemester: (date: Date, batch: string, semester: number) => boolean;
  saveSemesterDates: () => Promise<void>;
  createBatch: (startYear: number) => Promise<void>;
  updateBatch: (batchId: string, updates: Partial<Batch>) => Promise<void>;
  deleteBatch: (batchId: string) => Promise<void>;
  getAvailableBatches: () => Batch[];
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
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage on mount
  const { profile } = useAppContext();
  
  useEffect(() => {
    // Only initialize once when admin profile is first available
    if (profile?.is_admin && !isInitialized) {
      console.log('Initializing batch context for admin user...');
      
      // Load semester dates
      const savedDates = localStorage.getItem('batchSemesterDates');
      if (savedDates) {
        try {
          const parsed = JSON.parse(savedDates);
          const datesWithDateObjects = parsed.map((item: any) => ({
            ...item,
            startDate: item.startDate ? new Date(item.startDate) : undefined,
            endDate: item.endDate ? new Date(item.endDate) : undefined,
          }));
          setSemesterDates(datesWithDateObjects);
          console.log('Loaded semester dates from localStorage:', datesWithDateObjects);
        } catch (error) {
          console.error('Error loading semester dates:', error);
        }
      }

      // Load batches
      const savedBatches = localStorage.getItem('batches');
      if (savedBatches) {
        try {
          const loadedBatches = JSON.parse(savedBatches);
          setBatches(loadedBatches);
          console.log('Loaded batches from localStorage:', loadedBatches);
        } catch (error) {
          console.error('Error loading batches:', error);
        }
      } else {
        // Initialize with default batches if none are saved
        const currentYear = new Date().getFullYear();
        const defaultBatches: Batch[] = [];
        // Create batches for the current year and the 3 previous years
        for (let i = 0; i < 4; i++) {
          const year = currentYear - i;
          defaultBatches.push({
            id: year.toString(),
            startYear: year,
            endYear: year + 4,
            name: `${year}-${year + 4}`,
            isActive: true,
          });
        }
        const sortedBatches = defaultBatches.sort((a, b) => b.startYear - a.startYear);
        setBatches(sortedBatches);
        console.log('Created default batches:', sortedBatches);
      }
      
      setIsInitialized(true);
    }
  }, [profile?.is_admin, isInitialized]);

  // Function to save batches to localStorage
  const saveBatches = async (updatedBatches: Batch[]) => {
    try {
      localStorage.setItem('batches', JSON.stringify(updatedBatches));
      setBatches(updatedBatches);
    } catch (error) {
      console.error('Error saving batches:', error);
      throw error;
    }
  };

  // CRUD operations for batches
  const createBatch = async (startYear: number) => {
    const newBatch: Batch = {
      id: startYear.toString(),
      startYear,
      endYear: startYear + 4,
      name: `${startYear}-${startYear + 4}`,
      isActive: true,
    };
    const updatedBatches = [...batches, newBatch].sort((a, b) => b.startYear - a.startYear);
    await saveBatches(updatedBatches);
  };

  const updateBatch = async (batchId: string, updates: Partial<Batch>) => {
    const updatedBatches = batches.map(b => b.id === batchId ? { ...b, ...updates } : b);
    await saveBatches(updatedBatches);
  };

  const deleteBatch = async (batchId: string) => {
    const updatedBatches = batches.filter(b => b.id !== batchId);
    await saveBatches(updatedBatches);
  };

  const getAvailableBatches = useCallback(() => {
    return batches.filter(b => b.isActive);
  }, [batches]);


  const getSemesterDateRange = (batch: string, semester: number) => {
    const semesterData = semesterDates.find(s => s.batch === batch && s.semester === semester);
    if (semesterData?.startDate) {
      console.log('Using custom semester date:', { batch, semester, startDate: semesterData.startDate, endDate: semesterData.endDate });
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
    
    let fallbackResult;
    
    if (isOddSemester) {
      // All odd semesters (1, 3, 5, 7): June 1st to January 31st (next year)
      fallbackResult = {
        start: new Date(year, 5, 1), // June 1st
        end: new Date(year + 1, 0, 31) // January 31st next year
      };
    } else {
      // All even semesters (2, 4, 6, 8): January 1st to June 30th
      fallbackResult = {
        start: new Date(year + 1, 0, 1), // January 1st
        end: new Date(year + 1, 5, 30) // June 30th
      };
    }
    
    console.log('Using fallback calculation:', { 
      batch, 
      semester, 
      batchYear, 
      semesterIndex, 
      isOddSemester, 
      calculatedYear: year, 
      result: fallbackResult 
    });
    
    return fallbackResult;
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
      // Ensure we have valid data before saving
      if (!semesterDates || semesterDates.length === 0) {
        console.warn('No semester dates to save');
        return;
      }
      
      // Create a backup of current data
      const currentData = localStorage.getItem('batchSemesterDates');
      
      try {
        // Save the new data
        const dataToSave = JSON.stringify(semesterDates);
        localStorage.setItem('batchSemesterDates', dataToSave);
        console.log('Semester dates saved successfully:', semesterDates);
        
        // Verify the save was successful
        const savedData = localStorage.getItem('batchSemesterDates');
        if (!savedData || savedData !== dataToSave) {
          throw new Error('Data verification failed after save');
        }
      } catch (saveError) {
        // Restore backup if save failed
        if (currentData) {
          localStorage.setItem('batchSemesterDates', currentData);
          console.error('Save failed, restored backup data');
        }
        throw saveError;
      }
      
      // Here you would typically also save to your backend API
    } catch (error) {
      console.error('Error saving semester dates:', error);
      throw error; // Re-throw to allow the component to handle the error
    }
  };

  const value = {
    semesterDates,
    setSemesterDates,
    batches,
    setBatches,
    getSemesterDateRange,
    getCurrentActiveSemester,
    isDateWithinSemester,
    saveSemesterDates,
    createBatch,
    updateBatch,
    deleteBatch,
    getAvailableBatches,
  };

  return (
    <BatchContext.Provider value={value}>
      {children}
    </BatchContext.Provider>
  );
};
