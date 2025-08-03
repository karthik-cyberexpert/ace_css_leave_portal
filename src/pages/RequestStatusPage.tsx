import React, { useState, useMemo } from 'react';
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

type CombinedRequest = (LeaveRequest & { type: 'Leave' }) | (ODRequest & { type: 'OD' });

const RequestStatusPage = () => {
  const { leaveRequests, odRequests, requestLeaveCancellation, requestODCancellation, currentUser, uploadODCertificate, updateLeaveRequestStatus, updateODRequestStatus } = useAppContext();
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

  const canRequestCancellation = selectedRequestForReview && 
    (selectedRequestForReview.status === 'Pending' || 
     selectedRequestForReview.status === 'Approved' || 
     selectedRequestForReview.status === 'Forwarded');

  const canUploadCertificate = selectedRequestForReview?.type === 'OD' && 
    selectedRequestForReview.status === 'Approved' && 
    selectedRequestForReview.certificate_status === 'Pending Upload';

  const canRetryRequest = selectedRequestForReview?.status === 'Rejected';

  return (
    <Layout>
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
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.type}</TableCell>
                    <TableCell>{request.subject}</TableCell>
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