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

  // Function to determine current semester based on batch start year and current date
  const getCurrentSemesterForBatch = (batchStartYear: number): number => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1 for 1-12
    
    const yearDiff = currentYear - batchStartYear;
    
    // Determine if we're in the first half (Jan-May) or second half (Jun-Dec) of academic year
    const isFirstHalf = currentMonth >= 1 && currentMonth <= 5;
    const isSecondHalf = currentMonth >= 6 && currentMonth <= 12;
    
    let semester = 1;
    
    if (yearDiff === 0) {
      // Same year as batch start
      if (isSecondHalf) {
        semester = 1; // June-December of starting year = Semester 1
      } else {
        // January-May of starting year - batch hasn't started yet
        return 0; // Invalid semester
      }
    } else if (yearDiff === 1) {
      if (isFirstHalf) {
        semester = 2; // January-May of year 2 = Semester 2
      } else {
        semester = 3; // June-December of year 2 = Semester 3
      }
    } else if (yearDiff === 2) {
      if (isFirstHalf) {
        semester = 4; // January-May of year 3 = Semester 4
      } else {
        semester = 5; // June-December of year 3 = Semester 5
      }
    } else if (yearDiff === 3) {
      if (isFirstHalf) {
        semester = 6; // January-May of year 4 = Semester 6
      } else {
        semester = 7; // June-December of year 4 = Semester 7
      }
    } else if (yearDiff === 4) {
      if (isFirstHalf) {
        semester = 8; // January-May of year 5 = Semester 8
      } else {
        // June-December of year 5 - batch has completed
        return 0; // Invalid semester
      }
    } else {
      // Beyond 4 years or before batch start
      return 0; // Invalid semester
    }
    
    return semester;
  };

  // Get batches that are eligible for semester date management (current semester only)
  const batchData = useMemo(() => {
    return batches.filter(b => {
      if (!b.isActive) return false;
      
      const currentSemester = getCurrentSemesterForBatch(b.startYear);
      // Only show batches that have a valid current semester (1-8)
      return currentSemester >= 1 && currentSemester <= 8;
    }).map(batch => {
      const currentSemester = getCurrentSemesterForBatch(batch.startYear);
      return {
        batch: batch.id,
        semesters: [currentSemester], // Only allow managing the current semester
        currentSemester
      };
    });
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

  // Function to get valid date range for a batch and semester
  const getValidDateRange = (batchId: string, semester: number) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return { minDate: new Date(), maxDate: new Date() };

    const currentYear = new Date().getFullYear();
    const batchStartYear = batch.startYear;
    
    // Calculate which academic year this semester falls in
    const semesterYear = batchStartYear + Math.floor((semester - 1) / 2);
    
    // For current year restrictions, only allow dates within reasonable academic year ranges
    let minDate: Date;
    let maxDate: Date;
    
    if (semester % 2 === 1) {
      // Odd semesters (1, 3, 5, 7) typically run from June to December
      minDate = new Date(semesterYear, 5, 1); // June 1st
      maxDate = new Date(semesterYear, 11, 31); // December 31st
    } else {
      // Even semesters (2, 4, 6, 8) typically run from January to May of the next year
      minDate = new Date(semesterYear + 1, 0, 1); // January 1st
      maxDate = new Date(semesterYear + 1, 4, 31); // May 31st
    }
    
    // For current year batches, don't allow future dates beyond current year + 4
    const currentMaxDate = new Date(currentYear + 4, 11, 31);
    if (maxDate > currentMaxDate) {
      maxDate = currentMaxDate;
    }
    
    // Don't allow dates before the batch started
    const batchMinDate = new Date(batchStartYear, 5, 1);
    if (minDate < batchMinDate) {
      minDate = batchMinDate;
    }
    
    return { minDate, maxDate };
  };

  // Function to check if a date should be disabled
  const isDateDisabled = (date: Date, batchId: string, semester: number, type: 'start' | 'end') => {
    const { minDate, maxDate } = getValidDateRange(batchId, semester);
    
    // Disable dates outside the valid range
    if (date < minDate || date > maxDate) {
      return true;
    }
    
    // For end dates, ensure they're not before the start date
    if (type === 'end') {
      const semesterData = semesterDates.find(s => s.batch === batchId && s.semester === semester);
      if (semesterData?.startDate && date < semesterData.startDate) {
        return true;
      }
    }
    
    // For start dates, ensure they're not after the end date
    if (type === 'start') {
      const semesterData = semesterDates.find(s => s.batch === batchId && s.semester === semester);
      if (semesterData?.endDate && date > semesterData.endDate) {
        return true;
      }
    }
    
    return false;
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

  const handleCreateBatch = async () => {
    if (!newBatchYear) {
      showError('Please enter a valid batch year.');
      return;
    }
    
    const year = parseInt(newBatchYear);
    if (isNaN(year) || year < 2000 || year > 2050) {
      showError('Please enter a valid year between 2000 and 2050.');
      return;
    }
    
    // Check if batch already exists
    if (batches.some(b => b.startYear === year)) {
      showError('A batch with this start year already exists.');
      return;
    }
    
    try {
      await createBatch(year);
      setNewBatchYear('');
      setIsCreateDialogOpen(false);
      showSuccess(`Batch ${year}-${year + 4} created successfully!`);
    } catch (error) {
      console.error('Error creating batch:', error);
      showError('Failed to create batch. Please try again.');
    }
  };
  
  const handleEditBatch = (batch: { id: string; name: string }) => {
    setEditingBatch(batch);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateBatch = async () => {
    if (!editingBatch) return;
    
    try {
      // For now, we'll just toggle the active status
      // In a real application, you might want to update other properties
      const currentBatch = batches.find(b => b.id === editingBatch.id);
      if (currentBatch) {
        await updateBatch(editingBatch.id, { isActive: !currentBatch.isActive });
        showSuccess(`Batch ${editingBatch.name} updated successfully!`);
      }
      setIsEditDialogOpen(false);
      setEditingBatch(null);
    } catch (error) {
      console.error('Error updating batch:', error);
      showError('Failed to update batch. Please try again.');
    }
  };
  
  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (confirm(`Are you sure you want to delete batch ${batchName}? This action cannot be undone.`)) {
      try {
        await deleteBatch(batchId);
        showSuccess(`Batch ${batchName} deleted successfully!`);
      } catch (error) {
        console.error('Error deleting batch:', error);
        showError('Failed to delete batch. Please try again.');
      }
    }
  };

  return (
    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Batch Management</CardTitle>
            <CardDescription>Manage batches and their semester dates.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  Create New Batch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Batch</DialogTitle>
                  <DialogDescription>
                    Enter the starting year for the new batch. The batch will span 4 years (e.g., 2024-2028).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batchYear">Starting Year</Label>
                    <Input
                      id="batchYear"
                      type="number"
                      placeholder="e.g., 2024"
                      value={newBatchYear}
                      onChange={(e) => setNewBatchYear(e.target.value)}
                      min="2000"
                      max="2050"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBatch}>
                    Create Batch
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Edit Batch Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Batch</DialogTitle>
                  <DialogDescription>
                    Modify batch settings. Currently you can toggle the active status.
                  </DialogDescription>
                </DialogHeader>
                {editingBatch && (
                  <div className="space-y-4">
                    <div>
                      <Label>Batch Name</Label>
                      <Input value={editingBatch.name} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Current Status</Label>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          batches.find(b => b.id === editingBatch.id)?.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {batches.find(b => b.id === editingBatch.id)?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Clicking "Update Batch" will toggle the active status of this batch.
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateBatch}>
                    {editingBatch && batches.find(b => b.id === editingBatch.id)?.isActive ? 'Deactivate' : 'Activate'} Batch
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Batch List Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Existing Batches</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Year</TableHead>
                  <TableHead>End Year</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        batch.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {batch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{batch.startYear}</TableCell>
                    <TableCell>{batch.endYear}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBatch({ id: batch.id, name: batch.name })}
                          className="flex items-center gap-1"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBatch(batch.id, batch.name)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {batches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No batches found. Create your first batch to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Semester Management Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Semester Date Management</h3>
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
                {batchData.map(({ batch, semesters: semesterNumbers, currentSemester }) => {
                  const isLocked = false; // Current semester is never locked
                  const batchObj = batches.find(b => b.id === batch);
                  const currentDate = new Date();
                  const currentMonth = currentDate.getMonth() + 1;
                  const yearDiff = currentDate.getFullYear() - (batchObj?.startYear || 0);
                  
                  // Create a description of the current semester period
                  let semesterPeriod = '';
                  if (currentSemester % 2 === 1) {
                    // Odd semester (June-December)
                    const semesterYear = (batchObj?.startYear || 0) + Math.floor((currentSemester - 1) / 2);
                    semesterPeriod = `(Jun ${semesterYear} - Dec ${semesterYear})`;
                  } else {
                    // Even semester (January-May)
                    const semesterYear = (batchObj?.startYear || 0) + Math.floor((currentSemester - 1) / 2) + 1;
                    semesterPeriod = `(Jan ${semesterYear} - May ${semesterYear})`;
                  }

                  return (
                    <TableRow key={batch}>
                      <TableCell className="font-medium">{`${batch}-${parseInt(batch) + 4}`}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-600">Semester {currentSemester}</span>
                          <span className="text-xs text-gray-500">{semesterPeriod}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                          <DatePicker
                            date={semesterDates.find(s => s.batch === batch && s.semester === currentSemester)?.startDate}
                            setDate={(date) => handleDateChange(batch, currentSemester, date, 'start')}
                            disabled={(date) => isDateDisabled(date, batch, currentSemester, 'start')}
                            fullDisabled={isLocked}
                          />
                      </TableCell>
                      <TableCell>
                          <DatePicker
                            date={semesterDates.find(s => s.batch === batch && s.semester === currentSemester)?.endDate}
                            setDate={(date) => handleDateChange(batch, currentSemester, date, 'end')}
                            disabled={(date) => isDateDisabled(date, batch, currentSemester, 'end')}
                            fullDisabled={isLocked}
                          />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {batchData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      <div className="space-y-2">
                        <div>No batches are currently in an active semester period.</div>
                        <div className="text-xs text-gray-400">
                          Only batches with an active semester (based on current date and batch timeline) can have semester dates managed.
                          <br />Current date: {new Date().toLocaleDateString()} (July 2025 = various semester periods for different batches)
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
};

