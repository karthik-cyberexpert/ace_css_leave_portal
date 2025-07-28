import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { BulkStudent } from '@/components/BulkAddStudentsDialog';
import { format, addDays, isBefore, parseISO } from 'date-fns';
import { showError, showSuccess } from '@/utils/toast';
import axios from 'axios';

// API Client Configuration
const API_BASE_URL = 'http://localhost:3002';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if it's a session invalidation
      if (error.response?.data?.code === 'SESSION_INVALID') {
        showError('Your session has been invalidated because another user logged into this account.');
      }
      
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

type Session = {
  access_token: string;
  user: any;
};

type User = {
  id: string;
  email: string;
};

// --- DATA TYPES ---
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Forwarded' | 'Cancelled' | 'Cancellation Pending';
export type CertificateStatus = 'Pending Upload' | 'Pending Verification' | 'Approved' | 'Rejected' | 'Overdue';

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_tutor: boolean;
  profile_photo?: string;
};

export interface Student {
  id: string;
  name: string;
  register_number: string;
  tutor_id: string;
  year: string;
  leave_taken: number;
  username: string;
  profile_photo?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  username: string;
  profile_photo?: string;
  is_admin: boolean;
  is_tutor: boolean;
}

export interface LeaveRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_register_number: string;
  tutor_id: string;
  tutor_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  subject: string;
  description: string;
  status: RequestStatus;
  cancel_reason?: string;
  original_status?: RequestStatus;
  created_at: string;
}

export interface ODRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_register_number: string;
  tutor_id: string;
  tutor_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  purpose: string;
  destination: string;
  description: string;
  status: RequestStatus;
  cancel_reason?: string;
  certificate_url?: string;
  certificate_status?: CertificateStatus;
  upload_deadline?: string;
  original_status?: RequestStatus;
  created_at: string;
}

// --- FORM DATA TYPES ---
export type NewStaffData = {
  name: string;
  email: string;
  username: string;
  password?: string;
  is_admin: boolean;
  is_tutor: boolean;
};

export type NewStudentData = {
  name: string;
  registerNumber: string;
  tutorName: string;
  year: string;
  username: string;
  password?: string;
  profilePhoto?: string;
};

// --- CONTEXT DEFINITION ---
interface IAppContext {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: 'Admin' | 'Tutor' | 'Student' | null;
  loading: boolean;
  students: Student[];
  staff: Staff[];
  leaveRequests: LeaveRequest[];
  odRequests: ODRequest[];
  currentUser: Student | null;
  currentTutor: Staff | null;
  handleLogin: (identifier: string, password: string) => Promise<{ error: { message: string } | null }>;
  addStudent: (studentData: NewStudentData) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  bulkAddStudents: (newStudents: BulkStudent[]) => Promise<void>;
  addStaff: (staffMember: NewStaffData) => Promise<void>;
  updateStaff: (id: string, data: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status' | 'student_name' | 'student_id' | 'student_register_number' | 'tutor_id' | 'tutor_name' | 'created_at' | 'original_status'>) => Promise<void>;
  updateLeaveRequestStatus: (id: string, status: RequestStatus, reason?: string) => Promise<void>;
  requestLeaveCancellation: (id: string, reason: string) => Promise<void>;
  approveRejectLeaveCancellation: (id: string, approve: boolean) => Promise<void>;
  addODRequest: (request: Omit<ODRequest, 'id' | 'status' | 'student_name' | 'student_id' | 'student_register_number' | 'tutor_id' | 'tutor_name' | 'created_at' | 'original_status'>) => Promise<void>;
  updateODRequestStatus: (id: string, status: RequestStatus, reason?: string) => Promise<void>;
  requestODCancellation: (id: string, reason: string) => Promise<void>;
  approveRejectODCancellation: (id: string, approve: boolean) => Promise<void>;
  getTutors: () => Staff[];
  uploadODCertificate: (id: string, certificateUrl: string) => Promise<void>;
  verifyODCertificate: (id: string, isApproved: boolean) => Promise<void>;
  handleOverdueCertificates: () => Promise<void>;
  clearAllRequests: () => Promise<void>;
}

const AppContext = createContext<IAppContext | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [odRequests, setODRequests] = useState<ODRequest[]>([]);
  
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [currentTutor, setCurrentTutor] = useState<Staff | null>(null);

