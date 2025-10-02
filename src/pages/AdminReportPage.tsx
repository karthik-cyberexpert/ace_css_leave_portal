﻿﻿﻿﻿﻿﻿import React, { useState, useMemo, useEffect } from 'react';
import { useBatchContext } from '@/context/BatchContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { formatDateToLocalISO } from '@/utils/dateUtils';
import { DailyLeaveChart } from '@/components/DailyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { Download, Search } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
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
  
  // Register number filter state
  const [registerNumberFilter, setRegisterNumberFilter] = useState<string>('');
  
  // Use current date for table filtering
  const currentDate = formatDateToLocalISO(new Date());
  
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
    setStartDate('');
    setEndDate('');
    setRegisterNumberFilter(''); // Clear register number filter when changing batch
  };
  
  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
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

  // Memoize tutors to prevent recreation on every render
  const tutors = useMemo(() => {
    try {
      return getTutors();
    } catch (error) {
      console.error(`[AdminReport Error] Error getting tutors: ${error}`);
      return [];
    }
  }, [getTutors]);

  // Memoize available batches to prevent constant recalculation
  const availableBatches = useMemo(() => {
    try {
      return getAvailableBatches();
    } catch (error) {
      console.error(`[AdminReport Error] Error getting available batches: ${error}`);
      return [];
    }
  }, [getAvailableBatches]);

  // Add effect to log initial data - only run once on component mount
  useEffect(() => {
    const logInitialData = () => {
      try {
        addDebugInfo('students', students);
        addDebugInfo('leaveRequests', leaveRequests);
        addDebugInfo('odRequests', odRequests);
        addDebugInfo('tutors', tutors);
        addDebugInfo('availableBatches', availableBatches);
      } catch (error) {
        addError(`Error logging initial data: ${error}`);
      }
    };
    
    // Only log if we have all the necessary data
    if (students && leaveRequests && odRequests) {
      logInitialData();
    }
  }, [students, leaveRequests, odRequests, tutors, availableBatches]);

  const batches = useMemo(() => {
    try {
      if (!availableBatches || availableBatches.length === 0) {
        return ['all'];
      }
      const processedBatches = availableBatches.map(b => parseInt(b.id)).sort((a, b) => b - a);
      const result = ['all', ...processedBatches];
      return result;
    } catch (error) {
      console.error(`[AdminReport Error] Error processing batches: ${error}`);
      return ['all'];
    }
  }, [availableBatches]);

  const semesters = useMemo(() => {
    if (selectedBatch === 'all') return ['all'];
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
      });
      return ranges;
    } catch (error) {
      console.error(`[AdminReport Error] Error calculating semester date ranges: ${error}`);
      return {};
    }
  }, [selectedBatch, semesters, getSemesterDateRange]);

  // Enhanced download functionality that works with all data scenarios
  const downloadReport = async (exportFormat: 'xlsx' | 'csv') => {
    let dataToDownload = [];
    let reportTitle = '';
    let reportType = 'summary'; // Default to summary for detailed student reports

    try {
      // Always generate detailed student reports with leave and OD counts
      let studentsInBatch = selectedBatch !== 'all' 
        ? students.filter(s => s.batch === selectedBatch)
        : students;

      // Apply register number filter if provided
      if (registerNumberFilter.trim()) {
        studentsInBatch = studentsInBatch.filter(student => 
          student.register_number.toLowerCase().includes(registerNumberFilter.toLowerCase().trim())
        );
      }

      // Calculate detailed data for each student including leave and OD counts
      dataToDownload = await Promise.all(studentsInBatch.map(async (student) => {
        const tutor = getTutors().find(t => t.id === student.tutor_id);
        
        // Calculate total leave count for this student
        const studentLeaveRequests = leaveRequests.filter(
          req => req.student_id === student.id && req.status === 'Approved'
        );
        const totalLeaveCount = studentLeaveRequests.reduce((total, req) => {
          const days = parseFloat(req.total_days) || 0;
          return total + days;
        }, 0);

        // Calculate total OD count for this student
        const studentODRequests = odRequests.filter(
          req => req.student_id === student.id && req.status === 'Approved'
        );
        const totalODCount = studentODRequests.reduce((total, req) => {
          const days = parseFloat(req.total_days) || 0;
          return total + days;
        }, 0);

        return {
          'Name': student.name,
          'Register Number': student.register_number,
          'Batch': `${student.batch}-${parseInt(student.batch) + 4}`,
          'Semester': student.semester,
          'Total Leave Count': totalLeaveCount.toFixed(1),
          'Total OD Count': totalODCount.toFixed(1),
          'Tutor': tutor?.name || 'N/A',
          'Email': student.email || 'N/A',
          'Phone': student.mobile || 'N/A'
        };
      }));

      // Set appropriate report title
      let titleSuffix = '';
      if (selectedBatch !== 'all') {
        titleSuffix = `for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}`;
      } else {
        titleSuffix = 'for All Batches';
      }
      
      if (registerNumberFilter.trim()) {
        titleSuffix += ` (Filtered by Register Number: ${registerNumberFilter.trim()})`;
      }
      
      reportTitle = `Detailed Student Report ${titleSuffix}`;
    } catch (error) {
      console.error('Error generating detailed report:', error);
      // Fallback to basic student data if calculation fails
      let studentsInBatch = selectedBatch !== 'all' 
        ? students.filter(s => s.batch === selectedBatch)
        : students;
      
      // Apply register number filter if provided
      if (registerNumberFilter.trim()) {
        studentsInBatch = studentsInBatch.filter(student => 
          student.register_number.toLowerCase().includes(registerNumberFilter.toLowerCase().trim())
        );
      }
      
      dataToDownload = studentsInBatch.map(student => {
        const tutor = getTutors().find(t => t.id === student.tutor_id);
        return {
          'Name': student.name,
          'Register Number': student.register_number,
          'Batch': `${student.batch}-${parseInt(student.batch) + 4}`,
          'Semester': student.semester,
          'Total Leave Count': '0.0',
          'Total OD Count': '0.0',
          'Tutor': tutor?.name || 'N/A',
          'Email': student.email || 'N/A',
          'Phone': student.mobile || 'N/A'
        };
      });
      
      let titleSuffix = '';
      if (selectedBatch !== 'all') {
        titleSuffix = `for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}`;
      } else {
        titleSuffix = 'for All Batches';
      }
      
      if (registerNumberFilter.trim()) {
        titleSuffix += ` (Filtered by Register Number: ${registerNumberFilter.trim()})`;
      }
      
      reportTitle = `Detailed Student Report ${titleSuffix}`;
    }

    // Handle empty data case
    if (dataToDownload.length === 0) {
      dataToDownload = [{
        'Name': 'No Data Available',
        'Register Number': 'N/A',
        'Batch': 'N/A',
        'Semester': 'N/A',
        'Total Leave Count': '0.0',
        'Total OD Count': '0.0',
        'Tutor': 'N/A',
        'Email': 'N/A',
        'Phone': 'N/A'
      }];
    }

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const finalTitle = `${reportTitle}_${timestamp}`;

    switch (exportFormat) {
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(dataToDownload);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Report');
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
    try {
      if (selectedBatch === 'all') {
        return [];
      }
      
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

      const studentsInBatch = students.filter(s => s.batch === selectedBatch);
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
    } catch (error) {
      console.error("[AdminReport Error] Error calculating daily chart data:", error);
      return [];
    }
  }, [selectedBatch, selectedSemester, startDate, endDate, semesterDateRanges, leaveRequests, odRequests, students, registerNumberFilter]);

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
          <div className="flex justify-end gap-3">
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
              <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Download buttons - always available */}
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
      </div>
    </AdminLayout>
  );
};

export default AdminReportPage;
