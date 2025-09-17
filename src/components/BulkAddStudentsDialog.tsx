import React, { useState, useCallback, useEffect } from 'react';
import * as z from 'zod';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { FileWarning, CheckCircle, Upload } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { DownloadFormatDialog } from './DownloadFormatDialog';
import { useBatchContext } from '@/context/BatchContext';

// Schema for validating each row from the uploaded file
const bulkStudentSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  registerNumber: z.string().min(1, "Register number is required"),
  tutorName: z.string().min(2, "Tutor name is required"),
  batch: z.string().min(4, "Batch is required"),
  semester: z.preprocess((val) => parseInt(String(val), 10), z.number().min(1).max(8, "Semester must be between 1-8")),
  email: z.string().email("Invalid email address"),
  mobile: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid Indian mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type BulkStudent = z.infer<typeof bulkStudentSchema>;

interface BulkAddStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (newStudents: BulkStudent[]) => Promise<void>;
  existingStudents: { registerNumber: string; email: string }[];
}

export const BulkAddStudentsDialog: React.FC<BulkAddStudentsDialogProps> = ({ open, onOpenChange, onImport, existingStudents }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validStudents, setValidStudents] = useState<BulkStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const { getCurrentActiveSemester } = useBatchContext();

  const resetState = useCallback(() => {
    console.log('Resetting component state');
    setFile(null);
    setIsProcessing(false);
    setIsImporting(false);
    setValidStudents([]);
    setErrors([]);
    setProcessingStatus('');
    
    // Force reset the file input
    const fileInput = document.getElementById('bulk-student-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      fileInput.files = null;
      console.log('File input reset');
    }
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    } else {
      // Debug: Check browser compatibility when dialog opens
      console.log('Dialog opened, checking browser compatibility:');
      console.log('FileReader support:', typeof FileReader !== 'undefined');
      console.log('File API support:', !!(window.File && window.FileReader && window.FileList && window.Blob));
      console.log('User agent:', navigator.userAgent);
    }
  }, [open, resetState]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File change event triggered', event.target.files);
    console.log('Event target value:', event.target.value);
    
    // Clear previous state but don't reset the file input
    setIsProcessing(false);
    setIsImporting(false);
    setValidStudents([]);
    setErrors([]);
    setProcessingStatus('');
    
    const selectedFile = event.target.files?.[0];
    console.log('Selected file:', selectedFile);
    
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      console.log('File extension:', fileExtension);
      console.log('File name:', selectedFile.name);
      console.log('File size:', selectedFile.size);
      console.log('File type:', selectedFile.type);
      
      if (fileExtension && ['csv', 'xlsx', 'json'].includes(fileExtension)) {
        console.log('File accepted, setting file state');
        setFile(selectedFile);
        setProcessingStatus(`File "${selectedFile.name}" selected successfully. Click "Upload File" to continue.`);
      } else {
        console.log('File rejected - invalid extension');
        showError("Invalid File Type. Please upload a CSV, XLSX, or JSON file.");
        setErrors(["Invalid file type. Please select a CSV, XLSX, or JSON file."]);
        setFile(null);
      }
    } else {
      console.log('No file selected');
      setFile(null);
      setProcessingStatus('');
    }
  };

  const processData = useCallback((data: any[]) => {
    console.log('Processing data:', data);
    setProcessingStatus(`Processing ${data.length} rows...`);
    
    const newValidStudents: BulkStudent[] = [];
    const newErrors: string[] = [];
    const existingEmails = new Set(existingStudents.map(s => s.email));
    const existingRegNos = new Set(existingStudents.map(s => s.registerNumber));
    const fileEmails = new Set<string>();
    const fileRegNos = new Set<string>();

    if (!data || data.length === 0) {
      setErrors(['No data found in file. Please check your file format.']);
      setIsProcessing(false);
      setProcessingStatus('Error: No data found in file.');
      return;
    }

    data.forEach((row, index) => {
      console.log(`Processing row ${index + 1}:`, row);

      // Check for required fields
      const requiredFields = ['name', 'registerNumber', 'tutorName', 'batch', 'semester', 'email', 'mobile', 'password'];
      const missingFields = requiredFields.filter(field => !row[field] || (typeof row[field] === 'string' && row[field].trim() === ''));
      
      if (missingFields.length > 0) {
        newErrors.push(`Row ${index + 2}: Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Clean the data
      const cleanedRow = {
        name: String(row.name).trim(),
        registerNumber: String(row.registerNumber).trim(),
        tutorName: String(row.tutorName).trim(),
        batch: String(row.batch).trim(),
        semester: parseInt(String(row.semester), 10),
        email: String(row.email).trim(),
        mobile: String(row.mobile).trim(),
        password: String(row.password).trim(),
      };

      const validationResult = bulkStudentSchema.safeParse(cleanedRow);
      
      if (validationResult.success) {
        const student = validationResult.data;
        let hasError = false;
        
        if (existingRegNos.has(student.registerNumber) || fileRegNos.has(student.registerNumber)) {
          newErrors.push(`Row ${index + 2}: Register Number '${student.registerNumber}' already exists.`);
          hasError = true;
        }
        
        if (!hasError) {
          newValidStudents.push(student);
          fileRegNos.add(student.registerNumber);
        }
      } else {
        const errorMessages = validationResult.error.errors.map(e => `(${e.path.join('.')}) ${e.message}`).join(', ');
        newErrors.push(`Row ${index + 2}: ${errorMessages}`);
      }
    });

    console.log('Valid students:', newValidStudents);
    console.log('Errors:', newErrors);

    setValidStudents(newValidStudents);
    setErrors(newErrors);
    setIsProcessing(false);
    
    if (newValidStudents.length > 0) {
      setProcessingStatus(`Successfully processed ${newValidStudents.length} valid student records.`);
    } else {
      setProcessingStatus('No valid student records found. Please check the errors above.');
    }
  }, [existingStudents]);

  const handleProcessFile = useCallback(() => {
    if (!file) {
      showError('Please select a file first.');
      setErrors(['No file selected. Please choose a file to process.']);
      return;
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
    setErrors([]);
    setValidStudents([]);
    setIsProcessing(true);
    setProcessingStatus('Reading file...');
    
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        setProcessingStatus('Parsing file content...');
        
        if (fileExtension === 'csv') {
          Papa.parse(content as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              console.log('CSV parse results:', results);
              if (results.errors.length > 0) {
                console.log('CSV parse errors:', results.errors);
                setErrors(results.errors.map(err => `CSV Parse Error: ${err.message}`));
                setIsProcessing(false);
                setProcessingStatus('Error parsing CSV file.');
                return;
              }
              processData(results.data);
            },
            error: (error) => {
              console.error('CSV parse error:', error);
              setErrors([`CSV Parse Error: ${error.message}`]);
              setIsProcessing(false);
              setProcessingStatus('Error parsing CSV file.');
            }
          });
        } else if (fileExtension === 'xlsx') {
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          console.log('XLSX parsed data:', jsonData);
          processData(jsonData);
        } else if (fileExtension === 'json') {
          const jsonData = JSON.parse(content as string);
          console.log('JSON parsed data:', jsonData);
          if (Array.isArray(jsonData)) {
            processData(jsonData);
          } else {
            throw new Error("JSON file must contain an array of student objects.");
          }
        } else {
          throw new Error("Unsupported file type.");
        }
      } catch (error) {
        console.error('File processing error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setErrors([`Failed to process file: ${errorMessage}`]);
        setIsProcessing(false);
        setProcessingStatus(`Error: ${errorMessage}`);
      }
    };

    reader.onerror = () => {
      console.error('File read error');
      setErrors(["Failed to read file."]);
      setIsProcessing(false);
      setProcessingStatus('Error reading file.');
    };

    if (file.name.endsWith('.json') || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  }, [file, processData]);

  const handleImportClick = async () => {
    console.log('Starting import for students:', validStudents);
    setIsImporting(true);
    setProcessingStatus(`Importing ${validStudents.length} students...`);
    
    try {
      console.log('Calling onImport function with data:', validStudents);
      await onImport(validStudents);
      console.log('Import completed successfully');
      setProcessingStatus(`Successfully imported ${validStudents.length} students!`);
      
      // Give user time to see the success message
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Import failed with error:', error);
      setProcessingStatus('');
      showError(`Failed to import students: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadFormat = (format: 'xlsx' | 'csv' | 'json') => {
    const headers = ['name', 'registerNumber', 'tutorName', 'batch', 'semester', 'email', 'mobile', 'password'];
    // Use current active semesters for the example data
    const batch2024Semester = getCurrentActiveSemester('2024');
    const batch2025Semester = getCurrentActiveSemester('2025');
    const exampleRow1 = ['John Doe', 'S101', 'Dr. Smith', '2024', String(batch2024Semester), 'john.doe@example.com', '9876543210', 'password123'];
    const exampleRow2 = ['Jane Smith', 'S102', 'Dr. Brown', '2025', String(batch2025Semester), 'jane.smith@example.com', '9123456780', 'password456'];
    const dataRows = [headers].concat([exampleRow1, exampleRow2]);

    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, 'student_template.xlsx');
    } else if (format === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," 
        + dataRows.map(row => row.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "student_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'json') {
      const jsonObject = [
        {
          name: 'John Doe', registerNumber: 'S101', tutorName: 'Dr. Smith',
          batch: '2024', semester: batch2024Semester, email: 'john.doe@example.com', mobile: '9876543210', password: 'password123'
        },
        {
          name: 'Jane Smith', registerNumber: 'S102', tutorName: 'Dr. Brown',
          batch: '2025', semester: batch2025Semester, email: 'jane.smith@example.com', mobile: '9123456780', password: 'password456'
        }
      ];
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(jsonObject, null, 2))}`;
      const link = document.createElement("a");
      link.setAttribute("href", jsonString);
      link.setAttribute("download", "student_template.json");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsDownloadDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Students</DialogTitle>
          <DialogDescription>
            Upload a CSV, XLSX, or JSON file with student data. Please ensure the file includes all required fields: name, registerNumber, tutorName, batch, semester, email, mobile, and password.
            <Button variant="link" className="p-0 h-auto ml-1 text-blue-600" onClick={() => setIsDownloadDialogOpen(true)}>
              Download a template.
            </Button>
          </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 items-center">
            <div className="md:col-span-2">
              <Input 
                id="bulk-student-upload" 
                type="file" 
                accept=".csv,.xlsx,.json" 
                onChange={handleFileChange} 
                className="w-full" 
                onClick={(e) => {
                  console.log('File input clicked');
                  console.log('Current input value:', e.currentTarget.value);
                  console.log('Current file state:', file?.name || 'No file in state');
                }}
              />
              <div className="text-xs text-slate-500 mt-1">
                Accepted formats: CSV, XLSX, JSON (Max size: 10MB)
              </div>
            </div>
            <Button onClick={handleProcessFile} disabled={!file || isProcessing}>
              {isProcessing ? 'Processing...' : 'Upload File'}
            </Button>
          </div>
          {file ? (
            <div className="text-sm text-emerald-600 mb-4 bg-emerald-50 border border-emerald-200 rounded p-2">
              ✅ Selected file: <span className="font-medium">{file.name}</span> ({file.size < 1024 ? `${file.size} bytes` : `${Math.round(file.size / 1024)} KB`})
            </div>
          ) : (
            <div className="text-sm text-slate-500 mb-4">
              No file selected. Please choose a CSV, XLSX, or JSON file.
            </div>
          )}

          {processingStatus && (
            <div className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mb-4">
              <CheckCircle className="h-4 w-4 inline mr-2 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">{processingStatus}</span>
            </div>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <FileWarning className="h-4 w-4" />
              <AlertTitle>Validation Errors ({errors.length})</AlertTitle>
              <AlertDescription>
                <ScrollArea className="h-24">
                  <ul className="list-disc pl-5 text-xs">
                    {errors.map((error, i) => <li key={i}>{error}</li>)}
                  </ul>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {validStudents.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Students to be Imported ({validStudents.length})</h3>
              <ScrollArea className="h-64 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Register No.</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Semester</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validStudents.map((student, i) => (
                      <TableRow key={i}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.registerNumber}</TableCell>
                        <TableCell>{student.tutorName}</TableCell>
                        <TableCell>{student.batch}</TableCell>
                        <TableCell>{student.semester}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isImporting}>Cancel</Button></DialogClose>
            <Button onClick={handleImportClick} disabled={validStudents.length === 0 || isProcessing || isImporting}>
              {isImporting ? 'Importing...' : `Import ${validStudents.length} Students`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DownloadFormatDialog 
        open={isDownloadDialogOpen}
        onOpenChange={setIsDownloadDialogOpen}
        onDownload={handleDownloadFormat}
      />
    </>
  );
};