  const role = useMemo(() => {
    if (!profile) return null;
    if (profile.is_admin) return 'Admin';
    if (profile.is_tutor) return 'Tutor';
    return 'Student';
  }, [profile]);

  // Fetch data based on user profile and role
  const fetchDataForProfile = useCallback(async (userProfile: Profile) => {
    const currentRole = userProfile.is_admin ? 'Admin' : userProfile.is_tutor ? 'Tutor' : 'Student';

    // Reset data
    setStudents([]);
    setStaff([]);
    setLeaveRequests([]);
    setODRequests([]);
    setCurrentUser(null);
    setCurrentTutor(null);

    try {
      if (currentRole === 'Admin') {
        // Get admin's staff record
        const staffResponse = await apiClient.get('/staff');
        const adminRecord = staffResponse.data.find((staff: Staff) => staff.id === userProfile.id);
        if (adminRecord) setCurrentTutor(adminRecord);

        // Get all students
        const studentsResponse = await apiClient.get('/students');
        setStudents(studentsResponse.data || []);

        // Get all staff
        setStaff(staffResponse.data || []);

        // Get all leave requests
        const leaveResponse = await apiClient.get('/leave-requests');
        setLeaveRequests(leaveResponse.data || []);

        // Get all OD requests
        const odResponse = await apiClient.get('/od-requests');
        setODRequests(odResponse.data || []);

      } else if (currentRole === 'Tutor') {
        // Get tutor's staff record
        const staffResponse = await apiClient.get('/staff');
        const tutorRecord = staffResponse.data.find((staff: Staff) => staff.id === userProfile.id);
        if (!tutorRecord) throw new Error("Tutor record not found");
        setCurrentTutor(tutorRecord);

        // Get students assigned to this tutor
        const studentsResponse = await apiClient.get('/students');
        const tutorStudents = studentsResponse.data.filter((student: Student) => student.tutor_id === tutorRecord.id);
        setStudents(tutorStudents || []);

        // Get leave requests for tutor's students
        const leaveResponse = await apiClient.get('/leave-requests');
        const studentIds = tutorStudents.map((s: Student) => s.id);
        const tutorLeaveRequests = leaveResponse.data.filter((req: LeaveRequest) => 
          studentIds.includes(req.student_id)
        );
        setLeaveRequests(tutorLeaveRequests || []);

        // Get OD requests for tutor's students
        const odResponse = await apiClient.get('/od-requests');
        const tutorODRequests = odResponse.data.filter((req: ODRequest) => 
          studentIds.includes(req.student_id)
        );
        setODRequests(tutorODRequests || []);

      } else if (currentRole === 'Student') {
        // Get student record
        const studentsResponse = await apiClient.get('/students');
        const studentRecord = studentsResponse.data.find((student: Student) => student.id === userProfile.id);
        if (!studentRecord) throw new Error("Student record not found");
        setCurrentUser(studentRecord);

        // Get tutor information
        if (studentRecord.tutor_id) {
          const staffResponse = await apiClient.get('/staff');
          const tutorRecord = staffResponse.data.find((staff: Staff) => staff.id === studentRecord.tutor_id);
          if (tutorRecord) setStaff([tutorRecord]);
        }

        // Get student's leave requests
        const leaveResponse = await apiClient.get('/leave-requests');
        const studentLeaveRequests = leaveResponse.data.filter((req: LeaveRequest) => 
          req.student_id === userProfile.id
        );
        setLeaveRequests(studentLeaveRequests || []);

        // Get student's OD requests
        const odResponse = await apiClient.get('/od-requests');
        const studentODRequests = odResponse.data.filter((req: ODRequest) => 
          req.student_id === userProfile.id
        );
        setODRequests(studentODRequests || []);
      }
    } catch (error: any) {
      showError(`Failed to fetch data: ${error.response?.data?.error || error.message}`);
    }
  }, []);

  useEffect(() => {
    const initializeSessionAndData = async () => {
      // Check for existing session in localStorage
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          // Get user profile from backend
          const profileResponse = await apiClient.get('/profile');
          const userProfile = profileResponse.data;
          
          // Create session and user objects
          const currentSession = {
            access_token: token,
            user: { id: userProfile.id, email: userProfile.email }
          };
          
          setSession(currentSession);
          setUser(currentSession.user);
          setProfile(userProfile);
          
          // Fetch data based on the profile
          await fetchDataForProfile(userProfile);
        } catch (error: any) {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_profile');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      setLoadingInitial(false);
    };

    initializeSessionAndData();
  }, [fetchDataForProfile]);

