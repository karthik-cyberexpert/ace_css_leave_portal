import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { addDays, isAfter, isSameDay } from 'date-fns';
import apiClient from '@/utils/apiClient';
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

// Using shared apiClient from utils to ensure consistent configuration
// and prevent multiple interceptors from causing infinite loops

export const BatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [semesterDates, setSemesterDates] = useState<SemesterDates[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const { syncStudentStatusWithBatch, session, profile } = useAppContext();

  // Load batches from database on mount, with migration support
  useEffect(() => {
    const initializeBatches = async () => {
      // Only run if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('🔐 No auth token found, skipping batch initialization');
        return;
      }

      console.log('🚀 Initializing batches with token:', token.substring(0, 20) + '...');

      // Check if migration has been completed for this session
      const migrationComplete = sessionStorage.getItem('batches_migrated_session');
      
      if (!migrationComplete) {
        console.log('🔄 Running batch migration for this session...');
        // Migrate localStorage data to database first
        await migrateLocalStorageToDatabase();
        // Mark migration complete for this session only
        sessionStorage.setItem('batches_migrated_session', 'true');
      }
      
      // Load from database
      await loadBatchesFromDatabase();
    };
    
    initializeBatches();
    loadSemesterDatesFromStorage();
  }, []);
  
  // Re-initialize when authentication state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('auth_token');
      if (token && batches.length === 0) {
        console.log('🔄 Auth token detected, re-initializing batches...');
        loadBatchesFromDatabase();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [batches.length]);
  
  // Load batches when AppContext session is established
  useEffect(() => {
    if (session && profile && batches.length === 0) {
      console.log('📡 Session established, loading batches...', { hasSession: !!session, hasProfile: !!profile });
      loadBatchesFromDatabase();
    }
  }, [session, profile, batches.length]);

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
      console.log('Attempting to load batches from database...');
      const response = await apiClient.get<Batch[]>('/batches');
      console.log('Raw API response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        setBatches(response.data);
        console.log('✅ Successfully loaded', response.data.length, 'batches from database:', response.data);
      } else {
        console.warn('⚠️ API returned unexpected data format:', response.data);
        setBatches([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch batches from database:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.error('Authentication failed - token may be invalid or expired');
        const token = localStorage.getItem('auth_token');
        console.log('Current token exists:', !!token);
      }
      
      // Check if it's a server error
      if (error.response?.status === 500) {
        console.error('Server error - database may be down or table may not exist');
      }
      
      // Check if it's a network error
      if (!error.response) {
        console.error('Network error - backend server may be down');
        
        // Retry once if it's a network error
        if (retryCount < 1) {
          console.log('🔄 Retrying database connection in 2 seconds...');
          setTimeout(() => loadBatchesFromDatabase(retryCount + 1), 2000);
          return;
        }
      }
      
      // On error, try to fall back to localStorage if available
      console.log('💾 Attempting to fall back to localStorage...');
      try {
        const storedBatches = localStorage.getItem('batches');
        if (storedBatches) {
          const parsedBatches = JSON.parse(storedBatches);
          const normalizedBatches = parsedBatches.map((batch: any) => ({
            id: batch.id,
            start_year: batch.startYear || batch.start_year,
            end_year: batch.endYear || batch.end_year,
            name: batch.name,
            is_active: batch.isActive !== undefined ? batch.isActive : batch.is_active
          }));
          setBatches(normalizedBatches);
          console.log('✅ Loaded', normalizedBatches.length, 'batches from localStorage fallback');
          return;
        }
      } catch (storageError) {
        console.error('❌ Failed to load from localStorage:', storageError);
      }
      
      // Generate some default batches if all else fails
      console.log('📝 Generating default batches as last resort...');
      const defaultBatches = generateDefaultBatches();
      setBatches(defaultBatches);
      console.log('✅ Generated', defaultBatches.length, 'default batches');
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
        // No default generation - start with empty array
        setBatches([]);
        console.log('No batches in localStorage, starting with empty list');
      }
    } catch (error) {
      console.error('Error loading batches from storage:', error);
      // No default generation on error - start with empty array
      setBatches([]);
    }
  };

  const loadSemesterDatesFromStorage = () => {
    try {
      const storedDates = localStorage.getItem('batchSemesterDates');
      console.log('Loading semester dates from localStorage:', storedDates);
      if (storedDates) {
        const parsedDates = JSON.parse(storedDates, (key, value) => {
          if (key === 'startDate' || key === 'endDate') {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        console.log('Parsed semester dates:', parsedDates);
        setSemesterDates(parsedDates);
      } else {
        console.log('No semester dates found in localStorage');
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
      console.log(`Creating batch for year ${startYear}...`);
      
      // Check authentication first
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Double-check if batch exists before creating
      const existingBatch = batches.find(b => b.start_year === startYear);
      if (existingBatch) {
        throw new Error(`Batch ${startYear}-${startYear + 4} already exists`);
      }
      
      await apiClient.post('/batches', { startYear });
      console.log(`✅ Batch ${startYear}-${startYear + 4} created successfully`);
      
      await loadBatchesFromDatabase(); // Reload from database
    } catch (error: any) {
      console.error('Failed to create batch:', error);
      
      // Enhance error message for better user experience
      if (error.response?.status === 409) {
        const enhancedError = new Error(`Batch ${startYear}-${startYear + 4} already exists in the database`);
        enhancedError.name = 'ConflictError';
        throw enhancedError;
      } else if (error.response?.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
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
      console.log(`Attempting to delete batch ${batchId}...`);
      
      // Check authentication first
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      await apiClient.delete(`/batches/${batchId}`);
      console.log(`✅ Batch ${batchId} deleted successfully`);
      
      await loadBatchesFromDatabase(); // Reload from database
    } catch (error: any) {
      console.error('Failed to delete batch:', error);
      
      // Enhanced error handling for delete operations
      if (error.response?.status === 400) {
        // Handle constraint violations (students, requests, etc.)
        const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Cannot delete batch due to existing dependencies';
        throw new Error(errorMsg);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else if (error.response?.status === 404) {
        throw new Error('Batch not found or already deleted.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete batches.');
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw error;
    }
  };

  const getAvailableBatches = useCallback(() => {
    return batches.filter(batch => batch.is_active);
  }, [batches]);


  const getSemesterDateRange = (batch: string, semester: number) => {
    console.log('getSemesterDateRange called with:', { batch, semester, allSemesterDates: semesterDates });
    
    // Try to find semester data with exact batch match first
    let semesterData = semesterDates.find(s => s.batch === batch && s.semester === semester);
    
    // If not found, try with batch name format (e.g., "2024-2028")
    if (!semesterData) {
      const batchYear = parseInt(batch);
      if (!isNaN(batchYear)) {
        const batchName = `${batchYear}-${batchYear + 4}`;
        semesterData = semesterDates.find(s => s.batch === batchName && s.semester === semester);
        console.log('Trying batch name format:', { batchName, found: !!semesterData });
      }
    }
    
    // If still not found, try the reverse - if batch is in "2024-2028" format, try just "2024"
    if (!semesterData && batch.includes('-')) {
      const batchStartYear = batch.split('-')[0];
      semesterData = semesterDates.find(s => s.batch === batchStartYear && s.semester === semester);
      console.log('Trying batch start year format:', { batchStartYear, found: !!semesterData });
    }
    
    if (semesterData?.startDate) {
      console.log('Using custom semester date:', { batch, semester, startDate: semesterData.startDate, endDate: semesterData.endDate });
      return {
        start: semesterData.startDate,
        end: semesterData.endDate || new Date(8640000000000000) // Far future date if no end date
      };
    }
    
    // Smart fallback calculation based on current date and semester logic
    const batchYear = parseInt(batch);
    if (isNaN(batchYear)) return null;
    
    const semesterIndex = Math.floor((semester - 1) / 2);
    const isOddSemester = semester % 2 === 1;
    const academicYear = batchYear + semesterIndex;
    
    // Get current date for better calculation
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based (0 = January, 11 = December)
    
    let fallbackResult;
    
    if (isOddSemester) {
      // Odd semesters (1, 3, 5, 7): June to January (next year)
      // For current semester calculation, use a more realistic start date
      let semesterStartDate;
      
      // If this is the current academic year and we're past June
      if (academicYear === currentYear && currentMonth >= 5) {
        // Use June 1st of current year
        semesterStartDate = new Date(academicYear, 5, 1);
      } else if (academicYear === currentYear - 1 && currentMonth <= 1) {
        // We're in Jan-Feb of next year, semester started last June
        semesterStartDate = new Date(academicYear, 5, 1);
      } else {
        // For future/past semesters, use standard June 1st
        semesterStartDate = new Date(academicYear, 5, 1);
      }
      
      fallbackResult = {
        start: semesterStartDate,
        end: new Date(academicYear + 1, 0, 31) // January 31st next year
      };
    } else {
      // Even semesters (2, 4, 6, 8): January to June of the same calendar year
      fallbackResult = {
        start: new Date(academicYear + 1, 0, 1), // January 1st
        end: new Date(academicYear + 1, 5, 30) // June 30th
      };
    }
    
    console.log('Using smart fallback calculation:', { 
      batch, 
      semester, 
      batchYear, 
      semesterIndex, 
      isOddSemester, 
      academicYear, 
      currentYear,
      currentMonth,
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
      
      console.log('Saving semester dates:', semesterDates);
      
      // Create a backup of current data
      const currentData = localStorage.getItem('batchSemesterDates');
      
      try {
        // Save the new data
        const dataToSave = JSON.stringify(semesterDates, (key, value) => {
          // Ensure Date objects are properly serialized
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        });
        localStorage.setItem('batchSemesterDates', dataToSave);
        console.log('Semester dates saved successfully to localStorage:', dataToSave);
        
        // Verify the save was successful
        const savedData = localStorage.getItem('batchSemesterDates');
        if (!savedData) {
          throw new Error('Data verification failed - localStorage returned null after save');
        }
        
        // Parse and verify the saved data structure
        const parsedSavedData = JSON.parse(savedData);
        console.log('Verification - saved data parsed successfully:', parsedSavedData);
        
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
