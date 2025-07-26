import React, { useState } from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

// Dummy data for leave requests with more detailed descriptions
const initialLeaveRequests = [
  {
    id: 'leave-1',
    studentName: 'Alice Johnson',
    startDate: '2023-11-01',
    endDate: '2023-11-02',
    totalDays: 2,
    description: 'I need to take two days off for some urgent personal matters that require my attention.',
    status: 'Pending',
  },
  {
    id: 'leave-2',
    studentName: 'Bob Williams',
    startDate: '2023-11-05',
    endDate: '2023-11-08',
    totalDays: 4,
    description: 'Requesting leave to attend my cousin\'s wedding out of town. I will be back on the 9th.',
    status: 'Pending',
  },
  {
    id: 'leave-3',
    studentName: 'Charlie Brown',
    startDate: '2023-11-10',
    endDate: '2023-11-10',
    totalDays: 1,
    description: 'I have a scheduled doctor appointment that I cannot miss.',
    status: 'Pending',
  },
  {
    id: 'leave-4',
    studentName: 'Diana Miller',
    startDate: '2023-11-12',
    endDate: '2023-11-15',
    totalDays: 4,
    description: 'Going on a short vacation with my family.',
    status: 'Approved',
  },
  {
    id: 'leave-5',
    studentName: 'Ethan Hunt',
    startDate: '2023-11-20',
    endDate: '2023-11-20',
    totalDays: 1,
    description: 'Woke up with a high fever and will be unable to attend classes.',
    status: 'Rejected',
  },
];

type LeaveRequest = typeof initialLeaveRequests[0];
type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Forwarded' | 'Cancelled';

const TutorLeaveApprovePage = () => {
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const handleRequestAction = (id: string, newStatus: RequestStatus) => {
    setLeaveRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === id ? { ...request, status: newStatus } : request
      )
    );
    showSuccess(`Request has been ${newStatus.toLowerCase()}!`);
    setSelectedRequest(null); // Close the dialog
  };

  const handleReviewClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
  };

  return (
    <TutorLayout>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">Leave Approval</CardTitle>
          <CardDescription>Review and manage student leave requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Total Days</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.studentName}</TableCell>
                    <TableCell>{request.startDate}</TableCell>
                    <TableCell>{request.endDate}</TableCell>
                    <TableCell className="text-right">{request.totalDays}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold",
                        request.status === 'Approved' && 'bg-green-100 text-green-800',
                        request.status === 'Pending' && 'bg-yellow-100 text-yellow-800',
                        request.status === 'Rejected' && 'bg-red-100 text-red-800',
                        request.status === 'Forwarded' && 'bg-blue-100 text-blue-800',
                        request.status === 'Cancelled' && 'bg-gray-100 text-gray-800'
                      )}>
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {request.status === 'Pending' ? (
                        <Button variant="outline" size="sm" onClick={() => handleReviewClick(request)}>
                          Review
                        </Button>
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
        <DialogContent className="sm:max-w-[425px]">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Leave Request Details</DialogTitle>
                <DialogDescription>
                  From: <strong>{selectedRequest.studentName}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Dates</span>
                  <p>{selectedRequest.startDate} to {selectedRequest.endDate} ({selectedRequest.totalDays} days)</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Description</span>
                  <p>{selectedRequest.description}</p>
                </div>
              </div>
              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <div className="flex justify-end space-x-2 pt-2 sm:pt-0">
                  {selectedRequest.totalDays > 2 ? (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleRequestAction(selectedRequest.id, 'Rejected')}
                      >
                        Reject
                      </Button>
                      <Button
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => handleRequestAction(selectedRequest.id, 'Forwarded')}
                      >
                        Forward
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleRequestAction(selectedRequest.id, 'Rejected')}
                      >
                        Reject
                      </Button>
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleRequestAction(selectedRequest.id, 'Approved')}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TutorLayout>
  );
};

export default TutorLeaveApprovePage;