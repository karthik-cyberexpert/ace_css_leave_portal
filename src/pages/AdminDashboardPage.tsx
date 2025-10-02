import React, { useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WeeklyLeaveChart from '@/components/WeeklyLeaveChart';
import { AbsentStudentsTable } from '@/components/AbsentStudentsTable';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { subWeeks, startOfWeek, endOfWeek, format, isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths, eachWeekOfInterval, getWeeksInMonth, getWeekOfMonth } from 'date-fns';
import { formatDateToLocalISO } from '@/utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const AdminDashboardPage = () => {
  const { students, leaveRequests, odRequests } = useAppContext();
  const { getAvailableBatches } = useBatchContext();

  const pendingLeaves = leaveRequests.filter(r => r.status === 'Pending' || r.status === 'Forwarded').length;
  const pendingODs = odRequests.filter(r => r.status === 'Pending' || r.status === 'Forwarded').length;
  const totalStudents = students.length;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBatch, setSelectedBatch] = useState('all');

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => subMonths(prev, -1));
  };
  
  const isNextMonthDisabled = () => {
    const today = new Date();
    return currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  };

  const weeklyLeaveData = useMemo(() => {
    const approvedLeaves = leaveRequests.filter(r => r.status === 'Approved');
    const approvedODs = odRequests.filter(r => r.status === 'Approved');
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weeksInMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd });
    
    if (selectedBatch === 'all') {
      // Show all batches separately with different colors (combined leave + OD)
      const uniqueBatches = getAvailableBatches().map(b => b.id).sort((a,b) => parseInt(b) - parseInt(a));
      
      return weeksInMonth.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart);
        const weekData: any = { week: `Week ${index + 1}` };
        
        uniqueBatches.forEach(batch => {
          const batchStudents = students.filter(s => s.batch === batch);
          const batchStudentIds = new Set(batchStudents.map(s => s.id));
          const studentsAbsent = new Set<string>();
          
          // Check leave requests
          approvedLeaves.forEach(leave => {
            if (batchStudentIds.has(leave.student_id)) {
              const leaveStart = parseISO(leave.start_date);
              const leaveEnd = parseISO(leave.end_date);
              if (isWithinInterval(leaveStart, { start: weekStart, end: weekEnd }) || 
                  isWithinInterval(leaveEnd, { start: weekStart, end: weekEnd }) ||
                  (leaveStart <= weekStart && leaveEnd >= weekEnd)) {
                studentsAbsent.add(leave.student_id);
              }
            }
          });
          
          // Check OD requests
          approvedODs.forEach(od => {
            if (batchStudentIds.has(od.student_id)) {
              const odStart = parseISO(od.start_date);
              const odEnd = parseISO(od.end_date);
              if (isWithinInterval(odStart, { start: weekStart, end: weekEnd }) || 
                  isWithinInterval(odEnd, { start: weekStart, end: weekEnd }) ||
                  (odStart <= weekStart && odEnd >= weekEnd)) {
                studentsAbsent.add(od.student_id);
              }
            }
          });
          
          weekData[`batch_${batch}`] = studentsAbsent.size;
        });
        
        return weekData;
      });
    } else {
      // Show single batch data with separate leave and OD counts
      const studentsInBatch = students.filter(s => s.batch === selectedBatch);
      const batchStudentIds = new Set(studentsInBatch.map(s => s.id));

      return weeksInMonth.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart);
        const studentsOnLeave = new Set<string>();
        const studentsOnOD = new Set<string>();
        
        // Check leave requests
        approvedLeaves.forEach(leave => {
          if (batchStudentIds.has(leave.student_id)) {
            const leaveStart = parseISO(leave.start_date);
            const leaveEnd = parseISO(leave.end_date);
            if (isWithinInterval(leaveStart, { start: weekStart, end: weekEnd }) || 
                isWithinInterval(leaveEnd, { start: weekStart, end: weekEnd }) ||
                (leaveStart <= weekStart && leaveEnd >= weekEnd)) {
              studentsOnLeave.add(leave.student_id);
            }
          }
        });
        
        // Check OD requests
        approvedODs.forEach(od => {
          if (batchStudentIds.has(od.student_id)) {
            const odStart = parseISO(od.start_date);
            const odEnd = parseISO(od.end_date);
            if (isWithinInterval(odStart, { start: weekStart, end: weekEnd }) || 
                isWithinInterval(odEnd, { start: weekStart, end: weekEnd }) ||
                (odStart <= weekStart && odEnd >= weekEnd)) {
              studentsOnOD.add(od.student_id);
            }
          }
        });
        
        return { 
          week: `Week ${index + 1}`, 
          students: studentsOnLeave.size,
          studentsOnOD: studentsOnOD.size
        };
      });
    }
  }, [leaveRequests, odRequests, students, currentMonth, selectedBatch, getAvailableBatches]);

  const batchOptions = useMemo(() => {
    const uniqueBatches = getAvailableBatches().map(b => b.id).sort((a,b) => parseInt(b) - parseInt(a));
    return ['all', ...uniqueBatches];
  }, [getAvailableBatches]);

  // Get today's absent students (on leave or OD)
  const currentDate = formatDateToLocalISO(new Date());
  
  const absentStudents = useMemo(() => {
    const targetDate = new Date(currentDate);
    targetDate.setHours(0, 0, 0, 0);

    let studentsToCheck = students;
    
    // Filter by selected batch if not 'all'
    if (selectedBatch !== 'all') {
      studentsToCheck = students.filter(s => s.batch === selectedBatch);
    }

    return studentsToCheck.map(student => {
      let status: 'On Leave' | 'On OD' | null = null;
      let requestId = '';

      // Check for leave requests
      const leaveRequest = leaveRequests.find(req => {
        if (req.student_id !== student.id || req.status !== 'Approved') return false;
        
        const leaveStart = new Date(req.start_date);
        leaveStart.setHours(0, 0, 0, 0);
        const leaveEnd = new Date(req.end_date);
        leaveEnd.setHours(23, 59, 59, 999);
        
        return targetDate >= leaveStart && targetDate <= leaveEnd;
      });

      // Check for OD requests
      const odRequest = odRequests.find(req => {
        if (req.student_id !== student.id || req.status !== 'Approved') return false;
        
        const odStart = new Date(req.start_date);
        odStart.setHours(0, 0, 0, 0);
        const odEnd = new Date(req.end_date);
        odEnd.setHours(23, 59, 59, 999);
        
        return targetDate >= odStart && targetDate <= odEnd;
      });

      if (leaveRequest) {
        status = 'On Leave';
        requestId = leaveRequest.id;
      } else if (odRequest) {
        status = 'On OD';
        requestId = odRequest.id;
      }

      return status ? {
        id: student.id,
        name: student.name,
        register_number: student.register_number,
        batch: student.batch,
        semester: student.semester,
        status,
        requestId
      } : null;
    }).filter((student): student is NonNullable<typeof student> => student !== null);
  }, [students, leaveRequests, odRequests, currentDate, selectedBatch]);

  return (
    <AdminLayout>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Admin Dashboard</h1>
      <p className="text-md md:text-lg text-gray-700 dark:text-gray-300 mb-8">
        Oversee all portal activity and manage requests from a central hub.
      </p>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Total Pending Leaves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLeaves}</div>
              <p className="text-xs text-muted-foreground">across all departments</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Total Pending ODs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingODs}</div>
              <p className="text-xs text-muted-foreground">across all departments</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Total Active Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">currently enrolled</p>
            </CardContent>
          </Card>
        </div>

        {/* Absent Students Table */}
        <div className="grid gap-6 lg:grid-cols-3">
          <AbsentStudentsTable 
            absentStudents={absentStudents}
            currentDate={currentDate}
            selectedBatch={selectedBatch}
          />
        </div>

        {/* Weekly Chart */}
        <div className="grid gap-6 lg:grid-cols-3">
          <WeeklyLeaveChart 
            data={weeklyLeaveData}
            currentMonth={currentMonth}
            selectedBatch={selectedBatch}
            batchOptions={batchOptions}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onBatchChange={setSelectedBatch}
            isNextMonthDisabled={isNextMonthDisabled()}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;