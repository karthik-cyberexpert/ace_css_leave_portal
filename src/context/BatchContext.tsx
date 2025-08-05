import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { addDays, isAfter, isSameDay } from 'date-fns';
import axios from 'axios';
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
  start_year: number;
  end_year: number;
  name: string;
  is_active: boolean;
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

const apiClient = axios.create({
  baseURL: 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set up request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Set up response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      console.error('Authentication failed - redirecting to login');
      // You might want to redirect to login page here
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const BatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [semesterDates, setSemesterDates] = useState<SemesterDates[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const { syncStudentStatusWithBatch } = useAppContext();

  // Load batches from database on mount, with migration support
  useEffect(() => {
    const initializeBatches = async () => {
      // Check if migration has been completed
      const migrationComplete = localStorage.getItem('batches_migrated');
      
      if (!migrationComplete) {
        // Migrate localStorage data to database first
        await migrateLocalStorageToDatabase();
      }
      
      // Load from database
      await loadBatchesFromDatabase();
    };
    
    initializeBatches();
    loadSemesterDatesFromStorage();
  }, []);

  const migrateLocalStorageToDatabase = async () => {
    try {
      const storedBatches = localStorage.getItem('batches');
      if (storedBatches) {
        console.log('Found localStorage batches, migrating to database...');
        const localBatches = JSON.parse(storedBatches);
        
        // Convert camelCase to snake_case for database
        const dbBatches = localBatches.map((batch: any) => ({
          id: batch.id,
          start_year: batch.startYear || batch.start_year,
          end_year: batch.endYear || batch.end_year,
          name: batch.name,
          is_active: batch.isActive !== undefined ? batch.isActive : batch.is_active
        }));
        
        // Send each batch to database
        let migratedCount = 0;
        for (const batch of dbBatches) {
          try {
            await apiClient.post('/batches', {
              startYear: batch.start_year
            });
            console.log(`Migrated batch ${batch.name} to database`);
            migratedCount++;
          } catch (error: any) {
            // Check for duplicate/conflict errors
            const errorMsg = error.response?.data?.error || error.message || '';
            if (errorMsg.includes('already exists') || errorMsg.includes('Duplicate entry') || error.response?.status === 409) {
              console.log(`Batch ${batch.name} already exists in database, skipping`);
              migratedCount++; // Count as successful since it exists
            } else {
              console.warn(`Failed to migrate batch ${batch.name}:`, errorMsg);
            }
          }
        }
        
        // Mark migration as complete
        localStorage.setItem('batches_migrated', 'true');
        console.log(`Migration completed! ${migratedCount}/${dbBatches.length} batches processed successfully.`);
      } else {
        // No localStorage batches found, mark as migrated
        localStorage.setItem('batches_migrated', 'true');
        console.log('No localStorage batches found to migrate.');
      }
    } catch (error) {
      console.error('Error during migration:', error);
      // Don't fail completely, but mark as attempted
      localStorage.setItem('batches_migrated', 'error');
    }
  };

  const loadBatchesFromDatabase = async (retryCount: number = 0) => {
    try {
      const response = await apiClient.get<Batch[]>('/batches');
      setBatches(response.data);
      console.log('Loaded batches from database:', response.data);
    } catch (error: any) {
      console.error('Failed to fetch batches from database:', error.message);
      
      // Retry once if it's a network error
      if (retryCount < 1 && (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED')) {
        console.log('Retrying database connection...');
        setTimeout(() => loadBatchesFromDatabase(retryCount + 1), 2000);
        return;
      }
      
      // Fallback to localStorage if database fails
      console.log('Falling back to localStorage for batch data');
      loadBatchesFromStorage();
    }
  };

  const loadBatchesFromStorage = () => {
    try {
      const storedBatches = localStorage.getItem('batches');
      if (storedBatches) {
        const parsedBatches = JSON.parse(storedBatches);
        // Convert to database format for consistency
        const normalizedBatches = parsedBatches.map((batch: any) => ({
          id: batch.id,
          start_year: batch.startYear || batch.start_year,
          end_year: batch.endYear || batch.end_year,
          name: batch.name,
          is_active: batch.isActive !== undefined ? batch.isActive : batch.is_active
        }));
        setBatches(normalizedBatches);
        console.log('Loaded batches from localStorage (fallback):', normalizedBatches);
      } else {
        // Initialize with some default batches if none exist
        const defaultBatches = generateDefaultBatches();
        setBatches(defaultBatches);
      }
    } catch (error) {
      console.error('Error loading batches from storage:', error);
      const defaultBatches = generateDefaultBatches();
      setBatches(defaultBatches);
    }
  };

  const loadSemesterDatesFromStorage = () => {
    try {
      const storedDates = localStorage.getItem('batchSemesterDates');
      if (storedDates) {
        const parsedDates = JSON.parse(storedDates, (key, value) => {
          if (key === 'startDate' || key === 'endDate') {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        setSemesterDates(parsedDates);
      }
    } catch (error) {
      console.error('Error loading semester dates from storage:', error);
    }
  };

  const generateDefaultBatches = (): Batch[] => {
    const currentYear = new Date().getFullYear();
    const defaultBatches: Batch[] = [];
    
    // Generate batches from 2020 to current year + 2
    for (let year = 2020; year <= currentYear + 2; year++) {
      defaultBatches.push({
        id: year.toString(),
        start_year: year,
        end_year: year + 4,
        name: `${year}-${year + 4}`,
        is_active: year >= currentYear - 4 && year <= currentYear // Active for recent batches
      });
    }
    
    return defaultBatches;
  };

  const saveBatchesToStorage = (batchesToSave: Batch[]) => {
    try {
      localStorage.setItem('batches', JSON.stringify(batchesToSave));
    } catch (error) {
      console.error('Error saving batches to storage:', error);
    }
  };

  const createBatch = async (startYear: number): Promise<void> => {
    try {
      await apiClient.post('/batches', { startYear });
      await loadBatchesFromDatabase(); // Reload from database
    } catch (error) {
      console.error('Failed to create batch:', error);
      throw error;
    }
  };

  const updateBatch = async (batchId: string, updates: Partial<Batch>): Promise<void> => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Convert camelCase to snake_case for API
      const dbUpdates: any = {};
      if ('is_active' in updates) dbUpdates.is_active = updates.is_active;
      if ('isActive' in updates) dbUpdates.is_active = updates.isActive;
      if ('start_year' in updates) dbUpdates.start_year = updates.start_year;
      if ('end_year' in updates) dbUpdates.end_year = updates.end_year;
      if ('name' in updates) dbUpdates.name = updates.name;
      
      console.log('Updating batch:', { batchId, dbUpdates, hasToken: !!token });
      
      await apiClient.put(`/batches/${batchId}`, dbUpdates);
      await loadBatchesFromDatabase(); // Reload from database
      
      // If updating active status, sync student statuses via backend
      const activeStatus = updates.is_active !== undefined ? updates.is_active : (updates as any).isActive;
      if (activeStatus !== undefined && syncStudentStatusWithBatch) {
        await syncStudentStatusWithBatch(batchId, activeStatus);
      }
    } catch (error: any) {
      console.error('Failed to update batch:', error);
      
      // Handle specific authentication errors
      if (error.response?.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to update batches.');
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Unknown error occurred while updating batch.');
      }
    }
  };

  const deleteBatch = async (batchId: string): Promise<void> => {
    try {
      await apiClient.delete(`/batches/${batchId}`);
      await loadBatchesFromDatabase(); // Reload from database
    } catch (error) {
      console.error('Failed to delete batch:', error);
      throw error;
    }
  };

  const getAvailableBatches = useCallback(() => {
    return batches.filter(batch => batch.is_active);
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
