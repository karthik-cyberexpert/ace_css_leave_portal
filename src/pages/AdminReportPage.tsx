import React, { useState, useMemo } from 'react';
import { useBatchContext } from '@/context/BatchContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { eachDayOfInterval, format, isWithinInterval, parseISO } from 'date-fns';
import { DailyLeaveChart } from '@/components/DailyLeaveChart';
import { useAppContext } from '@/context/AppContext';

const AdminReportPage = () => {
  const { students, leaveRequests, getTutors } = useAppContext();
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const { getSemesterDateRange } = useBatchContext();

  const tutors = getTutors();

  const batches = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // New batches are added based on the previous year.
    // e.g., in 2027, the newest batch available for selection is 2026-2030.
    const latestBatchYear = currentYear - 1;
    
    const batchYears = [];
    // Generate batches from 2024 up to the latest batch year
    for (let year = 2024; year <= latestBatchYear; year++) {
      batchYears.push(year);
    }
    
    // Sort in descending order (newest first)
    batchYears.sort((a, b) => b - a);
    
    return ['all', ...batchYears];
  }, []);

  const semesters = useMemo(() => {
    if (selectedBatch === 'all') return ['all'];
    // Show all 8 semesters for any selected batch
    const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
    return ['all', ...availableSemesters];
  }, [selectedBatch]);

  const semesterDateRanges = useMemo(() => {
    if (selectedBatch === 'all') return {};
    const semestersToUse = semesters.filter(s => s !== 'all') as number[];
    const ranges: { [key: number]: { start: Date; end: Date } | null } = {};
    semestersToUse.forEach(semester => {
      ranges[semester] = getSemesterDateRange(selectedBatch, semester);
    });
    return ranges;
  }, [selectedBatch, semesters, getSemesterDateRange]);

  const dailyChartData = useMemo(() => {
    if (selectedBatch === 'all' || selectedSemester === 'all') return [];

    const semester = parseInt(selectedSemester);
    const range = semesterDateRanges[semester];
    if (!range?.start) return [];

    // Get students in the selected batch
    const studentsInBatch = students.filter(s => s.year === selectedBatch);
    const batchStudentIds = new Set(studentsInBatch.map(s => s.id));

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    // Use the earlier of today or semester end date
    const endDate = range.end && today > range.end ? range.end : today;

    const interval = {
      start: new Date(range.start),
      end: endDate,
    };

    const days = eachDayOfInterval(interval);

    return days.map(day => {
      const studentsOnLeave = new Set<string>();
      
      // Filter leave requests to only approved ones from students in the selected batch
      leaveRequests.forEach(req => {
        if (req.status === 'Approved' && batchStudentIds.has(req.student_id)) {
          const leaveStart = parseISO(req.start_date);
          const leaveEnd = parseISO(req.end_date);
          
          // Check if the day falls within the leave period
          if (isWithinInterval(day, { start: leaveStart, end: leaveEnd })) {
            studentsOnLeave.add(req.student_id);
          }
        }
      });
      
      return { 
        date: format(day, 'MMM d'), 
        studentsOnLeave: studentsOnLeave.size 
      };
    });
  }, [selectedBatch, selectedSemester, semesterDateRanges, leaveRequests, students]);



  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Students Leave Report</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map(batch => (
                  <SelectItem key={batch} value={batch}>{batch === 'all' ? 'All Batches' : `${batch}-${parseInt(batch) + 4}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={selectedBatch === 'all'}>
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
        
        {selectedBatch !== 'all' && selectedSemester !== 'all' ? (
          <DailyLeaveChart 
            data={dailyChartData} 
            title={`Daily Leave Report for Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}, Semester ${selectedSemester}`}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Select a Batch and Semester</CardTitle>
              <CardDescription>Please select a batch and semester to view the daily leave report.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

    </AdminLayout>
  );
};

export default AdminReportPage;