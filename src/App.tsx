import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LeaveRequestPage from "./pages/LeaveRequestPage";
import ODRequestPage from "./pages/ODRequestPage";
import RequestStatusPage from "./pages/RequestStatusPage";
import TutorDashboardPage from "./pages/TutorDashboardPage";
import TutorLeaveApprovePage from "./pages/TutorLeaveApprovePage";
import TutorODApprovePage from "./pages/TutorODApprovePage";
import TutorReportPage from "./pages/TutorReportPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLeaveApprovePage from "./pages/AdminLeaveApprovePage";
import AdminODApprovePage from "./pages/AdminODApprovePage";
import AdminReportPage from "./pages/AdminReportPage";
import AdminBatchManagementPage from "./pages/AdminBatchManagementPage";
import AdminStudentManagementPage from "./pages/AdminStudentManagementPage";
import AdminStaffManagementPage from "./pages/AdminStaffManagementPage";
import { AppProvider } from "./context/AppContext";
import { BatchProvider } from "./context/BatchContext";
import TutorStudentManagementPage from "./pages/TutorStudentManagementPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import StaffProfilePage from "./pages/StaffProfilePage";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <AppProvider>
      <BatchProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Student Routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Student']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/leave-request" element={<ProtectedRoute allowedRoles={['Student']}><LeaveRequestPage /></ProtectedRoute>} />
            <Route path="/od-request" element={<ProtectedRoute allowedRoles={['Student']}><ODRequestPage /></ProtectedRoute>} />
            <Route path="/request-status" element={<ProtectedRoute allowedRoles={['Student']}><RequestStatusPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['Student']}><ProfilePage /></ProtectedRoute>} />
            
            {/* Tutor Routes */}
            <Route path="/tutor-dashboard" element={<ProtectedRoute allowedRoles={['Tutor']}><TutorDashboardPage /></ProtectedRoute>} />
            <Route path="/tutor-leave-approve" element={<ProtectedRoute allowedRoles={['Tutor']}><TutorLeaveApprovePage /></ProtectedRoute>} />
            <Route path="/tutor-od-approve" element={<ProtectedRoute allowedRoles={['Tutor']}><TutorODApprovePage /></ProtectedRoute>} />
            <Route path="/tutor-report" element={<ProtectedRoute allowedRoles={['Tutor']}><TutorReportPage /></ProtectedRoute>} />
            <Route path="/tutor-students" element={<ProtectedRoute allowedRoles={['Tutor']}><TutorStudentManagementPage /></ProtectedRoute>} />
            <Route path="/tutor-profile" element={<ProtectedRoute allowedRoles={['Tutor']}><StaffProfilePage /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin-leave-requests" element={<ProtectedRoute allowedRoles={['Admin']}><AdminLeaveApprovePage /></ProtectedRoute>} />
            <Route path="/admin-od-requests" element={<ProtectedRoute allowedRoles={['Admin']}><AdminODApprovePage /></ProtectedRoute>} />
            <Route path="/admin-batch-management" element={<ProtectedRoute allowedRoles={['Admin']}><AdminBatchManagementPage /></ProtectedRoute>} />
            <Route path="/admin-reports" element={<ProtectedRoute allowedRoles={['Admin']}><AdminReportPage /></ProtectedRoute>} />
            <Route path="/admin-students" element={<ProtectedRoute allowedRoles={['Admin']}><AdminStudentManagementPage /></ProtectedRoute>} />
            <Route path="/admin-staff" element={<ProtectedRoute allowedRoles={['Admin']}><AdminStaffManagementPage /></ProtectedRoute>} />
            <Route path="/admin-profile" element={<ProtectedRoute allowedRoles={['Admin']}><StaffProfilePage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </BatchProvider>
    </AppProvider>
  </ThemeProvider>
);

export default App;