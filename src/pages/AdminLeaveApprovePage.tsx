import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { useAppContext, LeaveRequest, RequestStatus } from '@/context/AppContext';
import { format, parseISO, differenceInDays } from 'date-fns';

const AdminLeaveApprovePage = () => {
  const { leaveRequests, updateLeaveRequestStatus, approveRejectLeaveCancellation, students } = useAppContext();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isRevocation, setIsRevocation] = useState(false);

  const handleRequestAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      if (newStatus === 'Rejected') {
        await updateLeaveRequestStatus(id, newStatus, rejectionReason);
      } else {
        await updateLeaveRequestStatus(id, newStatus);
      }
      showSuccess(`Request has been ${newStatus.toLowerCase()}!`);
      setSelectedRequest(null);
      setRejectionReason('');
      setShowRejectionInput(false);
      setIsRevocation(false);
    } catch (error: any) {
      console.error('Error updating request status:', error);
      // Don't close dialog on error so user can see what happened
    }
  };

  const handleRejectClick = () => {
    setIsRevocation(false);
    setShowRejectionInput(true);
  };

  const handleRevokeClick = () => {
    setIsRevocation(true);
    setShowRejectionInput(true);
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      showError(`Please provide a reason for ${isRevocation ? 'revocation' : 'rejection'}.`);
      return;
    }
    handleRequestAction(selectedRequest!.id, 'Rejected');
  };

  const handleCancellationAction = async (id: string, approve: boolean) => {
    await approveRejectLeaveCancellation(id, approve);
    setSelectedRequest(null);
  };

  const getStudentInfo = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? { batch: student.batch, semester: student.semester } : { batch: 'N/A', semester: 'N/A' };
  };

  const getDurationTypeLabel = (durationType: string, totalDays: number | string) => {
    // Convert totalDays to number for comparison
    const numericTotalDays = parseFloat(String(totalDays));
    
    // If total_days is 0.5, it's definitely a half-day regardless of durationType
    if (numericTotalDays === 0.5) {
      switch (durationType) {
        case 'half_day_forenoon':
          return 'Half Day (Morning)';
        case 'half_day_afternoon':
          return 'Half Day (Afternoon)';
        default:
          return 'Half Day';
      }
    }
    
    // For other values, use the duration type or default to Full Day
    switch (durationType) {
      case 'full_day':
        return 'Full Day';
      case 'half_day_forenoon':
        return 'Half Day (Morning)';
      case 'half_day_afternoon':
        return 'Half Day (Afternoon)';
      default:
        return 'Full Day';
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    const colorClasses = {
      'Approved': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800',
      'Forwarded': 'bg-blue-100 text-blue-800',
      'Cancellation Pending': 'bg-purple-100 text-purple-800',
      'Retried': 'bg-orange-100 text-orange-800',
    };
    return <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", colorClasses[status] || 'bg-gray-100 text-gray-800')}>{status}</span>;
  };

  return (
    <AdminLayout>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">Admin Leave Management</CardTitle>
          <CardDescription>Review, approve, or reject student leave requests that have been forwarded by tutors.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Batch</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-center">Duration Type</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.filter(request => {
                  // Show Approved requests
                  if (request.status === 'Approved') return true;
                  // Show Forwarded requests
                  if (request.status === 'Forwarded') return true;
                  // Show Cancelled requests for record keeping
                  if (request.status === 'Cancelled') return true;
                  // Show Rejected requests for record keeping
                  if (request.status === 'Rejected') return true;
                  // Show Cancellation Pending requests
                  if (request.status === 'Cancellation Pending') return true;
                  // Show Retried requests
                  if (request.status === 'Retried') return true;
                  // For Pending requests, only show if older than 2 days
                  if (request.status === 'Pending') {
                    const daysSinceCreated = differenceInDays(new Date(), parseISO(request.created_at));
                    return daysSinceCreated >= 2;
                  }
                  return false;
                }).map((request) => {
                  const studentInfo = getStudentInfo(request.student_id);
                  return (
                    <TableRow key={request.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div>{request.student_name}</div>
                        <div className="text-xs text-muted-foreground">[{request.student_register_number}]</div>
                      </TableCell>
                      <TableCell className="text-center">{studentInfo.batch}-{studentInfo.batch !== 'N/A' ? parseInt(studentInfo.batch) + 4 : 'N/A'}</TableCell>
                      <TableCell className="text-center">{studentInfo.semester}</TableCell>
                      <TableCell>{format(parseISO(request.start_date), 'MMMM d yyyy')}</TableCell>
                      <TableCell>{format(parseISO(request.end_date), 'MMMM d yyyy')}</TableCell>
                      <TableCell className="text-right">{typeof request.total_days === 'number' ? request.total_days.toFixed(1) : request.total_days}</TableCell>
                    <TableCell className="text-center text-sm">
                      {getDurationTypeLabel((request as any).duration_type || 'full_day', request.total_days)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {request.status === 'Approved' ? (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => {
                            setSelectedRequest(request);
                            handleRevokeClick();
                          }}
                        >
                          Revoke
                        </Button>
                      ) : (request.status === 'Pending' || request.status === 'Forwarded' || request.status === 'Retried' || request.status === 'Cancellation Pending') ? (
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>Review</Button>
                      ) : (request.status === 'Rejected' || request.status === 'Cancelled') ? (
                        <span className="text-xs text-muted-foreground">Completed</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No actions</span>
                      )}
                    </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedRequest(null);
          setRejectionReason('');
          setShowRejectionInput(false);
          setIsRevocation(false);
        }
      }}>
        <DialogContent>
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Leave Request Details</DialogTitle>
                <DialogDescription>From: <strong>{selectedRequest.student_name}</strong> [{selectedRequest.student_register_number}]</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Dates</span>
                  <p>{format(parseISO(selectedRequest.start_date), 'MMMM d yyyy')} to {format(parseISO(selectedRequest.end_date), 'MMMM d yyyy')} ({selectedRequest.total_days} days)</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Subject</span>
                  <p>{selectedRequest.subject}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Description</span>
                  <p>{selectedRequest.description}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                {selectedRequest.original_status && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Original Status</span>
                    {getStatusBadge(selectedRequest.original_status)}
                  </div>
                )}
                {selectedRequest.cancel_reason && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Cancellation Reason</span>
                    <p>{selectedRequest.cancel_reason}</p>
                  </div>
                )}
                {showRejectionInput && (
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Reason for {isRevocation ? 'Revocation' : 'Rejection'}*</Label>
                    <Textarea 
                      id="rejection-reason" 
                      placeholder={`Please provide a reason for ${isRevocation ? 'revoking this approved request' : 'rejecting this request'}...`}
                      value={rejectionReason} 
                      onChange={(e) => setRejectionReason(e.target.value)} 
                      rows={3} 
                      className="resize-none"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                  setShowRejectionInput(false);
                  setIsRevocation(false);
                }}>Cancel</Button>
                {selectedRequest.status === 'Cancellation Pending' ? (
                  <>
                    <Button variant="destructive" onClick={() => handleCancellationAction(selectedRequest.id, false)}>Reject Cancellation</Button>
                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleCancellationAction(selectedRequest.id, true)}>Approve Cancellation</Button>
                  </>
                ) : showRejectionInput ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectionInput(false);
                        setRejectionReason('');
                        setIsRevocation(false);
                      }}
                    >
                      Cancel {isRevocation ? 'Revocation' : 'Rejection'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectionSubmit}
                      disabled={!rejectionReason.trim()}
                    >
                      Confirm {isRevocation ? 'Revocation' : 'Rejection'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="destructive" onClick={handleRejectClick}>Reject</Button>
                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleRequestAction(selectedRequest.id, 'Approved')}>Approve</Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLeaveApprovePage;