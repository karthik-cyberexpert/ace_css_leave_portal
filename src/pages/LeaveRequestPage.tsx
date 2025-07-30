import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInCalendarDays, format } from 'date-fns';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/datepicker';
import { showSuccess } from '@/utils/toast';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';

const leaveRequestSchema = z.object({
  startDate: z.date({
    required_error: "A start date is required.",
  }),
  endDate: z.date({
    required_error: "An end date is required.",
  }),
  subject: z.string().min(5, "Subject must be at least 5 characters long.").max(100, "Subject must be 100 characters or less."),
  description: z.string().min(10, "Description must be at least 10 characters long.").max(500, "Description must be 500 characters or less."),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const days = differenceInCalendarDays(data.endDate, data.startDate) + 1;
    return days <= 10;
  }
  return true;
}, {
  message: "Leave duration cannot exceed 10 days.",
  path: ["endDate"],
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

const LeaveRequestPage = () => {
  const { addLeaveRequest, userProfile } = useAppContext();
  const { getCurrentActiveSemester, isDateWithinSemester, getSemesterDateRange } = useBatchContext();
  const [totalDays, setTotalDays] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<number | null>(null);
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      subject: '',
      description: '',
    }
  });

  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  // Get current semester when user profile loads
  useEffect(() => {
    if (userProfile?.student?.batch) {
      const activeSemester = getCurrentActiveSemester(userProfile.student.batch);
      setCurrentSemester(activeSemester);
    }
  }, [userProfile, getCurrentActiveSemester]);

  useEffect(() => {
    if (startDate && endDate && endDate >= startDate) {
      let days = differenceInCalendarDays(endDate, startDate) + 1;
      let currentDate = startDate;
      while (currentDate <= endDate) {
        if (currentDate.getDay() === 0) {
          days--;
        }
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setTotalDays(days);
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate]);

  const onSubmit = async (data: LeaveRequestFormValues) => {
    setIsSubmitting(true);
    const requestData = {
      subject: data.subject,
      description: data.description,
      start_date: format(data.startDate, 'yyyy-MM-dd'),
      end_date: format(data.endDate, 'yyyy-MM-dd'),
      total_days: totalDays,
    };
    try {
      await addLeaveRequest(requestData as any);
      showSuccess('Leave request submitted successfully!');
      form.reset();
      setTotalDays(0);
    } catch (error) {
      console.error("Failed to submit leave request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Card className="w-full max-w-4xl mx-auto transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">Leave Request Form</CardTitle>
          <CardDescription>Fill out the form below to request time off.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // Disable past dates
                          if (date < today) return true;
                          
                          // If we have a current semester and student batch, validate against semester dates
                          if (currentSemester && userProfile?.student?.batch) {
                            const semesterRange = getSemesterDateRange(userProfile.student.batch, currentSemester);
                            if (semesterRange) {
                              const semesterStart = new Date(semesterRange.start);
                              semesterStart.setHours(0, 0, 0, 0);
                              
                              // Date must be on or after semester start
                              if (date < semesterStart) return true;
                              
                              // If semester has an end date, date must be before or on end date
                              if (semesterRange.end && semesterRange.end.getTime() !== 8640000000000000) {
                                const semesterEnd = new Date(semesterRange.end);
                                semesterEnd.setHours(23, 59, 59, 999);
                                if (date > semesterEnd) return true;
                              }
                            }
                          }
                          
                          return false;
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // Disable dates before start date or before today
                          const minDate = startDate || today;
                          if (date < minDate) return true;
                          
                          // If we have a current semester and student batch, validate against semester dates
                          if (currentSemester && userProfile?.student?.batch) {
                            const semesterRange = getSemesterDateRange(userProfile.student.batch, currentSemester);
                            if (semesterRange) {
                              // If semester has an end date, date must be before or on end date
                              if (semesterRange.end && semesterRange.end.getTime() !== 8640000000000000) {
                                const semesterEnd = new Date(semesterRange.end);
                                semesterEnd.setHours(23, 59, 59, 999);
                                if (date > semesterEnd) return true;
                              }
                            }
                          }
                          
                          return false;
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="totalDays">Total Number of Days</FormLabel>
                <Input
                  id="totalDays"
                  type="number"
                  value={totalDays}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Family Vacation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a brief reason for your leave."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button variant="outline" type="button" asChild>
                  <Link to="/dashboard">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default LeaveRequestPage;