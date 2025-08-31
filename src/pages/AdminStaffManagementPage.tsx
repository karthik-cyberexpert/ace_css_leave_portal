import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as HookFormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext, Staff } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits.").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
  is_admin: z.boolean().default(false),
  is_tutor: z.boolean().default(false),
}).refine(data => data.is_admin || data.is_tutor, {
  message: "A staff member must have at least one role (Admin or Tutor).",
  path: ["is_admin"],
});

type StaffFormValues = z.infer<typeof staffSchema>;

const AdminStaffManagementPage = () => {
  const { staff, addStaff, updateStaff, students, assignBatchToTutor, role, profile, refreshData } = useAppContext();
  const { getAvailableBatches } = useBatchContext();
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for batch-semester assignment per tutor
  const [assignmentState, setAssignmentState] = useState<Record<string, { batch: string; semester: number | null }>>({});

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', email: '', username: '', mobile: '', password: '', is_admin: false, is_tutor: false },
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingStaff) {
        form.reset({
          name: editingStaff.name,
          email: editingStaff.email,
          username: editingStaff.username,
          mobile: editingStaff.mobile || '',
          password: '',
          is_admin: editingStaff.is_admin,
          is_tutor: editingStaff.is_tutor,
        });
      } else {
        form.reset({ name: '', email: '', username: '', mobile: '', password: '', is_admin: false, is_tutor: false });
      }
    }
  }, [editingStaff, isDialogOpen, form]);

  const handleAddNew = () => {
    setEditingStaff(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (staffToDelete) {
      // Delete functionality disabled for security
      showError("Delete functionality is disabled for security reasons.");
      setStaffToDelete(null);
    }
  };

  // Helper functions for batch/semester assignment
  const handleBatchChange = (memberId: string, batch: string) => {
    setAssignmentState(prev => ({
      ...prev,
      [memberId]: { batch, semester: null }
    }));
  };

  const handleSemesterChange = (memberId: string, semester: number) => {
    setAssignmentState(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], semester }
    }));
  };

  const handleAssignBatch = async (memberId: string) => {
    const assignment = assignmentState[memberId];
    if (assignment?.batch && assignment?.semester) {
      // Check if another tutor is already assigned to this batch-semester combination
      const existingAssignment = staff.find(
        (s) => s.id !== memberId && 
               s.assigned_batch === assignment.batch && 
               s.assigned_semester === assignment.semester
      );
      
      if (existingAssignment) {
        showError(`${existingAssignment.name} is already assigned to batch ${assignment.batch} semester ${assignment.semester}`);
        return;
      }
      
      try {
        await assignBatchToTutor(memberId, assignment.batch, assignment.semester);
        // Clear assignment state for this member
        setAssignmentState(prev => {
          const { [memberId]: removed, ...rest } = prev;
          return rest;
        });
        
        // Refresh data to make sure the UI reflects the latest updates
        await refreshData();
      } catch (error) {
        console.error('Failed to assign batch to tutor:', error);
      }
    }
  };

  const handleRemoveAssignment = async (memberId: string) => {
    try {
      await updateStaff(memberId, {
        assigned_batch: null,
        assigned_semester: null,
      });
      
      showSuccess('Assignment removed successfully!');
      
      // Refresh data to reflect the changes
      await refreshData();
    } catch (error) {
      console.error('Failed to remove assignment:', error);
    }
  };

  const onSubmit = (data: StaffFormValues) => {
    if (editingStaff) {
      const { password, ...restOfData } = data;
      const staffData: Partial<Staff> = { ...restOfData };
      
      // Include password in the update if it's provided
      if (password && password.trim() !== '') {
        (staffData as any).password = password;
      }
      
      updateStaff(editingStaff.id, staffData);
    } else {
      if (!data.password) {
        form.setError("password", { type: "manual", message: "Password is required for new staff." });
        return;
      }
      addStaff(data as Omit<Staff, 'id'>);
    }
    setIsDialogOpen(false);
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold">Staff Management</CardTitle>
            <CardDescription>View, add, edit, or remove staff members from the portal.</CardDescription>
          </div>
          <Button onClick={handleAddNew} className="w-full md:w-auto">
            <UserPlus className="mr-2 h-4 w-4" /> Add Staff
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Roles</TableHead>
                  <TableHead className="text-center">Current Assignment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => {
                  const currentAssignment = assignmentState[member.id];
                  const availableBatches = getAvailableBatches();
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="text-center space-x-2">
                        {Boolean(member.is_admin) && <Badge variant="default">Admin</Badge>}
                        {Boolean(member.is_tutor) && <Badge variant="secondary">Tutor</Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        {member.assigned_batch && member.assigned_semester ? (
                          <Badge variant="outline">
                            {member.assigned_batch} - Sem {member.assigned_semester}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Only show assignment controls for tutors who are not admins */}
                          {Boolean(member.is_tutor) && !Boolean(member.is_admin) && (
                            <>
                              {/* If tutor already has an assignment, show remove button */}
                              {member.assigned_batch && member.assigned_semester ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(member.id)}
                                  className="transition-transform hover:scale-105 text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  Remove Assignment
                                </Button>
                              ) : (
                                /* If no assignment, show assignment controls */
                                <>
                                  <Select 
                                    onValueChange={(value) => handleBatchChange(member.id, value)}
                                    value={currentAssignment?.batch || ''}
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue placeholder="Batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableBatches.map((batch) => (
                                        <SelectItem key={batch.id} value={batch.id}>
                                          {batch.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  {currentAssignment?.batch && (
                                    <Select 
                                      onValueChange={(value) => handleSemesterChange(member.id, parseInt(value))}
                                      value={currentAssignment?.semester?.toString() || ''}
                                    >
                                      <SelectTrigger className="w-28">
                                        <SelectValue placeholder="Semester" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 8 }, (_, i) => i + 1).map((semester) => (
                                          <SelectItem key={semester} value={semester.toString()}>
                                            Semester {semester}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleAssignBatch(member.id)}
                                    disabled={!currentAssignment?.batch || !currentAssignment?.semester}
                                    className="transition-transform hover:scale-105"
                                  >
                                    Assign
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(member)} 
                            className="transition-transform hover:scale-105"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setStaffToDelete(member.id)} 
                            className="transition-transform hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update the details and roles for this staff member.' : 'Create a new staff account and assign their roles.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="jane.s@college.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="jane.smith" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><div className="relative"><FormControl><Input type={showPassword ? 'text' : 'password'} placeholder={editingStaff ? 'Leave blank to keep current password' : '••••••••'} {...field} /></FormControl><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</Button></div><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="is_admin" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Administrator</FormLabel><HookFormDescription>Grants full access to all portal features.</HookFormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="is_tutor" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Tutor</FormLabel><HookFormDescription>Can manage assigned students and their requests.</HookFormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />

              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{editingStaff ? 'Save Changes' : 'Add Staff'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!staffToDelete} onOpenChange={() => setStaffToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the staff member's account.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminStaffManagementPage;