  const handleLogin = async (identifier: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { identifier, password });
      if (response.data.token) {
        // Store token and user profile in local storage
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_profile', JSON.stringify(response.data.user));

        // Get full profile from backend
        const profileResponse = await apiClient.get('/profile');
        const userProfile = profileResponse.data;

        // Set session and user objects
        setSession({ access_token: response.data.token, user: response.data.user });
        setUser(response.data.user);
        setProfile(userProfile);

        // Fetch profile-specific data
        await fetchDataForProfile(userProfile);

        return { error: null };
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      return { error: { message: error.response?.data?.error?.message || "Invalid username or password." } };
    }
  };
  
  const addStudent = async (studentData: NewStudentData) => {
    if (!studentData.password) {
      showError("Password is required for new students.");
      return;
    }
    const tutor = staff.find(s => s.name === studentData.tutorName);
    if (!tutor) {
      showError(`Tutor '${studentData.tutorName}' not found.`);
      return;
    }

    try {
      const payload = {
        email: `${studentData.username}@college.portal`,
        password: studentData.password,
        name: studentData.name,
        registerNumber: studentData.registerNumber,
        tutorId: tutor.id,
        year: studentData.year,
        username: studentData.username,
        profilePhoto: studentData.profilePhoto,
      };

      await apiClient.post('/students', payload);
      showSuccess('Student added successfully!');
      
      // Refresh data
      if (profile) await fetchDataForProfile(profile);
    } catch (error: any) {
      console.error('Failed to add student:', error);
      showError(`Failed to add student: ${error.response?.data?.error || error.message}`);
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    try {
      const response = await apiClient.put(`/students/${id}`, data);
      showSuccess('Student updated!');
      setStudents(prev => prev.map(s => s.id === id ? response.data : s));
      if (currentUser?.id === id) {
        setCurrentUser(response.data);
      }
    } catch (error: any) {
      showError(`Failed to update student: ${error.response?.data?.error || error.message}`);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await apiClient.delete(`/students/${id}`);
      showSuccess('Student removed!');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      showError(`Failed to delete student: ${error.response?.data?.error || error.message}`);
    }
  };

  const bulkAddStudents = async (newStudents: BulkStudent[]) => {
    setLoadingInitial(true);
    let successCount = 0;
    const errors = [];

    for (const student of newStudents) {
      const tutor = staff.find(s => s.name === student.tutorName);
      if (!tutor) {
        errors.push(`Row for ${student.name}: Tutor '${student.tutorName}' not found.`);
        continue;
      }

      try {
        const payload = {
          email: `${student.username}@college.portal`,
          password: student.password,
          name: student.name,
          registerNumber: student.registerNumber,
          tutorId: tutor.id,
          year: student.year,
          username: student.username,
          profilePhoto: student.profilePhoto,
        };

        await apiClient.post('/students', payload);
        successCount++;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message;
        errors.push(`Row for ${student.name}: ${errorMessage}`);
      }
    }

    if (errors.length > 0) {
      showError(`Bulk add finished with ${errors.length} errors. ${successCount} students added.`);
      console.error("Bulk add errors:", errors);
    } else {
      showSuccess(`${successCount} students added successfully.`);
    }
    
    if (profile) await fetchDataForProfile(profile);
    setLoadingInitial(false);
  };

  const addStaff = async (staffMember: NewStaffData) => {
    if (!staffMember.password) {
      showError("Password is required for new staff members.");
      return;
    }

    try {
      await apiClient.post('/staff', {
        email: staffMember.email,
        password: staffMember.password,
        name: staffMember.name,
        username: staffMember.username,
        isAdmin: staffMember.is_admin,
        isTutor: staffMember.is_tutor
      });

      showSuccess("Staff member added successfully!");
      if (profile) await fetchDataForProfile(profile);
    } catch (error: any) {
      showError(`Failed to create staff: ${error.response?.data?.error || error.message}`);
    }
  };
  
  const updateStaff = async (id: string, data: Partial<Staff>) => {
    try {
      const response = await apiClient.put(`/staff/${id}`, data);
      showSuccess("Staff member updated successfully!");
      setStaff(prev => prev.map(s => s.id === id ? response.data : s));
    } catch (error: any) {
      showError(`Failed to update staff: ${error.response?.data?.error || error.message}`);
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      await apiClient.delete(`/staff/${id}`);
      showSuccess("Staff member removed!");
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      showError(`Failed to delete staff: ${error.response?.data?.error || error.message}`);
    }
  };

  const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status' | 'student_name' | 'student_id' | 'student_register_number' | 'tutor_id' | 'tutor_name' | 'created_at' | 'original_status'>) => {
    if (!currentUser) { 
      const err = "Current user not found. Cannot submit request.";
      showError(err);
      throw new Error(err);
    }
    const tutor = staff.find(s => s.id === currentUser.tutor_id);
    if (!tutor) {
      const err = "Tutor details not found. Cannot submit request.";
      showError(err);
      throw new Error(err);
    }

    try {
      const payload = {
        startDate: request.start_date,
        endDate: request.end_date,
        totalDays: request.total_days,
        subject: request.subject,
        description: request.description
      };

      const response = await apiClient.post('/leave-requests', payload);
      setLeaveRequests(prev => [...prev, response.data]);
      showSuccess('Leave request submitted successfully!');
    } catch (error: any) {
      showError(`Failed to submit leave request: ${error.response?.data?.error || error.message}`);
      throw error;
    }
  };

  const updateLeaveRequestStatus = async (id: string, status: RequestStatus, reason?: string) => {
    try {
      const response = await apiClient.put(`/leave-requests/${id}/status`, { status, cancelReason: reason });
      showSuccess("Status updated!");
      setLeaveRequests(prev => prev.map(req => req.id === id ? response.data : req));
      
      // Refresh student data to update leave counts and charts
      if (profile) {
        await fetchDataForProfile(profile);
      }
    } catch (error: any) {
      showError(`Failed to update status: ${error.response?.data?.error || error.message}`);
    }
  };

  const requestLeaveCancellation = async (id: string, reason: string) => {
    try {
      const response = await apiClient.put(`/leave-requests/${id}/status`, { 
        status: 'Cancellation Pending', 
        cancelReason: reason 
      });
      showSuccess('Cancellation request sent!');
      setLeaveRequests(prev => prev.map(req => req.id === id ? response.data : req));
    } catch (error: any) {
      showError(`Failed to request cancellation: ${error.response?.data?.error || error.message}`);
    }
  };

  const approveRejectLeaveCancellation = async (id: string, approve: boolean) => {
    try {
      const status = approve ? 'Cancelled' : 'Pending';
      const response = await apiClient.put(`/leave-requests/${id}/status`, { status });
      showSuccess(`Leave cancellation ${approve ? 'approved' : 'rejected'}!`);
      setLeaveRequests(prev => prev.map(req => req.id === id ? response.data : req));
    } catch (error: any) {
      showError(`Failed to process cancellation: ${error.response?.data?.error || error.message}`);
    }
  };

  const addODRequest = async (request: Omit<ODRequest, 'id' | 'status' | 'student_name' | 'student_id' | 'student_register_number' | 'tutor_id' | 'tutor_name' | 'created_at' | 'original_status'>) => {
    if (!currentUser) { 
      const err = "Current user not found. Cannot submit request.";
      showError(err);
      throw new Error(err);
    }
    const tutor = staff.find(s => s.id === currentUser.tutor_id);
    if (!tutor) {
      const err = "Tutor details not found. Cannot submit request.";
      showError(err);
      throw new Error(err);
    }

    try {
      const payload = {
        startDate: request.start_date,
        endDate: request.end_date,
        totalDays: request.total_days,
        purpose: request.purpose,
        destination: request.destination,
        description: request.description
      };

      const response = await apiClient.post('/od-requests', payload);
      setODRequests(prev => [...prev, response.data]);
      showSuccess('OD request submitted successfully!');
    } catch (error: any) {
      showError(`Failed to submit OD request: ${error.response?.data?.error || error.message}`);
      throw error;
    }
  };

  const updateODRequestStatus = async (id: string, status: RequestStatus, reason?: string) => {
    try {
      const response = await apiClient.put(`/od-requests/${id}/status`, { status, cancelReason: reason });
      showSuccess("Status updated!");
      setODRequests(prev => prev.map(req => req.id === id ? response.data : req));
      
      // Refresh student data to update leave counts and charts
      if (profile) {
        await fetchDataForProfile(profile);
      }
    } catch (error: any) {
      showError(`Failed to update status: ${error.response?.data?.error || error.message}`);
    }
  };

  const requestODCancellation = async (id: string, reason: string) => {
    try {
      const response = await apiClient.put(`/od-requests/${id}/status`, { 
        status: 'Cancellation Pending', 
        cancelReason: reason 
      });
      showSuccess('Cancellation request sent!');
      setODRequests(prev => prev.map(req => req.id === id ? response.data : req));
    } catch (error: any) {
      showError(`Failed to request cancellation: ${error.response?.data?.error || error.message}`);
    }
  };

  const approveRejectODCancellation = async (id: string, approve: boolean) => {
    try {
      const status = approve ? 'Cancelled' : 'Pending';
      const response = await apiClient.put(`/od-requests/${id}/status`, { status });
      showSuccess(`OD cancellation ${approve ? 'approved' : 'rejected'}!`);
      setODRequests(prev => prev.map(req => req.id === id ? response.data : req));
    } catch (error: any) {
      showError(`Failed to process cancellation: ${error.response?.data?.error || error.message}`);
    }
  };

  const uploadODCertificate = async (id: string, certificateUrl: string) => {
    try {
      const response = await apiClient.put(`/od-requests/${id}/certificate`, { 
        certificateUrl,
        certificateStatus: 'Pending Verification'
      });
      showSuccess("Certificate uploaded successfully!");
      setODRequests(prev => prev.map(req => req.id === id ? response.data : req));
    } catch (error: any) {
      showError(`Failed to upload certificate: ${error.response?.data?.error || error.message}`);
      throw error;
    }
  };

  const verifyODCertificate = async (id: string, isApproved: boolean) => {
    try {
      const response = await apiClient.put(`/od-requests/${id}/certificate/verify`, { 
        isApproved,
        certificateStatus: isApproved ? 'Approved' : 'Rejected'
      });
      showSuccess(`Certificate ${isApproved ? 'approved' : 'rejected'}!`);
      setODRequests(prev => prev.map(req => req.id === id ? response.data : req));
    } catch (error: any) {
      showError(`Failed to verify certificate: ${error.response?.data?.error || error.message}`);
      throw error;
    }
  };

  const handleOverdueCertificates = useCallback(async () => {
    try {
      const response = await apiClient.put('/od-requests/handle-overdue-certificates');
      const overdueCount = response.data.overdueCount || 0;
      if (overdueCount > 0) {
        showSuccess(`${overdueCount} overdue certificates have been marked as overdue.`);
        // Refresh OD requests to show updated status
        if (profile) await fetchDataForProfile(profile);
      }
    } catch (error: any) {
      showError(`Failed to handle overdue certificates: ${error.response?.data?.error || error.message}`);
    }
  }, [profile, fetchDataForProfile]);

  const getTutors = () => staff.filter(s => s.is_tutor);

  const clearAllRequests = async () => {
    try {
      const response = await apiClient.delete('/admin/clear-all-requests');
      
      // Clear local state
      setLeaveRequests([]);
      setODRequests([]);
      
      // Reset student leave counts locally
      setStudents(prev => prev.map(student => ({ ...student, leave_taken: 0 })));
      
      showSuccess(`All requests cleared successfully! ${response.data.clearedLeaveRequests} leave requests and ${response.data.clearedODRequests} OD requests were deleted.`);
    } catch (error: any) {
      showError(`Failed to clear all requests: ${error.response?.data?.error || error.message}`);
      throw error;
    }
  };

  const value = {
    session, user, profile, role, loading: loadingInitial,
    students, staff, leaveRequests, odRequests, currentUser, currentTutor,
    handleLogin,
    addStudent, updateStudent, deleteStudent, bulkAddStudents,
    addStaff, updateStaff, deleteStaff,
    addLeaveRequest, updateLeaveRequestStatus, requestLeaveCancellation, approveRejectLeaveCancellation,
    addODRequest, updateODRequestStatus, requestODCancellation, approveRejectODCancellation,
    getTutors, uploadODCertificate, verifyODCertificate, handleOverdueCertificates,
    clearAllRequests,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
