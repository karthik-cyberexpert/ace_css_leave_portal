import React, { useMemo, useState } from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext, Student } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { StudentFormDialog, StudentFormValues } from '@/components/StudentFormDialog';
import { useBatchContext } from '@/context/BatchContext';

const TutorStudentManagementPage = () => {
  const { students, currentTutor, updateStudent, staff } = useAppContext();
  const { getAvailableBatches } = useBatchContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const myStudents = useMemo(() => {
    if (!currentTutor) return [];
    // Filter only active students for tutors
    return students.filter(student => 
      student.tutor_id === currentTutor.id && student.is_active
    );
  }, [students, currentTutor]);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: StudentFormValues) => {
    if (editingStudent && currentTutor) {
      const { password, tutorName, ...restOfData } = data; // tutorName is not needed here as tutor is fixed
      const studentData: Partial<Student> = {
        name: data.name,
        register_number: data.registerNumber,
        tutor_id: currentTutor.id, // Always use currentTutor's ID
        batch: data.batch,
        semester: data.semester,
        email: data.email,
        mobile: data.mobile,
      };
      try {
        // Password update logic not handled by updateStudent in AppContext
        await updateStudent(editingStudent.id, studentData);
        setIsDialogOpen(false);
      } catch (error) {
        // Error handling is done in the AppContext functions
        console.error('Error updating student:', error);
      }
    } else {
      setIsDialogOpen(false);
    }
  };

  return (
    <TutorLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">My Students</CardTitle>
          <CardDescription>View and manage the students assigned to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Register Number</TableHead>
                  <TableHead className="text-center">Batch</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-right">Total Leave Taken</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={student.profile_photo} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.register_number}</TableCell>
                    <TableCell className="text-center">{student.batch}-{parseInt(student.batch) + 4}</TableCell>
                    <TableCell className="text-center">{student.semester}</TableCell>
                    <TableCell className="text-right">{student.leave_taken}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(student)} className="transition-transform hover:scale-110 hover:bg-accent">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
        batches={getAvailableBatches().map(b => b.id)}
        isTutorView={true}
      />
    </TutorLayout>
  );
};

export default TutorStudentManagementPage;