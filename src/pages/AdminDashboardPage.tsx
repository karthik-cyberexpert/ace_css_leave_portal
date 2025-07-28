import React, { useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeeklyLeaveChart from '@/components/WeeklyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { subWeeks, startOfWeek, endOfWeek, format, isWithinInterval, parseISO } from 'date-fns';

const AdminDashboardPage = () => {
  const { students, leaveRequests, odRequests } = useAppContext();

  const pendingLeaves = leaveRequests.filter(r => r.status === 'Pending' || r.status === 'Forwarded').length;
  const pendingODs = odRequests.filter(r => r.status === 'Pending' || r.status === 'Forwarded').length;
  const totalStudents = students.length;

  const weeklyLeaveData = useMemo(() => {
    const approvedLeaves = leaveRequests.filter(r => r.status === 'Approved');
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
  }, [leaveRequests]);

  return (
    <AdminLayout>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <p className="text-md md:text-lg text-gray-700 mb-8">
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
        <WeeklyLeaveChart data={weeklyLeaveData} />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;