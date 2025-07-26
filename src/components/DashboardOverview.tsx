import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarCheck, CalendarDays } from 'lucide-react'; // Icons for cards

const DashboardOverview = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2"> {/* Adjusted grid for 2 columns */}
      {/* Card for Leaves Taken */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leaves Taken</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">out of 20 allowed</p>
        </CardContent>
      </Card>

      {/* Card for Leaves Applied */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leaves Applied</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">pending approval</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;