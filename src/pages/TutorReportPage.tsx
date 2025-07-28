import React, { useMemo } from 'react';
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
import { useAppContext } from '@/context/AppContext';

const TutorReportPage = () => {
  const { students, leaveRequests, currentTutor, loading } = useAppContext();

  // If currentTutor is not yet loaded, show a loading indicator or return null
  if (loading || !currentTutor) {
    return (
      <TutorLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading tutor report data...</p>
        </div>
      </TutorLayout>
    );
  }

  const tutorStudentData = useMemo(() => {
    return students.filter(s => s.tutor_id === currentTutor.id);
  }, [students, currentTutor.id]);

  const tutorStudentLeaveRequests = useMemo(() => {
    return leaveRequests.filter(req => req.tutor_id === currentTutor.id);
  }, [leaveRequests, currentTutor.id]);

  const totalStudents = tutorStudentData.length;
  const totalLeaves = tutorStudentData.reduce((acc, student) => acc + student.leave_taken, 0);
  const averageLeaves = totalStudents > 0 ? (totalLeaves / totalStudents).toFixed(1) : 0;

  return (
    <TutorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Student Report for {currentTutor.name}</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">students assigned to you</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leaves Taken</CardTitle>
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeaves}</div>
              <p className="text-xs text-muted-foreground">by your students</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
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

        <MonthlyLeaveChart data={tutorStudentLeaveRequests} />

        <Card className="transition-all duration-300 hover:shadow-lg">
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
                    <TableRow key={student.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.register_number}</TableCell>
                      <TableCell className="text-center">{student.year}</TableCell>
                      <TableCell className="text-right font-semibold">{student.leave_taken}</TableCell>
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