import React, { useMemo, useState } from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext, Student } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { StudentFormDialog, StudentFormValues } from '@/components/StudentFormDialog';
import { showSuccess } from '@/utils/toast';

const TutorStudentManagementPage = () => {
  const { students, currentTutor, updateStudent, staff } = useAppContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const myStudents = useMemo(() => {
    if (!currentTutor) return [];
    return students.filter(student => student.tutor_id === currentTutor.id);
  }, [students, currentTutor]);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: StudentFormValues) => {
    if (editingStudent && currentTutor) {
      const { password, tutorName, ...restOfData } = data; // tutorName is not needed here as tutor is fixed
      const studentData: Partial<Student> = { 
        ...restOfData, 
        tutor_id: currentTutor.id, // Always use currentTutor's ID
        profile_photo: data.profilePhoto // Ensure profile_photo is passed
      };
      // Password update logic not handled by updateStudent in AppContext
      updateStudent(editingStudent.id, studentData);
      showSuccess('Student details updated successfully!');
    }
    setIsDialogOpen(false);
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
                  <TableHead className="text-center">Year</TableHead>
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
                    <TableCell className="text-center">{student.year}</TableCell>
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
        years={['1', '2', '3', '4']}
        isTutorView={true}
      />
    </TutorLayout>
  );
};

export default TutorStudentManagementPage;