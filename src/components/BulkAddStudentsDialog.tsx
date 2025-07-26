import React, { useState, useCallback, useEffect } from 'react';
import * as z from 'zod';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { FileWarning } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

// Schema for validating each row from the uploaded file
const bulkStudentSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  registerNumber: z.string().min(1, "Register number is required"),
  tutorName: z.string().min(2, "Tutor name is required"),
  year: z.string().refine(val => ['1', '2', '3', '4'].includes(val), "Year must be 1, 2, 3, or 4"),
  username: z.string().min(3, "Username is too short"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type BulkStudent = z.infer<typeof bulkStudentSchema>;

interface BulkAddStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (newStudents: BulkStudent[]) => void;
  existingStudents: { registerNumber: string; username: string }[];
}

export const BulkAddStudentsDialog: React.FC<BulkAddStudentsDialogProps> = ({ open, onOpenChange, onImport, existingStudents }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validStudents, setValidStudents] = useState<BulkStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const resetState = useCallback(() => {
    setFile(null);
    setIsProcessing(false);
    setValidStudents([]);
    setErrors([]);
    const fileInput = document.getElementById('bulk-student-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension && ['csv', 'xlsx', 'json'].includes(fileExtension)) {
        setFile(selectedFile);
      } else {
        showError("Invalid File Type. Please upload a CSV, XLSX, or JSON file.");
      }
    }
  };

  const processData = useCallback((data: any[]) => {
    const newValidStudents: BulkStudent[] = [];
    const newErrors: string[] = [];
    const existingUsernames = new Set(existingStudents.map(s => s.username));
    const existingRegNos = new Set(existingStudents.map(s => s.registerNumber));
    const fileUsernames = new Set<string>();
    const fileRegNos = new Set<string>();

    data.forEach((row, index) => {
      const validationResult = bulkStudentSchema.safeParse(row);
      if (validationResult.success) {
        const student = validationResult.data;
        let hasError = false;
        if (existingUsernames.has(student.username) || fileUsernames.has(student.username)) {
          newErrors.push(`Row ${index + 2}: Username '${student.username}' already exists.`);
          hasError = true;
        }
        if (existingRegNos.has(student.registerNumber) || fileRegNos.has(student.registerNumber)) {
          newErrors.push(`Row ${index + 2}: Register Number '${student.registerNumber}' already exists.`);
          hasError = true;
        }
        
        if (!hasError) {
          newValidStudents.push(student);
          fileUsernames.add(student.username);
          fileRegNos.add(student.registerNumber);
        }
      } else {
        const errorMessages = validationResult.error.errors.map(e => `(${e.path.join('.')}) ${e.message}`).join(', ');
        newErrors.push(`Row ${index + 2}: ${errorMessages}`);
      }
    });

    setValidStudents(newValidStudents);
    setErrors(newErrors);
    setIsProcessing(false);
  }, [existingStudents]);

  const handleProcessFile = useCallback(() => {
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension === 'csv') {
          Papa.parse(content as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => processData(results.data),
          });
        } else if (fileExtension === 'xlsx') {
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          processData(jsonData);
        } else if (fileExtension === 'json') {
          const jsonData = JSON.parse(content as string);
          if (Array.isArray(jsonData)) {
            processData(jsonData);
          } else {
            throw new Error("JSON file must contain an array of student objects.");
          }
        } else {
            throw new Error("Unsupported file type.");
        }
      } catch (error) {
        setErrors([`Failed to process file: ${error instanceof Error ? error.message : String(error)}`]);
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrors(["Failed to read file."]);
      setIsProcessing(false);
    };

    if (file.name.endsWith('.json') || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  }, [file, processData]);

  const handleImportClick = () => {
    onImport(validStudents);
    showSuccess(`${validStudents.length} students have been added.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Bulk Add Students</DialogTitle>
          <DialogDescription>
            Upload a CSV, XLSX, or JSON file. The file must contain headers/keys: 
            `name`, `registerNumber`, `tutorName`, `year`, `username`, `password`.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 items-center">
          <Input id="bulk-student-upload" type="file" accept=".csv, .xlsx, .json" onChange={handleFileChange} className="md:col-span-2" />
          <Button onClick={handleProcessFile} disabled={!file || isProcessing}>
            {isProcessing ? 'Processing...' : 'Process File'}
          </Button>
        </div>

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
                    <TableHead>Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validStudents.map((student, i) => (
                    <TableRow key={i}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.registerNumber}</TableCell>
                      <TableCell>{student.tutorName}</TableCell>
                      <TableCell>{student.year}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleImportClick} disabled={validStudents.length === 0 || isProcessing}>
            Import {validStudents.length} Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};