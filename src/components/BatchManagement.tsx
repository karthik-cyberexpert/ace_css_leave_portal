import React, { useState, useMemo } from 'react';
import { useBatchContext, SemesterDates } from '@/context/BatchContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/datepicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppContext } from '@/context/AppContext';
import { addDays, isAfter, isSameDay } from 'date-fns';
import { showSuccess, showError } from '@/utils/toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Semester {
  id: string;
  batch: string;
  semester: number;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export const BatchManagement = () => {
  const { students } = useAppContext();
  const { semesterDates, setSemesterDates, saveSemesterDates, batches, createBatch, updateBatch, deleteBatch } = useBatchContext();
  const [selectedSemesters, setSelectedSemesters] = useState<Record<string, number>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newBatchYear, setNewBatchYear] = useState<string>('');
  const [editingBatch, setEditingBatch] = useState<{ id: string; name: string } | null>(null);

  const batchData = useMemo(() => {
    return batches.filter(b => b.isActive).map(batch => ({
      batch: batch.id,
      semesters: [1, 2, 3, 4, 5, 6, 7, 8] as number[]
    }));
  }, [batches]);

  const handleSemesterChange = (batch: string, semester: number) => {
    setSelectedSemesters(prev => ({ ...prev, [batch]: semester }));
  };

  const handleDateChange = (batch: string, semester: number, date: Date | undefined, type: 'start' | 'end') => {
    setSemesterDates(prev => {
      const existing = prev.find(s => s.batch === batch && s.semester === semester);
      if (existing) {
        return prev.map(s => s.batch === batch && s.semester === semester ? { ...s, [type === 'start' ? 'startDate' : 'endDate']: date } : s);
      } else {
        return [...prev, { id: `${batch}-${semester}`, batch, semester, startDate: type === 'start' ? date : undefined, endDate: type === 'end' ? date : undefined }];
      }
    });
  };

  // Function to determine the current active semester for a batch based on dates
  const getCurrentActiveSemester = (batch: string, semesterNumbers: number[]): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    // Find the highest semester that has ended (current date is after end date)
    let activeSemester = 1; // Default to semester 1
    
    for (const semester of semesterNumbers.sort((a, b) => a - b)) {
      const semesterData = semesterDates.find(s => s.batch === batch && s.semester === semester);
      
      if (semesterData?.startDate && semesterData?.endDate) {
        const endDate = new Date(semesterData.endDate);
        endDate.setHours(0, 0, 0, 0);
        const dayAfterEnd = addDays(endDate, 1);
        
        // If today is the day after the semester ended or later, and there's a next semester
        if ((isSameDay(today, dayAfterEnd) || isAfter(today, dayAfterEnd)) && semester < 8) {
          activeSemester = semester + 1;
        }
      }
    }
    
    // Ensure we don't exceed semester 8
    return Math.min(activeSemester, 8);
  };

  const isSemesterLocked = (batch: string, semester: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Semester 1 is never locked
    if (semester === 1) return false;
    
    // For semester 2 and beyond, check if the previous semester has ended
    const prevSemester = semesterDates.find(s => s.batch === batch && s.semester === semester - 1);
    
    // If previous semester doesn't exist or has no end date, lock the current semester
    if (!prevSemester || !prevSemester.endDate) return true;
    
    const prevEndDate = new Date(prevSemester.endDate);
    prevEndDate.setHours(0, 0, 0, 0);
    const dayAfterPrevEnd = addDays(prevEndDate, 1);
    
    // Unlock if today is the day after the previous semester ended or later
    return isAfter(dayAfterPrevEnd, today);
  };

  const handleSave = async () => {
    try {
      await saveSemesterDates();
      showSuccess('Semester dates saved successfully!');
    } catch (error) {
      console.error('Error saving semester dates:', error);
      showError('Failed to save semester dates. Please try again.');
    }
  };

  return (
    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
      <CardHeader>
        <CardTitle>Batch Management</CardTitle>
        <CardDescription>Manage the start and end dates for each semester of each batch.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map(({ batch, semesters: semesterNumbers }) => {
                // Determine the current active semester based on dates, fallback to semester 3 or 1
                const currentActiveSemester = getCurrentActiveSemester(batch, semesterNumbers);
                const fallbackSemester = semesterNumbers.includes(3) ? 3 : semesterNumbers[0];
                const defaultSemester = currentActiveSemester || fallbackSemester;
                const selectedSemester = selectedSemesters[batch] || defaultSemester;
                const isLocked = isSemesterLocked(batch, selectedSemester);

                return (
                  <TableRow key={batch}>
                    <TableCell>{`${batch}-${parseInt(batch) + 4}`}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => handleSemesterChange(batch, parseInt(value))} defaultValue={String(selectedSemester)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {semesterNumbers.map(sem => (
                            <SelectItem key={sem} value={String(sem)}>{`Semester ${sem}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                        <DatePicker
                          date={semesterDates.find(s => s.batch === batch && s.semester === selectedSemester)?.startDate}
                          setDate={(date) => handleDateChange(batch, selectedSemester, date, 'start')}
                          fullDisabled={isLocked}
                        />
                    </TableCell>
                    <TableCell>
                        <DatePicker
                          date={semesterDates.find(s => s.batch === batch && s.semester === selectedSemester)?.endDate}
                          setDate={(date) => handleDateChange(batch, selectedSemester, date, 'end')}
                          fullDisabled={isLocked}
                        />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
};

