import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { Student, Staff } from '@/context/AppContext'; // Import Staff type
import { useBatchContext } from '@/context/BatchContext';

const studentFormSchema = (isEditing: boolean) => z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  registerNumber: z.string().min(3, "Register number is required."),
  tutorName: z.string({ required_error: "Please select a tutor." }),
  batch: z.string({ required_error: "Please select a batch." }),
  semester: z.number({ required_error: "Please select a semester." }).min(1).max(8),
  email: z.string().email("Invalid email address."),
  mobile: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid Indian mobile number."),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
}).refine((data) => isEditing || (data.password && data.password.length > 0), {
  message: "Password is required for new students.",
  path: ["password"],
});

export type StudentFormValues = z.infer<ReturnType<typeof studentFormSchema>>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StudentFormValues) => void;
  editingStudent: Student | null;
  staffMembers: Staff[]; // Changed from tutors: string[]
  batches: string[];
  isTutorView?: boolean;
}

export const StudentFormDialog: React.FC<StudentFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  editingStudent,
  staffMembers, // Use staffMembers
  batches,
  isTutorView = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { getCurrentActiveSemester } = useBatchContext();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema(!!editingStudent)),
    defaultValues: { name: '', registerNumber: '', tutorName: '', batch: '', semester: 1, email: '', mobile: '', password: '' },
  });

  // Function to handle batch change and auto-set semester
  const handleBatchChange = (selectedBatch: string) => {
    form.setValue('batch', selectedBatch);
    // Auto-fetch the current active semester for the selected batch
    if (selectedBatch) {
      const defaultSemester = getCurrentActiveSemester(selectedBatch);
      form.setValue('semester', defaultSemester);
    }
  };

  useEffect(() => {
    if (open) {
      if (editingStudent) {
        // Find tutor name from tutor_id
        const currentTutorName = staffMembers.find(t => t.id === editingStudent.tutor_id)?.name || '';
        form.reset({ 
          name: editingStudent.name,
          registerNumber: editingStudent.register_number, // Fix property name mismatch
          tutorName: currentTutorName, // Set tutorName for the form
          batch: editingStudent.batch,
          semester: editingStudent.semester,
          email: editingStudent.email,
          mobile: editingStudent.mobile,
          password: '', 
        });
      } else {
        const defaultTutorName = isTutorView && staffMembers.length > 0 
          ? staffMembers.filter(s => s.is_tutor)[0]?.name || '' 
          : '';
        form.reset({ 
          name: '', 
          registerNumber: '', 
          tutorName: defaultTutorName, 
          batch: '', 
          semester: 1, 
          email: '', 
          mobile: '', 
          password: '', 
        });
      }
    }
  }, [editingStudent, open, form, isTutorView, staffMembers]); // Add staffMembers to dependency array

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {!isTutorView && (
              <FormField control={form.control} name="tutorName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}> {/* Use value for controlled component */}
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a tutor" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {staffMembers.filter(s => s.is_tutor).map(tutor => <SelectItem key={tutor.id} value={tutor.name}>{tutor.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="batch" render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch</FormLabel>
                  <Select onValueChange={handleBatchChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a batch" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {batches.map(batch => <SelectItem key={batch} value={batch}>{batch}-{parseInt(batch) + 4}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="semester" render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="john.doe@example.com" type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
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
  );
};