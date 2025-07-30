import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, UserPlus, Upload } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BulkAddStudentsDialog } from '@/components/BulkAddStudentsDialog';
import { useAppContext, Student, NewStudentData } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StudentFormDialog, StudentFormValues } from '@/components/StudentFormDialog';

const AdminStudentManagementPage = () => {
  const { students, addStudent, updateStudent, deleteStudent, bulkAddStudents, staff } = useAppContext();
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);

  const batches = ['2024', '2025', '2026', '2027'];

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete);
      showSuccess('Student removed successfully!');
      setStudentToDelete(null);
    }
  };

  const onSubmit = async (data: StudentFormValues) => {
    const tutor = staff.find(s => s.name === data.tutorName);
    if (!tutor) {
      showError("Selected tutor not found.");
      return;
    }

    try {
      if (editingStudent) {
        const { password, tutorName, ...restOfData } = data;
        const studentData: Partial<Student> = {
          name: data.name,
          register_number: data.registerNumber,
          tutor_id: tutor.id,
          batch: data.batch,
          semester: data.semester,
          email: data.email,
          mobile: data.mobile,
        };
        await updateStudent(editingStudent.id, studentData);
      } else {
        // addStudent expects NewStudentData which has tutorName, it handles finding tutorId internally
        await addStudent(data as NewStudentData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error handling is done in the AppContext functions
      console.error('Error submitting student form:', error);
    }
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
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Register Number</TableHead>
                  <TableHead>Tutor Name</TableHead>
                  <TableHead className="text-center">Batch</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">Leave Taken</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const tutor = staff.find(s => s.id === student.tutor_id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={student.profile_photo} alt={student.name} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.register_number}</TableCell>
                      <TableCell>{tutor ? tutor.name : 'N/A'}</TableCell>
                      <TableCell className="text-center">{student.batch}-{parseInt(student.batch) + 4}</TableCell>
                      <TableCell className="text-center">{student.semester}</TableCell>
                      <TableCell className="text-center">{student.leave_taken}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(student)} className="transition-transform hover:scale-110 hover:bg-accent">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => setStudentToDelete(student.id)} className="transition-transform hover:scale-110">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StudentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onSubmit}
        editingStudent={editingStudent}
        staffMembers={staff} // Pass full staff array
        batches={batches}
      />

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
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkAddStudentsDialog
        open={isBulkAddOpen}
        onOpenChange={setIsBulkAddOpen}
        onImport={bulkAddStudents}
        existingStudents={students.map(s => ({ registerNumber: s.register_number, email: s.email }))}
      />
    </AdminLayout>
  );
};

export default AdminStudentManagementPage;