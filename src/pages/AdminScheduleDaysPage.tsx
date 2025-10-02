import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datepicker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  CalendarDays, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  Calendar,
  Clock,
  Upload,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { showError, showSuccess } from '@/utils/toast';
import apiClient from '@/utils/apiClient';

interface ExceptionDay {
  id: string;
  date: string;
  reason: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const AdminScheduleDaysPage = () => {
  const [exceptionDays, setExceptionDays] = useState<ExceptionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<ExceptionDay | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<ExceptionDay | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch exception days from API
  const fetchExceptionDays = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/exception-days');
      // Ensure response.data is always an array
      const data = Array.isArray(response.data) ? response.data : [];
      setExceptionDays(data);
    } catch (error) {
      console.error('Error fetching exception days:', error);
      showError('Failed to load exception days');
      setExceptionDays([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptionDays();
  }, []);

  // Reset form
  const resetForm = () => {
    setSelectedDate(undefined);
    setReason('');
    setDescription('');
    setEditingDay(null);
  };

  // Handle add new exception day
  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Handle edit exception day
  const handleEdit = (day: ExceptionDay) => {
    setEditingDay(day);
    setSelectedDate(new Date(day.date));
    setReason(day.reason);
    setDescription(day.description || '');
    setIsDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (day: ExceptionDay) => {
    setDayToDelete(day);
    setDeleteConfirmOpen(true);
  };

  // Submit form (add or edit)
  const handleSubmit = async () => {
    // Enhanced validation
    if (!selectedDate) {
      showError('Please select a date');
      return;
    }
    
    if (!reason.trim()) {
      showError('Please enter a reason');
      return;
    }
    
    if (reason.trim().length > 255) {
      showError('Reason must be less than 255 characters');
      return;
    }
    
    if (description.trim().length > 1000) {
      showError('Description must be less than 1000 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Ensure date is in correct format and timezone
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const formData = {
        date: formattedDate,
        reason: reason.trim(),
        description: description.trim() || null // Use null instead of undefined
      };
      
      console.log('Submitting exception day data:', formData);

      if (editingDay) {
        // Update existing
        await apiClient.put(`/api/exception-days/${editingDay.id}`, formData);
        showSuccess('Exception day updated successfully');
      } else {
        // Create new
        await apiClient.post('/api/exception-days', formData);
        showSuccess('Exception day added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchExceptionDays();
    } catch (error: any) {
      console.error('Error saving exception day:', error);
      
      // Enhanced error handling
      let message = 'Failed to save exception day';
      
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        if (status === 400) {
          message = data?.message || data?.error || 'Invalid data provided. Please check your inputs.';
        } else if (status === 409) {
          message = 'This date already exists as an exception day.';
        } else if (status === 500) {
          message = 'Server error. Please try again or contact administrator.';
        } else {
          message = data?.message || data?.error || `Server error (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        message = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        message = error.message || 'An unexpected error occurred.';
      }
      
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!dayToDelete) return;

    try {
      await apiClient.delete(`/api/exception-days/${dayToDelete.id}`);
      showSuccess('Exception day deleted successfully');
      setDeleteConfirmOpen(false);
      setDayToDelete(null);
      fetchExceptionDays();
    } catch (error) {
      console.error('Error deleting exception day:', error);
      showError('Failed to delete exception day');
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!uploadFile) {
      showError('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      await apiClient.post('/api/exception-days/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showSuccess('Exception days uploaded successfully!');
      setBulkUploadOpen(false);
      setUploadFile(null);
      fetchExceptionDays();
    } catch (error: any) {
      console.error('Error uploading exception days:', error);
      const message = error.response?.data?.error || 'Failed to upload exception days';
      showError(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Download template files
  const downloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await apiClient.get(`/api/exception-days/template/${format}`, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout
      });

      // Verify the response has content
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty file received from server');
      }

      // Create blob with exact MIME type from server or fallback
      const contentType = response.headers['content-type'] || 
        (format === 'xlsx' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv');
      
      const blob = new Blob([response.data], { type: contentType });
      
      // Check blob size
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create download URL
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Use filename from server or fallback
      const disposition = response.headers['content-disposition'];
      let filename = `Exception_Days_Template.${format}`;
      if (disposition) {
        const filenameMatch = disposition.match(/filename[^;=\n]*=(['"]*)([^'"\n]*?)\1/i);
        if (filenameMatch && filenameMatch[2]) {
          filename = filenameMatch[2];
        }
      }
      link.download = filename;
      
      // Ensure the link is added to DOM for Firefox compatibility
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
      
      showSuccess(`Template downloaded successfully in ${format.toUpperCase()} format (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (error: any) {
      console.error('Error downloading template:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to download template';
      showError(`Download failed: ${errorMessage}`);
    }
  };

  // Get status badge for date
  const getDateStatus = (date: string) => {
    const dayDate = new Date(date);
    if (isPast(dayDate) && !isToday(dayDate)) {
      return <Badge variant="secondary">Past</Badge>;
    } else if (isToday(dayDate)) {
      return <Badge variant="destructive">Today</Badge>;
    } else if (isFuture(dayDate)) {
      return <Badge variant="default">Upcoming</Badge>;
    }
    return null;
  };

  // Get stats - ensure exceptionDays is always an array
  const safeExceptionDays = Array.isArray(exceptionDays) ? exceptionDays : [];
  const totalDays = safeExceptionDays.length;
  const upcomingDays = safeExceptionDays.filter(day => isFuture(new Date(day.date))).length;
  const todayCount = safeExceptionDays.filter(day => isToday(new Date(day.date))).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="h-8 w-8 text-primary" />
              Schedule Days Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage exception days when students cannot apply for leave or OD requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddNew} className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Add Exception Day
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setBulkUploadOpen(true)} 
              className="w-fit"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exception Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDays}</div>
              <p className="text-xs text-muted-foreground">All configured days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Days</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingDays}</div>
              <p className="text-xs text-muted-foreground">Future exception days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCount}</div>
              <p className="text-xs text-muted-foreground">Applications blocked today</p>
            </CardContent>
          </Card>
        </div>

        {/* Exception Days Table */}
        <Card>
          <CardHeader>
            <CardTitle>Exception Days</CardTitle>
            <CardDescription>
              Days when leave and OD applications are not allowed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p>Loading exception days...</p>
              </div>
            ) : safeExceptionDays.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No exception days configured</p>
                  <p className="text-sm">Click "Add Exception Day" to get started</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeExceptionDays
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((day) => (
                        <TableRow key={day.id}>
                          <TableCell className="font-medium">
                            {format(new Date(day.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{getDateStatus(day.date)}</TableCell>
                          <TableCell>{day.reason}</TableCell>
                          <TableCell className="max-w-xs">
                            {day.description ? (
                              <span className="text-sm">{day.description}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">No description</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(day.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(day)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(day)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDay ? 'Edit Exception Day' : 'Add Exception Day'}
              </DialogTitle>
              <DialogDescription>
                {editingDay 
                  ? 'Update the details of this exception day.'
                  : 'Add a new day when leave and OD applications will be blocked.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <DatePicker
                  date={selectedDate}
                  setDate={setSelectedDate}
                  disabled={(date) => isPast(date) && !isToday(date)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Holiday, Exam Day, Maintenance"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about this exception day..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingDay ? 'Update' : 'Add')} Exception Day
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Exception Day</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this exception day? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {dayToDelete && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <p><strong>Date:</strong> {format(new Date(dayToDelete.date), 'MMM dd, yyyy')}</p>
                  <p><strong>Reason:</strong> {dayToDelete.reason}</p>
                  {dayToDelete.description && (
                    <p><strong>Description:</strong> {dayToDelete.description}</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bulk Upload Exception Days</DialogTitle>
              <DialogDescription>
                Upload multiple exception days using a CSV or XLSX file. Download a template to get started.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Template Download Section */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTemplate('csv')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    CSV Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTemplate('xlsx')}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    XLSX Template
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Template includes: Date (YYYY-MM-DD), Reason, Description columns with sample data
                </p>
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium text-primary">Click to upload</span>
                        <span className="text-muted-foreground"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        CSV, XLSX files only
                      </p>
                    </div>
                  </label>
                </div>
                {uploadFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {uploadFile.name}
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
                <strong>File Format Requirements:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Date:</strong> YYYY-MM-DD format (e.g., 2024-12-25)</li>
                  <li><strong>Reason:</strong> Required field (max 255 characters)</li>
                  <li><strong>Description:</strong> Optional field (max 1000 characters)</li>
                  <li><strong>Headers:</strong> First row must contain: Date, Reason, Description</li>
                  <li><strong>Duplicates:</strong> Existing dates will be skipped</li>
                  <li><strong>File types:</strong> .csv, .xlsx, .xls formats supported</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkUploadOpen(false);
                  setUploadFile(null);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkUpload} 
                disabled={!uploadFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Exception Days'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminScheduleDaysPage;