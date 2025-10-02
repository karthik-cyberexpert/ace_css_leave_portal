﻿﻿﻿﻿﻿﻿import React, { useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CalendarOff, BarChart2, Download, Search } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import MonthlyLeaveChart from '@/components/MonthlyLeaveChart';
import { DailyLeaveChart } from '@/components/DailyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { formatDateToLocalISO } from '@/utils/dateUtils';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const TutorReportPage = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Register number filter state
  const [registerNumberFilter, setRegisterNumberFilter] = useState<string>('');
  
  // Use current date for table filtering
  const currentDate = formatDateToLocalISO(new Date());
  const { students, leaveRequests, odRequests, currentTutor, loading } = useAppContext();
  const { getSemesterDateRange } = useBatchContext();
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
    setStartDate('');
    setEndDate('');
    setSelectedSemester('all');
    setRegisterNumberFilter(''); // Clear register number filter when changing batch
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    setStartDate('');
    setEndDate('');
  };
  
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
    const startDate = new Date(range.start);
    startDate.setHours(0, 0, 0, 0);

    const calculatedMaxDate = today < new Date(range.end) ? today : new Date(range.end);
    return {
      minDate: formatDateToLocalISO(startDate),
      maxDate: formatDateToLocalISO(calculatedMaxDate),
      prevSemesterEndDate: semester > 1 ? (getSemesterDateRange(selectedBatch, semester - 1)?.end || null) : null,
    };
  };

  const { minDate, maxDate, prevSemesterEndDate } = getDateConstraints();

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

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
    
    if (selectedBatch !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.batch === selectedBatch);
    }
    
    // Apply register number filter if provided
    if (registerNumberFilter.trim()) {
      filteredStudents = filteredStudents.filter(student => 
        student.register_number.toLowerCase().includes(registerNumberFilter.toLowerCase().trim())
      );
    }
    
    return filteredStudents;
  }, [students, currentTutor, selectedBatch, registerNumberFilter]);

  const tutorStudentLeaveRequests = useMemo(() => {
    if (!currentTutor) return [];
    return leaveRequests.filter(req => req.tutor_id === currentTutor.id);
  }, [leaveRequests, currentTutor]);

  const tutorStudentODRequests = useMemo(() => {
    if (!currentTutor) return [];
    return odRequests.filter(req => req.tutor_id === currentTutor.id);
  }, [odRequests, currentTutor]);

  const availableBatches = useMemo(() => {
    if (!currentTutor) return [];
    const allTutorStudents = students.filter(s => s.tutor_id === currentTutor.id);
    const batches = [...new Set(allTutorStudents.map(s => s.batch))].sort();
    return ['all', ...batches];
  }, [students, currentTutor]);

  const availableSemesters = useMemo(() => {
    if (selectedBatch === 'all') return ['all'];
    return ['all', ...Array.from({length: 8}, (_, i) => i + 1)];
  }, [selectedBatch]);

  const semesterDateRanges = useMemo(() => {
    try {
      if (selectedBatch === 'all') return {};
      const semestersToUse = availableSemesters.filter(s => s !== 'all') as number[];
      const ranges: { [key: number]: { start: Date; end: Date } | null } = {};
      semestersToUse.forEach(semester => {
        const range = getSemesterDateRange(selectedBatch, semester);
        ranges[semester] = range;
      });
      return ranges;
    } catch (error) {
      console.error(`[Tutor] Error calculating semester date ranges: ${error}`);
      return {};
    }
  }, [selectedBatch, availableSemesters, getSemesterDateRange]);

  // Download function with PDF removed
  const downloadReport = (exportFormat: 'xlsx' | 'csv') => {
    let dataToDownload = [];
    let reportTitle = '';

    if (selectedBatch !== 'all' && (selectedSemester !== 'all' || (startDate && endDate))) {
      if (dailyChartData.length > 0) {
        dataToDownload = dailyChartData;
        let titleSuffix = startDate && endDate 
          ? `Daily Leave & OD Report for ${currentTutor?.name || 'Tutor'} - Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}`
          : `Daily Leave & OD Report for ${currentTutor?.name || 'Tutor'} - Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}, Semester ${selectedSemester}`;
        
        if (registerNumberFilter.trim()) {
          titleSuffix += ` (Filtered by Register Number: ${registerNumberFilter.trim()})`;
        }
        
        reportTitle = titleSuffix;
      }
    } else {
      if (tutorStudentData.length > 0) {
        dataToDownload = tutorStudentData.map(student => ({
          'Student Name': student.name,
          'Register Number': student.register_number,
          'Batch': `${student.batch}-${parseInt(student.batch) + 4}`,
          'Semester': student.semester,
          'Total Leave Taken': student.leave_taken || 0,
          'Mobile': student.mobile || 'N/A',
          'Email': student.email || 'N/A'
        }));
      }
      
      let titleSuffix = `Student Report for ${currentTutor?.name || 'Tutor'}`;
      if (registerNumberFilter.trim()) {
        titleSuffix += ` (Filtered by Register Number: ${registerNumberFilter.trim()})`;
      }
      
      reportTitle = titleSuffix;
    }

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const finalTitle = `${reportTitle}_${timestamp}`;

    switch (exportFormat) {
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(dataToDownload);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${finalTitle}.xlsx`);
        break;

      case 'csv':
        const csv = Papa.unparse(dataToDownload);
        const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.setAttribute('href', csvUrl);
        csvLink.setAttribute('download', `${finalTitle}.csv`);
        csvLink.style.display = 'none';
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);
        break;

      default:
        break;
    }
  };

  const dailyChartData = useMemo(() => {
    if (selectedBatch === 'all') return [];
    
    let interval: { start: Date; end: Date } | null = null;
    
    if (startDate && endDate) {
      const customStart = new Date(startDate);
      const customEnd = new Date(endDate);
      customEnd.setHours(23, 59, 59, 999);
      
      if (customStart <= customEnd) {
        interval = { start: customStart, end: customEnd };
      }
    } else if (selectedSemester !== 'all') {
      const semester = parseInt(selectedSemester);
      const range = semesterDateRanges[semester];
      
      if (range?.start && range.start instanceof Date) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        const endDate = (range.end && range.end instanceof Date && today > range.end) ? range.end : today;
        interval = { start: new Date(range.start), end: endDate };
      }
    }
    
    if (!interval || interval.start > interval.end) {
      return [];
    }

    const studentsInBatch = tutorStudentData.filter(s => s.batch === selectedBatch);
    let filteredStudents = studentsInBatch;
    
    // Apply register number filter if provided
    if (registerNumberFilter.trim()) {
      filteredStudents = studentsInBatch.filter(student => 
        student.register_number.toLowerCase().includes(registerNumberFilter.toLowerCase().trim())
      );
    }
    
    const batchStudentIds = new Set(filteredStudents.map(s => s.id));
    
    const days = eachDayOfInterval(interval);

    const chartData = days.map(day => {
      const studentsOnLeave = new Set<string>();
      const studentsOnOD = new Set<string>();
      
      leaveRequests.forEach(req => {
        if (req.status === 'Approved' && batchStudentIds.has(req.student_id)) {
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
      
      odRequests.forEach(req => {
        if (req.status === 'Approved' && batchStudentIds.has(req.student_id)) {
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
    
    return chartData;
  }, [selectedBatch, selectedSemester, startDate, endDate, semesterDateRanges, leaveRequests, odRequests, tutorStudentData, registerNumberFilter]);

  const totalStudents = tutorStudentData.length;
  const totalLeaves = tutorStudentData.reduce((acc, student) => {
    const leaveTaken = parseFloat(String(student.leave_taken || 0));
    return acc + (isNaN(leaveTaken) ? 0 : leaveTaken);
  }, 0);
  const averageLeaves = totalStudents > 0 ? (totalLeaves / totalStudents).toFixed(1) : '0.0';

  const getTutorStudentStatusForDate = useMemo(() => {
    if (!currentTutor || selectedBatch === 'all' || selectedSemester === 'all') return [];

    let studentsToShow = students.filter(s => s.tutor_id === currentTutor.id);
    
    if (selectedBatch !== 'all') {
      studentsToShow = studentsToShow.filter(s => s.batch === selectedBatch);
    }
    
    // Apply register number filter if provided
    if (registerNumberFilter.trim()) {
      studentsToShow = studentsToShow.filter(student => 
        student.register_number.toLowerCase().includes(registerNumberFilter.toLowerCase().trim())
      );
    }

    const targetDate = new Date(currentDate);
    targetDate.setHours(0, 0, 0, 0);

    return studentsToShow.map(student => {
      let status = 'Present';
      let requestType = '';
      let requestId = '';

      const leaveRequest = leaveRequests.find(req => {
        if (req.student_id !== student.id || req.status !== 'Approved') return false;
        
        const leaveStart = new Date(req.start_date);
        leaveStart.setHours(0, 0, 0, 0);
        const leaveEnd = new Date(req.end_date);
        leaveEnd.setHours(23, 59, 59, 999);
        
        return targetDate >= leaveStart && targetDate <= leaveEnd;
      });

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
    }).filter(student => student.status !== 'Present');
  }, [currentTutor, selectedBatch, selectedSemester, currentDate, students, leaveRequests, odRequests, registerNumberFilter]);

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
        
        {/* Filter Controls */}
        <div className="flex flex-col gap-4">
          {/* Register Number Search */}
          <div className="flex justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by register number..."
                value={registerNumberFilter}
                onChange={(e) => setRegisterNumberFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Date Range Filters */}
          <div className="flex gap-3">
          <DateRangePicker 
            date={startDate ? new Date(startDate) : undefined} 
            setDate={(date) => setStartDate(date ? formatDateToLocalISO(date) : '')}
            placeholder="From Date"
            disabled={selectedBatch === 'all' || selectedSemester === 'all'}
            minDate={minDate ? new Date(minDate) : undefined}
            maxDate={endDate ? new Date(endDate) : (maxDate ? new Date(maxDate) : undefined)}
            prevSemesterEndDate={prevSemesterEndDate}
            className="w-40"
          />
          <DateRangePicker 
            date={endDate ? new Date(endDate) : undefined} 
            setDate={(date) => setEndDate(date ? formatDateToLocalISO(date) : '')}
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
      </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadReport('xlsx')}>
            <Download className="h-4 w-4 mr-2" />
            Download XLSX
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadReport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
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
              ? `Daily Leave & OD Report for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}`
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
