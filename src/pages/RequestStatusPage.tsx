﻿import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext, LeaveRequest, ODRequest, RequestStatus, CertificateStatus } from '@/context/AppContext';
import { format, parseISO, differenceInDays } from 'date-fns'; // Import format, parseISO, and differenceInDays for displaying dates
import { useSearchParams } from 'react-router-dom';

type CombinedRequest = (LeaveRequest & { type: 'Leave' }) | (ODRequest & { type: 'OD' });

const RequestStatusPage = () => {
  const { leaveRequests, odRequests, requestLeaveCancellation, requestODCancellation, currentUser, uploadODCertificate, updateLeaveRequestStatus, updateODRequestStatus } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if the current user is inactive
  const isUserInactive = !currentUser?.is_active;
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<CombinedRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [cancelStartDate, setCancelStartDate] = useState('');
  const [cancelEndDate, setCancelEndDate] = useState('');
  const [isPartialCancellation, setIsPartialCancellation] = useState(false);

  const allRequests = useMemo(() => {
    if (!currentUser?.id || !Array.isArray(leaveRequests) || !Array.isArray(odRequests)) {
      return [];
    }
    
    const studentLeaveRequests = leaveRequests.filter(r => r.student_id === currentUser.id);
    const studentODRequests = odRequests.filter(r => r.student_id === currentUser.id);

    const combined: CombinedRequest[] = [
      ...studentLeaveRequests.map(r => ({ ...r, type: 'Leave' as const, subject: r.subject })),
      ...studentODRequests.map(r => ({ ...r, type: 'OD' as const, subject: r.purpose })),
    ];
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Sort by created_at for latest first
  }, [leaveRequests, odRequests, currentUser?.id]);

  // Handle URL highlight parameter
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && allRequests.length > 0) {
      const requestToHighlight = allRequests.find(request => request.id.toString() === highlightId);
      if (requestToHighlight) {
        setSelectedRequestForReview(requestToHighlight);
      }
    }
  }, [searchParams, allRequests]);

  const handleRequestCancellation = async () => {
    if (!selectedRequestForReview || !cancelReason.trim()) return;
    
    let cancellationData = { reason: cancelReason };
    
    // For partial leave cancellations, include date range
    if (selectedRequestForReview.type === 'Leave' && isPartialCancellation && cancelStartDate && cancelEndDate) {
      cancellationData = {
        ...cancellationData,
        startDate: cancelStartDate,
        endDate: cancelEndDate,
        isPartial: true
      };
    }
    
    if (selectedRequestForReview.type === 'Leave') {
      await requestLeaveCancellation(selectedRequestForReview.id, cancelReason, cancellationData);
    } else {
      await requestODCancellation(selectedRequestForReview.id, cancelReason);
    }
    setSelectedRequestForReview(null);
    setCancelReason('');
    setCancelStartDate('');
    setCancelEndDate('');
    setIsPartialCancellation(false);
  };

  const handleRetryRequest = async () => {
    if (!selectedRequestForReview) return;
    
    try {
      if (selectedRequestForReview.type === 'Leave') {
        await updateLeaveRequestStatus(selectedRequestForReview.id, 'Retried');
      } else {
        await updateODRequestStatus(selectedRequestForReview.id, 'Retried');
      }
      showSuccess('Request retried successfully! Status changed to Retried.');
      setSelectedRequestForReview(null);
    } catch (error) {
      console.error('Failed to retry request:', error);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedRequestForReview || selectedRequestForReview.type !== 'OD' || !uploadFile) return;
    
    try {
      await uploadODCertificate(selectedRequestForReview.id, uploadFile);
      showSuccess('Certificate uploaded for verification!');
      setSelectedRequestForReview(null);
      setUploadFile(null);
    } catch (error) {
      console.error('Failed to upload certificate:', error);
    }
  };

  const getStatusBadge = (status: RequestStatus, certStatus?: CertificateStatus) => {
    const statusText = certStatus ? `${status} (${certStatus})` : status;
    const colorClasses = {
      'Approved': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800',
      'Forwarded': 'bg-blue-100 text-blue-800',
      'Cancellation Pending': 'bg-purple-100 text-purple-800',
      'Retried': 'bg-orange-100 text-orange-800',
      'Pending Upload': 'bg-orange-100 text-orange-800',
      'Pending Verification': 'bg-purple-100 text-purple-800',
      'Overdue': 'bg-red-200 text-red-900',
    };
    return <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", colorClasses[status as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800')}>{statusText}</span>;
  };

  const canRequestCancellation = !isUserInactive && selectedRequestForReview && 
    (selectedRequestForReview.status === 'Pending' || 
     selectedRequestForReview.status === 'Approved' || 
     selectedRequestForReview.status === 'Forwarded') &&
    (() => {
      // Only allow cancellation if the last date hasn't passed
      const requestEndDate = new Date(selectedRequestForReview.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      requestEndDate.setHours(0, 0, 0, 0);
      return today <= requestEndDate;
    })();

  const canUploadCertificate = !isUserInactive && selectedRequestForReview?.type === 'OD' && 
    selectedRequestForReview.status === 'Approved' && 
    selectedRequestForReview.certificate_status === 'Pending Upload';
    // No deadline restriction - users can upload certificates anytime

  const canRetryRequest = !isUserInactive && selectedRequestForReview?.status === 'Rejected' &&
    (() => {
      // Only allow retry if the last date hasn't passed
      const requestEndDate = new Date(selectedRequestForReview.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      requestEndDate.setHours(0, 0, 0, 0);
      return today <= requestEndDate;
    })();

  return (
    <Layout>
      {isUserInactive && (
        <div className="mb-6">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Account Inactive - Limited Access
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm">
              You can view your request status but cannot perform actions like canceling requests, uploading certificates, or retrying requests.
            </p>
          </div>
        </div>
      )}
      <Card className="w-full max-w-6xl mx-auto transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">Request Status</CardTitle>
          <CardDescription>View the status of all your submitted leave and OD requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject/Purpose</TableHead>
                  <TableHead className="text-center">Start Date</TableHead>
                  <TableHead className="text-center">End Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.type}</TableCell>
                    <TableCell>{request.subject}</TableCell>
                    <TableCell className="text-center">{format(parseISO(request.start_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-center">{format(parseISO(request.end_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(request.status, request.type === 'OD' ? request.certificate_status : undefined)}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedRequestForReview(request)}>Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review/Action Dialog */}
      <Dialog open={!!selectedRequestForReview} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedRequestForReview(null);
          setCancelReason('');
          setUploadFile(null);
          setCancelStartDate('');
          setCancelEndDate('');
          setIsPartialCancellation(false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedRequestForReview && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRequestForReview.type} Request Details</DialogTitle>
                <DialogDescription>From: <strong>{selectedRequestForReview.student_name}</strong></DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Dates</span>
                  <p>{format(parseISO(selectedRequestForReview.start_date), 'MMMM d yyyy')} to {format(parseISO(selectedRequestForReview.end_date), 'MMMM d yyyy')} ({selectedRequestForReview.total_days} days)</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Subject/Purpose</span>
                  <p>{selectedRequestForReview.subject}</p>
                </div>
                {selectedRequestForReview.type === 'OD' && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Destination</span>
                    <p>{selectedRequestForReview.destination}</p>
                  </div>
                )}
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Description</span>
                  <p>{selectedRequestForReview.description}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                  {getStatusBadge(selectedRequestForReview.status, selectedRequestForReview.type === 'OD' ? selectedRequestForReview.certificate_status : undefined)}
                </div>
                {selectedRequestForReview.original_status && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Original Status</span>
                    {getStatusBadge(selectedRequestForReview.original_status)}
                  </div>
                )}
                {selectedRequestForReview.cancel_reason && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Cancellation Reason</span>
                    <p>{selectedRequestForReview.cancel_reason}</p>
                  </div>
                )}

                {/* Show info when actions are blocked by date validation */}
                {selectedRequestForReview && (() => {
                  const requestEndDate = new Date(selectedRequestForReview.end_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  requestEndDate.setHours(0, 0, 0, 0);
                  const dateHasPassed = today > requestEndDate;
                  
                  // Show message when retry is blocked by date
                  const wouldShowRetryButBlocked = selectedRequestForReview.status === 'Rejected' && dateHasPassed && !isUserInactive;
                  // Show message when cancellation is blocked by date
                  const wouldShowCancelButBlocked = 
                    (selectedRequestForReview.status === 'Pending' || 
                     selectedRequestForReview.status === 'Approved' || 
                     selectedRequestForReview.status === 'Forwarded') && 
                    selectedRequestForReview.status !== 'Cancellation Pending' && 
                    dateHasPassed && !isUserInactive;
                  
                  if (wouldShowRetryButBlocked || wouldShowCancelButBlocked) {
                    return (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          <strong className="flex items-center mb-1">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Actions Not Available
                          </strong>
                          {wouldShowRetryButBlocked && 'Retry action is not available because the leave/OD end date has already passed.'}
                          {wouldShowCancelButBlocked && 'Cancellation is not available because the leave/OD end date has already passed.'}
                          <br />
                          <span className="text-xs">
                            End date: {format(parseISO(selectedRequestForReview.end_date), 'MMMM d, yyyy')}
                          </span>
                        </p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}

                {/* Conditional input for cancellation reason or certificate upload */}
                {canRequestCancellation && selectedRequestForReview.status !== 'Cancellation Pending' && (
                  <div className="space-y-4">
                    {selectedRequestForReview.type === 'Leave' && selectedRequestForReview.status === 'Approved' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="partial-cancellation"
                          checked={isPartialCancellation}
                          onChange={(e) => setIsPartialCancellation(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="partial-cancellation" className="text-sm font-medium">
                          Request partial cancellation (specify date range)
                        </Label>
                      </div>
                    )}
                    
                    {isPartialCancellation && selectedRequestForReview.type === 'Leave' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cancel-start-date">Cancel From Date</Label>
                          <Input
                            id="cancel-start-date"
                            type="date"
                            value={cancelStartDate}
                            onChange={(e) => setCancelStartDate(e.target.value)}
                            min={selectedRequestForReview.start_date}
                            max={selectedRequestForReview.end_date}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cancel-end-date">Cancel To Date</Label>
                          <Input
                            id="cancel-end-date"
                            type="date"
                            value={cancelEndDate}
                            onChange={(e) => setCancelEndDate(e.target.value)}
                            min={cancelStartDate || selectedRequestForReview.start_date}
                            max={selectedRequestForReview.end_date}
                          />
                        </div>
                      </div>
                    )}
                    
                    {isPartialCancellation && cancelStartDate && cancelEndDate && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>Days to cancel:</strong> {differenceInDays(new Date(cancelEndDate), new Date(cancelStartDate)) + 1} days
                          <br />
                          <strong>From:</strong> {format(new Date(cancelStartDate), 'MMMM d, yyyy')}
                          <br />
                          <strong>To:</strong> {format(new Date(cancelEndDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
                      <Textarea 
                        id="cancel-reason" 
                        placeholder="Type your reason here..." 
                        value={cancelReason} 
                        onChange={(e) => setCancelReason(e.target.value)} 
                        rows={3} 
                      />
                    </div>
                  </div>
                )}
                {canUploadCertificate && (
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="certificate-file">Upload Certificate</Label>
                    <Input id="certificate-file" type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                {canUploadCertificate ? (
                  <Button onClick={handleUploadSubmit} disabled={!uploadFile}>Upload Certificate</Button>
                ) : canRequestCancellation && selectedRequestForReview.status !== 'Cancellation Pending' ? (
                  <Button 
                    variant="destructive" 
                    onClick={handleRequestCancellation} 
                    disabled={!cancelReason.trim() || (isPartialCancellation && (!cancelStartDate || !cancelEndDate))}
                  >
                    Request Cancellation
                  </Button>
                ) : canRetryRequest && (
                  <Button onClick={handleRetryRequest}>Retry Request</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default RequestStatusPage;

