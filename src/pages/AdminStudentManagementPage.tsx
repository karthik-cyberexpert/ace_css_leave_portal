import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, UserPlus, Eye, EyeOff, Upload } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulkAddStudentsDialog, BulkStudent } from '@/components/BulkAddStudentsDialog';

// Dummy Data
const initialStudents = [
  { id: 'stud-1', name: 'Alice Johnson', registerNumber: 'S001', tutorName: 'Dr. Smith', year: '3', leaveTaken: 10, username: 'alicej', password: 'password123' },
  { id: 'stud-2', name: 'Bob Williams', registerNumber: 'S002', tutorName: 'Prof. Jones', year: '2', leaveTaken: 15, username: 'bobw', password: 'password123' },
  { id: 'stud-3', name: 'Charlie Brown', registerNumber: 'S003', tutorName: 'Dr. Davis', year: '4', leaveTaken: 6, username: 'charlieb', password: 'password123' },
  { id: 'stud-4', name: 'Diana Miller', registerNumber: 'S004', tutorName: 'Dr. Smith', year: '3', leaveTaken: 8, username: 'dianam', password: 'password123' },
];

const tutors = ['Dr. Smith', 'Prof. Jones', 'Dr. Davis', 'Prof. White'];
const years = ['1', '2', '3', '4'];

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  registerNumber: z.string().min(3, "Register number is required."),
  tutorName: z.string({ required_error: "Please select a tutor." }),
  year: z.string({ required_error: "Please select a year." }),
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
});

type StudentFormValues = z.infer<typeof studentSchema>;
type Student = typeof initialStudents[0];

const AdminStudentManagementPage = () => {
  const [students, setStudents] = useState(initialStudents);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: '', registerNumber: '', tutorName: '', year: '', username: '', password: '' },
  });

  useEffect(() => {
    if (editingStudent) {
      form.reset({ ...editingStudent, password: '' });
    } else {
      form.reset({ name: '', registerNumber: '', tutorName: '', year: '', username: '', password: '' });
    }
  }, [editingStudent, form]);

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (studentToDelete) {
      setStudents(students.filter(s => s.id !== studentToDelete));
      showSuccess('Student removed successfully!');
      setStudentToDelete(null);
    }
  };

  const onSubmit = (data: StudentFormValues) => {
    if (editingStudent) {
      const { password, ...restOfData } = data;
      const updatedStudent = {
        ...students.find(s => s.id === editingStudent.id)!,
        ...restOfData,
      };
      if (password) {
        updatedStudent.password = password;
      }
      setStudents(students.map(s => s.id === editingStudent.id ? updatedStudent : s));
      showSuccess('Student details updated successfully!');
    } else {
      if (!data.password) {
        form.setError("password", { type: "manual", message: "Password is required for new students." });
        return;
      }
      const newStudent = { ...data, id: `stud-${Date.now()}`, leaveTaken: 0, password: data.password };
      setStudents([...students, newStudent]);
      showSuccess('Student added successfully!');
    }
    setIsDialogOpen(false);
  };

  const handleBulkImport = (newStudents: BulkStudent[]) => {
    const studentsToAdd = newStudents.map(s => ({
      ...s,
      id: `stud-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      leaveTaken: 0,
    }));
    setStudents(prev => [...prev, ...studentsToAdd]);
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold">Student Management</CardTitle>
            <CardDescription>View, add, edit, or remove students from the portal.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto" onClick={() => setIsBulkAddOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Bulk Add
            </Button>
            <Button onClick={handleAddNew} className="w-full md:w-auto">
              <UserPlus className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Register Number</TableHead>
                  <TableHead>Tutor Name</TableHead>
                  <TableHead className="text-center">Year</TableHead>
                  <TableHead className="text-center">Leave Taken</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.registerNumber}</TableCell>
                    <TableCell>{student.tutorName}</TableCell>
                    <TableCell className="text-center">{student.year}</TableCell>
                    <TableCell className="text-center">{student.leaveTaken}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(student)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => setStudentToDelete(student.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="registerNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Register Number</FormLabel>
                  <FormControl><Input placeholder="S005" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tutorName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a tutor" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {tutors.map(tutor => <SelectItem key={tutor} value={tutor}>{tutor}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a year" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input placeholder="john.doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder={editingStudent ? 'Leave blank to keep current password' : '••••••••'} 
                        {...field} 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{editingStudent ? 'Save Changes' : 'Add Student'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student's account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkAddStudentsDialog
        open={isBulkAddOpen}
        onOpenChange={setIsBulkAddOpen}
        onImport={handleBulkImport}
        existingStudents={students}
      />
    </AdminLayout>
  );
};

export default AdminStudentManagementPage;