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
import { Badge } from '@/components/ui/badge';
import { Users, CalendarOff, BarChart2, CalendarDays, X, Download, Calendar } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';
import { DailyLeaveChart } from '@/components/DailyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const TutorReportPage = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Use current date for table filtering
  const currentDate = new Date().toISOString().split('T')[0];
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
    
    const startDate = new Date(range.start);
    startDate.setHours(0, 0, 0, 0);

    // Update maxDate to today if it's beyond current date
    const calculatedMaxDate = today < new Date(range.end) ? today : new Date(range.end);
    return {
      minDate: startDate.toISOString().split('T')[0],
      maxDate: calculatedMaxDate.toISOString().split('T')[0],
      prevSemesterEndDate: semester > 1 ? (getSemesterDateRange(selectedBatch, semester - 1)?.end || null) : null,
    };
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

  // Download functionality
  const downloadReport = (format: 'xlsx' | 'csv' | 'pdf') => {
    // For tutor reports, we can download both daily chart data and student data
    let dataToDownload = [];
    let reportTitle = '';

    if (dailyChartData.length > 0) {
      dataToDownload = dailyChartData;
      reportTitle = startDate && endDate 
        ? `Daily Leave & OD Report for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4} (${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')})`
        : `Daily Leave & OD Report for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}, Semester ${selectedSemester}`;
    } else if (tutorStudentData.length > 0) {
      // If no daily chart data, export student data
      dataToDownload = tutorStudentData.map(student => ({
        'Student Name': student.name,
        'Register Number': student.register_number,
        'Batch': `${student.batch}-${parseInt(student.batch) + 4}`,
        'Semester': student.semester,
        'Total Leave Taken': student.leave_taken
      }));
      reportTitle = `Student Report for ${currentTutor?.name || 'Tutor'} - ${selectedBatch !== 'all' ? `Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}` : 'All Batches'}`;
    } else {
      alert('No data available for download.');
      return;
    }

    switch (format) {
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(dataToDownload);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${reportTitle}.xlsx`);
        break;

      case 'csv':
        const csv = Papa.unparse(dataToDownload);
        const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.setAttribute('href', csvUrl);
        csvLink.setAttribute('download', `${reportTitle}.csv`);
        csvLink.click();
        URL.revokeObjectURL(csvUrl);
        break;

      case 'pdf':
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(reportTitle, 20, 20);
        
        let tableData = [];
        let headers = [];
        
        if (dailyChartData.length > 0) {
          headers = ['Date', 'Students on Leave', 'Students on OD'];
          tableData = dailyChartData.map(item => [
            item.date,
            item.studentsOnLeave.toString(),
            item.studentsOnOD.toString()
          ]);
        } else {
          headers = ['Student Name', 'Register Number', 'Batch', 'Semester', 'Total Leave Taken'];
          tableData = tutorStudentData.map(student => [
            student.name,
            student.register_number,
            `${student.batch}-${parseInt(student.batch) + 4}`,
            student.semester.toString(),
            student.leave_taken.toString()
          ]);
        }
        
        (doc as any).autoTable({
          head: [headers],
          body: tableData,
          startY: 30,
        });
        
        doc.save(`${reportTitle}.pdf`);
        break;

      default:
        break;
    }
  };

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

  // Get student status for current date (tutor view)
  const getTutorStudentStatusForDate = useMemo(() => {
    if (!currentTutor || selectedBatch === 'all' || selectedSemester === 'all') return [];

    let studentsToShow = students.filter(s => s.tutor_id === currentTutor.id);
    
    // Filter by batch if selected
    if (selectedBatch !== 'all') {
      studentsToShow = studentsToShow.filter(s => s.batch === selectedBatch);
    }

    const targetDate = new Date(currentDate);
    targetDate.setHours(0, 0, 0, 0);

    return studentsToShow.map(student => {
      let status = 'Present';
      let requestType = '';
      let requestId = '';

      // Check leave requests
      const leaveRequest = leaveRequests.find(req => {
        if (req.student_id !== student.id || req.status !== 'Approved') return false;
        
        const leaveStart = new Date(req.start_date);
        leaveStart.setHours(0, 0, 0, 0);
        const leaveEnd = new Date(req.end_date);
        leaveEnd.setHours(23, 59, 59, 999);
        
        return targetDate >= leaveStart && targetDate <= leaveEnd;
      });

      // Check OD requests
      const odRequest = odRequests.find(req => {
        if (req.student_id !== student.id || req.status !== 'Approved') return false;
        
        const odStart = new Date(req.start_date);
        odStart.setHours(0, 0, 0, 0);
        const odEnd = new Date(req.end_date);
        odEnd.setHours(23, 59, 59, 999);
        
        return targetDate >= odStart && targetDate <= odEnd;
      });

      if (leaveRequest) {
        status = 'On Leave';
        requestType = 'Leave';
        requestId = leaveRequest.id;
      } else if (odRequest) {
        status = 'On OD';
        requestType = 'OD';
        requestId = odRequest.id;
      }

      return {
        ...student,
        status,
        requestType,
        requestId
      };
    }).filter(student => student.status !== 'Present'); // Only show absent/OD students
  }, [currentTutor, selectedBatch, selectedSemester, currentDate, students, leaveRequests, odRequests]);


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
        
        {/* Download buttons - separate row */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadReport('xlsx')}>
            <Download className="h-4 w-4 mr-2" />
            Download XLSX
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadReport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
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
        
        {/* Student Status Table */}
        {selectedBatch !== 'all' && selectedSemester !== 'all' && getTutorStudentStatusForDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Status for {format(new Date(currentDate), 'MMMM d, yyyy')}</CardTitle>
            <CardDescription>
              View current leave and OD status for your students
              {selectedBatch !== 'all' && ` in Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}`}
            </CardDescription>
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
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTutorStudentStatusForDate.map((student) => (
                    <TableRow key={student.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.register_number}</TableCell>
                      <TableCell className="text-center">{student.batch}-{parseInt(student.batch) + 4}</TableCell>
                      <TableCell className="text-center">{student.semester}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={student.status === 'Present' ? 'default' : student.status === 'On Leave' ? 'destructive' : 'secondary'}
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </TutorLayout>
  );
};

export default TutorReportPage;