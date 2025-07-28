import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { useAppContext, LeaveRequest, RequestStatus } from '@/context/AppContext';
import { format, parseISO } from 'date-fns';

const AdminLeaveApprovePage = () => {
  const { leaveRequests, updateLeaveRequestStatus, approveRejectLeaveCancellation } = useAppContext();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const handleRequestAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    await updateLeaveRequestStatus(id, newStatus);
    showSuccess(`Request has been ${newStatus.toLowerCase()}!`);
    setSelectedRequest(null);
  };

  const handleCancellationAction = async (id: string, approve: boolean) => {
    await approveRejectLeaveCancellation(id, approve);
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: RequestStatus) => {
    const colorClasses = {
      'Approved': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800',
      'Forwarded': 'bg-blue-100 text-blue-800',
      'Cancellation Pending': 'bg-purple-100 text-purple-800',
    };
    return <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", colorClasses[status] || 'bg-gray-100 text-gray-800')}>{status}</span>;
  };

  return (
    <AdminLayout>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">Admin Leave Management</CardTitle>
          <CardDescription>Review, approve, or reject all student leave requests, including those forwarded by tutors and cancellation requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>{request.student_name}</div>
                      <div className="text-xs text-muted-foreground">[{request.student_register_number}]</div>
                    </TableCell>
                    <TableCell>{format(parseISO(request.start_date), 'MMMM d yyyy')} to {format(parseISO(request.end_date), 'MMMM d yyyy')}</TableCell>
                    <TableCell className="text-right">{request.total_days}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {request.status === 'Approved' ? (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleRequestAction(request.id, 'Rejected')}
                        >
                          Reject
                        </Button>
                      ) : (request.status === 'Pending' || request.status === 'Forwarded' || request.status === 'Cancellation Pending') ? (
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>Review</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No actions</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                {selectedRequest.status === 'Cancellation Pending' ? (
                  <>
                    <Button variant="destructive" onClick={() => handleCancellationAction(selectedRequest.id, false)}>Reject Cancellation</Button>
                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleCancellationAction(selectedRequest.id, true)}>Approve Cancellation</Button>
                  </>
                ) : (
                  <>
                    <Button variant="destructive" onClick={() => handleRequestAction(selectedRequest.id, 'Rejected')}>Reject</Button>
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