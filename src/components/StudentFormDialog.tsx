import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Student, Staff } from '@/context/AppContext'; // Import Staff type

const studentFormSchema = (isEditing: boolean) => z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  registerNumber: z.string().min(3, "Register number is required."),
  tutorName: z.string({ required_error: "Please select a tutor." }),
  batch: z.string({ required_error: "Please select a batch." }),
  semester: z.number({ required_error: "Please select a semester." }).min(1).max(8),
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
  profilePhoto: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
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
  const [photoInputMode, setPhotoInputMode] = useState<'url' | 'upload'>('url');

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema(!!editingStudent)),
    defaultValues: { name: '', registerNumber: '', tutorName: '', year: '', username: '', password: '', profilePhoto: '' },
  });

  useEffect(() => {
    if (open) {
      if (editingStudent) {
        // Find tutor name from tutor_id
        const currentTutorName = staffMembers.find(t => t.id === editingStudent.tutor_id)?.name || '';
        form.reset({ 
          ...editingStudent, 
          tutorName: currentTutorName, // Set tutorName for the form
          password: '', 
          profilePhoto: editingStudent.profile_photo || '' // Use profile_photo from Student
        });
        setPhotoInputMode(editingStudent.profile_photo?.startsWith('blob:') ? 'upload' : 'url'); // Use profile_photo
      } else {
        const defaultTutorName = isTutorView && staffMembers.length > 0 
          ? staffMembers.filter(s => s.is_tutor)[0]?.name || '' 
          : '';
        form.reset({ 
          name: '', 
          registerNumber: '', 
          tutorName: defaultTutorName, 
          year: '', 
          username: '', 
          password: '', 
          profilePhoto: '' 
        });
        setPhotoInputMode('url');
      }
    }
  }, [editingStudent, open, form, isTutorView, staffMembers]); // Add staffMembers to dependency array

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      const photoUrl = form.getValues('profilePhoto');
      if (photoUrl && photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
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
            <FormField
              control={form.control}
              name="profilePhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo</FormLabel>
                  <ToggleGroup
                    type="single"
                    value={photoInputMode}
                    onValueChange={(value: 'url' | 'upload') => {
                      if (value) {
                        if (field.value?.startsWith('blob:')) URL.revokeObjectURL(field.value);
                        field.onChange('');
                        setPhotoInputMode(value);
                      }
                    }}
                    className="mb-2"
                  >
                    <ToggleGroupItem value="url">URL</ToggleGroupItem>
                    <ToggleGroupItem value="upload">Upload</ToggleGroupItem>
                  </ToggleGroup>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      {photoInputMode === 'url' ? (
                        <FormControl>
                          <Input placeholder="https://example.com/photo.png" {...field} />
                        </FormControl>
                      ) : (
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (field.value?.startsWith('blob:')) URL.revokeObjectURL(field.value);
                                const newUrl = URL.createObjectURL(file);
                                field.onChange(newUrl);
                              }
                            }}
                          />
                        </FormControl>
                      )}
                    </div>
                    <Avatar>
                      <AvatarImage src={field.value} />
                      <AvatarFallback><UserPlus /></AvatarFallback>
                    </Avatar>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
  );
};