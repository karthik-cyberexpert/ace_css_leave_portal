import React, { useMemo } from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeeklyLeaveChart from '@/components/WeeklyLeaveChart';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { subWeeks, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

const TutorDashboardPage = () => {
  const { students, leaveRequests, odRequests, currentTutor } = useAppContext();
  
  const tutorData = useMemo(() => {
    if (!currentTutor) return { pendingLeaves: 0, pendingODs: 0, totalStudents: 0, allMyLeaveRequests: [] };
    
    const myStudents = students.filter(s => s.tutor_id === currentTutor.id);
    const myStudentIds = new Set(myStudents.map(s => s.id));
    
    const myLeaveRequests = leaveRequests.filter(r => myStudentIds.has(r.student_id));
    const myODRequests = odRequests.filter(r => myStudentIds.has(r.student_id));

    return {
      pendingLeaves: myLeaveRequests.filter(r => r.status === 'Pending').length,
      pendingODs: myODRequests.filter(r => r.status === 'Pending').length,
      totalStudents: myStudents.length,
      allMyLeaveRequests: myLeaveRequests,
    };
  }, [students, leaveRequests, odRequests, currentTutor]);

  const weeklyLeaveData = useMemo(() => {
    const approvedLeaves = tutorData.allMyLeaveRequests.filter(r => r.status === 'Approved');
    const now = new Date();
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = endOfWeek(subWeeks(now, i));
      return { start: weekStart, end: weekEnd };
    }).reverse();

    return last4Weeks.map((week, index) => {
      const studentsOnLeave = new Set<string>();
      approvedLeaves.forEach(leave => {
        const leaveStart = parseISO(leave.start_date);
        const leaveEnd = parseISO(leave.end_date);
        if (isWithinInterval(leaveStart, { start: week.start, end: week.end }) || isWithinInterval(leaveEnd, { start: week.start, end: week.end })) {
          studentsOnLeave.add(leave.student_id);
        }
      });
      return { week: `W${index + 1}`, students: studentsOnLeave.size };
    });
  }, [tutorData.allMyLeaveRequests]);

  return (
    <TutorLayout>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Tutor Dashboard</h1>
      <p className="text-md md:text-lg text-gray-700 mb-8">
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
        <WeeklyLeaveChart data={weeklyLeaveData} />
        <MonthlyLeaveChart data={tutorData.allMyLeaveRequests} />
      </div>
    </TutorLayout>
  );
};

export default TutorDashboardPage;