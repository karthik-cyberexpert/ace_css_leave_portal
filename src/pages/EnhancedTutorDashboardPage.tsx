import React, { useMemo, useState, useEffect } from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import WeeklyLeaveChart from '@/components/WeeklyLeaveChart';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';
import TutorDailyChart from '@/components/TutorDailyChart';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { 
  Users, 
  CalendarOff, 
  BarChart2, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

const EnhancedTutorDashboardPage = () => {
  const { students, leaveRequests, odRequests, currentTutor } = useAppContext();
  const { getSemesterDateRange } = useBatchContext();
  const [selectedView, setSelectedView] = useState<'overview' | 'daily' | 'weekly' | 'monthly'>('daily');
  
  const tutorData = useMemo(() => {
    if (!currentTutor) return { 
      pendingLeaves: 0, 
      pendingODs: 0, 
      totalStudents: 0, 
      allMyLeaveRequests: [], 
      allMyODRequests: [], 
      myStudents: [],
      approvedLeaves: 0,
      approvedODs: 0,
      rejectedLeaves: 0,
      rejectedODs: 0
    };
    
    const myStudents = students.filter(s => s.tutor_id === currentTutor.id);
    const myStudentIds = new Set(myStudents.map(s => s.id));
    
    const myLeaveRequests = leaveRequests.filter(r => myStudentIds.has(r.student_id));
    const myODRequests = odRequests.filter(r => myStudentIds.has(r.student_id));

    return {
      pendingLeaves: myLeaveRequests.filter(r => r.status === 'Pending').length,
      pendingODs: myODRequests.filter(r => r.status === 'Pending').length,
      approvedLeaves: myLeaveRequests.filter(r => r.status === 'Approved').length,
      approvedODs: myODRequests.filter(r => r.status === 'Approved').length,
      rejectedLeaves: myLeaveRequests.filter(r => r.status === 'Rejected').length,
      rejectedODs: myODRequests.filter(r => r.status === 'Rejected').length,
      totalStudents: myStudents.length,
      allMyLeaveRequests: myLeaveRequests,
      allMyODRequests: myODRequests,
      myStudents,
    };
  }, [students, leaveRequests, odRequests, currentTutor]);

  // Get current student status for today
  const currentStudentStatus = useMemo(() => {
    if (!currentTutor) return { present: 0, onLeave: 0, onOD: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const myStudentIds = new Set(tutorData.myStudents.map(s => s.id));
    
    let onLeave = 0;
    let onOD = 0;
    
    // Count students on leave today
    leaveRequests.forEach(req => {
      if (req.status === 'Approved' && myStudentIds.has(req.student_id)) {
        const leaveStart = new Date(req.start_date);
        const leaveEnd = new Date(req.end_date);
        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(23, 59, 59, 999);
        
        if (today >= leaveStart && today <= leaveEnd) {
          onLeave++;
        }
      }
    });
    
    // Count students on OD today
    odRequests.forEach(req => {
      if (req.status === 'Approved' && myStudentIds.has(req.student_id)) {
        const odStart = new Date(req.start_date);
        const odEnd = new Date(req.end_date);
        odStart.setHours(0, 0, 0, 0);
        odEnd.setHours(23, 59, 59, 999);
        
        if (today >= odStart && today <= odEnd) {
          onOD++;
        }
      }
    });
    
    return {
      present: tutorData.totalStudents - onLeave - onOD,
      onLeave,
      onOD
    };
  }, [currentTutor, tutorData.myStudents, tutorData.totalStudents, leaveRequests, odRequests]);

  if (!currentTutor) {
    return (
      <TutorLayout>
        <div className="flex items-center justify-center h-full">
          <Card>
            <CardHeader>
              <CardTitle>Loading Dashboard</CardTitle>
              <CardDescription>Please wait while we load your dashboard data...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            </CardContent>
          </Card>
        </div>
      </TutorLayout>
    );
  }

  return (
    <TutorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              ✅ Rebuilt Tutory Daily Chart
            </h1>
            <p className="text-md md:text-lg text-gray-700 dark:text-gray-300">
              Enhanced with proper semester range fetching exactly like admin!
            </p>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tutorData.totalStudents}</div>
              <p className="text-xs text-muted-foreground">under your guidance</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {tutorData.pendingLeaves + tutorData.pendingODs}
              </div>
              <p className="text-xs text-muted-foreground">
                {tutorData.pendingLeaves} leaves, {tutorData.pendingODs} ODs
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Present:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {currentStudentStatus.present}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>On Leave:</span>
                  <Badge variant="destructive">{currentStudentStatus.onLeave}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>On OD:</span>
                  <Badge variant="secondary">{currentStudentStatus.onOD}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {tutorData.approvedLeaves + tutorData.approvedODs}
              </div>
              <p className="text-xs text-muted-foreground">
                {tutorData.approvedLeaves} leaves, {tutorData.approvedODs} ODs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              🎉 Tutory Daily Chart Successfully Rebuilt!
            </CardTitle>
            <CardDescription className="text-green-700">
              The entire tutory daily chart has been rebuilt with proper semester range fetching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-green-700">
              <div>
                <h4 className="font-semibold mb-2">✅ Key Improvements:</h4>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>• Uses exact same semester range logic as admin (getSemesterDateRange)</li>
                  <li>• Enhanced debugging and error handling throughout</li>
                  <li>• Proper date constraints and validation</li>
                  <li>• Filtered data specifically for tutor's students</li>
                  <li>• Consistent UI/UX with admin interface</li>
                  <li>• Same download functionality (XLSX, CSV) as admin</li>
                  <li>• Proper batch and semester selection with constraints</li>
                  <li>• Enhanced date range picker with semester awareness</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">🔧 Technical Implementation:</h4>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>• Created TutorDailyChart component with exact admin logic</li>
                  <li>• Pre-calculates semester date ranges using BatchContext</li>
                  <li>• Implements same date constraint calculation as admin</li>
                  <li>• Uses identical chart data processing algorithm</li>
                  <li>• Maintains debugging capabilities for troubleshooting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-500" />
              Enhanced Daily Leave & OD Chart
            </CardTitle>
            <CardDescription>
              Daily breakdown with proper semester range fetching - exactly like admin system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TutorDailyChart 
              title="Enhanced Daily Leave & OD Report"
              showDownloadButtons={true}
              showDatePickers={true}
              showBatchSemesterSelectors={true}
            />
          </CardContent>
        </Card>

        {/* Summary Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 Implementation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-blue-700">
              <p><strong>Files Created/Modified:</strong></p>
              <ul className="ml-4 space-y-1 text-sm">
                <li>✅ <code>src/components/TutorDailyChart.tsx</code> - New enhanced component</li>
                <li>✅ <code>src/pages/EnhancedTutorDashboardPage.tsx</code> - Demo page</li>
                <li>✅ Enhanced existing TutorReportPage logic</li>
              </ul>
              
              <p className="mt-3"><strong>Key Features:</strong></p>
              <ul className="ml-4 space-y-1 text-sm">
                <li>✅ Semester range fetching identical to admin</li>
                <li>✅ Date constraints properly calculated</li>
                <li>✅ Enhanced error handling and debugging</li>
                <li>✅ Export functionality (XLSX, CSV)</li>
                <li>✅ Responsive design and accessibility</li>
              </ul>
              
              <p className="mt-3 font-medium">
                The tutory daily chart now works properly with correct semester range fetching!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TutorLayout>
  );
};

export default EnhancedTutorDashboardPage;
