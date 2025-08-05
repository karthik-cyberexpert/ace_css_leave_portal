import React, { useState, useMemo, useEffect } from 'react';
import { useBatchContext } from '@/context/BatchContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { eachDayOfInterval, format, isWithinInterval, parseISO, startOfDay, endOfDay, subMonths } from 'date-fns';
import { DailyLeaveChart } from '@/components/DailyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { CalendarDays, X, Users, Clock, TrendingUp, Download, Calendar } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const AdminReportPage = () => {
  const { students, leaveRequests, odRequests, getTutors } = useAppContext();
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [errors, setErrors] = useState<string[]>([]);
  
  // Date filtering state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Use current date for table filtering
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Debug logging function
  const addDebugInfo = (key: string, value: any) => {
    setDebugInfo(prev => ({ ...prev, [key]: value }));
    console.log(`[AdminReport Debug] ${key}:`, value);
  };
  
  const addError = (error: string) => {
    setErrors(prev => [...prev, error]);
    console.error(`[AdminReport Error] ${error}`);
  };
  
  // Clear custom dates when changing batch/semester
  const handleBatchChange = (batch: string) => {
    setSelectedBatch(batch);
    // Clear dates when changing batch
    setStartDate('');
    setEndDate('');
  };
  
  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    // Clear dates when changing semester
    setStartDate('');
    setEndDate('');
  };

  const { getSemesterDateRange, getAvailableBatches } = useBatchContext();

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

  const tutors = getTutors();

  // Add effect to log initial data
  useEffect(() => {
    try {
      addDebugInfo('students', students);
      addDebugInfo('leaveRequests', leaveRequests);
      addDebugInfo('odRequests', odRequests);
      addDebugInfo('tutors', tutors);
      addDebugInfo('availableBatches', getAvailableBatches());
    } catch (error) {
      addError(`Error logging initial data: ${error}`);
    }
  }, [students, leaveRequests, tutors]);

  const batches = useMemo(() => {
    try {
      const availableBatches = getAvailableBatches().map(b => parseInt(b.id)).sort((a, b) => b - a);
      const result = ['all', ...availableBatches];
      addDebugInfo('processedBatches', result);
      return result;
    } catch (error) {
      addError(`Error processing batches: ${error}`);
      return ['all'];
    }
  }, [getAvailableBatches]);

  const semesters = useMemo(() => {
    if (selectedBatch === 'all') return ['all'];
    // Show all 8 semesters for any selected batch
    const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
    return ['all', ...availableSemesters];
  }, [selectedBatch]);

  const semesterDateRanges = useMemo(() => {
    try {
      if (selectedBatch === 'all') return {};
      const semestersToUse = semesters.filter(s => s !== 'all') as number[];
      const ranges: { [key: number]: { start: Date; end: Date } | null } = {};
      semestersToUse.forEach(semester => {
        const range = getSemesterDateRange(selectedBatch, semester);
        ranges[semester] = range;
        addDebugInfo(`semesterRange_${selectedBatch}_${semester}`, range);
      });
      addDebugInfo('allSemesterDateRanges', ranges);
      return ranges;
    } catch (error) {
      addError(`Error calculating semester date ranges: ${error}`);
      return {};
    }
  }, [selectedBatch, semesters, getSemesterDateRange]);

  // Download functionality
  const downloadReport = (format: 'xlsx' | 'csv' | 'pdf') => {
    if (dailyChartData.length === 0) {
      alert('No data available for download. Please select a batch and semester.');
      return;
    }

    const reportTitle = startDate && endDate 
      ? `Daily Leave & OD Report for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4} (${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')})`
      : `Daily Leave & OD Report for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}, Semester ${selectedSemester}`;

    switch (format) {
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(dailyChartData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${reportTitle}.xlsx`);
        break;

      case 'csv':
        const csv = Papa.unparse(dailyChartData);
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
        
        const tableData = dailyChartData.map(item => [
          item.date,
          item.studentsOnLeave.toString(),
          item.studentsOnOD.toString()
        ]);
        
        (doc as any).autoTable({
          head: [['Date', 'Students on Leave', 'Students on OD']],
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
      addDebugInfo('chartDataCalculation_start', {
        selectedBatch,
        selectedSemester,
        startDate,
        endDate
      });
      
      // Check if we have valid filters
      if (selectedBatch === 'all') {
        addDebugInfo('chartData_result', 'No batch selected');
        return [];
      }
      
      let interval: { start: Date; end: Date } | null = null;
      
      if (startDate && endDate) {
        // Use custom date range if both dates are provided
        const customStart = new Date(startDate);
        const customEnd = new Date(endDate);
        customEnd.setHours(23, 59, 59, 999); // End of day
        
        if (customStart <= customEnd) {
          interval = { start: customStart, end: customEnd };
          addDebugInfo('interval_custom', interval);
        }
      } else if (selectedSemester !== 'all') {
        // Use semester date range as fallback
        const semester = parseInt(selectedSemester);
        const range = semesterDateRanges[semester];
        
        addDebugInfo(`range_for_semester_${semester}`, range);
        
        if (range?.start && range.start instanceof Date) {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          
          const endDate = (range.end && range.end instanceof Date && today > range.end) ? range.end : today;
          interval = { start: new Date(range.start), end: endDate };
          addDebugInfo('interval_semester', interval);
        } else {
          addDebugInfo('no_valid_range_found', {
            semester,
            range,
            hasStart: range?.start,
            isDate: range?.start instanceof Date
          });
        }
      }
      
      if (!interval || interval.start > interval.end) {
        addDebugInfo('no_valid_interval', { interval });
        return [];
      }

      // Get students in the selected batch
      const studentsInBatch = students.filter(s => s.batch === selectedBatch);
      const batchStudentIds = new Set(studentsInBatch.map(s => s.id));
      
      addDebugInfo('students_in_batch', {
        batch: selectedBatch,
        count: studentsInBatch.length,
        students: studentsInBatch
      });

      const days = eachDayOfInterval(interval);
      addDebugInfo('days_in_interval', { count: days.length, first: days[0], last: days[days.length - 1] });

      const chartData = days.map(day => {
        const studentsOnLeave = new Set<string>();
        const studentsOnOD = new Set<string>();
        
        // Process leave requests
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
        
        // Process OD requests
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
      
      addDebugInfo('final_chart_data', { count: chartData.length, sample: chartData.slice(0, 5) });
      return chartData;
    } catch (error) {
      addError(`Error calculating daily chart data: ${error}`);
      console.error("Error calculating daily chart data:", error);
      return [];
    }
  }, [selectedBatch, selectedSemester, startDate, endDate, semesterDateRanges, leaveRequests, odRequests, students]);

  // Get student status for current date
  const getStudentStatusForDate = useMemo(() => {
    if (selectedBatch === 'all' || selectedSemester === 'all') return [];

    const studentsInBatch = students.filter(s => s.batch === selectedBatch);
    const targetDate = new Date(currentDate);
    targetDate.setHours(0, 0, 0, 0);

    return studentsInBatch.map(student => {
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

      // Get tutor name
      const tutor = tutors.find(t => t.id === student.tutor_id);

      return {
        ...student,
        status,
        requestType,
        requestId,
        tutorName: tutor?.name || 'N/A'
      };
    }).filter(student => student.status !== 'Present'); // Only show absent/OD students
  }, [selectedBatch, selectedSemester, currentDate, students, leaveRequests, odRequests, tutors]);


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Students Leave Report</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedBatch} onValueChange={handleBatchChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map(batch => (
                  <SelectItem key={batch} value={String(batch)}>{batch === 'all' ? 'All Batches' : `${batch}-${parseInt(String(batch)) + 4}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSemester} onValueChange={handleSemesterChange} disabled={selectedBatch === 'all'}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map(semester => (
                  <SelectItem key={semester} value={String(semester)}>{semester === 'all' ? 'All Semesters' : `Semester ${semester}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
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
            <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
              Clear
            </Button>
          )}
        </div>
        
        {/* Download buttons - separate row */}
        {selectedBatch !== 'all' && selectedSemester !== 'all' && (
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
        )}
        
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
        
        {/* Student Status Table */}
        {selectedBatch !== 'all' && selectedSemester !== 'all' && getStudentStatusForDate.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Student Status for {format(new Date(currentDate), 'MMMM d, yyyy')}</CardTitle>
              <CardDescription>
                View current leave and OD status for students in Batch {selectedBatch}-{parseInt(selectedBatch) + 4}
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
                      <TableHead>Tutor Name</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getStudentStatusForDate.map((student) => (
                      <TableRow key={student.id} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.register_number}</TableCell>
                        <TableCell className="text-center">{student.batch}-{parseInt(student.batch) + 4}</TableCell>
                        <TableCell className="text-center">{student.semester}</TableCell>
                        <TableCell>{student.tutorName}</TableCell>
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

    </AdminLayout>
  );
};

export default AdminReportPage;