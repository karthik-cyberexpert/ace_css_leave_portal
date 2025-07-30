import React, { useMemo, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CalendarOff, BarChart2 } from 'lucide-react';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';
import { DailyLeaveChart } from '@/components/DailyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

const TutorReportPage = () => {
  const { students, leaveRequests, currentTutor, loading } = useAppContext();
  const { getSemesterDateRange } = useBatchContext();
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

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
    if (!currentTutor) return [];
    return students.filter(s => s.tutor_id === currentTutor.id);
  }, [students, currentTutor]);

  const tutorStudentLeaveRequests = useMemo(() => {
    if (!currentTutor) return [];
    return leaveRequests.filter(req => req.tutor_id === currentTutor.id);
  }, [leaveRequests, currentTutor]);

  const dailyChartData = useMemo(() => {
    try {
      if (selectedSemester === 'all') return [];

      const semester = parseInt(selectedSemester);
      const tutorBatch = tutorStudentData.length > 0 ? tutorStudentData[0].batch : null;
      if (!tutorBatch) return [];

      const range = getSemesterDateRange(tutorBatch, semester);

      if (!range?.start || !(range.start instanceof Date)) return [];

      const today = new Date();
      today.setHours(23, 59, 59, 999); 

      const endDate = (range.end && range.end instanceof Date && today > range.end) ? range.end : today;

      const interval = {
        start: new Date(range.start),
        end: endDate,
      };

      if (interval.start > interval.end) {
          return [];
      }

      const days = eachDayOfInterval(interval);

      return days.map(day => {
        const studentsOnLeave = new Set<string>();
        
        tutorStudentLeaveRequests.forEach(req => {
          if (req.status === 'Approved') {
            const leaveStart = parseISO(req.start_date);
            const leaveEnd = parseISO(req.end_date);
            
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            
            const leaveStartNormalized = new Date(leaveStart);
            leaveStartNormalized.setHours(0, 0, 0, 0);
            
            const leaveEndNormalized = new Date(leaveEnd);
            leaveEndNormalized.setHours(23, 59, 59, 999); 
            
            if (dayStart >= leaveStartNormalized && dayStart <= leaveEndNormalized) {
              studentsOnLeave.add(req.student_id);
            }
          }
        });
        
        return { 
          date: format(day, 'MMM d'), 
          studentsOnLeave: studentsOnLeave.size 
        };
      });
    } catch (error) {
      console.error("Error calculating daily chart data:", error);
      return [];
    }
  }, [selectedSemester, tutorStudentData, tutorStudentLeaveRequests, getSemesterDateRange]);

  const totalStudents = tutorStudentData.length;
  const totalLeaves = tutorStudentData.reduce((acc, student) => acc + student.leave_taken, 0);
  const averageLeaves = totalStudents > 0 ? (totalLeaves / totalStudents).toFixed(1) : 0;

  return (
    <TutorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Student Report for {currentTutor.name}</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                  <SelectItem key={semester} value={String(semester)}>{`Semester ${semester}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* ... cards ... */}
        </div>

        {selectedSemester !== 'all' ? (
          <DailyLeaveChart 
            data={dailyChartData} 
            title={`Daily Leave Report for Semester ${selectedSemester}`}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Select a Semester</CardTitle>
              <CardDescription>Please select a semester to view the daily leave report.</CardDescription>
            </CardHeader>
          </Card>
        )}

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
                    <TableHead className="text-center">Batch</TableHead>
                    <TableHead className="text-center">Semester</TableHead>
                    <TableHead className="text-right">Total Leave Taken</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorStudentData.map((student) => (
                    <TableRow key={student.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.register_number}</TableCell>
                      <TableCell className="text-center">{student.batch}-{parseInt(student.batch) + 4}</TableCell>
                      <TableCell className="text-center">{student.semester}</TableCell>
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