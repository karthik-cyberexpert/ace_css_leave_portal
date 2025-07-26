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

// Dummy data for OD requests
const initialODRequests = [
  {
    id: 'od-1',
    studentName: 'Frank Green',
    startDate: '2023-11-03',
    endDate: '2023-11-03',
    totalDays: 1,
    purpose: 'Attend Tech Symposium',
    destination: 'Main Auditorium',
    description: 'Presenting a paper at the annual tech symposium held on campus.',
    status: 'Pending',
  },
  {
    id: 'od-2',
    studentName: 'Grace Hall',
    startDate: '2023-11-06',
    endDate: '2023-11-09',
    totalDays: 4,
    purpose: 'Inter-college Sports Meet',
    destination: 'City Sports Complex',
    description: 'Representing the college in the regional basketball tournament.',
    status: 'Pending',
  },
  {
    id: 'od-3',
    studentName: 'Henry King',
    startDate: '2023-11-11',
    endDate: '2023-11-11',
    totalDays: 1,
    purpose: 'Workshop on AI',
    destination: 'Computer Science Dept.',
    description: 'Participating in a full-day workshop on Artificial Intelligence.',
    status: 'Pending',
  },
  {
    id: 'od-4',
    studentName: 'Ivy Scott',
    startDate: '2023-11-14',
    endDate: '2023-11-16',
    totalDays: 3,
    purpose: 'National Science Fair',
    destination: 'Capital City Convention Center',
    description: 'Selected to present my project at the National Science Fair.',
    status: 'Approved',
  },
  {
    id: 'od-5',
    studentName: 'Jack Turner',
    startDate: '2023-11-22',
    endDate: '2023-11-22',
    totalDays: 1,
    purpose: 'Industrial Visit',
    destination: 'Local Tech Park',
    description: 'Department-organized industrial visit.',
    status: 'Rejected',
  },
];

type ODRequest = typeof initialODRequests[0];
type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Forwarded' | 'Cancelled';

const TutorODApprovePage = () => {
  const [odRequests, setODRequests] = useState(initialODRequests);
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);

  const handleRequestAction = (id: string, newStatus: RequestStatus) => {
    setODRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === id ? { ...request, status: newStatus } : request
      )
    );
    showSuccess(`Request has been ${newStatus.toLowerCase()}!`);
    setSelectedRequest(null);
  };

  const handleReviewClick = (request: ODRequest) => {
    setSelectedRequest(request);
  };

  return (
    <TutorLayout>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">On Duty (OD) Approval</CardTitle>
          <CardDescription>Review and manage student OD requests.</CardDescription>
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
                {odRequests.map((request) => (
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
                <DialogTitle>OD Request Details</DialogTitle>
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
                  <span className="text-sm font-medium text-muted-foreground">Purpose</span>
                  <p>{selectedRequest.purpose}</p>
                </div>
                 <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Place to Visit</span>
                  <p>{selectedRequest.destination}</p>
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

export default TutorODApprovePage;