import React from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeeklyLeaveChart from '@/components/WeeklyLeaveChart';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';

// Dummy data for the tutor's students' leave requests for the monthly chart
const tutorLeaveRequests = [
  { id: 'req-1', studentName: 'Alice Johnson', startDate: '2023-11-01', totalDays: 2, status: 'Approved' },
  { id: 'req-2', studentName: 'Bob Williams', startDate: '2023-11-05', totalDays: 4, status: 'Approved' },
  { id: 'req-3', studentName: 'Charlie Brown', startDate: '2023-10-10', totalDays: 1, status: 'Approved' },
  { id: 'req-4', studentName: 'Diana Miller', startDate: '2023-10-15', totalDays: 3, status: 'Rejected' },
  { id: 'req-5', studentName: 'Ethan Hunt', startDate: '2023-09-20', totalDays: 5, status: 'Approved' },
  { id: 'req-6', studentName: 'Frank Green', startDate: '2023-09-01', totalDays: 1, status: 'Approved' },
  { id: 'req-7', studentName: 'Grace Hall', startDate: '2023-11-12', totalDays: 1, status: 'Pending' },
];

const TutorDashboardPage = () => {
  return (
    <TutorLayout>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Tutor Dashboard</h1>
      <p className="text-md md:text-lg text-gray-700 mb-8">
        Welcome, Tutor! Here you can manage leave and OD requests, and view reports.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">awaiting your approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Pending OD Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">awaiting your approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-muted-foreground">under your guidance</p>
          </CardContent>
        </Card>
        <WeeklyLeaveChart />
        <MonthlyLeaveChart data={tutorLeaveRequests} />
      </div>
    </TutorLayout>
  );
};

export default TutorDashboardPage;