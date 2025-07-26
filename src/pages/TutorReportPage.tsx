import React from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, CalendarOff, BarChart2 } from 'lucide-react';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';

// Dummy data for the tutor's students (for the table and summary cards)
const tutorStudentData = [
  { id: '1', studentName: 'Alice Johnson', registerNumber: 'S001', year: 3, totalLeaveTaken: 8 },
  { id: '2', studentName: 'Bob Williams', registerNumber: 'S002', year: 2, totalLeaveTaken: 12 },
  { id: '3', studentName: 'Charlie Brown', registerNumber: 'S003', year: 4, totalLeaveTaken: 5 },
  { id: '4', studentName: 'Diana Miller', registerNumber: 'S004', year: 3, totalLeaveTaken: 10 },
  { id: '5', studentName: 'Ethan Hunt', registerNumber: 'S005', year: 1, totalLeaveTaken: 2 },
];

// Dummy data for all individual leave requests from this tutor's students (for the monthly chart)
const tutorStudentLeaveRequests = [
  // Alice Johnson (8 days)
  { startDate: '2023-01-10', totalDays: 2, status: 'Approved' },
  { startDate: '2023-03-15', totalDays: 1, status: 'Approved' },
  { startDate: '2023-05-20', totalDays: 5, status: 'Approved' },
  // Bob Williams (12 days)
  { startDate: '2023-02-05', totalDays: 3, status: 'Approved' },
  { startDate: '2023-04-10', totalDays: 2, status: 'Approved' },
  { startDate: '2023-06-12', totalDays: 7, status: 'Approved' },
  // Charlie Brown (5 days)
  { startDate: '2023-01-25', totalDays: 1, status: 'Approved' },
  { startDate: '2023-07-01', totalDays: 4, status: 'Approved' },
  // Diana Miller (10 days)
  { startDate: '2023-02-18', totalDays: 4, status: 'Approved' },
  { startDate: '2023-08-22', totalDays: 6, status: 'Approved' },
  // Ethan Hunt (2 days)
  { startDate: '2023-03-05', totalDays: 2, status: 'Approved' },
  // Some rejected/pending requests to ensure chart only counts approved leaves
  { startDate: '2023-03-10', totalDays: 1, status: 'Rejected' },
  { startDate: '2023-04-01', totalDays: 3, status: 'Pending' },
];

const TutorReportPage = () => {
  const totalStudents = tutorStudentData.length;
  const totalLeaves = tutorStudentData.reduce((acc, student) => acc + student.totalLeaveTaken, 0);
  const averageLeaves = totalStudents > 0 ? (totalLeaves / totalStudents).toFixed(1) : 0;

  return (
    <TutorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Student Report</h1>
        
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">students assigned to you</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leaves Taken</CardTitle>
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeaves}</div>
              <p className="text-xs text-muted-foreground">by your students</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Leave</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageLeaves}</div>
              <p className="text-xs text-muted-foreground">days per student</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Leave Chart */}
        <MonthlyLeaveChart data={tutorStudentLeaveRequests} />

        {/* Detailed Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Student Report</CardTitle>
            <CardDescription>A summary of total leaves taken by each of your students.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Register Number</TableHead>
                    <TableHead className="text-center">Year</TableHead>
                    <TableHead className="text-right">Total Leave Taken</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorStudentData.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell>{student.registerNumber}</TableCell>
                      <TableCell className="text-center">{student.year}</TableCell>
                      <TableCell className="text-right font-semibold">{student.totalLeaveTaken}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TutorLayout>
  );
};

export default TutorReportPage;