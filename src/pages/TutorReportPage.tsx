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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, CalendarOff, BarChart2, CalendarDays, X } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';
import { DailyLeaveChart } from '@/components/DailyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

const TutorReportPage = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const { students, leaveRequests, odRequests, currentTutor, loading } = useAppContext();
  const { getSemesterDateRange } = useBatchContext();
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
    // Clear dates and semester when changing batch
    setStartDate('');
    setEndDate('');
    setSelectedSemester('all');
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    // Clear dates when changing semester
    setStartDate('');
    setEndDate('');
  };
  // Get date constraints based on selected batch and semester
  const getDateConstraints = () => {
    if (selectedBatch === 'all' || selectedSemester === 'all') {
      return { minDate: '', maxDate: '', prevSemesterEndDate: null };
    }
    
    const semester = parseInt(selectedSemester);
    const range = getSemesterDateRange(selectedBatch, semester);
    
    if (!range?.start) {
      return { minDate: '', maxDate: '', prevSemesterEndDate: null };
    }
    
    const today = new Date();
    let minDate: string;
    let maxDate: string;
    let prevSemesterEndDate: Date | null = null;
    
    if (semester === 3) {
      // For semester 3, allow selection from July 1 to January 31 (next year)
      const batchYear = parseInt(selectedBatch);
      const july1 = new Date(batchYear, 6, 1); // July 1st of batch year
      const jan31NextYear = new Date(batchYear + 1, 0, 31); // January 31st next year
      
      // Get previous semester (semester 2) end date
      const prevRange = getSemesterDateRange(selectedBatch, 2);
      if (prevRange?.end) {
        prevSemesterEndDate = prevRange.end;
      }
      
      minDate = july1.toISOString().split('T')[0];
      // Use the earlier of today or January 31st next year as max
      maxDate = (today < jan31NextYear ? today : jan31NextYear).toISOString().split('T')[0];
    } else {
      // For other semesters, use the semester start date
      const startDate = new Date(range.start);
      startDate.setHours(0, 0, 0, 0);
      minDate = startDate.toISOString().split('T')[0];
      maxDate = today.toISOString().split('T')[0]; // Current date as max
    }
    
    return { minDate, maxDate, prevSemesterEndDate };
  };

  const { minDate, maxDate, prevSemesterEndDate } = getDateConstraints();

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

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
    let filteredStudents = students.filter(s => s.tutor_id === currentTutor.id);
    
    // Filter by batch if selected
    if (selectedBatch !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.batch === selectedBatch);
    }
    
    return filteredStudents;
  }, [students, currentTutor, selectedBatch]);

  const tutorStudentLeaveRequests = useMemo(() => {
    if (!currentTutor) return [];
    return leaveRequests.filter(req => req.tutor_id === currentTutor.id);
  }, [leaveRequests, currentTutor]);

  const tutorStudentODRequests = useMemo(() => {
    if (!currentTutor) return [];
    return odRequests.filter(req => req.tutor_id === currentTutor.id);
  }, [odRequests, currentTutor]);

  // Get available batches for this tutor's students
  const availableBatches = useMemo(() => {
    if (!currentTutor) return [];
    const allTutorStudents = students.filter(s => s.tutor_id === currentTutor.id);
    const batches = [...new Set(allTutorStudents.map(s => s.batch))].sort();
    return ['all', ...batches];
  }, [students, currentTutor]);

  // Get available semesters for the selected batch
  const availableSemesters = useMemo(() => {
    if (selectedBatch === 'all') return ['all'];
    // Show all 8 semesters for any selected batch
    return ['all', ...Array.from({length: 8}, (_, i) => i + 1)];
  }, [selectedBatch]);

  const dailyChartData = useMemo(() => {
    try {
      if (selectedSemester === 'all') return [];
      
      let interval = null;
      
      if (startDate && endDate) {
        // Use custom date range if both dates are provided
        interval = {
          start: new Date(startDate),
          end: new Date(endDate)
        };
      } else {
        // Use semester date range as fallback
        const semester = parseInt(selectedSemester);
        const tutorBatch = selectedBatch !== 'all' ? selectedBatch : (tutorStudentData.length > 0 ? tutorStudentData[0].batch : null);
        if (!tutorBatch) return [];

        const range = getSemesterDateRange(tutorBatch, semester);
        if (!range?.start || !(range.start instanceof Date)) return [];

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const endDate = (range.end && range.end instanceof Date && today > range.end) ? range.end : today;

        interval = {
          start: new Date(range.start),
          end: endDate,
        };
      }

      if (!interval || interval.start > interval.end) {
        return [];
      }

      const days = eachDayOfInterval(interval);

      return days.map(day => {
        const studentsOnLeave = new Set<string>();
        const studentsOnOD = new Set<string>();
        
        // Process leave requests
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
        
        // Process OD requests
        tutorStudentODRequests.forEach(req => {
          if (req.status === 'Approved') {
            const odStart = parseISO(req.start_date);
            const odEnd = parseISO(req.end_date);
            
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            
            const odStartNormalized = new Date(odStart);
            odStartNormalized.setHours(0, 0, 0, 0);
            
            const odEndNormalized = new Date(odEnd);
            odEndNormalized.setHours(23, 59, 59, 999); 
            
            if (dayStart >= odStartNormalized && dayStart <= odEndNormalized) {
              studentsOnOD.add(req.student_id);
            }
          }
        });
        
        return { 
          date: format(day, 'MMM d'), 
          studentsOnLeave: studentsOnLeave.size,
          studentsOnOD: studentsOnOD.size
        };
      });
    } catch (error) {
      console.error("Error calculating daily chart data:", error);
      return [];
    }
  }, [startDate, endDate, selectedBatch, selectedSemester, tutorStudentData, tutorStudentLeaveRequests, tutorStudentODRequests, getSemesterDateRange]);

  const totalStudents = tutorStudentData.length;
  const totalLeaves = tutorStudentData.reduce((acc, student) => acc + student.leave_taken, 0);
  const averageLeaves = totalStudents > 0 ? (totalLeaves / totalStudents).toFixed(1) : 0;

  return (
    <TutorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Student Report for {currentTutor.name}</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedBatch} onValueChange={handleBatchChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                {availableBatches.map(batch => (
                  <SelectItem key={batch} value={String(batch)}>
                    {batch === 'all' ? 'All Batches' : `${batch}-${parseInt(String(batch)) + 4}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSemester} onValueChange={handleSemesterChange} disabled={selectedBatch === 'all'}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {availableSemesters.map(semester => (
                  <SelectItem key={semester} value={String(semester)}>
                    {semester === 'all' ? 'All Semesters' : `Semester ${semester}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-3">
          <DateRangePicker 
            date={startDate ? new Date(startDate) : undefined} 
            setDate={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
            placeholder="From Date"
            disabled={selectedBatch === 'all' || selectedSemester === 'all'}
            minDate={minDate ? new Date(minDate) : undefined}
            maxDate={endDate ? new Date(endDate) : (maxDate ? new Date(maxDate) : undefined)}
            prevSemesterEndDate={prevSemesterEndDate}
            className="w-40"
          />
          <DateRangePicker 
            date={endDate ? new Date(endDate) : undefined} 
            setDate={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
            placeholder="To Date"
            disabled={selectedBatch === 'all' || selectedSemester === 'all'}
            minDate={startDate ? new Date(startDate) : (minDate ? new Date(minDate) : undefined)}
            maxDate={maxDate ? new Date(maxDate) : undefined}
            className="w-40"
          />
          {(startDate || endDate) && (
            <Button variant="outline" size="sm" onClick={clearDates}>
              Clear
            </Button>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leaves Taken</CardTitle>
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeaves}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Leaves per Student</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageLeaves}</div>
            </CardContent>
          </Card>
        </div>

        {selectedBatch !== 'all' && selectedSemester !== 'all' ? (
          <DailyLeaveChart 
            data={dailyChartData} 
            title={startDate && endDate 
              ? `Daily Leave & OD Report for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4} (${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')})`
              : `Daily Leave & OD Report for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}, Semester ${selectedSemester}`
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedBatch === 'all' ? 'Select a Batch and Semester' : 'Select a Semester'}
              </CardTitle>
              <CardDescription>
                {selectedBatch === 'all' 
                  ? 'Please select a batch and semester to view the daily leave report.'
                  : 'Please select a semester to view the daily leave report. You can also use custom date ranges above.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <MonthlyLeaveChart leaveData={tutorStudentLeaveRequests} odData={tutorStudentODRequests} />

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