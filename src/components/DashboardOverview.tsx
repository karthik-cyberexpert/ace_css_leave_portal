import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarCheck, CalendarDays } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { calculateWorkingDaysFromSemesterStart } from '@/utils/dateUtils';

const DashboardOverview = () => {
  const { leaveRequests, currentUser } = useAppContext();
  const { getSemesterDateRange, getCurrentActiveSemester } = useBatchContext();
  
  // Handle case when currentUser is not loaded yet
  if (!currentUser) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="text-center py-8 text-muted-foreground">Loading user data...</div>
      </div>
    );
  }
  
  const leavesTaken = currentUser.leave_taken || 0;
  
  const leavesApplied = leaveRequests.filter(r => 
    r.student_id === currentUser.id && (r.status === 'Pending' || r.status === 'Forwarded')
  ).length;

  // Calculate total working days from semester start to current date
  const totalWorkingDays = useMemo(() => {
    if (!currentUser?.batch || !currentUser?.semester) {
      return 0;
    }

    const semesterRange = getSemesterDateRange(currentUser.batch, currentUser.semester);
    if (!semesterRange?.start) {
      return 0;
    }

    return calculateWorkingDaysFromSemesterStart(semesterRange.start);
  }, [currentUser?.batch, currentUser?.semester, getSemesterDateRange]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leaves Taken</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leavesTaken}</div>
          <p className="text-xs text-muted-foreground">
            out of {totalWorkingDays > 0 ? totalWorkingDays : '0'} days
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leaves Applied</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leavesApplied}</div>
          <p className="text-xs text-muted-foreground">pending approval</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;