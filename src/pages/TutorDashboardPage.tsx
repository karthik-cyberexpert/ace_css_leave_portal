import React, { useMemo, useState } from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeeklyLeaveChart from '@/components/WeeklyLeaveChart';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { subWeeks, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths, eachWeekOfInterval } from 'date-fns';

const TutorDashboardPage = () => {
  const { students, leaveRequests, odRequests, currentTutor } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const tutorData = useMemo(() => {
    if (!currentTutor) return { pendingLeaves: 0, pendingODs: 0, totalStudents: 0, allMyLeaveRequests: [], myStudents: [] };
    
    const myStudents = students.filter(s => s.tutor_id === currentTutor.id);
    const myStudentIds = new Set(myStudents.map(s => s.id));
    
    const myLeaveRequests = leaveRequests.filter(r => myStudentIds.has(r.student_id));
    const myODRequests = odRequests.filter(r => myStudentIds.has(r.student_id));

    return {
      pendingLeaves: myLeaveRequests.filter(r => r.status === 'Pending').length,
      pendingODs: myODRequests.filter(r => r.status === 'Pending').length,
      totalStudents: myStudents.length,
      allMyLeaveRequests: myLeaveRequests,
      myStudents,
    };
  }, [students, leaveRequests, odRequests, currentTutor]);
  
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
    const approvedLeaves = tutorData.allMyLeaveRequests.filter(r => r.status === 'Approved');
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weeksInMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd });
    
    // Get the unique batch of tutor's students (should be only one batch)
    const tutorBatch = tutorData.myStudents.length > 0 ? tutorData.myStudents[0].batch : null;
    const myStudentIds = new Set(tutorData.myStudents.map(s => s.id));

    return weeksInMonth.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart);
      const studentsOnLeave = new Set<string>();
      
      approvedLeaves.forEach(leave => {
        if (myStudentIds.has(leave.student_id)) {
          const leaveStart = parseISO(leave.start_date);
          const leaveEnd = parseISO(leave.end_date);
          if (isWithinInterval(leaveStart, { start: weekStart, end: weekEnd }) || isWithinInterval(leaveEnd, { start: weekStart, end: weekEnd })) {
            studentsOnLeave.add(leave.student_id);
          }
        }
      });
      
      return { week: `Week ${index + 1}`, students: studentsOnLeave.size };
    });
  }, [tutorData.allMyLeaveRequests, tutorData.myStudents, currentMonth]);

  return (
    <TutorLayout>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Tutor Dashboard</h1>
      <p className="text-md md:text-lg text-gray-700 dark:text-gray-300 mb-8">
        Welcome, {currentTutor?.name}! Here you can manage leave and OD requests, and view reports.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutorData.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">awaiting your approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Pending OD Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutorData.pendingODs}</div>
            <p className="text-xs text-muted-foreground">awaiting your approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutorData.totalStudents}</div>
            <p className="text-xs text-muted-foreground">under your guidance</p>
          </CardContent>
        </Card>
        <WeeklyLeaveChart 
          data={weeklyLeaveData}
          currentMonth={currentMonth}
          selectedBatch={tutorData.myStudents.length > 0 ? tutorData.myStudents[0].batch : 'none'}
          batchOptions={[]} // No batch selection for tutors
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onBatchChange={() => {}} // No batch change for tutors
          isNextMonthDisabled={isNextMonthDisabled()}
        />
        <MonthlyLeaveChart data={tutorData.allMyLeaveRequests} />
      </div>
    </TutorLayout>
  );
};

export default TutorDashboardPage;