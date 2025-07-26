import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, getMonth, getYear } from 'date-fns';
import TutorLeaveSummaryChart from '@/components/TutorLeaveSummaryChart';

// --- Dummy Data ---
const tutors = [
  { id: 'tutor-1', name: 'Dr. Smith' },
  { id: 'tutor-2', name: 'Prof. Jones' },
  { id: 'tutor-3', name: 'Dr. Davis' },
  { id: 'tutor-4', name: 'Prof. White' },
];

const allLeaveRequests = [
  // Dr. Smith's students
  { id: 'req-1', studentName: 'Alice Johnson', tutorName: 'Dr. Smith', startDate: '2023-11-01', totalDays: 2, status: 'Approved' },
  { id: 'req-4', studentName: 'Diana Miller', tutorName: 'Dr. Smith', startDate: '2023-10-15', totalDays: 3, status: 'Rejected' },
  { id: 'req-9', studentName: 'Ivy Scott', tutorName: 'Dr. Smith', startDate: '2023-08-05', totalDays: 10, status: 'Approved' },
  { id: 'req-13', studentName: 'Student A', tutorName: 'Dr. Smith', startDate: '2023-11-10', totalDays: 5, status: 'Approved' },

  // Prof. Jones' students
  { id: 'req-2', studentName: 'Bob Williams', tutorName: 'Prof. Jones', startDate: '2023-11-05', totalDays: 4, status: 'Approved' },
  { id: 'req-6', studentName: 'Frank Green', tutorName: 'Prof. Jones', startDate: '2023-09-01', totalDays: 1, status: 'Approved' },
  { id: 'req-10', studentName: 'Jack Turner', tutorName: 'Prof. Jones', startDate: '2023-07-22', totalDays: 2, status: 'Approved' },

  // Dr. Davis' students
  { id: 'req-3', studentName: 'Charlie Brown', tutorName: 'Dr. Davis', startDate: '2023-10-10', totalDays: 1, status: 'Approved' },
  { id: 'req-7', studentName: 'Grace Hall', tutorName: 'Dr. Davis', startDate: '2023-11-12', totalDays: 1, status: 'Pending' },
  { id: 'req-11', studentName: 'Kevin White', tutorName: 'Dr. Davis', startDate: '2023-07-15', totalDays: 3, status: 'Approved' },

  // Prof. White's students
  { id: 'req-5', studentName: 'Ethan Hunt', tutorName: 'Prof. White', startDate: '2023-09-20', totalDays: 5, status: 'Approved' },
  { id: 'req-8', studentName: 'Henry King', tutorName: 'Prof. White', startDate: '2023-11-18', totalDays: 3, status: 'Forwarded' },
  { id: 'req-12', studentName: 'Laura Black', tutorName: 'Prof. White', startDate: '2023-06-10', totalDays: 7, status: 'Approved' },
];

// In a real app, this would come from a database. Here we derive it.
const studentTutorMap = new Map<string, Set<string>>();
allLeaveRequests.forEach(req => {
  if (!studentTutorMap.has(req.tutorName)) {
    studentTutorMap.set(req.tutorName, new Set());
  }
  studentTutorMap.get(req.tutorName)!.add(req.studentName);
});

const tutorStudentCounts = tutors.map(tutor => ({
  ...tutor,
  studentCount: studentTutorMap.get(tutor.name)?.size || 0,
}));


const AdminReportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  const currentYear = 2023; // Hardcoding year for dummy data

  const monthName = format(new Date(currentYear, parseInt(selectedMonth)), 'MMMM');

  // Data for the monthly chart
  const chartData = useMemo(() => {
    const monthlyRequests = allLeaveRequests.filter(req => {
      const reqDate = new Date(req.startDate);
      return getMonth(reqDate) === parseInt(selectedMonth) && getYear(reqDate) === currentYear && req.status === 'Approved';
    });

    const leavesByTutor = new Map<string, number>();
    monthlyRequests.forEach(req => {
      leavesByTutor.set(req.tutorName, (leavesByTutor.get(req.tutorName) || 0) + req.totalDays);
    });

    return tutors.map(tutor => ({
      name: tutor.name,
      totalLeaves: leavesByTutor.get(tutor.name) || 0,
    }));
  }, [selectedMonth, currentYear]);

  // Data for the summary table (monthly)
  const reportTableData = useMemo(() => {
    return tutorStudentCounts.map(tutor => {
      const monthlyApprovedRequests = allLeaveRequests
        .filter(req => 
            req.tutorName === tutor.name && 
            req.status === 'Approved' && 
            getYear(new Date(req.startDate)) === currentYear &&
            getMonth(new Date(req.startDate)) === parseInt(selectedMonth)
        );
      
      const totalLeaveDays = monthlyApprovedRequests.reduce((acc, req) => acc + req.totalDays, 0);
      
      const studentsWhoTookLeave = new Set(monthlyApprovedRequests.map(req => req.studentName));
      const numberOfStudentsWithLeave = studentsWhoTookLeave.size;

      const averageLeavePercentage = tutor.studentCount > 0
        ? ((numberOfStudentsWithLeave / tutor.studentCount) * 100).toFixed(1)
        : '0.0';

      return {
        tutorName: tutor.name,
        totalStudents: tutor.studentCount,
        totalLeaveApproved: totalLeaveDays,
        averageLeavePercentage: `${averageLeavePercentage}%`,
      };
    });
  }, [selectedMonth, currentYear]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(currentYear, i), 'MMMM'),
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Tutor Performance Report</h1>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <TutorLeaveSummaryChart data={chartData} month={monthName} />

        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary Report for {monthName}</CardTitle>
            <CardDescription>An overview of each tutor's student leave management for the selected month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor Name</TableHead>
                    <TableHead className="text-center">Total Students</TableHead>
                    <TableHead className="text-center">Total Leave Approved (Days)</TableHead>
                    <TableHead className="text-right">Average Leave Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportTableData.map((row) => (
                    <TableRow key={row.tutorName}>
                      <TableCell className="font-medium">{row.tutorName}</TableCell>
                      <TableCell className="text-center">{row.totalStudents}</TableCell>
                      <TableCell className="text-center">{row.totalLeaveApproved}</TableCell>
                      <TableCell className="text-right font-semibold">{row.averageLeavePercentage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReportPage;