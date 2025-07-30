import React, { useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WeeklyLeaveChart from '@/components/WeeklyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { subWeeks, startOfWeek, endOfWeek, format, isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths, eachWeekOfInterval, getWeeksInMonth, getWeekOfMonth } from 'date-fns';
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
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weeksInMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd });
    
    if (selectedBatch === 'all') {
      // Show all batches separately with different colors
      const uniqueBatches = getAvailableBatches().map(b => b.id).sort((a,b) => parseInt(b) - parseInt(a));
      
      return weeksInMonth.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart);
        const weekData: any = { week: `Week ${index + 1}` };
        
        uniqueBatches.forEach(batch => {
          const batchStudents = students.filter(s => s.batch === batch);
          const batchStudentIds = new Set(batchStudents.map(s => s.id));
          const studentsOnLeave = new Set<string>();
          
          approvedLeaves.forEach(leave => {
            if (batchStudentIds.has(leave.student_id)) {
              const leaveStart = parseISO(leave.start_date);
              const leaveEnd = parseISO(leave.end_date);
              if (isWithinInterval(leaveStart, { start: weekStart, end: weekEnd }) || isWithinInterval(leaveEnd, { start: weekStart, end: weekEnd })) {
                studentsOnLeave.add(leave.student_id);
              }
            }
          });
          
          weekData[`batch_${batch}`] = studentsOnLeave.size;
        });
        
        return weekData;
      });
    } else {
      // Show single batch data
      const studentsInBatch = students.filter(s => s.batch === selectedBatch);
      const batchStudentIds = new Set(studentsInBatch.map(s => s.id));

      return weeksInMonth.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart);
        const studentsOnLeave = new Set<string>();
        
        approvedLeaves.forEach(leave => {
          if (batchStudentIds.has(leave.student_id)) {
            const leaveStart = parseISO(leave.start_date);
            const leaveEnd = parseISO(leave.end_date);
            if (isWithinInterval(leaveStart, { start: weekStart, end: weekEnd }) || isWithinInterval(leaveEnd, { start: weekStart, end: weekEnd })) {
              studentsOnLeave.add(leave.student_id);
            }
          }
        });
        
        return { week: `Week ${index + 1}`, students: studentsOnLeave.size };
      });
    }
  }, [leaveRequests, students, currentMonth, selectedBatch, getAvailableBatches]);

  const batchOptions = useMemo(() => {
    const uniqueBatches = getAvailableBatches().map(b => b.id).sort((a,b) => parseInt(b) - parseInt(a));
    return ['all', ...uniqueBatches];
  }, [getAvailableBatches]);

  return (
    <AdminLayout>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Admin Dashboard</h1>
      <p className="text-md md:text-lg text-gray-700 dark:text-gray-300 mb-8">
        Oversee all portal activity and manage requests from a central hub.
      </p>
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
    </AdminLayout>
  );
};

export default AdminDashboardPage;