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
import { CalendarDays, X, Users, Clock, TrendingUp } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const AdminReportPage = () => {
  const { students, leaveRequests, odRequests, getTutors } = useAppContext();
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [errors, setErrors] = useState<string[]>([]);
  
  // Date filtering state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
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