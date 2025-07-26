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
import AdminStudentManagementPage from "./pages/AdminStudentManagementPage";
import AdminStaffManagementPage from "./pages/AdminStaffManagementPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Student Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leave-request" element={<LeaveRequestPage />} />
          <Route path="/od-request" element={<ODRequestPage />} />
          <Route path="/request-status" element={<RequestStatusPage />} />
          
          {/* Tutor Routes */}
          <Route path="/tutor-dashboard" element={<TutorDashboardPage />} />
          <Route path="/tutor-leave-approve" element={<TutorLeaveApprovePage />} />
          <Route path="/tutor-od-approve" element={<TutorODApprovePage />} />
          <Route path="/tutor-report" element={<TutorReportPage />} />

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin-leave-requests" element={<AdminLeaveApprovePage />} />
          <Route path="/admin-od-requests" element={<AdminODApprovePage />} />
          <Route path="/admin-reports" element={<AdminReportPage />} />
          <Route path="/admin-students" element={<AdminStudentManagementPage />} />
          <Route path="/admin-staff" element={<AdminStaffManagementPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;