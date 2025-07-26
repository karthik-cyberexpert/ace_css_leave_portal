import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

const initialLeaveRequests = [
  { id: 'leave-1', studentName: 'Bob Williams', startDate: '2023-11-05', endDate: '2023-11-08', totalDays: 4, description: 'Requesting leave to attend my cousin\'s wedding out of town.', status: 'Forwarded' },
  { id: 'leave-2', studentName: 'Eve Davis', startDate: '2023-11-18', endDate: '2023-11-21', totalDays: 4, description: 'Family trip to visit grandparents.', status: 'Forwarded' },
  { id: 'leave-3', studentName: 'Alice Johnson', startDate: '2023-11-01', endDate: '2023-11-02', totalDays: 2, description: 'Urgent personal matters.', status: 'Pending' },
  { id: 'leave-4', studentName: 'Diana Miller', startDate: '2023-11-12', endDate: '2023-11-15', totalDays: 4, description: 'Going on a short vacation with my family.', status: 'Approved' },
];

type LeaveRequest = typeof initialLeaveRequests[0];
type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Forwarded' | 'Cancelled';

const AdminLeaveApprovePage = () => {
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const handleRequestAction = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    showSuccess(`Request has been ${newStatus.toLowerCase()}!`);
    setSelectedRequest(null);
  };

  return (
    <AdminLayout>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">Admin Leave Management</CardTitle>
          <CardDescription>Review, approve, or reject all student leave requests, including those forwarded by tutors.</CardDescription>
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
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.studentName}</TableCell>
                    <TableCell>{request.startDate} to {request.endDate}</TableCell>
                    <TableCell className="text-right">{request.totalDays}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", request.status === 'Approved' && 'bg-green-100 text-green-800', request.status === 'Pending' && 'bg-yellow-100 text-yellow-800', request.status === 'Rejected' && 'bg-red-100 text-red-800', request.status === 'Forwarded' && 'bg-blue-100 text-blue-800')}>
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {request.status === 'Pending' || request.status === 'Forwarded' ? (
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
                <DialogDescription>From: <strong>{selectedRequest.studentName}</strong></DialogDescription>
              </DialogHeader>
              <div className="py-4">{selectedRequest.description}</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleRequestAction(selectedRequest.id, 'Rejected')}>Reject</Button>
                <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleRequestAction(selectedRequest.id, 'Approved')}>Approve</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLeaveApprovePage;