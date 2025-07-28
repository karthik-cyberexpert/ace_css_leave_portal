import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarCheck, CalendarDays } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const DashboardOverview = () => {
  const { leaveRequests, currentUser } = useAppContext();
  
  const leavesTaken = currentUser.leave_taken;
  
  const leavesApplied = leaveRequests.filter(r => 
    r.student_id === currentUser.id && (r.status === 'Pending' || r.status === 'Forwarded')
  ).length;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leaves Taken</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{leavesTaken}</div>
          <p className="text-xs text-muted-foreground">out of 20 allowed</p>
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