import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, getMonth, getYear } from 'date-fns';
import TutorLeaveSummaryChart from '@/components/TutorLeaveSummaryChart';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { showSuccess } from '@/utils/toast';

const AdminReportPage = () => {
  const { students, leaveRequests, getTutors, clearAllRequests } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const tutors = getTutors();
  const selectedYearInt = parseInt(selectedYear);
  const monthName = format(new Date(selectedYearInt, parseInt(selectedMonth)), 'MMMM');

  const chartData = useMemo(() => {
    const monthlyRequests = leaveRequests.filter(req => {
      const reqDate = new Date(req.start_date);
      return getMonth(reqDate) === parseInt(selectedMonth) && getYear(reqDate) === selectedYearInt && req.status === 'Approved';
    });

    const leavesByTutor = new Map<string, number>();
    monthlyRequests.forEach(req => {
      leavesByTutor.set(req.tutor_name, (leavesByTutor.get(req.tutor_name) || 0) + req.total_days);
    });

    return tutors.map(tutor => ({
      name: tutor.name,
      totalLeaves: leavesByTutor.get(tutor.name) || 0,
    }));
  }, [selectedMonth, selectedYearInt, leaveRequests, tutors]);

  const reportTableData = useMemo(() => {
    return tutors.map(tutor => {
      const tutorStudents = students.filter(s => s.tutor_id === tutor.id);
      const monthlyApprovedRequests = leaveRequests
        .filter(req => 
            req.tutor_id === tutor.id && 
            req.status === 'Approved' && 
            getYear(new Date(req.start_date)) === selectedYearInt &&
            getMonth(new Date(req.start_date)) === parseInt(selectedMonth)
        );
      
      const totalLeaveDays = monthlyApprovedRequests.reduce((acc, req) => acc + req.total_days, 0);
      
      const studentsWhoTookLeave = new Set(monthlyApprovedRequests.map(req => req.student_name));
      const numberOfStudentsWithLeave = studentsWhoTookLeave.size;

      const averageLeavePercentage = tutorStudents.length > 0
        ? ((numberOfStudentsWithLeave / tutorStudents.length) * 100).toFixed(1)
        : '0.0';

      return {
        tutorName: tutor.name,
        totalStudents: tutorStudents.length,
        totalLeaveApproved: totalLeaveDays,
        averageLeavePercentage: `${averageLeavePercentage}%`,
      };
    });
  }, [selectedMonth, selectedYearInt, students, leaveRequests, tutors]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(currentYear, i), 'MMMM'),
  }));

  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const handleClearAllRequests = async () => {
    await clearAllRequests();
    showSuccess('All leave and OD requests have been cleared!');
    setIsConfirmDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Tutor Performance Report</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="destructive" onClick={() => setIsConfirmDialogOpen(true)} className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Clear All Requests
            </Button>
          </div>
        </div>
        
        <TutorLeaveSummaryChart data={chartData} month={`${monthName} ${selectedYear}`} />

        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Monthly Summary Report for {monthName} {selectedYear}</CardTitle>
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
                    <TableRow key={row.tutorName} className="transition-colors hover:bg-muted/50">
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

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete ALL leave and OD request records from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllRequests} className="bg-destructive hover:bg-destructive/90">
              Delete All Records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminReportPage;